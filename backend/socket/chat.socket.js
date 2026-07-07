module.exports = (io, socket) => {

    socket.on("join_chat", ({ caseId, user }) => {

        socket.join(`chat_${caseId}`);

        console.log(`${user.name} joined chat`);

        io.to(`chat_${caseId}`).emit("system_message", {

            text: `${user.name} joined the chat`

        });

    });

    socket.on("send_message", (data) => {

        io.to(`chat_${data.caseId}`).emit("receive_message", {

            sender: data.sender,

            role: data.role,

            text: data.text,

            time: new Date()

        });

    });

};