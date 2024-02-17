const config = require("config");
import cookie from "cookie";
import * as CryptoJS from 'crypto-js';
import { getSession } from "./getSession";
import { Sequelize } from "sequelize";
import { NextApiRequest, NextApiResponse } from 'next';
import User from "../../app/interfaces/IUser";

// Constants
export let DBType = config.has(`SQLite.username`) ? "SQLite" : config.has(`SQLServer.username`) ? "SQLServer" : "";

export const DBFile = "watchlistdb.sqlite.demo";

const defaultSources = ['Amazon', 'Hulu', 'Movie Theatre', 'Netflix', 'Plex', 'Prime', 'Web'];
const defaultTypes = ['Movie', 'Other', 'Special', 'TV'];

// SQLite
const SQLiteSequelize = new Sequelize(config.get(`SQLite.database`), config.get(`SQLite.username`), config.get(`SQLite.password`), {
     dialect: "sqlite",
     storage: DBFile,
     logging: false
});

const MSSQLSequelize = new Sequelize(config.get(`SQLServer.database`), config.get(`SQLServer.username`), config.get(`SQLServer.password`), {
     host: config.get(`SQLServer.host`),
     //encrypt: false,
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

export const sequelize = DBType === "SQLite" ? SQLiteSequelize : MSSQLSequelize;

const initModels = require("./models/init-models");
const models = initModels(sequelize);
const secretKey = config.get(`Secret`);

export async function addUser(req: NextApiRequest, res: NextApiResponse, IsNewInstance = false) {
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
                         .catch(function (e: Error) {
                              const errorMsg = `addUser(): The error ${e.message} occurred while initializing the default WatchList Sources`;
                              console.error(errorMsg);
                         });
               });

               // Initialize the default watchlist types so this table is not empty by default
               defaultTypes.forEach(async (element) => {
                    await models.WatchListTypes.create({
                         WatchListTypeName: element
                    })
                         .catch(function (e: Error) {
                              const errorMsg = `addUser(): The error ${e.message} occurred while initializing the default WatchList Types`;
                              console.error(errorMsg);
                         });
               });
          } else {
               // This action should only be performed by logged in users who are an admin when not setting up new instance
               const userSession = await getSession(req, res);

               if (typeof userSession === "undefined" || (typeof userSession !== "undefined" && userSession.Admin === false)) {
                    res.send(["ERROR", `addUser(): Access Denied`]);
                    return;
               }
          }

          await models.Users.create({
               Username: encrypt(String(userName)),
               Realname: encrypt(String(realName)),
               Password: encrypt(String(password)),
               Admin: isAdmin,
               Enabled: 1,
          }).then((result: User) => {
               // Return ID of newly inserted row
               res.send(["OK", result.UserID]);
          }).catch(function (e: Error) {
               const errorMsg = `addUser(): The error ${e.message} occurred while adding the user`;
               console.error(errorMsg);
               res.send(["ERROR", errorMsg]);
          });
     }
}

export const encrypt = (plainText: string) => {
     const cipherText = CryptoJS.AES.encrypt(plainText, secretKey).toString()
     return cipherText
}

export const decrypt = (cipherText: string) => {
     const bytes = CryptoJS.AES.decrypt(cipherText, secretKey)
     const plainText = bytes.toString(CryptoJS.enc.Utf8)
     return plainText
}

export function getModels() {
     return models;
}

export async function getUserID(req: NextApiRequest, res: NextApiResponse) {
     const userSession = await getUserSession(req, res);

     if (typeof userSession !== "undefined" && typeof userSession.UserID !== "undefined") {
          return userSession.UserID;
     } else {
          return null;
     }
}

export async function getUserSession(req: NextApiRequest, res: NextApiResponse) {
     const cookies = cookie.parse(req.headers.cookie || '');

     let userSessionCookie;
     
     try {
          userSessionCookie = JSON.parse(cookies.userData);
     } catch(e: any) {
          userSessionCookie = null;
     }

     return userSessionCookie;
}

export async function validateSettings() {
     if (DBType === "") {
          //console.log(`Config file error: Database is not configured`);
          return false;
     }

     // Validate config file properties that are required
     if (!config.has(`Secret`)) {
          return `Config file error: Secret property is missing or not set`;
     }
     if (DBType === "MSSQL" && (!config.has(`SQLServer.username`) || (config.has(`SQLServer.username`) && config.get(`SQLServer.username`) === ""))) {
          return `Config file error: SQLServer.username property is missing or not set`;
     }
     
     if (DBType === "MSSQL" && (!config.has(`SQLServer.password`) || (config.has(`SQLServer.password`) && config.get(`SQLServer.password`) === ""))) {
          return `Config file error: SQLServer.password property is missing or not set`;
     }
     
     if (DBType === "MSSQL" && (!config.has(`SQLServer.host`) || (config.has(`SQLServer.host`) && config.get(`SQLServer.host`) === ""))) {
          return `Config file error: SQLServer.host property is missing or not set`;
     }
     
     if (DBType === "MSSQL" && (!config.has(`SQLServer.database`) || (config.has(`SQLServer.database`) && config.get(`SQLServer.database`) === ""))) {
          return `Config file error: SQLServer.database property is missing or not set`;
     }
     
     if (DBType === "SQLite" && (!config.has(`SQLite.username`) || (config.has(`SQLite.username`) && config.get(`SQLite.username`) === ""))) {
          return `Config file error: SQLite.username property is missing or not set`;
     }
     
     if (DBType === "SQLite" && (!config.has(`SQLite.password`) || (config.has(`SQLite.password`) && config.get(`SQLite.password`) === ""))) {
          return `Config file error: SQLite.password property is missing or not set`;
     }
     
     if (DBType === "SQLite" && (!config.has(`SQLite.database`) || (config.has(`SQLite.database`) && config.get(`SQLite.database`) === ""))) {
          return `Config file error: SQLite.database property is missing or not set`;
     }

     if (DBType === "MSSQL") {
          (async () => {
               try {
                    await sequelize.authenticate();
     
               } catch (e: any) {
                    return `Sequelize encountered the error ${e.message} while connecting to the DB`;
               }
          })();
     }

     return "";
}