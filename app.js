require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { getUsers, getUserById, getUserMatchesById, createUser } = require("./services/database");

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
  console.log(user);
  res.send(user);
});

app.get("/users/:userid/matches", async (req, res) => {
  const userId = req.params.userid;
  const matches = await getUserMatchesById(userId);
  res.send(matches);
});

app.listen(port, () => {
  console.log(`Twitter API listening on port ${port}`);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(401).send({ error: "Unknown user" });
    }

    if (user.password !== password) {
      return res.status(401).send({ error: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
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
