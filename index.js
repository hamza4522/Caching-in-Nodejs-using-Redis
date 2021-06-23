const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const app = express();

const SERVER_PORT = process.env.SERVER_PORT || 3000;
app.listen(SERVER_PORT, () =>
  console.log(`Server Listening on SERVER_PORT ${SERVER_PORT}`)
);
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

async function makerequest(req, res, next) {
  try {
    const username = req.params.username;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    const public_repos = data.public_repos;
    client.setex(username, 10, public_repos);
    res
      .status(200)
      .send(
        `<h2> Public repos for this actual request user ${username}: ${public_repos}</h2>`
      );
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}
function cache(req, res, next) {
  const username = req.params.username;
  client.get(username, (error, data) => {
    error
      ? console.log(error)
      : data != null
      ? res.send(
          `<h2> Public repos cache for this user ${username}: ${data}</h2>`
        )
      : next();
  });
}

app.get("/repos/:username", cache, makerequest, (req, res) => {});
