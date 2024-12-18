const { Pool } = require("pg");
const config = require("../config");

const pool = new Pool({
    user: config.PSQL_USER,
    host: config.PSQL_HOST,
    database: config.PSQL_DATABASE,
    password: config.PSQL_PASSWORD,
    port: config.PSQL_PORT,
    client_encoding: 'UTF8',
});

async function insertCacheEntry(url, res_headers, res_body, {expires_at, valid_for}) {
    let expiration_date;
    if (expires_at != undefined) {
        expiration_date = new Date(expires_at);
    } else if (valid_for != undefined) {
        d = new Date();
        d.setSeconds(d.getSeconds() + valid_for);
        expiration_date = d;
    }
    
    const query = `
    INSERT INTO cache (url, res_headers, res_body, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `;    
    const values = [url, res_headers, res_body, expiration_date];

    pool.query(query, values)
        .then(res => {
            console.log("    Response succesfully cached");
        })
        .catch(err => {
            console.error("    Error inserting rows: " + err)
        });
}

// returns the response as an object if an entry is found,
// otherwise it returns undefined
async function getCacheEntry(url) {
    const query = "SELECT * FROM cache WHERE url = $1";
    const values = [url];

    const res = await pool.query(query, values);
    return res.rows[0];
}

async function deleteEntry(url) {
    const query = "DELETE FROM cache WHERE url = $1";
    const values = [url];

    pool.query(query, values)
        .then(res => {
            console.log("    Expired entry succesfully deleted");
        })
        .catch(err => {
            console.error("    Error deleting entry: " + err)
        });
}

async function clearCache() {
    const query = "TRUNCATE TABLE cache";
    pool.query(query)
        .then(res => {
            console.log("Cache successfully cleared");
        })
        .catch(err => {
            console.error("Error clearing cache: " + err)
        });
}

module.exports = {
    insertCacheEntry,
    getCacheEntry,
    deleteEntry,
    clearCache
};