import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const bugLogID = searchParams.get("WLBugID");
    const bugLogName = searchParams.get("WLBugName");
    const addDate = searchParams.get("AddDate");
    const completedDate = searchParams.get("CompletedDate");

    if (bugLogID === null) {
        return Response.json({ "ERROR": "Bug log ID is not set" });
    }

    let params = "";

    if (bugLogName !== null) {
        params += "&WLBugName=" + encodeURIComponent(bugLogName);
    }

    if (addDate !== null) {
        params += "&AddDate=" + encodeURIComponent(addDate);
    }

    if (completedDate !== null) {
        params += "&CompletedDate=" + encodeURIComponent(completedDate);
    }

    if (params === "") {
        return Response.json(["ERROR", `No parameters were passed`]);
    }

    params = "?WLBugID=" + bugLogID + params;

    const axios = require("axios");
    const https = require('https');

    const updateBugsLogURL = `https://nodejs-shovav.replit.app/UpdateBugLog`;

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    return axios.get(updateBugsLogURL + params, { httpsAgent: agent })
        .then(() => {
            return Response.json(["OK"]);
        })
        .catch((err: Error) => {
            return Response.json(["ERROR", err.message]);
        });
}