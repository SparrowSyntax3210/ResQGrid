const express = require("express");
const app = express();
const authrouter = require("../routers/auth.routes")
const path = require("path")
const session = require("express-session");
const guardianroutes = require("../routers/guardian.routes")
const VolunteerRoutes = require("../routers/volunteer.routes");
const cors = require("cors");

app.use(cors({
    origin:[
        "http://localhost:5500",
        "https://resqgrid.vercel.app"
    ],
    credentials:true
}));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            secure: false, 
        },
    })
);


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "../../frontend/public")))
app.use("/auth" , authrouter);
app.use("/guardian" , guardianroutes);
app.use("/volunteer" , VolunteerRoutes);
app.use("/uploads",express.static(path.join(__dirname, "../uploads")));

app.get("/role-selection" , (req,res)=> {
    res.redirect("role-selection.html")
})

module.exports = app;