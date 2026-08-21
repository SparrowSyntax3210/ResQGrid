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

    // ================================================
    // GUARDIAN DASHBOARD
    // ================================================

    socket.on("join_guardians", () => {
      socket.join("guardians");

    });

    // ================================================
    // VOLUNTEER DASHBOARD
    // ================================================

    socket.on("join_volunteers", () => {
      socket.join("volunteers");

    });

    // ================================================
    // DISCONNECT
    // ================================================

    socket.on("disconnect", () => {
    });
  });
}

// =====================================================
// GENERIC BROADCAST
// =====================================================

function broadcast(event, data) {
  if (!io) {
    console.error("❌ SOS Socket.IO not initialized");

    return;
  }

  io.to("volunteers").emit(event, data);

  io.to("guardians").emit(event, data);

}

// =====================================================
// BROADCAST NEW SOS
// =====================================================

function broadcastNewSOS(sos) {
  if (!io) {
    console.error("❌ SOS Socket.IO not initialized");

    return;
  }

  io.to("volunteers").emit("sos:created", sos);

  io.to("guardians").emit("sos:created", sos);
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
    id: sos._id,
  };

  io.to("volunteers").emit("sos:deleted", data);

  io.to("guardians").emit("sos:deleted", data);

}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  initializeSOSSocket,
  broadcast,
  broadcastNewSOS,
  broadcastSOSUpdate,
  broadcastSOSDeleted,
};
