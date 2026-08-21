// =====================================================
// RESQGRID SOS SOCKET SERVICE
// =====================================================

let io = null;

// =====================================================
// INITIALIZE
// =====================================================

function initializeSOSSocket(socketIO) {
  io = socketIO;

  console.log("🚨 SOS Socket Service Initialized");

  io.on("connection", (socket) => {
    console.log(`🔌 SOS client connected: ${socket.id}`);

    // ================================================
    // GUARDIAN DASHBOARD
    // ================================================

    socket.on("join_guardians", () => {
      socket.join("guardians");

      console.log(`🛡️ ${socket.id} joined guardians`);
    });

    // ================================================
    // VOLUNTEER DASHBOARD
    // ================================================

    socket.on("join_volunteers", () => {
      socket.join("volunteers");

      console.log(`🦺 ${socket.id} joined volunteers`);
    });

    // ================================================
    // DISCONNECT
    // ================================================

    socket.on("disconnect", () => {
      console.log(`🔌 SOS client disconnected: ${socket.id}`);
    });
  });
}

// =====================================================
// BROADCAST NEW SOS
// =====================================================

function broadcastNewSOS(sos) {
  if (!io) {
    console.error("❌ SOS Socket.IO not initialized");

    return;
  }

  // Send to volunteers
  io.to("volunteers").emit("sos:created", sos);

  // Also notify guardians
  io.to("guardians").emit("sos:created", sos);

  console.log(`🚨 SOS CREATED BROADCAST: ${sos.sosId}`);
}

// =====================================================
// BROADCAST SOS UPDATE
// =====================================================

function broadcastSOSUpdate(sos) {
  if (!io) return;

  io.to("volunteers").emit("sos:updated", sos);

  io.to("guardians").emit("sos:updated", sos);
}

// =====================================================
// BROADCAST SOS DELETE
// =====================================================

function broadcastSOSDeleted(sos) {
  if (!io) return;

  const data = {
    sosId: sos.sosId,
  };

  io.to("volunteers").emit("sos:deleted", data);

  io.to("guardians").emit("sos:deleted", data);
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  initializeSOSSocket,

  broadcastNewSOS,

  broadcastSOSUpdate,

  broadcastSOSDeleted,
};
