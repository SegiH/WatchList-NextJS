"use strict";
const axios = require("axios");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("config");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const sql = require("mssql");
const request = require("request");
const { Sequelize } = require("sequelize");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const RAPIDAPI_KEY = config.has(`RapidAPIKey`) && config.get(`RapidAPIKey`) ? config.get(`RapidAPIKey`) : "";
const app = express();

// Constants
const DBType = "SQLite";
const DBFile = "watchlistdb.sqlite.demo";
const PORT = config.has(`Port`) ? config.get(`Port`) : 8080;
const HOST = "0.0.0.0";
//const Op = Sequelize.Op;
const defaultSources = ['Amazon','Hulu','Movie Theatre','Netflix','Plex','Prime','Web']; 
const defaultTypes = ['Movie','Other','Special','TV'];

// Validate config file properties that are required
if (DBType === "MSSQL" && (!config.has(`SQLServer.username`) || (config.has(`SQLServer.username`) && config.get(`SQLServer.username`) === "") )) {
  console.log(`Config file error: SQLServer.username property is missing or not set`);
  process.exit(1);
}

if (DBType === "MSSQL" && (!config.has(`SQLServer.password`) || (config.has(`SQLServer.password`) && config.get(`SQLServer.password`) === ""))) {
  console.log(`Config file error: SQLServer.password property is missing or not set`);
  process.exit(1);
}

if (DBType === "MSSQL" && (!config.has(`SQLServer.host`) || (config.has(`SQLServer.host`) && config.get(`SQLServer.host`) === ""))) {
  console.log(`Config file error: SQLServer.host property is missing or not set`);
  process.exit(1);
}

if (DBType === "MSSQL" && (!config.has(`SQLServer.database`) || (config.has(`SQLServer.database`) && config.get(`SQLServer.database`) === ""))) {
  console.log(`Config file error: SQLServer.database property is missing or not set`);
  process.exit(1);
}

if (DBType === "SQLite" && (!config.has(`SQLite.username`) || (config.has(`SQLite.username`) && config.get(`SQLite.username`) === ""))) {
  console.log(`Config file error: SQLite.username property is missing or not set`);
  process.exit(1);
}

if (DBType === "SQLite" && (!config.has(`SQLite.password`) || (config.has(`SQLite.password`) && config.get(`SQLite.password`) === ""))) {
  console.log(`Config file error: SQLite.password property is missing or not set`);
  process.exit(1);
}

if (DBType === "SQLite" && (!config.has(`SQLite.database`) || (config.has(`SQLite.database`) && config.get(`SQLite.database`) === ""))) {
  console.log(`Config file error: SQLite.database property is missing or not set`);
  process.exit(1);
}

if (!config.has(`Secret`) || (config.has(`Secret`) && config.get(`Secret`) === "")) {
  console.log(`Config file error: Secret property is missing or not set`);
  process.exit(1);
}

let userSession = {};

// Date prototype to return date in format yyyymmdd. Used to convert date field for database queries
Date.prototype.yyyymmdd = function () {
  const yyyy = this.getFullYear().toString();
  const mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();

  return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
};

const sessionConfig = {
  secret: config.get(`Secret`),
  resave: "save",
  saveUninitialized: true,
  //store: memoryStore,
  cookie: {
    //sameSite: 'none',
    secure: "false",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.1",
    info: {
      title: "WatchList API",
      description: "WatchList API",
      version: "2.0.0",
      displayRequestDuration: true,
    },
    components: {
      schemas: {
        WatchList: {
          properties: {
            WatchListID: {
              type: "integer",
              description: "WatchList ID",
            },
            WatchListItemID: {
              type: "integer",
              description: "WatchList Item ID",
            },
            StartDate: {
              type: "string",
              format: "date",
              description: "WatchList Start Date",
            },
            EndDate: {
              type: "string",
              format: "date",
              description: "WatchList End Date",
            },
            WatchListSourceID: {
              type: "integer",
              description: "WatchList Source",
            },
            Season: {
              type: "integer",
              description: "WatchList Season",
            },
            Rating: {
              type: "integer",
              description: "Movie/Show Rating",
            },
            Notes: {
              type: "string",
              description: "WatchList Notes",
            },
          },
        },
        WatchListItem: {
          properties: {
            WatchListItemID: {
              type: "integer",
              description: "WatchList Item ID",
            },
            WatchListItemName: {
              type: "string",
              format: "date",
              description: "WatchList Item Name",
            },
            WatchListTypeID: {
              type: "integer",
              description: "WatchList Type",
            },
            IMDB_URL: {
              type: "string",
              description: "WatchList Item IMDB URL",
            },
            ItemNotes: {
              type: "string",
              description: "WatchList Item Notes",
            },
          },
        },
        WatchListSources: {
          properties: {
            WatchListSourceID: {
              type: "integer",
              description: "WatchList Source ID",
            },
            WatchListSourceName: {
              type: "string",
              description: "WatchList Source Name",
            },
          },
        },
        WatchListTypes: {
          properties: {
            WatchListTypeID: {
              type: "integer",
              description: "WatchList Type ID",
            },
            WatchListTypeName: {
              type: "string",
              description: "WatchList Type Name",
            },
          },
        },
        Users: {
          properties: {
            UserID: {
              type: "integer",
              description: "User ID",
            },
            UserName: {
              type: "string",
              description: "User Name",
            },
            RealName: {
              type: "string",
              description: "Real Name",
            },
            Password: {
              type: "string",
              description: "Password",
            },
            Admin: {
              type: "bit",
              description: "User is Admin",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
      {
        url: "https://watchlist-backend.yoursite.com",
        description: "Production Server",
      },
    ],
    tags: [
      {
        name: "WatchList",
        description: "WatchList",
      },
      {
        name: "WatchListItems",
        description: "WatchListItems",
      },
      {
        name: "WatchListSources",
        description: "WatchListSources",
      },
      {
        name: "WatchListTypes",
        description: "WatchListTypes",
      },
    ],
  },
  apis: ["watchlistbackend.js"],
};

// SQLite
const SQLiteSequelize = new Sequelize(config.get(`SQLite.database`), config.get(`SQLite.username`), config.get(`SQLite.password`), {
  dialect: "sqlite",
  storage: DBFile,
  logging: false
});

const MSSQLSequelize = new Sequelize(config.get(`SQLServer.database`), config.get(`SQLServer.username`), config.get(`SQLServer.password`), {
  host: config.get(`SQLServer.host`),
  encrypt: false,
  dialect: "mssql",
  logging: false,
  quoteIdentifiers: true,
  define: {
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    port: 1433,
  },
});

if (DBType === "MSSQL") {
  (async () => {
    try {
      await sequelize.authenticate();

    } catch (e) {
      console.log(`Sequelize encountered the error ${e.message} while connecting to the DB`, null);
      process.exit(0);
    }
  })();
}

const sequelize = DBType === "SQLite" ? SQLiteSequelize : MSSQLSequelize;

const initModels = require("./models/init-models");
const models = initModels(DBType === "SQLite" ? SQLiteSequelize : MSSQLSequelize);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    methods: ['GET','OPTIONS','PUT'],
    origin: config.has(`CORS`) ? config.get(`CORS`) : [],
  }),
);
app.use(express.static("swagger"));
app.use(session(sessionConfig));

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware that is called before any endpoint is reached
app.use(function (req, res, next) {
  if (req.url.startsWith("/IsLoggedIn")) {
    next();
    return;
  }

  if (userSession) {
    next();
  } else if (req.url.startsWith("/Login")) {
    next();
  } else {
    console.log("Sending forbidden in middleware");
    res.sendStatus("403");
  }
});

//Default route doesn't need to return anything
app.get("/", (req, res) => {
  res.send("");
});

/**
 * @swagger
 * /AddUser:
 *    put:
 *        tags:
 *          - User
 *        summary: Add new user
 *        description: Add user
 *        parameters:
*           - name: wl_username
 *             in: query
 *             description: User name
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_realname
 *             in: query
 *             description: RealName
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_password
 *             in: query
 *             description: Password
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_isadmin
 *             in: query
 *             description: Is admin
 *             required: false
 *             schema:
 *                  type: bit
 *           - name: wl_enabled
 *             in: query
 *             description: Acconut is enabled
 *             required: false
 *             schema:
 *                  type: bit
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/AddUser", async (req, res) => {
  addUser(req, res, false);
});

/**
 * @swagger
 * /AddWatchList:
 *    put:
 *        tags:
 *          - WatchList
 *        summary: Add new WatchList item
 *        description: Add WatchList item
 *        parameters:
 *           - name: UserID
 *             in: query
 *             description: User ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: WatchListItemID
 *             in: query
 *             description: WatchList Item ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: StartDate
 *             in: query
 *             description: Start Date
 *             required: true
 *             schema:
 *                  type: string
 *           - name: EndDate
 *             in: query
 *             description: End Date
 *             required: false
 *             schema:
 *                  type: string
 *           - name: WatchListSourceID
 *             in: query
 *             description: WatchList Source ID
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Season
 *             in: query
 *             description: Season
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Archived
 *             in: query
 *             description: Archived
 *             required: false
 *             schema:
 *                  type: boolean
 *           - name: Rating
 *             in: query
 *             description: Rating
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Notes
 *             in: query
 *             description: Notes
 *             required: false
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/AddWatchList", async (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;
  const watchListItemID = typeof req.query.WatchListItemID !== "undefined" ? req.query.WatchListItemID : null;
  const startDate = typeof req.query.StartDate !== "undefined" ? req.query.StartDate : null;
  const endDate = typeof req.query.EndDate !== "undefined" ? req.query.EndDate : null; // Optional
  const sourceID = typeof req.query.WatchListSourceID !== "undefined" ? req.query.WatchListSourceID : null;
  const season = typeof req.query.Season !== "undefined" ? req.query.Season : null;
  const rating = typeof req.query.Rating !== "undefined" ? req.query.Rating : null;
  const notes = typeof req.query.Notes !== "undefined" ? req.query.Notes : null;

  if (userID === null) {
    res.send(["User ID is not set"]);
    return;
  } else if (watchListItemID === null) {
    res.send(["Item ID was not provided"]);
    return;
  } else if (startDate === null) {
    res.send(["Start Date was not provided"]);
    return;
  } else {
    await models.WatchList.create({
      UserID: userID,
      WatchListItemID: watchListItemID,
      StartDate: startDate,
      EndDate: endDate,
      WatchListSourceID: sourceID,
      Season: season,
      Archived: 0,
      Rating: rating,
      Notes: notes,
    })
      .then((result) => {
        // Return ID of newly inserted row
        res.send(["OK", result.WatchListID]);
      })
      .catch(function (e) {
        const errorMsg = `/AddWatchList: The error ${e.message} occurred while adding the WatchList record`;
        console.error(errorMsg);
      });
  }
});

/**
 * @swagger
 * /AddWatchListItem:
 *    put:
 *        tags:
 *          - WatchListItems
 *        summary: Add new WatchList item
 *        description: Add WatchList item
 *        parameters:
 *           - name: WatchListItemName
 *             in: query
 *             description: Name
 *             required: true
 *             schema:
 *                  type: string
 *           - name: Type
 *             in: query
 *             description: Type
 *             required: true
 *             schema:
 *                  type: string
 *           - name: IMDB_URL
 *             in: query
 *             description: IMDB URL
 *             required: false
 *             schema:
 *                  type: string
 *           - name: IMDB_Poster
 *             in: query
 *             description: IMDB image
 *             required: false
 *             schema:
 *                  type: string
 *           - name: Notes
 *             in: query
 *             description: Notes
 *             required: false
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/AddWatchListItem", async (req, res) => {
  const name = typeof req.query.WatchListItemName !== "undefined" ? req.query.WatchListItemName : null;
  const type = typeof req.query.WatchListTypeID !== "undefined" ? req.query.WatchListTypeID : null;
  const imdb_url = typeof req.query.IMDB_URL !== "undefined" ? req.query.IMDB_URL : null;
  const imdb_poster = typeof req.query.IMDB_Poster !== "undefined" ? req.query.IMDB_Poster : null;
  const notes = typeof req.query.Notes !== "undefined" ? req.query.Notes : null;

  if (name === null) {
    res.send(["ERROR", "Name was not provided"]);
    return;
  } else if (type === null) {
    res.send(["ERROR", "Type was not provided"]);
    return;
  } else {
    const existingWatchListItem = await models.WatchListItems.findAll({
      where: {
        IMDB_URL: imdb_url,
      },
    }).catch(function (err) {
      return ["ERROR", `/GetOrder: The error ${err.message} occurred getting the order with the Order ID`];
    });

    if (existingWatchListItem.length > 0) {
      res.send(["ERROR-ALREADY-EXISTS", `The URL ${imdb_url} already exists with the name ${existingWatchListItem[0].WatchListItemName} and the ID ${existingWatchListItem[0].WatchListItemID}. It was NOT added!`]);
      return;
    }

    await models.WatchListItems.create({
      WatchListItemName: name,
      WatchListTypeID: type,
      IMDB_URL: imdb_url,
      IMDB_Poster: imdb_poster,
      ItemNotes: notes,
      Archived: 0,
    })
      .then((result) => {
        // Return ID of newly inserted row
        res.send(["OK", result.WatchListItemID]);
        return;
      })
      .catch(function (e) {
        res.send(["ERROR", `/AddWatchListItems: The error ${e.message} occurred while adding the WatchList Item record`]);
        return;
      });
  }
});

/**
 * @swagger
 * /AddWatchSource:
 *    put:
 *        tags:
 *          - WatchListSource
 *        summary: Add WatchList source
 *        description: Add WatchList source
 *        parameters:
 *           - name: WatchListSourceName
 *             in: query
 *             description: WatchList Source name
 *             required: true
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/AddWatchListSource", async (req, res) => {
  const watchListSourceName = typeof req.query.WatchListSourceName !== "undefined" ? req.query.WatchListSourceName : null;

  if (watchListSourceName === null) {
    res.send(["ERROR", "WatchList Source Name was not provided"]);
    return;
  }

  await models.WatchListSources.create({
    WatchListSourceName: watchListSourceName
  })
  .then((result) => {
      // Return ID of newly inserted row
      res.send(["OK", result.WatchListSourceID]);
  })
  .catch(function (e) {
      const errorMsg = `/AddWatchListSource: The error ${e.message} occurred while adding the WatchList Source record`;
      console.error(errorMsg);
  });
});

/**
 * @swagger
 * /AddWatchType:
 *    put:
 *        tags:
 *          - WatchListType
 *        summary: Add WatchList type
 *        description: Add WatchList type
 *        parameters:
 *           - name: WatchListTypeName
 *             in: query
 *             description: WatchList Type name
 *             required: true
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/AddWatchListType", async (req, res) => {
  const watchListTypeName = typeof req.query.WatchListTypeName !== "undefined" ? req.query.WatchListTypeName : null;

  if (watchListTypeName === null) {
    res.send(["ERROR", "WatchList Source Name was not provided"]);
    return;
  }

  await models.WatchListTypes.create({
    WatchListTypeName: watchListTypeName
  })
  .then((result) => {
      // Return ID of newly inserted row
      res.send(["OK", result.WatchListTypeID]);
  })
  .catch(function (e) {
      const errorMsg = `/AddWatchListType: The error ${e.message} occurred while adding the WatchList Type record`;
      console.error(errorMsg);
  });
});

/**
 * @swagger
 * /GetUsers:
 *    get:
 *        tags:
 *          - Users
 *        summary: Get users
 *        description: Get users
 *        responses:
 *          200:
 *            description: "WatchList records on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetUsers", (req, res) => {
  const enabled = typeof req.query.Enabled !== "undefined" ? req.query.Enabled : null;
  const admin = typeof req.query.Admin !== "undefined" ? req.query.Admin : null;

  // Only admins can call this endpoint
  if (typeof userSession === "undefined" || (typeof userSession !== "undefined" && userSession.Admin === false)) {
    res.send[("ERROR", "Access denied")];
    return;
  }

  models.Users.findAll({
    attributes: ['UserID', 'Username','Realname','Admin','Enabled'],
    where: {
      ...(enabled !== null && {
        Enabled: enabled,
      }),
      ...(admin !== null && {
        Admin: admin,
      }),
    },
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetUsers: The error ${err} occurred getting the users`]);
    });
});

/**
 * @swagger
 * /GetWatchList:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchList records
 *        description: Get WatchList records
 *        parameters:
 *           - name: RecordLimit
 *             in: query
 *             description: Record Limit
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: SortColumn
 *             in: query
 *             description: Sort Column
 *             required: false
 *             schema:
 *                  type: string
 *           - name: SortDirection
 *             in: query
 *             description: Sort Direction
 *             required: false
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "WatchList records on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchList", (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;
  let sortColumn = typeof req.query.SortColumn !== "undefined" ? req.query.SortColumn : "WatchListItemName";
  let sortDirection = typeof req.query.SortDirection !== "undefined" ? req.query.SortDirection : "ASC";
  let recordLimit = typeof req.query.RecordLimit !== "undefined" ? req.query.RecordLimit : null;

  if (userID === null) {
    res.send(["User ID is not set"]);
    return;
  }

  if (sortColumn === null || typeof sortColumn == "undefined") sortColumn = "WatchListItemName";
  else if (sortColumn === "ID") sortColumn = "WatchListID";
  else if (sortColumn === "Name") sortColumn = "WatchListItemName";

  if (sortDirection === null || typeof sortDirection == "undefined" || (sortDirection !== "ASC" && sortDirection != "DESC")) sortDirection = "ASC";

  models.WatchListItems.hasMany(models.WatchList, {
    foreignKey: "WatchListItemID",
  });
  models.WatchList.belongsTo(models.WatchListItems, {
    foreignKey: "WatchListItemID",
  });

  models.WatchListSources.hasMany(models.WatchList, {
    foreignKey: "WatchListSourceID",
  });
  models.WatchList.belongsTo(models.WatchListSources, {
    foreignKey: "WatchListSourceID",
  });

  models.WatchListTypes.hasMany(models.WatchListItems, {
    foreignKey: "WatchListTypeID",
  });
  models.WatchListItems.belongsTo(models.WatchListTypes, {
    foreignKey: "WatchListTypeID",
  });

  models.WatchList.findAll({
    //logging: console.log,
    limit: recordLimit !== null ? recordLimit : 999999999,
    include: [
      {
        model: models.WatchListItems,
        required: true,
        include: [{ model: models.WatchListTypes, required: true }],
      },
      { model: models.WatchListSources, required: true },
    ],
    /*where: {
               UserID: userID,
                ...((searchTerm !== null) && {
                    WatchListItemName: {
                         [Op.like]: "%" + searchTerm + "%"
                    }
               }),
               ...((sourceFilter !== null) && {
                    WatchListSourceID: sourceFilter
               }),
               ...((typeFilter !== null) && {
                    WatchListTypeID: typeFilter
               }),
               ...((incompleteFilter !== null) && {
                    EndDate: {
                         [Op.ne]: null
                    }
               }),
          },*/
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchList: The error ${err} occurred getting the WatchList`]);
    });
});

/**
 * @swagger
 * /GetWatchListDtl:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchList dtl record
 *        description: Get WatchList dtl records
 *        parameters:
 *           - name: WatchListID
 *             in: query
 *             description: WatchListID
 *             required: true
 *             schema:
 *                  type: integer
 *        responses:
 *          200:
 *            description: "WatchList record on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListDtl", (req, res) => {
  const watchListID = typeof req.query.WatchListID !== "undefined" ? req.query.WatchListID : null;

  if (watchListID === null) {
    res.send(["ERROR", "WatchList ID was not provided"]);
    return;
  }

  models.WatchListItems.hasMany(models.WatchList, {
    foreignKey: "WatchListItemID",
  });
  models.WatchList.belongsTo(models.WatchListItems, {
    foreignKey: "WatchListItemID",
  });

  models.WatchListSources.hasMany(models.WatchList, {
    foreignKey: "WatchListSourceID",
  });
  models.WatchList.belongsTo(models.WatchListSources, {
    foreignKey: "WatchListSourceID",
  });

  models.WatchListTypes.hasMany(models.WatchListItems, {
    foreignKey: "WatchListTypeID",
  });
  models.WatchListItems.belongsTo(models.WatchListTypes, {
    foreignKey: "WatchListTypeID",
  });

  models.WatchList.findAll({
    include: [
      {
        model: models.WatchListItems,
        required: true,
        include: [{ model: models.WatchListTypes, required: true }],
      },
      { model: models.WatchListSources, required: true },
    ],
    where: {
      WatchListID: watchListID,
    },
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchList: The error ${err.message} occurred getting the WatchList Detail`]);
    });
});

/**
 * @swagger
 * /GetWatchListItemDtl:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchListItem dtl record
 *        description: Get WatchListv dtl records
 *        parameters:
 *           - name: WatchListItemID
 *             in: query
 *             description: WatchListItemID
 *             required: true
 *             schema:
 *                  type: integer
 *        responses:
 *          200:
 *            description: "WatchListItem record on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListItemDtl", (req, res) => {
  const watchListItemID = typeof req.query.WatchListItemID !== "undefined" ? req.query.WatchListItemID : null;

  if (watchListItemID === null) {
    res.send(["ERROR", "WatchList ItemID was not provided"]);
    return;
  }

  models.WatchListTypes.hasMany(models.WatchListItems, {
    foreignKey: "WatchListTypeID",
  });
  models.WatchListItems.belongsTo(models.WatchListTypes, {
    foreignKey: "WatchListTypeID",
  });

  models.WatchListItems.findAll({
    include: [{ model: models.WatchListTypes, required: true }],
    where: {
      WatchListItemID: watchListItemID,
    },
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListItems: The error ${err.message} occurred getting the WatchList Item Detail`]);
    });
});

/**
 * @swagger
 * /GetWatchListItems:
 *    get:
 *        tags:
 *          - WatchListItems
 *        summary: Get WatchList Items records
 *        description: Get WatchList Items records
 *        parameters:
 *           - name: RecordLimit
 *             description: Record Limit
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: SearchTerm
 *             in: query
 *             description: Search Term
 *             required: false
 *             schema:
 *                  type: string
 *           - name: SortColumn
 *             in: query
 *             description: Sort Column
 *             required: false
 *             schema:
 *                  type: string
 *           - name: SortDirection
 *             in: query
 *             description: Sort Direction
 *             required: false
 *             schema:
 *                  type: string
 *           - name: IMDBURLMissing
 *             in: query
 *             description: IMDBURLMissing
 *             required: false
 *             schema:
 *                  type: boolean
 *        responses:
 *          200:
 *            description: "WatchList item records on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListItems", (req, res) => {
  // WatchListItems applies to all users so no need to provide user ID
  //const searchTerm = typeof req.query.SearchTerm !== "undefined" ? req.query.SearchTerm : null;
  //const IMDBURLMissing = req.query.IMDBURLMissing == "true" ? true : false;
  let recordLimit = typeof req.query.RecordLimit !== "undefined" ? req.query.RecordLimit : null;
  let sortColumn = typeof req.query.SortColumn !== "undefined" ? req.query.SortColumn : null;
  let sortDirection = typeof req.query.SortDirection !== "undefined" ? req.query.SortDirection : null;

  if (sortColumn === null || typeof sortColumn == "undefined") sortColumn = "WatchListItemName";
  else if (sortColumn === "ID") sortColumn = "WatchListItemID";
  else if (sortColumn === "Name") sortColumn = "WatchListItemName";
  else if (sortColumn === "Type") sortColumn = "WatchListTypeID";
  else if (sortColumn === "IMDB_URL") {
  } // Nothing to do for this columns

  if (sortDirection === null || typeof sortDirection == "undefined" || (sortDirection !== "ASC" && sortDirection != "DESC")) sortDirection = "ASC";

  models.WatchListTypes.hasMany(models.WatchListItems, {
    foreignKey: "WatchListTypeID",
  });
  models.WatchListItems.belongsTo(models.WatchListTypes, {
    foreignKey: "WatchListTypeID",
  });

  models.WatchListItems.findAll({
    limit: recordLimit !== null ? recordLimit : 999999999,
    include: [{ model: models.WatchListTypes, required: true }],
    /*where: {
                    UserID: userID,
                     ...((searchTerm !== null) && {
                         WatchListItemName: {
                              [Op.like]: "%" + searchTerm + "%"
                         }
                    }),
                    ...((sourceFilter !== null) && {
                         WatchListSourceID: sourceFilter
                    }),
                    ...((typeFilter !== null) && {
                         WatchListTypeID: typeFilter
                    }),
                    ...((incompleteFilter !== null) && {
                         EndDate: {
                              [Op.ne]: null
                         }
                    }),
               },*/
    /*order: [
                    [sortColumn, sortDirection]
               ]*/
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchList: The error ${JSON.stringify(err)} occurred getting the WatchList Items`]);
    });
});

/**
 * @swagger
 * /GetWatchListSources:
 *    get:
 *        tags:
 *          - WatchListSources
 *        summary: Get WatchList Sources
 *        description: Get WatchList Sources
 *        responses:
 *          200:
 *            description: "WatchList source on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListSources", (req, res) => {
  models.WatchListSources.findAll({
    order: [["WatchListSourceName", "DESC"]],
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListSources: The error ${err.message} occurred getting the WatchList Sources`]);
    });
});

/**
 * @swagger
 * /GetWatchListTypes:
 *    get:
 *        tags:
 *          - WatchListTypes
 *        summary: Get WatchList Types
 *        description: Get WatchList Types
 *        responses:
 *          200:
 *            description: "WatchList types on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListTypes", (req, res) => {
  models.WatchListTypes.findAll({
    order: [["WatchListTypeName", "DESC"]],
  })
    .then((results) => {
      res.send(results);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListTypes: The error ${err.message} occurred getting the WatchList Types`]);
    });
});

/**
 * @swagger
 * /GetWatchListMovieStats:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchList Movie Stats
 *        description: Get WatchList Movie Stats
 *        parameters:
 *           - name: UserID
 *             in: query
 *             description: User ID
 *             required: true
 *             schema:
 *                  type: integer
 *        responses:
 *          200:
 *            description: "WatchList movie stats on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListMovieStats", (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;

  if (userID === null) {
    res.send(["ERROR", "User ID is not set"]);
    return;
  }

  const SQL = `WITH GetFrequentItems AS (SELECT UserID,WatchListItemName,COUNT(*) AS ItemCount FROM WatchList WL LEFT JOIN WatchListItems WLI ON WLI.WatchListItemID=WL.WatchListItemID WHERE WLI.WatchListTypeID=1 GROUP BY UserID,WatchListItemName) SELECT ${DBType === "MSSQL" ? ` TOP(10) ` : ``} *,(SELECT IMDB_URL FROM WatchListItems WHERE WatchListItemName=GetFrequentItems.WatchListItemName) AS IMDB_URL FROM GetFrequentItems WHERE UserID=:UserID AND ItemCount > 1 ORDER BY ItemCount DESC ${DBType == "SQLite" ? " LIMIT 10" : ""}`;

  sequelize
    .query(SQL, { replacements: { UserID: userID } })
    .then((results) => {
      res.send(results[0]);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListMovieStats: The error ${err.message} occurred getting the WatchList Movie Stats`]);
    });
});

/**
 * @swagger
 * /GetWatchListSourceStats:
 *    get:
 *        tags:
 *          - WatchListSources
 *        summary: Get WatchList Source Stats
 *        description: Get WatchList Sources Stats
 *        responses:
 *          200:
 *            description: "WatchList Sources stats on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListSourceStats", (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;
  const getDetail = typeof req.query.GetDetail !== "undefined" && req.query.GetDetail === "true" ? 1 : 0;

  if (userID === null) {
    res.send(["ERROR", "User ID is not set"]);
    return;
  }

  const SQL = "SELECT WatchList.WatchListSourceID, WatchListSources.WatchListSourceName, COUNT(WatchList.WatchListSourceID) AS SourceCount FROM WatchList LEFT JOIN WatchListSources ON WatchListSources.WatchListSourceID=WatchList.WatchListSourceID WHERE UserID=:UserID AND  WatchListSources.WatchListSourceName IS NOT NULL GROUP BY WatchList.WatchListSourceID,WatchListSources.WatchListSourceName ORDER BY SourceCount DESC";

  const detailSQL = "SELECT * FROM WatchList LEFT JOIN WatchListItems ON WatchListItems.WatchListItemID=WatchList.WatchListItemID LEFT JOIN WatchListSources ON WatchListSources.WatchListSourceID=WatchList.WatchListSourceID WHERE UserID=:UserID ORDER BY StartDate DESC";

  sequelize
    .query(!getDetail ? SQL : detailSQL, { replacements: { UserID: userID } })
    .then((results) => {
      res.send(results[0]);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListSourceStats: The error ${err.message} occurred getting the WatchList Source Stats`]);
    });
});

/**
 * @swagger
 * /GetWatchListTopRated:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchList Top Rated
 *        description: Get WatchList Top Rated
 *        parameters:
 *           - name: UserID
 *             in: query
 *             description: User ID
 *             required: true
 *             schema:
 *                  type: integer
 *        responses:
 *          200:
 *            description: "WatchList Top Rated stats on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListTopRatedStats", (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;

  if (userID === null) {
    res.send(["ERROR", "User ID is not set"]);
    return;
  }

  const SQL = `SELECT ${DBType === "MSSQL" ? ` TOP(10) ` : ``} WatchListItemName,Season,Rating,IMDB_URL FROM WatchList LEFT JOIN WatchListItems ON WatchListItems.WatchListItemID=WatchList.WatchListItemID WHERE Rating IS NOT NULL AND UserID=:UserID ORDER BY Rating DESC ${DBType == "SQLite" ? " LIMIT 10" : ""}`;

  sequelize
    .query(SQL, { replacements: { UserID: userID } })
    .then((results) => {
      res.send(results[0]);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListTopRatedStats: The error ${err.message} occurred getting the WatchList Top Rated Stats`]);
    });
});

/**
 * @swagger
 * /GetWatchListTVStats:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get WatchList TV Stats
 *        description: Get WatchList TV Stats
 *        parameters:
 *           - name: UserID
 *             in: query
 *             description: User ID
 *             required: true
 *             schema:
 *                  type: integer
 *        responses:
 *          200:
 *            description: "WatchList TV stats on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/GetWatchListTVStats", (req, res) => {
  const userID = typeof userSession.UserID !== "undefined" ? userSession.UserID : null;

  if (userID === null) {
    res.send(["ERROR", "User ID is not set"]);
    return;
  }

  const SQL =
    `WITH GetFrequentItems AS (SELECT UserID,WLI.WatchListItemName,MIN(StartDate) AS StartDate,MAX(StartDate) AS EndDate,COUNT(*) AS ItemCount FROM WatchList WL LEFT JOIN WatchListItems WLI ON WLI.WatchListItemID=WL.WatchListItemID LEFT JOIN WatchListTypes WLT ON WLT.WatchListTypeID=WLI.WatchListTypeID WHERE WLI.WatchListTypeID=2 AND WL.EndDate IS NOT NULL GROUP BY UserID,WatchListItemName) SELECT ${DBType === "MSSQL" ? ` TOP(10) ` : ``} *,(SELECT IMDB_URL FROM WatchListItems WHERE WatchListItemName=GetFrequentItems.WatchListItemName) AS IMDB_URL FROM GetFrequentItems WHERE UserID=:UserID AND ItemCount > 1 ORDER BY ItemCount DESC ${DBType == "SQLite" ? " LIMIT 10" : ""}`;

  sequelize
    .query(SQL, { replacements: { UserID: userID } })
    .then((results) => {
      res.send(results[0]);
    })
    .catch(function (err) {
      res.send(["ERROR", `/GetWatchListTVStats: The error ${err.message} occurred getting the WatchList TV Stats`]);
    });
});

/**
 * @swagger
 * /IsIMDBSearchEnabled:
 *    get:
 *        tags:
 *          - IMDB
 *        summary: Get flag that returns true if RapidAPI key is set to allow IMDB search
 *        description: Get flag that returns true if RapidAPI key is set to allow IMDB search
 *        responses:
 *          200:
 *            description: "Returns true or false"
 *
 */
app.get("/IsIMDBSearchEnabled", (req, res) => {
  if (RAPIDAPI_KEY == null) {
    res.send(false);
  } else {
    res.send(true);
  }
});

/**
 * @swagger
 * /IsLoggedIn:
 *    get:
 *        tags:
 *          - Users
 *        summary: Return flag to indicate if user is logged in or not
 *        description: Return flag to indicate if user is logged in or not
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.get("/IsLoggedIn", (_req, res) => {
  if (userSession.UserID) {
    res.send([
      "OK",
      {
        UserID: userSession.UserID,
        Username: userSession.UserName,
        RealName: userSession.RealName,
        Admin: userSession.Admin,
      },
    ]);
  } else {
    res.send(["ERROR", false]);
  }
});

/**
 * @swagger
 * /Login:
 *    put:
 *        tags:
 *          - Login
 *        summary: Login endpoint
 *        description: Login endpoint
 *        parameters:
 *           - name: wl_username
 *             in: header
 *             description: User name
 *             required: true
 *             schema:
 *                  type: string
 *           - name: wl_password
 *             in: header
 *             description: Password
 *             required: true
 *             schema:
 *                  type: string
 *                  format: password
 *        responses:
 *          200:
 *            description: "Returns ['OK',USERPAYLOADOBJECT] on success or 403 error if login failed"
 *
 */
app.get("/Login", async (req, res) => {
  const username = typeof req.query["wl_username"] !== "undefined" ? req.query["wl_username"] : null;
  const password = typeof req.query["wl_password"] !== "undefined" ? req.query["wl_password"] : null;

  if (username === null || password === null) {
    return res.status(403).send("Unauthorized 1");
  } else {
    const sanitizedUsername = typeof username === "string" && username !== "" && username.length < 50 ? username : null;
    const sanitizedPassword = typeof password === "string" && password !== "" && password.length < 50 ? password : null;

    if (sanitizedUsername === null) {
      return res.status(403).send("Unauthorized 2");
    }

    if (sanitizedPassword === null) {
      return res.status(403).send("Unauthorized 3");
    }

    try {
      const SQL =
        DBType === "MSSQL"
          ? "OPEN SYMMETRIC KEY WatchListKey DECRYPTION BY CERTIFICATE WatchListCert;SELECT TOP(1) UserID,CONVERT(VARCHAR(50),DECRYPTBYKEY(Username)) AS Username,CONVERT(VARCHAR(50),DECRYPTBYKEY(Realname)) AS Realname,Admin FROM Users WHERE :Username = CONVERT(VARCHAR(50),DECRYPTBYKEY(Username))AND :Password = CONVERT(VARCHAR(50),DECRYPTBYKEY(Password));CLOSE SYMMETRIC KEY WatchListKey"
          : "SELECT UserID,Username,Realname,Admin FROM Users WHERE Username=:Username AND Password=:Password AND Enabled=1 LIMIT 1";

      sequelize
        .query(SQL, {
          replacements: { Username: username, Password: password },
        })
        .then((results) => {
          if (results[0].length === 0) {
            res.send(["ERROR", "Invalid username or password"]);
            return;
          }

          req.session.UserID = results[0][0]["UserID"];
          req.session.UserName = results[0][0]["Username"];
          req.session.RealName = results[0][0]["Realname"];
          req.session.Admin = results[0][0]["Admin"];

          userSession = req.session;

          res.send(["OK", results]);
        })
        .catch(function (err) {
          console.dir(err);
          res.send(["ERROR", `/Login: The error ${err} occurred logging in`]);
        });
    } catch (err) {
      return res.status(403).send("Unauthorized 4: " + err.message);
    }
  }
});

/**
 * @swagger
 * /Recommendations:
 *    get:
 *        tags:
 *          - Recommendations
 *        summary: Get recommendations based on existing tv show or movie
 *        description: Get recommendations based on existing tv show or movie
 *        responses:
 *          200:
 *            description: "Returns ['OK']"
 *
 */
app.get("/Recommendations", (req, res) => {
     const queryTerm = typeof req.query.QueryTerm !== "undefined" ? req.query.QueryTerm : null;
     const typeName = typeof req.query.Type !== "undefined" ? req.query.Type : null;

     const recommendationsURL = `https://nodejs-shovav.replit.app/Recommendations?QueryTerm=${encodeURIComponent(queryTerm)}&Type=${typeName}`;

     axios.get(recommendationsURL)
     .then((response) => {
          res.send(["OK",response.data]);
     })
     .catch((err) => {
          res.send(["ERROR",err.message]);
     });
});

/**
 * @swagger
 * /Setup:
 *    get:
 *        tags:
 *          - Setup
 *        summary: Set up new instance
 *        description: Set up new instance
 *        responses:
 *          200:
 *            description: "Returns ['OK']"
 *
 */
app.put("/Setup", async (req, res) => {
  if (DBType === "SQLite") {
    try {
      if (fs.existsSync(DBFile)) {
        res.send(["ERROR", `Error! The WatchList database file already exists. Please move or rename this file`]);
        return;
      }
    } catch (err) {
      res.send(["ERROR", err]);
      return;
    }
  }

  addUser(req, res, true);
});

/**
 * @swagger
 * /SignOut:
 *    get:
 *        tags:
 *          - Login
 *        summary: Logout endpoint
 *        description: Logout endpoint
 *        responses:
 *          200:
 *            description: "Returns ['OK']"
 *
 */
app.get("/SignOut", (req, res) => {
  req.session.destroy();

  userSession = {};

  res.send(["OK"]);
});

/**
 * @swagger
 * /SearchIMDB:
 *    get:
 *        tags:
 *          - IMDB
 *        summary: Search IMDB
 *        description: Search IMDB
 *        parameters:
 *           - name: SearchTerm
 *             in: query
 *             description: SearchTerm
 *             required: true
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "Returns search results on success or error message"
 *
 */
app.get("/SearchIMDB", (req, res) => {
  const searchTerm = typeof req.query.SearchTerm !== "undefined" ? req.query.SearchTerm : null;
  let currentResults = {};

  if (searchTerm === null) {
    res.send(["ERROR", "Search term not provided"]);
  } else if (RAPIDAPI_KEY == null) {
    res.send(["ERROR", "IMDB search is not enabled"]);
  } else {
    let options = {
      method: "GET",
      url: "https://imdb107.p.rapidapi.com/",
      qs: { s: searchTerm, page: "1", r: "json" },
      headers: {
        "x-rapidapi-host": "movie-database-alternative.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
        useQueryString: true,
      },
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      currentResults = body;

      (options.qs = { s: searchTerm, page: "2", r: "json" }),
        request(options, function (error, response, body2) {
          if (error) throw new Error(error);

          res.send(["OK", currentResults, body2]);
        });
    });
  }
});

app.get("/UpdateMissingPosters", async (req, res) => {
  /*models.WatchListItems.findAll({
    //logging: console.log,
    limit: 50,
    //include: [{ model: models.WatchListTypes, required: true }],
    where: {
      IMDB_Poster: null
    },
    order: [
        [sortColumn, sortDirection]
    ]
  })*/
  /*const SQL=`SELECT TOP(50) WatchListItems.WatchListItemID,WatchListItems.WatchListItemName,WatchListItems.IMDB_URL FROM WatchListItems LEFT JOIN IMDBPosters on IMDBPosters.WatchListItemID=WatchListItems.WatchListItemID WHERE IMDBPosters.PosterURL IS NULL
  AND imdb_url is not null
  AND WatchListItems.WatchListItemID NOT IN(10,28,84,92,163,170,178,260,261,344)
  ORDER BY WatchListItemID`;
  
  let posterResults=[];

  if (result[0] !== "OK") {
      res.send("Oh shit" + result[1]);
      return;
  }

  const items=result[1];

  for (let i=0;i<items.length;i++) {
      console.log(`Starting ${items[i]["WatchListItemName"]}`);
      const options = {
            method: 'GET',
            url: 'https://imdb107.p.rapidapi.com/',
            qs: {s: items[i]["WatchListItemName"], page: '1', r: 'json'},
            headers: {
                 'x-rapidapi-host': 'movie-database-alternative.p.rapidapi.com',
                 'x-rapidapi-key': RAPIDAPI_KEY,
                 useQueryString: true
            }
       };

       await new Promise(resolve => setTimeout(resolve, 1000));

       request(options, async function (error, response, body) {
          if (error) {
                console.log(error)
                throw new Error(error);
            }

            const searchResults=JSON.parse(body);
            //console.log(searchResults);
            if ((typeof searchResults["Response"] !== 'undefined' && searchResults["Response"] == "False") || typeof searchResults["Search"] === 'undefined') {
                //posterResults.push([items[i]["WatchListItemID"],searchResults["Error"]]);
                console.log(`Not adding ${items[i]["WatchListItemName"]} because ${body}`);
                return;
            }

            for (let j=0;j<searchResults["Search"].length;j++) {
                 const imdbURL=`https://www.imdb.com/title/${searchResults["Search"][j].imdbID}`;

                 try {
                     const itemIMDBURL=items[i]["IMDB_URL"].slice(0,items[i]["IMDB_URL"].length-1);
//console.log(`itemIMDBURL=${itemIMDBURL} imdbURL=${imdbURL}`);
                     if (itemIMDBURL === imdbURL) {
                         const params=[['WatchListItemID',sql.Int,items[i]["WatchListItemID"]],['PosterURL',sql.VarChar,searchResults["Search"][j]["Poster"]]];
                         const SQL="IF (SELECT COUNT(*) FROM IMDBPosters WHERE WatchListItemID=@WatchListItemID) = 0 INSERT INTO IMDBPosters(WatchListItemID,PosterURL) VALUES(@WatchListItemID,@PosterURL) ELSE UPDATE IMDBPosters SET PosterURL=@PosterURL WHERE WatchListItemID=@WatchListItemID";

                         //posterResults.push([items[i]["WatchListItemID"],"OK"]);
                         console.log(`Adding ${items[i]["WatchListItemName"]}`);

                         continue;
                     }
                 } catch(e) {
                     console.log(`Not adding ${items[i]["WatchListItemID"]} because error ${e}`);
                     break;
                 }
            }
       });

       if (i==items.length-1) {
           return res.send("");
       }
  }*/
});

/**
 * @swagger
 * /UpdateUser:
 *    put:
 *        tags:
 *          - User
 *        summary: Add new user
 *        description: Add user
 *        parameters:
 *           - name: wl_userid
 *             in: query
 *             description: User ID
 *             required: true
 *             schema:
 *                  type: int
 *           - name: wl_username
 *             in: query
 *             description: User name
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_realname
 *             in: query
 *             description: RealName
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_password
 *             in: query
 *             description: Password
 *             required: false
 *             schema:
 *                  type: string
 *           - name: wl_isadmin
 *             in: query
 *             description: Is admin
 *             required: false
 *             schema:
 *                  type: bit
 *           - name: wl_enabled
 *             in: query
 *             description: Acconut is enabled
 *             required: false
 *             schema:
 *                  type: bit
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/UpdateUser", async (req, res) => {
  // Only admins can call this endpoint. this is to prevent a non-admin from making themselves an admin
  if (typeof userSession === "undefined" || (typeof userSession !== "undefined" && userSession.Admin === false)) {
    res.send[("ERROR", "Access denied")];
    return;
  }

  const userID = typeof req.query.wl_userid !== "undefined" ? req.query.wl_userid : null;
  const userName = typeof req.query.wl_username !== "undefined" ? req.query.wl_username : null;
  const realName = typeof req.query.wl_realname !== "undefined" ? req.query.wl_realname : null;
  const password = typeof req.query.wl_password !== "undefined" ? req.query.wl_password : null;
  const admin = typeof req.query.wl_admin !== "undefined" && (req.query.wl_admin === "true" || req.query.wl_admin === "false") ? (req.query.wl_admin === "true" ? 1 : 0) : null;
  const enabled = typeof req.query.wl_enabled !== "undefined" && (req.query.wl_enabled === "true" || req.query.wl_enabled === "false") ? (req.query.wl_enabled === "true" ? 1 : 0) : null;

  if (userID === null) {
    res.send(["ERROR","User Name was not provided"]);
    return;
  }

  const updateColumns = {};

  if (userName !== null) {
    updateColumns["Username"]=userName;
  }

  if (realName !== null) {
    updateColumns["Realname"]=realName;
  }

  if (password !== null) {
    updateColumns["Password"]=password;
  }

  if (admin !== null) {
    updateColumns["Admin"]=admin;
  }

  if (enabled !== null) {
    updateColumns["Enabled"]=enabled;
  }

  if (updateColumns == {}) {
    res.send(["ERROR", "No params were passed"]);
    return;
  }

  const updatedRowCount = await models.Users.update(
    updateColumns
  ,{
    //logging: console.log,
    where: { UserID: userID}
  }).catch(function (e) {
    const errorMsg = `/UpdateUser: The error ${e.message} occurred while updating User with ID ${userID}`;
    res.send(["ERROR", errorMsg]);
    return;
  });

  res.send(["OK", updatedRowCount]);

  //const SQL = `UPDATE Users SET ${updateStr} WHERE UserID=:UserID`;

  /*sequelize
    .query(SQL, {
      replacements: {
        UserID: userID,
        Username: userName,
        Realname: realName,
        Password: password,
        Admin: admin,
        Enabled: enabled,
      },
    })
    .then(() => {
      res.send(["OK", ""]);
    })
    .catch(function (err) {
      res.send(["ERROR", `/UpdateUsers: The error ${err.message} occurred while updating User with ID ${userID}`]);
    });*/
});

/**
 * @swagger
 * /UpdateWatchList:
 *    put:
 *        tags:
 *          - WatchList
 *        summary: Update WatchList item
 *        description: Update WatchList item
 *        parameters:
 *           - name: WatchListID
 *             in: query
 *             description: WatchList ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: WatchListItemID
 *             in: query
 *             description: WatchList Item ID
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: StartDate
 *             in: query
 *             description: Start Date
 *             required: false
 *             schema:
 *                  type: string
 *           - name: EndDate
 *             in: query
 *             description: End Date
 *             required: false
 *             schema:
 *                  type: string
 *           - name: WatchListSourceID
 *             in: query
 *             description: WatchList Source ID
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Season
 *             in: query
 *             description: Season
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Rating
 *             in: query
 *             description: Rating
 *             required: false
 *             schema:
 *                  type: integer
 *           - name: Notes
 *             in: query
 *             description: Notes
 *             required: false
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/UpdateWatchList", async (req, res) => {
  const watchListID = typeof req.query.WatchListID !== "undefined" ? req.query.WatchListID : null;
  const watchListItemID = typeof req.query.WatchListItemID !== "undefined" ? req.query.WatchListItemID : null;
  const startDate = typeof req.query.StartDate !== "undefined" ? req.query.StartDate : null;
  const endDate = typeof req.query.EndDate !== "undefined" ? req.query.EndDate : null; // Optional
  const sourceID = typeof req.query.WatchListSourceID !== "undefined" ? req.query.WatchListSourceID : null;
  const season = typeof req.query.Season !== "undefined" ? req.query.Season : null;
  const archived = typeof req.query.Archived !== "undefined" ? req.query.Archived : null;
  const rating = typeof req.query.Rating !== "undefined" ? req.query.Rating : null;
  const notes = typeof req.query.Notes !== "undefined" ? req.query.Notes : null;

  if (watchListID === null) {
    res.send(["ERROR", "WatchList ID was not provided"]);
    return;
  }

  const updateColumns = {};

  if (watchListItemID !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "WatchListItemID=:WatchListItemID";
    updateColumns['WatchListItemID']=watchListItemID;
  }

  if (startDate !== null) {
    updateColumns['StartDate']=startDate;
  }

  if (endDate !== null) {
    updateColumns['EndDate']=endDate;
  }

  if (sourceID !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "WatchListSourceID=:WatchListSourceID";
    updateColumns['WatchListSourceID']=sourceID;
  }

  if (season !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "Season=:Season";
    updateColumns['Season']=season;
  }

  if (archived !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "Archived=:Archived";
    updateColumns['Archive']=archived;
  }

  if (rating !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "Rating=:Rating";
    updateColumns['Rating']=rating;
  }

  if (notes !== null) {
    //updateStr += (updateStr == "" ? "" : ",") + "Notes=:Notes";
    updateColumns['Notes']=notes;
  }

  if (updateColumns === {}) { // No params were passed except for the mandatory column
        res.send(["ERROR","No params were passed"]);
        return;
  }

  const updatedRowCount = await models.WatchList.update(
    updateColumns
  ,{
    //logging: console.log,
    where: { WatchListID: watchListID}
  }).catch(function (e) {
    const errorMsg = `/UpdateWatchList: The error ${e.message} occurred while updating WatchList with ID ${watchListID}`;
    res.send(["ERROR", errorMsg]);
    return;
  });

  res.send(["OK", updatedRowCount]);
});

/**
 * @swagger
 * /UpdateWatchListItem:
 *    put:
 *        tags:
 *          - WatchListItems
 *        summary: Update WatchList item
 *        description: Update WatchList item
 *        parameters:
 *           - name: WatchListItemID
 *             in: query
 *             description: WatchList Item ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: Name
 *             in: query
 *             description: Name
 *             required: false
 *             schema:
 *                  type: string
 *           - name: Type
 *             in: query
 *             description: Type
 *             required: false
 *             schema:
 *                  type: string
 *           - name: IMDB_URL
 *             in: query
 *             description: IMDB_URL
 *             required: false
 *             schema:
 *                  type: string
 *           - name: IMDB_Poster
 *             in: query
 *             description: IMDB_URL
 *             required: false
 *             schema:
 *                  type: string
 *           - name: Notes
 *             in: query
 *             description: Notes
 *             required: false
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/UpdateWatchListItem", async (req, res) => {
  const watchListItemID = typeof req.query.WatchListItemID !== "undefined" ? req.query.WatchListItemID : null;
  const name = typeof req.query.WatchListItemName !== "undefined" ? req.query.WatchListItemName : null;
  const typeID = typeof req.query.WatchListTypeID !== "undefined" ? req.query.WatchListTypeID : null;
  const imdb_url = typeof req.query.IMDB_URL !== "undefined" ? req.query.IMDB_URL : null;
  const imdb_poster = typeof req.query.IMDB_Poster !== "undefined" ? req.query.IMDB_Poster : null;
  const notes = typeof req.query.ItemNotes !== "undefined" ? req.query.ItemNotes : null;
  const archived = typeof req.query.Archived !== "undefined" ? req.query.Archived : null;

  if (watchListItemID === null) {
    res.send(["ERROR", "ID was not provided"]);
    return;
  } else {
    const updateColumns = {};
    //let updateStr = "";

    if (name !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "WatchListItemName=:WatchListItemName";
      updateColumns['WatchListItemName']=name;
    }

    if (typeID !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "WatchListTypeID=:WatchListTypeID";
      updateColumns['WatchListTypeID']=typeID;
    }

    if (imdb_url !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "IMDB_URL=:IMDB_URL";
      updateColumns['IMDB_URL']=imdb_url;
    }

    if (imdb_poster !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "IMDB_Poster=:IMDB_Poster";
      updateColumns['IMDB_Poster']=imdb_poster;
    }

    if (notes !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "ItemNotes=:ItemNotes";
      updateColumns['ItemNotes']=notes;
    }

    if (archived !== null) {
      //updateStr += (updateStr == "" ? "" : ",") + "Archived=:Archived";
      updateColumns['Season']=season;
    }

    if (updateColumns === {}) { // No params were passed except for the mandatory column
         res.send(["ERROR","No params were passed"]);
         return;
    }

    const updatedRowCount = await models.WatchListItems.update(
      updateColumns
    ,{
      where: { WatchListItemID: watchListItemID}
    }).catch(function (e) {
      const errorMsg = `/UpdateWatchListItems: The error ${e.message} occurred while updating WatchList Item with ID ${watchListItemID}`;
      res.send(["ERROR", errorMsg]);
      return;
    });

    res.send(["OK", updatedRowCount]);

    /*if (updateStr === "") {
      // No params were passed except for the mandatory column
      res.send(["ERROR", "No params were passed"]);
      return;
    }

    const SQL = `UPDATE WatchListItems SET ${updateStr} WHERE WatchListItemID=:WatchListItemID`;

    sequelize
      .query(SQL, {
        replacements: {
          WatchListItemID: watchListItemID,
          WatchListItemName: name,
          WatchListTypeID: typeID,
          IMDB_URL: imdb_url,
          IMDB_Poster: imdb_poster,
          ItemNotes: notes,
          Archived: archived,
        },
      })
      .then((results) => {
        res.send(["OK", ""]);
      })
      .catch(function (err) {
        res.send(["ERROR", `/UpdateWatchListItems: The error ${err.message} occurred while updating WatchList Items with ID ${watchListItemID}`]);
      });*/
  }
});

/**
 * @swagger
 * /UpdateWatchSource:
 *    put:
 *        tags:
 *          - WatchListSource
 *        summary: Update WatchList source
 *        description: Update WatchList source
 *        parameters:
 *           - name: WatchListSourceID
 *             in: query
 *             description: WatchList Source ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: WatchListSourceName
 *             in: query
 *             description: WatchList Source name
 *             required: true
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/UpdateWatchListSource", async (req, res) => {
  const watchListSourceID = typeof req.query.WatchListSourceID !== "undefined" ? req.query.WatchListSourceID : null;
  const watchListSourceName = typeof req.query.WatchListSourceName !== "undefined" ? req.query.WatchListSourceName : null;

  if (watchListSourceID === null) {
    res.send(["ERROR", "WatchList Source ID was not provided"]);
    return;
  } else if (watchListSourceName === null) {
    res.send(["ERROR", "WatchList Source Name was not provided"]);
    return;
  }

  const updatedRowCount = await models.WatchListSources.update(
    { WatchListSourceName: watchListSourceName }
  ,{
    //logging: console.log,
    where: { WatchListSourceID: watchListSourceID}
  }).catch(function (e) {
    const errorMsg = `/UpdateWatchList: The error ${e.message} occurred while updating WatchList Sources with ID ${watchListSourceID}`;
    res.send(["ERROR", errorMsg]);
    return;
  });

  res.send(["OK", updatedRowCount]);
});

/**
 * @swagger
 * /UpdateWatchType:
 *    put:
 *        tags:
 *          - WatchListType
 *        summary: Update WatchList type
 *        description: Update WatchList type
 *        parameters:
 *           - name: WatchListTypeID
 *             in: query
 *             description: WatchList Type ID
 *             required: true
 *             schema:
 *                  type: integer
 *           - name: WatchListTypeName
 *             in: query
 *             description: WatchList Type name
 *             required: true
 *             schema:
 *                  type: string
 *        responses:
 *          200:
 *            description: "['OK',''] on success, ['ERROR','ERROR MESSAGE'] on error"
 *
 */
app.put("/UpdateWatchListType", async (req, res) => {
  const watchListTypeID = typeof req.query.WatchListTypeID !== "undefined" ? req.query.WatchListTypeID : null;
  const watchListTypeName = typeof req.query.WatchListTypeName !== "undefined" ? req.query.WatchListTypeName : null;

  if (watchListTypeID === null) {
    res.send(["ERROR", "WatchList Type ID was not provided"]);
    return;
  } else if (watchListTypeName === null) {
    res.send(["ERROR", "WatchList Type Name was not provided"]);
    return;
  }

  const updatedRowCount = await models.WatchListTypes.update(
    { WatchListTypeName: watchListTypeName }
  ,{
    //logging: console.log,
    where: { WatchListTypeID: watchListTypeID}
  }).catch(function (e) {
    const errorMsg = `/UpdateWatchList: The error ${e.message} occurred while updating WatchList Types with ID ${watchListTypeID}`;
    res.send(["ERROR", errorMsg]);
    return;
  });

  res.send(["OK", updatedRowCount]);
});

async function addUser(req, res, IsNewInstance = false) {
  const userName = typeof req.query.wl_username !== "undefined" ? req.query.wl_username : null;
  const realName = typeof req.query.wl_realname !== "undefined" ? req.query.wl_realname : null;
  const password = typeof req.query.wl_password !== "undefined" ? req.query.wl_password : null;
  const isAdmin = typeof req.query.wl_isadmin !== "undefined" && (req.query.wl_isadmin === "true" || IsNewInstance === true) ? 1 : 0;

  if (userName === null) {
    res.send(["User Name was not provided"]);
    return;
  } else if (realName === null) {
    res.send(["Real name was not provided"]);
    return;
  } else if (password === null) {
    res.send(["Password was not provided"]);
    return;
  } else {
    if (IsNewInstance === true) {
      await sequelize.sync({ alter: true }); // Init the DB


      // Initialize the default watchlist sources so this table is not empty by default
      defaultSources.forEach(async (element) => { 
        await models.WatchListSources.create({
          WatchListSourceName: element
        })        
        .catch(function (e) {
            const errorMsg = `addUser(): The error ${e.message} occurred while initializing the default WatchList Sources`;
            console.error(errorMsg);
        });
      });

      // Initialize the default watchlist types so this table is not empty by default
      defaultTypes.forEach(async (element) => { 
        await models.WatchListTypes.create({
          WatchListTypeName: element
        })        
        .catch(function (e) {
            const errorMsg = `addUser(): The error ${e.message} occurred while initializing the default WatchList Types`;
            console.error(errorMsg);
        });
      });
    } else {
      // This action should only be performed by logged in users who are an admin when not setting up new instance
      if (typeof userSession === "undefined" || (typeof userSession !== "undefined" && userSession.Admin === false)) {
        res.send(["ERROR", `addUser(): Access Denied`]);
        return;
      }
    }

    await models.Users.create({
      Username: userName,
      Realname: realName,
      Password: password,
      Admin: isAdmin,
      Enabled: 1,
    })
      .then((result) => {
        // Return ID of newly inserted row
        res.send(["OK", result.UserID]);
      })
      .catch(function (e) {
        const errorMsg = `addUser(): The error ${e.message} occurred while adding the user`;
        console.error(errorMsg);
        res.send(["ERROR", errorMsg]);
      });
  }
}
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
