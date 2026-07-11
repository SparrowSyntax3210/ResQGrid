module.exports = (io, socket) => {

    // ===============================
    // JOIN CHAT
    // ===============================

    socket.on("join_chat", ({ caseId, user }) => {

        socket.join(`chat_${caseId}`);

        const displayName =
            user.role === "Guardian"
                ? `${user.name} (Guardian)`
                : user.name;

        socket.to(`chat_${caseId}`).emit("system_message", {
            text: `${displayName} joined the chat`
        });

    });

    // ===============================
    // SEND MESSAGE
    // ===============================

    socket.on("send_message", (data) => {

        const displayName =
            data.role === "Guardian"
                ? `${data.sender} (Guardian)`
                : data.sender;

        io.to(`chat_${data.caseId}`).emit("receive_message", {

            senderId: data.senderId,
            sender: displayName,
            role: data.role,
            text: data.text,
            time: new Date()

        });

    });

    // ===============================
    // TYPING
    // ===============================

    socket.on("typing", ({ caseId, name, role }) => {

        const displayName =
            role === "Guardian"
                ? `${name} (Guardian)`
                : name;

        socket.to(`chat_${caseId}`).emit("user_typing", displayName);

    });

};