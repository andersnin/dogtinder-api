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

  function getUserById(id) {
    return database
      .query(
        `
      SELECT * FROM users WHERE id = $1
    `,
        [id]
      )
      .then((results) => results.rows[0]);
  }

  module.exports = {
    getUsers,
    getUserById
  };