const connectDB = require("../backend/config/db");

const http = require("http");
const { Server } = require("socket.io");

const Application = require("./models/application.schema");

const chatSocket = require("./socket/chat.socket");

const app = require("./src/app");

// ==========================================
// SERVER
// ==========================================

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

app.set("io", io);


// ==========================================
// LIVE CASE STORAGE
// ==========================================

const activeCases = {};

const GRID_NAMES = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

// ==========================================
// GRID TEMPLATE
// ==========================================

function createGrid() {
  return {
    volunteers: [],

    count: 0,

    priority: 0,

    basePriority: 0,

    searched: 0,

    claimedBy: null,

    completed: false,

    locked: false,

    startedAt: null,
  };
}

// ==========================================
// CREATE CASE STATE
// ==========================================

function createLiveCase(application) {
  let grids = {};

  GRID_NAMES.forEach((grid) => {
    grids[grid] = createGrid();
  });

  return {
    caseId: application._id,

    casePriority: application.priorityScore || 50,

    priorityLevel: application.priorityLevel || "Medium",

    priorityReason: application.priorityReason || "",

    totalVolunteers: 0,

    volunteers: {},

    grids,
  };
}

// ==========================================
// LOAD CASE INTO MEMORY
// ==========================================

async function loadCase(caseId) {
  if (activeCases[caseId]) return activeCases[caseId];

  const application = await Application.findById(caseId);

  if (!application) return null;

  activeCases[caseId] = createLiveCase(application);

  generatePriority(activeCases[caseId]);

  return activeCases[caseId];
}

// ==========================================
// PRIORITY GENERATOR
// ==========================================

function generatePriority(caseData) {
  const center = {
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
    let score =
      caseData.casePriority + center[grid] + Math.floor(Math.random() * 10);

    caseData.grids[grid].basePriority = Math.max(0, Math.min(100, score));

    caseData.grids[grid].priority = caseData.grids[grid].basePriority;
  });
}

// ==========================================
// BROADCAST STATE
// ==========================================

function broadcastCase(caseId) {
  const data = activeCases[caseId];

  if (!data) return;

  io.to(caseId).emit("case_state", {
    caseId,
    ...data,
  });
}

// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  chatSocket(io, socket);

  // ==========================================
  // JOIN CASE
  // ==========================================

  socket.on("join_case", async (data) => {
    let caseId;

    if (typeof data === "string") {
      caseId = data;
    } else {
      caseId = data.caseId;
    }

    if (!caseId) return;

    socket.caseId = caseId;

    socket.join(caseId);

    console.log(socket.id, "joined", caseId);

    // load case

    const state = await loadCase(caseId);

    if (state) {
      socket.emit("case_state", {
        caseId,
        ...state,
      });
    }
  });

  // ==========================================
  // VOLUNTEER JOIN
  // ==========================================

  socket.on("volunteer_joined", async (data) => {
    if (!data.caseId) return;

    const state = await loadCase(data.caseId);

    if (!state) return;

    state.volunteers[socket.id] = {
      name: data.name || "Volunteer",
    };

    state.totalVolunteers = Object.keys(state.volunteers).length;

    broadcastCase(data.caseId);
  });

  // ==========================================
  // VOLUNTEER LOCATION
  // ==========================================

  socket.on("volunteer_location", async (data) => {
    console.log("LOCATION UPDATE");

    console.table(data);

    if (!data.caseId) return;

    const state = await loadCase(data.caseId);

    if (!state) return;

    // store volunteer

    state.volunteers[socket.id] = {
      name: data.name,

      lat: data.lat,

      lng: data.lng,

      gridId: data.gridId,
    };

    // GRID UPDATE

    if (data.gridId && state.grids[data.gridId]) {
      let grid = state.grids[data.gridId];

      if (!grid.volunteers.includes(socket.id)) {
        grid.volunteers.push(socket.id);

        grid.count = grid.volunteers.length;
      }

      grid.startedAt = grid.startedAt || Date.now();
    }

    state.totalVolunteers = Object.keys(state.volunteers).length;

    // send location

    io.to(data.caseId).emit("volunteer_location", {
      caseId: data.caseId,

      name: data.name || "Volunteer",

      lat: Number(data.lat),

      lng: Number(data.lng),

      distance: data.distance ?? null,

      eta: data.eta ?? null,

      accuracy: data.accuracy ?? null,

      timestamp: Date.now(),
    });

    // send grid update

    broadcastCase(data.caseId);
  });

  // ==========================================
  // GRID COMPLETED
  // ==========================================

  socket.on("complete_grid", async (data) => {
    const state = await loadCase(data.caseId);

    if (state && state.grids[data.gridId]) {
      state.grids[data.gridId].completed = true;

      broadcastCase(data.caseId);
    }
  });

  // ==========================================
  // LEAVE
  // ==========================================

  socket.on("volunteer_left", (data) => {
    if (!data.caseId) return;

    io.to(data.caseId).emit("volunteer_left", data);
  });

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {
    console.log("DISCONNECTED:", socket.id);

    for (const id in activeCases) {
      const state = activeCases[id];

      if (state.volunteers[socket.id]) {
        delete state.volunteers[socket.id];

        state.totalVolunteers = Object.keys(state.volunteers).length;

        GRID_NAMES.forEach((grid) => {
          let g = state.grids[grid];

          g.volunteers = g.volunteers.filter((v) => v !== socket.id);

          g.count = g.volunteers.length;
        });

        broadcastCase(id);
      }
    }
  });
});

// ==========================================
// START
// ==========================================

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});

connectDB();
