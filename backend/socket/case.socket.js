const Application = require("../models/application.schema");

// ==========================================
// LIVE CASE STORAGE
// ==========================================

const activeCases = {};

const GRID_NAMES = [
  "A1",
  "A2",
  "A3",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "C3",
];

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
// CREATE LIVE CASE
// ==========================================

function createLiveCase(application) {
  const grids = {};

  GRID_NAMES.forEach((id) => {
    grids[id] = createGrid();
  });

  return {
    caseId: String(application._id),

    casePriority: application.priorityScore || 50,

    priorityLevel: application.priorityLevel || "Medium",

    priorityReason: application.priorityReason || "",

    totalVolunteers: 0,

    volunteers: {},

    grids,
  };
}

// ==========================================
// PRIORITY GENERATOR
// ==========================================

function generatePriority(caseData) {
  const modifier = {
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

  GRID_NAMES.forEach((gridId) => {
    let score =
      caseData.casePriority +
      modifier[gridId] +
      Math.floor(Math.random() * 10);

    score = Math.max(0, Math.min(100, score));

    caseData.grids[gridId].basePriority = score;
    caseData.grids[gridId].priority = score;
  });
}

// ==========================================
// LOAD CASE
// ==========================================

async function loadCase(caseId) {
  caseId = String(caseId);

  if (activeCases[caseId]) {
    return activeCases[caseId];
  }

  const application = await Application.findById(caseId);

  if (!application) {
    return null;
  }

  activeCases[caseId] = createLiveCase(application);

  generatePriority(activeCases[caseId]);

  return activeCases[caseId];
}

// ==========================================
// BROADCAST
// ==========================================

function broadcastCase(io, caseId) {
  caseId = String(caseId);

  const state = activeCases[caseId];

  if (!state) return;

  io.to(`case_${caseId}`).emit("case_state", {
    caseId,

    casePriority: state.casePriority,

    priorityLevel: state.priorityLevel,

    priorityReason: state.priorityReason,

    totalVolunteers: state.totalVolunteers,

    volunteers: state.volunteers,

    grids: state.grids,
  });
}

// ==========================================
// SOCKET
// ==========================================

module.exports = (io, socket) => {
  console.log("Case Socket Connected:", socket.id);

  // ==========================================
  // JOIN CASE
  // ==========================================

  socket.on("join_case", async (data) => {
    try {
      let caseId;
      let role = "Unknown";

      if (typeof data === "string") {
        caseId = data;
      } else {
        caseId = data.caseId;
        role = data.role || "Unknown";
      }

      if (!caseId) {
        console.log("Missing Case ID");
        return;
      }

      caseId = String(caseId);

      socket.caseId = caseId;
      socket.role = role;

      socket.join(`case_${caseId}`);

      console.log(`${socket.id} joined case_${caseId}`);

      const application = await Application.findById(caseId);

      if (application) {
        socket.emit("case_loaded", application);
      }

      const state = await loadCase(caseId);

      if (state) {
        socket.emit("case_state", {
          caseId,

          casePriority: state.casePriority,

          priorityLevel: state.priorityLevel,

          priorityReason: state.priorityReason,

          totalVolunteers: state.totalVolunteers,

          volunteers: state.volunteers,

          grids: state.grids,
        });
      }

      socket.to(`case_${caseId}`).emit("case_joined", {
        caseId,
        role,
        message: `${role} joined`,
      });

    } catch (err) {
      console.error("JOIN CASE ERROR:", err);
    }
  });

  // ==========================================
  // VOLUNTEER JOINED
  // ==========================================

  socket.on("volunteer_joined", async (data) => {
    if (!data || !data.caseId) return;

    const caseId = String(data.caseId);

    const state = await loadCase(caseId);

    if (!state) return;

    state.volunteers[socket.id] = {
      name: data.name || "Volunteer",
    };

    state.totalVolunteers = Object.keys(state.volunteers).length;

    broadcastCase(io, caseId);
  });

    // ==========================================
  // VOLUNTEER LOCATION
  // ==========================================

  socket.on("volunteer_location", async (data) => {
    try {
      if (!data || !data.caseId) return;

      const caseId = String(data.caseId);

      const state = await loadCase(caseId);

      if (!state) return;

      // -----------------------------
      // Update Volunteer
      // -----------------------------

      state.volunteers[socket.id] = {
        ...(state.volunteers[socket.id] || {}),

        name: data.name || "Volunteer",

        lat: Number(data.lat),

        lng: Number(data.lng),

        gridId: data.gridId || null,

        updatedAt: Date.now(),
      };

      state.totalVolunteers = Object.keys(state.volunteers).length;

      // -----------------------------
      // Update Grid (if any)
      // -----------------------------

      if (
        data.gridId &&
        state.grids[data.gridId]
      ) {
        const grid = state.grids[data.gridId];

        if (!grid.volunteers.includes(socket.id)) {
          grid.volunteers.push(socket.id);
        }

        grid.count = grid.volunteers.length;

        grid.startedAt =
          grid.startedAt || Date.now();
      }

      // -----------------------------
      // Broadcast GPS
      // -----------------------------

      io.to(`case_${caseId}`).emit(
        "volunteer_location",
        {
          caseId,

          socketId: socket.id,

          name: data.name || "Volunteer",

          lat: Number(data.lat),

          lng: Number(data.lng),

          targetLat: Number(data.targetLat),

          targetLng: Number(data.targetLng),

          distance: data.distance ?? null,

          eta: data.eta ?? null,

          accuracy: data.accuracy ?? null,

          gridId: data.gridId || null,

          timestamp: Date.now(),
        }
      );

      // -----------------------------
      // Broadcast Dashboard
      // -----------------------------

      broadcastCase(io, caseId);

    } catch (err) {
      console.log("VOLUNTEER LOCATION ERROR", err);
    }
  });

  // ==========================================
  // GRID UPDATE
  // ==========================================

  socket.on("volunteer_grid_update", async (data) => {
    try {
      if (!data || !data.caseId || !data.gridId) return;

      const caseId = String(data.caseId);

      const gridId = data.gridId;

      const state = await loadCase(caseId);

      if (!state) return;

      // -----------------------------
      // Volunteer
      // -----------------------------

      state.volunteers[socket.id] = {
        ...(state.volunteers[socket.id] || {}),

        name: data.name || "Volunteer",

        gridId,
      };

      // -----------------------------
      // Remove volunteer
      // from previous grids
      // -----------------------------

      GRID_NAMES.forEach((id) => {
        const grid = state.grids[id];

        grid.volunteers =
          grid.volunteers.filter(
            (v) => v !== socket.id
          );

        grid.count = grid.volunteers.length;
      });

      // -----------------------------
      // Add to new grid
      // -----------------------------

      const grid = state.grids[gridId];

      if (grid) {
        if (!grid.volunteers.includes(socket.id)) {
          grid.volunteers.push(socket.id);
        }

        grid.count = grid.volunteers.length;

        grid.startedAt =
          grid.startedAt || Date.now();
      }

      state.totalVolunteers =
        Object.keys(state.volunteers).length;

      // -----------------------------
      // Broadcast Grid Update
      // -----------------------------

      io.to(`case_${caseId}`).emit(
        "grid_update",
        {
          caseId,

          gridId,

          volunteer: data.name || "Volunteer",

          volunteers: grid.volunteers,

          count: grid.count,
        }
      );

      broadcastCase(io, caseId);

    } catch (err) {
      console.log("GRID UPDATE ERROR", err);
    }
  });

  // ==========================================
  // CLAIM GRID
  // ==========================================

  socket.on("claim_grid", async (data) => {
    try {
      if (!data || !data.caseId || !data.gridId) return;

      const caseId = String(data.caseId);

      const state = await loadCase(caseId);

      if (!state) return;

      const grid = state.grids[data.gridId];

      if (!grid) return;

      if (!grid.volunteers.includes(socket.id)) {
        grid.volunteers.push(socket.id);
      }

      grid.count = grid.volunteers.length;

      grid.claimedBy =
        data.name || "Volunteer";

      grid.startedAt =
        grid.startedAt || Date.now();

      state.volunteers[socket.id] = {
        ...(state.volunteers[socket.id] || {}),

        name: data.name || "Volunteer",

        gridId: data.gridId,
      };

      state.totalVolunteers =
        Object.keys(state.volunteers).length;

      broadcastCase(io, caseId);

    } catch (err) {
      console.log("CLAIM GRID ERROR", err);
    }
  });

  // ==========================================
  // COMPLETE GRID
  // ==========================================

  socket.on("complete_grid", async (data) => {
    try {
      if (!data || !data.caseId || !data.gridId) return;

      const caseId = String(data.caseId);

      const state = await loadCase(caseId);

      if (!state) return;

      const grid = state.grids[data.gridId];

      if (!grid) return;

      grid.completed = true;

      broadcastCase(io, caseId);

    } catch (err) {
      console.log("COMPLETE GRID ERROR", err);
    }
  });

  // ==========================================
  // CASE STATE UPDATE
  // ==========================================

  socket.on("case_state_update", (data) => {
    if (!data || !data.caseId) return;

    io.to(`case_${data.caseId}`).emit(
      "case_state_update",
      data
    );
  });

  // ==========================================
  // NEW SIGHTING
  // ==========================================

  socket.on("new_sighting", (data) => {
    if (!data || !data.caseId) return;

    io.to(`case_${data.caseId}`).emit(
      "new_sighting",
      data
    );
  });

    // ==========================================
  // VOLUNTEER LEFT
  // ==========================================

  socket.on("volunteer_left", async (data) => {
    try {
      if (!data || !data.caseId) return;

      const caseId = String(data.caseId);

      const state = activeCases[caseId];

      if (!state) return;

      // Remove volunteer
      delete state.volunteers[socket.id];

      state.totalVolunteers = Object.keys(state.volunteers).length;

      // Remove from every grid
      GRID_NAMES.forEach((gridId) => {
        const grid = state.grids[gridId];

        grid.volunteers = grid.volunteers.filter(
          (id) => id !== socket.id
        );

        grid.count = grid.volunteers.length;

        if (grid.count === 0) {
          grid.claimedBy = null;
        }
      });

      io.to(`case_${caseId}`).emit("volunteer_left", {
        caseId,
        name: data.name || "Volunteer",
      });

      broadcastCase(io, caseId);
    } catch (err) {
      console.log("VOLUNTEER LEFT ERROR:", err);
    }
  });

  // ==========================================
  // LEAVE CASE
  // ==========================================

  socket.on("leave_case", () => {
    if (!socket.caseId) return;

    socket.leave(`case_${socket.caseId}`);

    console.log(
      `${socket.id} left case_${socket.caseId}`
    );
  });

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    if (!socket.caseId) return;

    const caseId = String(socket.caseId);

    const state = activeCases[caseId];

    if (!state) return;

    // Remove volunteer record
    delete state.volunteers[socket.id];

    state.totalVolunteers = Object.keys(state.volunteers).length;

    // Remove volunteer from all grids
    GRID_NAMES.forEach((gridId) => {
      const grid = state.grids[gridId];

      grid.volunteers = grid.volunteers.filter(
        (id) => id !== socket.id
      );

      grid.count = grid.volunteers.length;

      if (grid.count === 0) {
        grid.claimedBy = null;
      }
    });

    // Notify guardian only if volunteer disconnected
    if (socket.role === "Volunteer") {
      io.to(`case_${caseId}`).emit("volunteer_left", {
        caseId,
        name:
          state.volunteers[socket.id]?.name ||
          "Volunteer",
      });
    }

    broadcastCase(io, caseId);
  });
};
