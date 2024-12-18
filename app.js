const express = require("express");
const yargs = require("yargs");

const { handleGetReq, relayNonGetReq } = require("./services/handleReqs")
const db = require("./db/db");


// Handle CLI arguments
const argv = yargs
    .option("port", {
        alias: "p",
        type: "number",
        description: "Specify the port number the server should run on",
    })
    .option("origin", {
        alias: "o",
        type: "string",
        description: "Specify the URL the server should forward requests to",
    })
    .option("clear-cache", {
        type: "boolean",
        description: "Specify whether all already cached responses should be deleted from the database before launching the server",
    })
    .demandOption(["port", "origin"], "Please provide both --port and --origin arguments")
    .help()
    .argv;

const { port, origin, clearCache } = argv;
if (clearCache) {
    db.clearCache();
}


const app = express();
app.use(express.json());

app.get("*", async (req, res) => {
    console.log(`GET request made to ${req.url}`);
    
    const reqUrl = new URL(req.url, origin);
    const apiRes = await handleGetReq(reqUrl);

    let headers = { ...apiRes.headers };
    delete headers["transfer-encoding"];
    res.set(headers);
    apiRes.cached ? res.set("X-Cache", "HIT") : res.set("X-Cache", "MISS"); 
    
    res.status(apiRes.status).send(apiRes.data);
});

app.all("*", async (req, res) => {
    console.log(`${req.method} request made to ${req.url}`);
    reqUrl = new URL(req.url, origin);
    const apiRes = await relayNonGetReq(req.method.toLowerCase(), reqUrl, req.body, req.headers);
    res.status(apiRes.status).send(apiRes.data);
});


app.listen(port, () => {
    console.log(`Listening on port ${port}   -   Forwarding to ${origin}\n`);
});