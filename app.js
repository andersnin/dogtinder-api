require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const {
    getUsers,
  } = require("./services/database");

const port = process.env.PORT;
const secret = process.env.SECRET;

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

app.listen(port, () => {
    console.log(`Twitter API listening on port ${port}`);
  });