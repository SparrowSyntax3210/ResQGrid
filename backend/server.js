const connectDB = require("../backend/config/db");
const http = require("http");
const { Server } = require("socket.io");

const Application = require("./models/application.schema");
const chatSocket = require("./socket/chat.socket");
const app = require("./src/app");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);

const activeCases = {};

// ==========================================
// GRID PRIORITY CALCULATOR
// ==========================================

function calculateGridPriorities(caseData) {
  console.log("Calculating Grid Priorities...");

  let baseScore = caseData.priorityScore || 50;

  let riskScore = 0;

  const reason = caseData.priorityReason?.toLowerCase() || "";

  // AI reason based risk detection

  if (reason.includes("railway")) riskScore += 20;

  if (reason.includes("road")) riskScore += 15;

  if (reason.includes("water")) riskScore += 25;

  if (reason.includes("forest")) riskScore += 15;

  if (reason.includes("open")) riskScore += 10;

  Object.keys(caseData.grids).forEach((grid, index) => {
    let variation = Math.floor(Math.random() * 20) - 10;

    let volunteerPenalty = caseData.grids[grid].count * 5;

    let score = baseScore + riskScore + variation - volunteerPenalty;

    if (score > 100) score = 100;

    if (score < 0) score = 0;

    caseData.grids[grid].priority = score;

    console.log(grid, "Priority:", score);
  });
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  chatSocket(io, socket);

  // ==========================================
  // VOLUNTEER ROOM
  // ==========================================

  socket.on("join_volunteers", () => {
    socket.join("volunteers");

    console.log(socket.id, "joined volunteer room");
  });

  // ==========================================
  // JOIN CASE
  // ==========================================

  socket.on("join_case", async (caseId) => {
    try {
      socket.join(`case_${caseId}`);

      console.log(socket.id, "joined case", caseId);

      if (!activeCases[caseId]) {
        console.log("Creating new live case:", caseId);

        const application = await Application.findById(caseId);

        if (!application) {
          console.log("Application not found");

          return;
        }

        activeCases[caseId] = {
          casePriority: application.priorityScore,

          priorityLevel: application.priorityLevel,

          priorityReason: application.priorityReason,

          totalVolunteers: 0,

          volunteers: {},

          grids: {
            A1: { volunteers: [], count: 0, priority: 0 },

            A2: { volunteers: [], count: 0, priority: 0 },

            A3: { volunteers: [], count: 0, priority: 0 },

            B1: { volunteers: [], count: 0, priority: 0 },

            B2: { volunteers: [], count: 0, priority: 0 },

            B3: { volunteers: [], count: 0, priority: 0 },

            C1: { volunteers: [], count: 0, priority: 0 },

            C2: { volunteers: [], count: 0, priority: 0 },

            C3: { volunteers: [], count: 0, priority: 0 },
          },
        };
      }

      // add volunteer

      if (!activeCases[caseId].volunteers[socket.id]) {
        activeCases[caseId].volunteers[socket.id] = true;
      }

      activeCases[caseId].totalVolunteers = Object.keys(
        activeCases[caseId].volunteers,
      ).length;

      // calculate grid priority

      calculateGridPriorities(activeCases[caseId]);

      io.to(`case_${caseId}`).emit("case_state", {
        caseId,

        ...activeCases[caseId],
      });
    } catch (error) {
      console.log("JOIN CASE ERROR", error);
    }
  });

  // ==========================================
  // LEAVE CASE
  // ==========================================

  socket.on("leave_case", (caseId) => {
    socket.leave(`case_${caseId}`);

    console.log(socket.id, "left", caseId);
  });

  // ==========================================
  // CLAIM GRID
  // ==========================================

  socket.on("claim_grid", ({ caseId, gridId }) => {
    console.log("Grid claimed:", gridId, "by", socket.id);

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    // remove previous grid

    for (const grid in currentCase.grids) {
      currentCase.grids[grid].volunteers = currentCase.grids[
        grid
      ].volunteers.filter((id) => id !== socket.id);
    }

    // add new grid

    if (currentCase.grids[gridId]) {
      currentCase.grids[gridId].volunteers.push(socket.id);
    }

    // update count

    for (const grid in currentCase.grids) {
      currentCase.grids[grid].count = currentCase.grids[grid].volunteers.length;
    }

    calculateGridPriorities(currentCase);

    io.to(`case_${caseId}`).emit("case_state", {
      caseId,

      ...currentCase,
    });
  });

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {
    console.log(socket.id, "Disconnected");

    for (const caseId in activeCases) {
      delete activeCases[caseId].volunteers[socket.id];

      for (const grid in activeCases[caseId].grids) {
        activeCases[caseId].grids[grid].volunteers = activeCases[caseId].grids[
          grid
        ].volunteers.filter((id) => id !== socket.id);

        activeCases[caseId].grids[grid].count =
          activeCases[caseId].grids[grid].volunteers.length;
      }

      activeCases[caseId].totalVolunteers = Object.keys(
        activeCases[caseId].volunteers,
      ).length;

      calculateGridPriorities(activeCases[caseId]);

      io.to(`case_${caseId}`).emit("case_state", {
        caseId,

        ...activeCases[caseId],
      });
    }
  });
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});

connectDB();
