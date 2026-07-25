const express = require("express");
const app = express();
const authrouter = require("../routers/auth.routes")
const path = require("path")
const session = require("express-session");
const guardianroutes = require("../routers/guardian.routes")
const VolunteerRoutes = require("../routers/volunteer.routes");
const cors = require("cors");

const corsOptions = {
    origin: [
        "https://res-q-grid.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:5500"
    ],
    credentials:true
};


app.use(cors(corsOptions));


app.set("trust proxy", 1);


app.use(session({

    secret:"your-secret",

    resave:false,

    saveUninitialized:false,

    cookie:{
        secure:true,
        sameSite:"none",
        httpOnly:true,
        maxAge:1000*60*60*24
    }

}));

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