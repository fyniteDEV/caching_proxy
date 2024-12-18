# Caching Proxy

A caching server made using Express, Axios and PostgreSQL

## How to use
1. Clone the repository
2. Install dependencies: `npm install`
3. Create the database in PSQL using the file in `./db/cache.sql`
4. Copy and populate the sample environment variable file with your config values: `cp .env.sample .env`
5. Run the project: e.g. `node app.js --origin https://dummyjson.com --port 3000 --clear-cache`
     - Info on command-line arguments: `node app.js --help`
