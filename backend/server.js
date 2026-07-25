const connectDB = require("../backend/config/db");

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");

const caseSocket = require("./socket/case.socket");
const chatSocket = require("./socket/chat.socket");

// ======================================
// HTTP SERVER
// ======================================

const server = http.createServer(app);

// ======================================
// SOCKET.IO
// ======================================

const io = new Server(server, {
  cors: {
    origin: "https://res-q-grid.vercel.app",
    methods: ["GET", "POST", "PATCH"],
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
});

// ======================================
// SOCKET ERROR
// ======================================

io.engine.on("connection_error", (err) => {
  console.log("Socket Connection Error");
  console.log(err.req);
  console.log(err.code);
  console.log(err.message);
  console.log(err.context);
});

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log("=================================");
});

// ======================================
// DATABASE
// ======================================

connectDB()
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error");
    console.error(err);
  });

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

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection");
  console.error(err);
});