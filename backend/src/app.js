const express = require("express");
const app = express();

app.get("/test" , (req,res)=>{
    res.send("route is running")

})

module.exports = app;