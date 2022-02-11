const { Pool } = require("pg");

const database = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.IS_LOCAL ? undefined : { rejectUnauthorized: false },
});


function getUsers() {
    return database
      .query(
        `
      SELECT
        *
      FROM
        users;
    `
      )
      .then((results) => results.rows);
  }

  module.exports = {
    getUsers,
  };