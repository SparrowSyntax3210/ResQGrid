function initializeChat(socket, caseId) {
  console.log("Chat initialized:", caseId);

  const user = {
    name: localStorage.getItem("name") || "User",

    role: localStorage.getItem("role") || "Volunteer",
  };

  // ==========================
  // JOIN COMMON CHAT ROOM
  // ==========================

  socket.emit("join_chat", {
    caseId,

    user,
  });

  console.log("Joined chat room:", `chat_${caseId}`);

  // ==========================
  // RECEIVE MESSAGE
  // ==========================

  socket.on("receive_message", (data) => {
    console.log("New Message:", data);

    // connect your UI here

    // addMessage(data)
  });

  // ==========================
  // SYSTEM MESSAGE
  // ==========================

  socket.on("system_message", (data) => {
    console.log(data.text);
  });

  // ==========================
  // TYPING
  // ==========================

  socket.on("user_typing", (name) => {
    console.log(`${name} is typing...`);
  });
}
