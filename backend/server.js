require("dotenv").config();

const connectDB = require("../backend/config/db");

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");

const caseSocket = require("./socket/case.socket");
const chatSocket = require("./socket/chat.socket");

// ======================================
// ENVIRONMENT
// ======================================

const isProduction = process.env.NODE_ENV === "production";

// ======================================
// HTTP SERVER
// ======================================

const server = http.createServer(app);

// ======================================
// SOCKET.IO
// ======================================

const allowedOrigins = isProduction
  ? [
      "http://localhost:5000",
    ]
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://res-q-grid.vercel.app"
    ];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

// Make io available inside routes
app.set("io", io);

// ======================================
// SOCKET CONNECTION
// ======================================

io.on("connection", (socket) => {
  console.log("=================================");
  console.log("CLIENT CONNECTED");
  console.log("Socket:", socket.id);
  console.log("=================================");

  // Case / Tracking / Grid Socket
  caseSocket(io, socket);

  // Chat Socket
  chatSocket(io, socket);

  // Disconnect
  socket.on("disconnect", (reason) => {
    console.log("CLIENT DISCONNECTED");
    console.log("Socket:", socket.id);
    console.log("Reason:", reason);
  });
});

// ======================================
// SOCKET ERROR
// ======================================

io.engine.on("connection_error", (err) => {
  console.log("=================================");
  console.log("Socket Connection Error");
  console.log("=================================");

  console.log("Code:", err.code);
  console.log("Message:", err.message);
  console.log("Context:", err.context);
});

// ======================================
// DATABASE + START SERVER
// ======================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    console.log("=================================");
    console.log("MongoDB Connected");
    console.log("=================================");

    server.listen(PORT, "0.0.0.0", () => {
      console.log("=================================");
      console.log(`🚀 ResQGrid Server Running`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log("=================================");
    });

  } catch (err) {
    console.error("=================================");
    console.error("MongoDB Connection Error");
    console.error("=================================");
    console.error(err);

    process.exit(1);
  }
}

startServer();

// ======================================
// GRACEFUL SHUTDOWN
// ======================================

process.on("SIGINT", async () => {
  console.log("\nStopping Server...");

  server.close(() => {
    console.log("HTTP Server Closed");
    process.exit(0);
  });
});

// ======================================
// ERROR HANDLING
// ======================================

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection");
  console.error(err);
});