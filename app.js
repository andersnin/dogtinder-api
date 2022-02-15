require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const {
  getUsers,
  createUser,
  deleteUser,
  getMessages,
  getUserById,
  getUserByEmail,
  getUserMatchesById,
  getPotentialMatches,
} = require("./services/database");

const port = process.env.PORT;
const secret = process.env.SECRET;
console.log(port);

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send({ message: "Hello from DogTinder!" });
});

app.get("/users", async (req, res) => {
  const users = await getUsers();
  res.send(users);
});

app.get("/users/:userid", async (req, res) => {
  const userId = req.params.userid;
  const user = await getUserById(userId);
  res.send(user);
});

app.get("/swipecards/:userid", async (req, res) => {
  try {
    const userId = req.params.userid;
    const users = await getPotentialMatches(userId);
    res.send(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
});

app.get("/users/:userid/matches", async (req, res) => {
  const userId = req.params.userid;
  const matches = await getUserMatchesById(userId);
  res.send(matches);
});

app.listen(port, () => {
  console.log(`Twitter API listening on port ${port}`);
});

app.post("/signup", async (req, res) => {
  const { surname, firstname, email, password, sex, breed, bio } = req.body;
  console.log(req.body);

  try {
    const newUser = await createUser(
      surname,
      firstname,
      email,
      password,
      sex,
      breed,
      bio
    );
    res.send(newUser);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
});

app.get("/messages/:fromuserid/:touserid", async (req, res) => {
  try {
    const { fromuserid, touserid } = req.params;
    const messages = await getMessages(fromuserid, touserid);
    res.send(messages);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).send({ error: "Unknown user" });
    }

    if (user.password !== password) {
      return res.status(401).send({ error: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        surname: user.surname,
      },
      Buffer.from(secret, "base64")
    );

    res.send({
      token: token,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/delete", async (req, res) => {
  const token = req.headers["doggytoken"];

  try {
    const payload = jwt.verify(token, Buffer.from(secret, "base64"));
    const deleteUser = await deleteUser(payload.id);
    res.send(deleteUser);
  } catch (error) {
    res.status(401).send({
      error: "Unable to authenticate - please use a valid token",
    });
  }
});
