module.exports = (io, socket) => {
  console.log("Case Socket Connected:", socket.id);

  // =====================================================
  // JOIN CASE ROOM
  // =====================================================
  socket.on("join_case", async (data) => {
    try {
      let caseId;
      let role;

      // support old and new frontend
      if (typeof data === "string") {
        caseId = data;
        role = "Unknown";
      } else {
        caseId = data.caseId;
        role = data.role;
      }

      if (!caseId) {
        console.log("Missing case id");
        return;
      }

      const room = `case_${caseId}`;

      socket.join(room);

      console.log(socket.id, "joined", room, {
        caseId,
        role,
      });

      socket.caseId = caseId;
      socket.role = role;

      // send current case information if needed

      const application = await Application.findById(caseId);

      if (application) {
        socket.emit("case_loaded", application);
      }

      socket.to(room).emit("case_state", {
        caseId,
        message: `${role} joined`,
      });
    } catch (err) {
      console.log("JOIN CASE ERROR", err);
    }
  });

  // =====================================================
  // VOLUNTEER LIVE LOCATION
  // =====================================================

  socket.on("volunteer_location", (data) => {
    console.log("SERVER RECEIVED LOCATION", data);

    const room = `case_${data.caseId}`;

    console.log("EMITTING TO ROOM", room);

    io.to(room).emit("volunteer_location", data);
  });

  // =====================================================
  // CASE STATE UPDATE
  // =====================================================

  socket.on("case_state_update", (data) => {
    if (!data || !data.caseId) {
      return;
    }

    const room = `case_${data.caseId}`;

    io.to(room).emit("case_state", data);
  });

  // =====================================================
  // NEW SIGHTING
  // =====================================================

  socket.on("new_sighting", (data) => {
    if (!data || !data.caseId) {
      return;
    }

    const room = `case_${data.caseId}`;

    io.to(room).emit("new_sighting", data);
  });

  // =====================================================
  // VOLUNTEER LEFT
  // =====================================================

  socket.on("volunteer_left", (data) => {
    if (!data || !data.caseId) {
      return;
    }

    const room = `case_${data.caseId}`;

    io.to(room).emit("volunteer_left", data);
  });

  // =====================================================
  // DISCONNECT
  // =====================================================

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    if (socket.caseId && socket.role === "Volunteer") {
      io.to(`case_${socket.caseId}`).emit("volunteer_left", {
        caseId: socket.caseId,

        name: "Volunteer",
      });
    }
  });
};
