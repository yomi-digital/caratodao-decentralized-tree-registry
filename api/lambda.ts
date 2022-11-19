const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
import * as nfts from "./routes/nfts"

// Init express server
const app = express();
app.use(cors());
app.use(express.json());

// Default response
app.get("/", async function (req, res) {
  res.send({ message: "API IS ONLINE", error: false })
})

app.post('/mint/tree', nfts.mintTree)
app.get('/trees', nfts.getTrees)

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
