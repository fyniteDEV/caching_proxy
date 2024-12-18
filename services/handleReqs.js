const axios = require("axios");
const https = require("https");

const db = require("../db/db");
const config = require("../config");

async function handleGetReq(url) {
    // check if there is an entry in the database
    const cacheEntry = await db.getCacheEntry(url.href);
    if (cacheEntry != undefined ) { 
        const expiresAt = new Date(cacheEntry.expires_at);
        const now = new Date();
        if (now < expiresAt) {
            console.log("    Cached response found, forwarding entry to client...")
            return {
                success: true,
                status: 200,
                cached: true,
                data: cacheEntry.res_body,
                headers: cacheEntry.res_headers
            };
        } else {
            console.log("    Cache expired, updating response...");
            db.deleteEntry(url.href);
        }
    }
    
    console.log("    Cache unavailable, forwarding request...");
    try {
        const res = await axios.get(url.href);
        let expiration = {};
        // Expires
        if (res.headers['expires'] != undefined) {
            try {
                d = new Date(res.headers['expires']);
                expiration.expires_at = d;
            } catch (error) {
                console.error("    Invalid Expires header value. Falling back to Cache-Control max-age if available...");   
            }
        }
        // Cache-Control
        if (expiration.expires_at == undefined && res.headers['cache-control'] != undefined) {
            const cc = res.headers['cache-control'];
            const directives = cc.split(',');
            let max_age;
            directives.forEach(d => {
                if (d.trim().startsWith("max-age")) {
                    max_age = d.split("=")[1];
                }
            });
            expiration.valid_for = max_age;
        // Fallback: default expiration policy to be used  
        } else {
            expiration.valid_for = config.DEFAULT_EXPIRATION_POLICY;
        }

        await db.insertCacheEntry(url.href, res.headers, res.data, expiration);

        return {
            success: true,
            status: res.status,
            cached: false,
            data: res.data,
            headers: res.headers
        }
    } catch (error) {
        console.log(error);
        if (error.response) {
            // the request was made, but the status code != 2xx
            return {
                success: false,
                status: error.response.status,
                cached: false,
                data: error.response.data,
                headers: error.response.headers
            }
        } else if (error.request) {
            // no response from the server
            return {
                success: false,
                status: error.request.status,
                cached: false,
                data: error.request.data,
                headers: error.request.headers
            }
        } else {
            // internal server error, on this machine
            return {
                success: false,
                status: 500,
                cached: false,
                data: "Internal server error on caching proxy server",
                headers: null
            }
        }
    }
}

async function relayNonGetReq(method, url, body = null, headers) {
    const forwardedHeaders = { ...headers };
    forwardedHeaders.Host = url.host;

    let res;
    try {
        switch (method) {
            case "post":
                res = await axios.post(url.href, body, headers);        
                break;
            case "put":
                res = await axios.put(url.href, body, headers);
                break;
            case "delete":
                res = await axios.delete(url.href, headers);
                break;
            case "patch":
                res = await axios.patch(url.href, body, headers);
                break;
            default:
                console.log(`    Unsupported HTTP method: ${method}`);
                return {
                    success: false,
                    status: 500,
                    cached: false,
                    data: `Unsupported HTTP method: ${method}`,
                    headers: null
                }
        }
    } catch (error) {
        console.log("    Error forwarding method to URL");
        return {
            success: false,
            status: 500,
            cached: false,
            data: "Internal server error on caching proxy server",
            headers: null
        }
    }

    console.log("    Request forwarded to server");
    return res;
}

module.exports = {
    handleGetReq,
    relayNonGetReq,
}