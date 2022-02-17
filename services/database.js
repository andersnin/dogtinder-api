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

function getMessages(from_user_id, to_user_id) {
  return database
    .query(
      `
    SELECT id, from_user_id, to_user_id, message, created_at
FROM messages
WHERE (from_user_id = $1 AND  to_user_id = $2) OR (from_user_id = $2 AND  to_user_id = $1)
ORDER BY created_at  DESC
    `,
      [from_user_id, to_user_id]
    )
    .then((results) => results.rows);
}

function postNewMessage(fromUserId, toUserId, newMessage) {
  return database
    .query(
      `
    INSERT INTO messages
      (from_user_id, to_user_id, message)
    VALUES
      ($1, $2, $3)
    RETURNING
      *
  `,
      [fromUserId, toUserId, newMessage]
    )
    .then((results) => results.rows[0]);
}

function getPotentialMatches(id) {
  return database
    .query(
      `SELECT
      id, firstname, surname, bio, img_url, sex, breed, age
  FROM
      users
  WHERE NOT EXISTS (
      SELECT *
      FROM
          likes
      WHERE
          likes.from_user_id = $1 AND users.id = likes.to_user_id
  )
  AND NOT users.id = $1
  ORDER BY id
      `,
      [id]
    )
    .then((results) => results.rows);
}

function getUserMatchesById(id) {
  return database
    .query(
      `
      SELECT U.surname, U.firstname, U.img_url, U.bio, U.age, U.sex, A.from_user_id AS me, B.from_user_id AS user_who_matched
      FROM likes A
      JOIN users U
      ON U.id = A.to_user_id
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
      (surname, firstname, email, password, bio, breed, sex)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      *
  `,
      [surname, firstname, email, password, bio, breed, sex]
    )
    .then((results) => results.rows[0]);
}

function editUser(id, surname, firstname, email, password, sex, breed, bio) {
  return database
    .query(
      `UPDATE users SET (surname, firstname, email, password, sex, breed, bio) = ($2, $3, $4, $5, $6, $7, $8)
      WHERE id = $1
      RETURNING
      *
`,
      [id, surname, firstname, email, password, sex, breed, bio]
    )
    .then((results) => results.rows[0]);
}

function deleteUser(id) {
  return database
    .query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [id]
    )
    .then((results) => results.rows[0]);
}

function postReaction(from_user_id, to_user_id, likes) {
  return database
    .query(
      `
    INSERT INTO likes
      (from_user_id, to_user_id, likes)
    VALUES
      ($1, $2, $3)
    RETURNING
      *
  `,
      [from_user_id, to_user_id, likes]
    )
    .then((results) => results.rows);
}

module.exports = {
  getUsers,
  editUser,
  createUser,
  deleteUser,
  getUserById,
  getMessages,
  postReaction,
  getUserByEmail,
  postNewMessage,
  getUserMatchesById,
  getPotentialMatches,
};
