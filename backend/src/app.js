const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");

const authrouter = require("../routers/auth.routes");
const guardianroutes = require("../routers/guardian.routes");
const VolunteerRoutes = require("../routers/volunteer.routes");

const app = express();

// ========================================
// TRUST PROXY (Required for Render + Secure Cookies)
// ========================================

app.set("trust proxy", 1);

// ========================================
// CORS
// ========================================

app.use(
  cors({
    origin: [
      "https://res-q-grid.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  })
);

// ========================================
// BODY PARSER
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// SESSION
// ========================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret",

    resave: false,

    saveUninitialized: false,

    proxy: true,

    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ========================================
// STATIC FILES
// ========================================

// Frontend
app.use(express.static(path.join(__dirname, "../../frontend/public")));

// Uploaded Images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ========================================
// ROUTES
// ========================================

app.use("/auth", authrouter);
app.use("/guardian", guardianroutes);
app.use("/volunteer", VolunteerRoutes);

app.get("/role-selection", (req, res) => {
  res.redirect("/role-selection.html");
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("========== SERVER ERROR ==========");
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.stack,
  });
});

module.exports = app;