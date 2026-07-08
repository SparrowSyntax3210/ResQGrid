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
// GRID CONSTANTS
// ==========================================

const GRID_NAMES = [
  "A1", "A2", "A3",
  "B1", "B2", "B3",
  "C1", "C2", "C3",
];

// ==========================================
// CREATE EMPTY GRID
// ==========================================

function createGrid() {
  return {
    volunteers: [],
    count: 0,

    priority: 0,

    basePriority: 0,
    variation: 0,

    searched: 0,

    claimedBy: null,

    completed: false,

    locked: false,

    startedAt: null,
  };
}

// ==========================================
// CREATE LIVE CASE
// ==========================================

function createLiveCase(application) {

  const grids = {};

  GRID_NAMES.forEach((grid) => {
    grids[grid] = createGrid();
  });

  return {

    createdAt: Date.now(),

    casePriority: application.priorityScore,

    priorityLevel: application.priorityLevel,

    priorityReason: application.priorityReason,

    totalVolunteers: 0,

    volunteers: {},

    grids,

  };

}

// ==========================================
// GENERATE GRID PRIORITIES
// (ONLY ONCE)
// ==========================================

function generateBasePriorities(caseData) {

  const centerWeight = {

    A1: -15,
    A2: -5,
    A3: -15,

    B1: -5,
    B2: 15,
    B3: -5,

    C1: -15,
    C2: -5,
    C3: -15,

  };

  GRID_NAMES.forEach((grid) => {

    const variation =
      Math.floor(Math.random() * 11) - 5;

    const base =
      caseData.casePriority +
      centerWeight[grid] +
      variation;

    caseData.grids[grid].variation = variation;

    caseData.grids[grid].basePriority =
      Math.max(0, Math.min(100, base));

  });

}

// ==========================================
// UPDATE GRID PRIORITIES
// ==========================================

function updatePriorities(caseData) {

  GRID_NAMES.forEach((grid) => {

    const g = caseData.grids[grid];

    let score = g.basePriority;

    // More volunteers = lower priority

    score -= g.count * 10;

    // Search completed

    score -= g.searched;

    if (g.completed) {
      score = 0;
    }

    g.priority =
      Math.max(0, Math.min(100, score));

  });

}

// ==========================================
// SEARCH GRID
// ==========================================

function searchGrid(caseData, gridId) {

  const grid = caseData.grids[gridId];

  if (!grid) return;

  grid.searched += 10;

  if (grid.searched > 100) {
    grid.searched = 100;
  }

  updatePriorities(caseData);

}

// ==========================================
// SEND LIVE STATE
// ==========================================

function broadcastCase(io, caseId) {

  const currentCase = activeCases[caseId];

  if (!currentCase) return;

  io.to(`case_${caseId}`).emit("case_state", {

    caseId,

    ...currentCase,

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

      console.log(socket.id, "joined", caseId);

      // --------------------------------------
      // CREATE LIVE CASE (FIRST TIME ONLY)
      // --------------------------------------

      if (!activeCases[caseId]) {

        const application = await Application.findById(caseId);

        if (!application) {

          console.log("Application not found");

          return;

        }

        const liveCase = createLiveCase(application);

        generateBasePriorities(liveCase);

        updatePriorities(liveCase);

        activeCases[caseId] = liveCase;

        console.log("Live case initialized");

      }

      const currentCase = activeCases[caseId];

      // --------------------------------------
      // REGISTER VOLUNTEER
      // --------------------------------------

      if (!currentCase.volunteers[socket.id]) {

        currentCase.volunteers[socket.id] = {

          socketId: socket.id,

          joinedAt: Date.now(),

          lastHeartbeat: Date.now(),

          grid: null,

          searching: false,

        };

      }

      currentCase.totalVolunteers =
        Object.keys(currentCase.volunteers).length;

      updatePriorities(currentCase);

      broadcastCase(io, caseId);

    }

    catch (err) {

      console.log("JOIN CASE ERROR");

      console.log(err);

    }

  });

  // ==========================================
  // HEARTBEAT
  // ==========================================

  socket.on("heartbeat", ({ caseId }) => {

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    if (!currentCase.volunteers[socket.id]) return;

    currentCase.volunteers[socket.id].lastHeartbeat =
      Date.now();

  });

  // ==========================================
  // CLAIM GRID
  // ==========================================

  socket.on("claim_grid", ({ caseId, gridId }) => {

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    // Remove volunteer from previous grid

    GRID_NAMES.forEach((grid) => {

      currentCase.grids[grid].volunteers =
        currentCase.grids[grid].volunteers.filter(
          id => id !== socket.id
        );

      currentCase.grids[grid].count =
        currentCase.grids[grid].volunteers.length;

    });

    // Add to selected grid

    if (
      currentCase.grids[gridId] &&
      !currentCase.grids[gridId].volunteers.includes(socket.id)
    ) {

      currentCase.grids[gridId].volunteers.push(socket.id);

      currentCase.grids[gridId].count =
        currentCase.grids[gridId].volunteers.length;

      currentCase.grids[gridId].claimedBy = socket.id;

      currentCase.grids[gridId].startedAt = Date.now();

    }

    if (currentCase.volunteers[socket.id]) {

      currentCase.volunteers[socket.id].grid = gridId;

      currentCase.volunteers[socket.id].searching = true;

    }

    updatePriorities(currentCase);

    broadcastCase(io, caseId);

  });

  // ==========================================
  // SEARCH GRID
  // ==========================================

  socket.on("search_grid", ({ caseId, gridId }) => {

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    searchGrid(currentCase, gridId);

    broadcastCase(io, caseId);

  });

  // ==========================================
  // COMPLETE GRID
  // ==========================================

  socket.on("complete_grid", ({ caseId, gridId }) => {

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    if (!currentCase.grids[gridId]) return;

    currentCase.grids[gridId].completed = true;

    updatePriorities(currentCase);

    broadcastCase(io, caseId);

  });

  // ==========================================
  // LEAVE CASE
  // ==========================================

  socket.on("leave_case", (caseId) => {

    socket.leave(`case_${caseId}`);

    const currentCase = activeCases[caseId];

    if (!currentCase) return;

    GRID_NAMES.forEach((grid) => {

      currentCase.grids[grid].volunteers =
        currentCase.grids[grid].volunteers.filter(
          id => id !== socket.id
        );

      currentCase.grids[grid].count =
        currentCase.grids[grid].volunteers.length;

    });

    delete currentCase.volunteers[socket.id];

    currentCase.totalVolunteers =
      Object.keys(currentCase.volunteers).length;

    updatePriorities(currentCase);

    broadcastCase(io, caseId);

  });


  // ==========================================
  // DISCONNECT
  // ==========================================

    // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {

    console.log(socket.id, "Disconnected");

    // Remove volunteer from every active case

    for (const caseId in activeCases) {

      const currentCase = activeCases[caseId];

      if (!currentCase) continue;

      // Remove from volunteer list

      delete currentCase.volunteers[socket.id];

      // Remove from all claimed grids

      GRID_NAMES.forEach((grid) => {

        currentCase.grids[grid].volunteers =
          currentCase.grids[grid].volunteers.filter(
            id => id !== socket.id
          );

        currentCase.grids[grid].count =
          currentCase.grids[grid].volunteers.length;

        // Reset claim if this volunteer owned it

        if (currentCase.grids[grid].claimedBy === socket.id) {

          currentCase.grids[grid].claimedBy = null;

          currentCase.grids[grid].startedAt = null;

        }

      });

      currentCase.totalVolunteers =
        Object.keys(currentCase.volunteers).length;

      updatePriorities(currentCase);

      broadcastCase(io, caseId);

      // ---------------------------------------
      // Remove inactive live case
      // ---------------------------------------

      if (
        currentCase.totalVolunteers === 0
      ) {

        console.log(
          `Removing inactive live case ${caseId}`
        );

        delete activeCases[caseId];

      }

    }

  });

});

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});

connectDB();
