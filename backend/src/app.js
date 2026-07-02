const express = require("express");
const app = express();
const authrouter = require("../routers/auth.routes")
const expresssession = require("express-session")
const path = require("path")


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "../../frontend/public")))
app.use("/auth" , authrouter)

app.get("/test" , (req,res)=>{
    res.send("route is running")

})

module.exports = app;