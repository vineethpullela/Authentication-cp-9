const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const startAuthenticationServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server Running at http://localhost:3005");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};

startAuthenticationServer();
module.exports = app;

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUser);
  //console.log(password.length);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (dbUser === undefined) {
    if (password.length <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO 
        user (username,name,password,gender,location)
        VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      const dbResponse = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const getUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUser);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePassQuery = `update user set password = '${hashedPassword}' where username = '${username}';`;
      await db.run(updatePassQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});
