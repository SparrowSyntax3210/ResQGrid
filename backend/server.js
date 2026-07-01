const express = require("express");
const app = require("./src/app");
const connectDB = require("./config/db");

app.listen("5000", (req,res)=> {
    console.log("server is running at 5000")
})

connectDB();
