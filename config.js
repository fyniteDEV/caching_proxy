require("dotenv").config();

const PSQL_USER = process.env.PSQL_USER;
const PSQL_HOST = process.env.PSQL_HOST;
const PSQL_DATABASE = process.env.PSQL_DATABASE;
const PSQL_PASSWORD = process.env.PSQL_PASSWORD;
const PSQL_PORT = process.env.PORT;

const DEFAULT_EXPIRATION_POLICY = 3600;

module.exports = {
    PSQL_USER,
    PSQL_HOST,
    PSQL_DATABASE,
    PSQL_PASSWORD,
    PSQL_PORT,
    DEFAULT_EXPIRATION_POLICY
}