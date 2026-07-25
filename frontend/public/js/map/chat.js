function initializeChat(socket, caseId) {
  console.log("Chat initialized:", caseId);

  // Join chat room

  socket.emit("join_chat", {
    caseId,

    user: {
      name: localStorage.getItem("name") || "Volunteer",
      role: "Volunteer",
    },
  });

  // Receive messages

  socket.on("receive_message", (data) => {
    console.log("Message:", data);

    // later connect this to chat UI
  });

  // System messages

  socket.on("system_message", (data) => {
    console.log(data.text);
  });

  // Typing event

  socket.on("user_typing", (name) => {
    console.log(`${name} is typing...`);
  });
}
