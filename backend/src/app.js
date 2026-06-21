const express = require("express");
const path = require("path");
const app = express();
const AuthRoutes = require("../routes/user");
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../../frontend/public")));
app.use("/auth", AuthRoutes);

app.get("/test", (req, res) => {
  res.send("running");
});
module.exports = app;
