import { NextRequest } from 'next/server';
import { DBType, getUserID, sequelize } from "../lib";

/**
 * @swagger
 * /api/GetWatchListTopRatedStats:
 *    get:
 *        tags:
 *          - WatchList
 *        summary: Get the WatchList top rated stats for the current user
 *        description: Get the WatchList top rated stats for the highest rated movie/shows for the current user
 *        responses:
 *          200:
 *            description: '["OK",""] on success, ["ERROR","error message"] on error'
 */
export async function GET(request: NextRequest) {
     const userID = await getUserID(request);

     if (userID === null) {
          return Response.json(["ERROR", "User ID is not set"]);
     }

     const SQL = `SELECT ${DBType === "MSSQL" ? ` TOP(10) ` : ``} WatchListItemName,Season,Rating,IMDB_URL FROM WatchList LEFT JOIN WatchListItems ON WatchListItems.WatchListItemID=WatchList.WatchListItemID WHERE Rating IS NOT NULL AND UserID=:UserID ORDER BY Rating DESC ${DBType == "SQLite" ? " LIMIT 10" : ""}`;

     return sequelize
          .query(SQL, { replacements: { UserID: userID } })
          .then((results: any) => {
               return Response.json(["OK", results[0]]);
          })
          .catch(function (err) {
               return Response.json(["ERROR", `/GetWatchListTopRatedStats: The error ${err.message} occurred getting the WatchList Top Rated Stats`]);
          });
}