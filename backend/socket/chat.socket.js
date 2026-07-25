module.exports = (io, socket) => {
  // =====================================
  // JOIN CHAT ROOM
  // =====================================

  socket.on("join_chat", (data) => {
    const { caseId, user } = data;

    if (!caseId) {
      console.log("Chat join failed: No caseId");
      return;
    }

    const room = `chat_${caseId}`;

    socket.join(room);

    console.log(socket.id, "joined", room);

    let displayName = user.name;

    if (user.role === "Guardian") {
      displayName = `${user.name} (Guardian)`;
    }

    socket.to(room).emit("system_message", {
      text: `${displayName} joined the chat`,
    });
  });

  // =====================================
  // SEND MESSAGE
  // =====================================

  socket.on("send_message", (data) => {
    const { caseId, senderId, sender, role, text } = data;

    if (!caseId) {
      return;
    }

    let displayName = sender;

    if (role === "Guardian") {
      displayName = `${sender} (Guardian)`;
    }

    io.to(`chat_${caseId}`).emit("receive_message", {
      senderId,

      sender: displayName,

      role,

      text,

      time: new Date(),
    });
  });

  // =====================================
  // TYPING INDICATOR
  // =====================================

  socket.on("typing", ({ caseId, name, role }) => {
    if (!caseId) return;

    let displayName = name;

    if (role === "Guardian") {
      displayName = `${name} (Guardian)`;
    }

    socket.to(`chat_${caseId}`).emit("user_typing", displayName);
  });

  // =====================================
  // LEAVE CHAT
  // =====================================

  socket.on("leave_chat", ({ caseId }) => {
    socket.leave(`chat_${caseId}`);
  });
};
