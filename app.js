const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
module.exports = app;
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    if (request.body.password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashPassword = await bcrypt.hash(request.body.password, 10);
      const addUser = `INSERT INTO user(username,name,password,gender,location)
        VALUES (
            '${username}',
            '${name}',
            '${hashPassword}',
            '${gender}',
            '${location}');`;
      await db.run(addUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUser);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const verifyPassword = await bcrypt.compare(password, dbUser.password);
    console.log(verifyPassword);
    if (verifyPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUser);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const verifyPassword = await bcrypt.compare(oldPassword, dbUser.password);
    console.log(verifyPassword);
    if (verifyPassword === true) {
      if (request.body.newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
        const updatePassword = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
