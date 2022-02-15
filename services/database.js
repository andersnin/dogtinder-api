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

function getUserByEmail(email) {
  return database
    .query(
      `
    SELECT id, firstname, surname, email, password FROM users WHERE email = $1
  `,
      [email]
    )
    .then((results) => results.rows[0]);
}

function getUserMatchesById(id) {
  return database
    .query(
      `
      SELECT A.from_user_id AS me, B.from_user_id AS user_who_matched
FROM likes A
JOIN likes B
  ON A.from_user_id = B.to_user_id
  AND A.to_user_id = B.from_user_id
  AND A.id <> B.id
WHERE A.likes = true 
  AND B.likes = true
  AND A.from_user_id = $1;
      `,
      [id]
    )
    .then((results) => results.rows);
}

function createUser(surname, firstname, email, password, sex, breed, bio) {
  return database
    .query(
      `
    INSERT INTO users
      (surname, firstname, email, password, sex, breed, bio)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      *
  `,
      [surname, firstname, email, password, sex, breed, bio]
    )
    .then((results) => results.rows[0]);
}

module.exports = {
  getUsers,
  createUser,
  getUserById,
  getUserByEmail,
  getUserMatchesById,
};
