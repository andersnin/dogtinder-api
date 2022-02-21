require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var http = require('http');

const {
  getUsers,
  createUser,
  editUser,
  deleteUser,
  getMessages,
  getUserById,
  postReaction,
  getUserByEmail,
  postNewMessage,
  getUserMatchesById,
  getPotentialMatches,
  getMessagesByUserId,
} = require("./services/database");



// Express Server

const port = process.env.PORT;
const secret = process.env.SECRET;

const app = express();

// Websocket Server

var server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

let interval;

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

server.listen(port, () => {
  console.log(`DogTinder WS-API listening on port ${port}`);
});

// Server functions

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send({ message: "Hello from DogTinder!" });
});

app.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.send(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
});

app.get("/users/:userid", async (req, res) => {
  try {
    const userId = req.params.userid;
    const user = await getUserById(userId);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
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

app.post("/swipecards", async (req, res) => {
  const { to_user_id, likes } = req.body;
  const token = req.headers["x-auth-token"];

  try {
    const payload = jwt.verify(token, Buffer.from(secret, "base64"));
    const reaction = await postReaction(payload.id, Number(to_user_id), likes);
    res.send(reaction);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again later",
    });
  }
});

app.get("/users/:userid/matches", async (req, res) => {
  try {
    const userId = req.params.userid;
    const matches = await getUserMatchesById(userId);
    res.send(matches);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
});

app.post("/signup", async (req, res) => {
  const { img_url, surname, firstname, email, password, sex, age, breed, bio } =
    req.body;
  console.log(req.body);

  try {
    const newUser = await createUser(
      img_url,
      surname,
      firstname,
      email,
      password,
      sex,
      age,
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

app.put("/users/:userid", function (req, res) {
  const {
    id,
    surname,
    firstname,
    email,
    password,
    sex,
    age,
    breed,
    bio,
    img_url,
  } = req.body;

  try {
    const updatedUser = editUser(
      id,
      surname,
      firstname,
      email,
      password,
      sex,
      age,
      breed,
      bio,
      img_url
    );

    res.send(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again",
    });
  }
});

app.post("/message", async (req, res) => {
  const { newMessage, toUserId } = req.body;
  const token = req.headers["x-auth-token"];

  try {
    const payload = jwt.verify(token, Buffer.from(secret, "base64"));
    const message = await postNewMessage(payload.id, toUserId, newMessage);
    res.send(message);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again later",
    });
  }
});

app.get("/messages", async (req, res) => {
  const token = req.headers["x-auth-token"];

  try {
    const payload = jwt.verify(token, Buffer.from(secret, "base64"));
    const messages = await getMessagesByUserId(payload.id);
    res.send(messages);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Unable to contact database - please try again later",
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


