const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");

const authrouter = require("../routers/auth.routes");
const guardianroutes = require("../routers/guardian.routes");
const VolunteerRoutes = require("../routers/volunteer.routes");
const sosroutes = require("../routers/sos.routes");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// ========================================
// TRUST PROXY
// ========================================

if (isProduction) {
  app.set("trust proxy", 1);
}

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  // Production frontend
  "https://resqgrid-b1zt.onrender.com",

  // Local development
  "https://resqgrid-b1zt.onrender.com",
  "http://127.0.0.1:5000",

  "http://localhost:5500",
  "http://127.0.0.1:5500",

  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,
  })
);

// ========================================
// BODY PARSER
// ========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ========================================
// SESSION
// ========================================

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "dev-secret",

    resave: false,

    saveUninitialized: false,

    proxy: isProduction,

    cookie: {
      httpOnly: true,

      secure: isProduction,

      sameSite: isProduction
        ? "none"
        : "lax",

      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ========================================
// STATIC FILES
// ========================================

app.use(
  express.static(
    path.join(
      __dirname,
      "../../frontend/public"
    )
  )
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

// ========================================
// ROUTES
// ========================================

app.use("/auth", authrouter);

app.use(
  "/guardian",
  guardianroutes
);

app.use(
  "/volunteer",
  VolunteerRoutes
);

app.use(
  "/api/sos",
  sosroutes
);

// ========================================
// ROLE SELECTION
// ========================================

app.get(
  "/role-selection",
  (req, res) => {
    res.redirect("/role-selection.html");
  }
);

// ========================================
// HEALTH CHECK
// ========================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "ResQGrid server is running",
      environment: isProduction
        ? "production"
        : "development",
    });
  }
);

// ========================================
// ERROR HANDLER
// ========================================

app.use(
  (err, req, res, next) => {
    console.error(
      "========== SERVER ERROR =========="
    );

    console.error(err);

    res.status(err.status || 500).json({
      success: false,

      message:
        err.message ||
        "Internal Server Error",

      stack: !isProduction
        ? err.stack
        : undefined,
    });
  }
);

module.exports = app;