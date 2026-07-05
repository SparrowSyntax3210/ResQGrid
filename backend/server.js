const connectDB = require("../backend/config/db");
const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");

const activeCases = {};

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("Volunteer connected:", socket.id);

    // ==========================
    // JOIN CASE
    // ==========================
    socket.on("join_case", (caseId) => {

        socket.join(`case_${caseId}`);

        console.log(`${socket.id} joined room case_${caseId}`);

        if (!activeCases[caseId]) {

            activeCases[caseId] = {

                totalVolunteers: 0,

                volunteers: {},

                grids: {

                    A1: { volunteers: [], count: 0 },
                    A2: { volunteers: [], count: 0 },
                    A3: { volunteers: [], count: 0 },

                    B1: { volunteers: [], count: 0 },
                    B2: { volunteers: [], count: 0 },
                    B3: { volunteers: [], count: 0 },

                    C1: { volunteers: [], count: 0 },
                    C2: { volunteers: [], count: 0 },
                    C3: { volunteers: [], count: 0 }

                }

            };

        }

        activeCases[caseId].volunteers[socket.id] = true;

        activeCases[caseId].totalVolunteers =
            Object.keys(activeCases[caseId].volunteers).length;

        io.to(`case_${caseId}`).emit(
            "volunteer_joined",
            {
                socketId: socket.id
            }
        );

        io.to(`case_${caseId}`).emit(
            "case_state",
            activeCases[caseId]
        );

    });

    // ==========================
    // CLAIM GRID
    // ==========================
    socket.on("claim_grid", ({ caseId, gridId }) => {

        const currentCase = activeCases[caseId];
    
        if (!currentCase) return;
    
        // Remove volunteer from any previously claimed grid
        for (const grid in currentCase.grids) {
    
            currentCase.grids[grid].volunteers =
                currentCase.grids[grid].volunteers.filter(
                    id => id !== socket.id
                );
    
        }
    
        // Add volunteer to the selected grid
        if (!currentCase.grids[gridId].volunteers.includes(socket.id)) {
    
            currentCase.grids[gridId].volunteers.push(socket.id);
    
        }
    
        // Update counts
        for (const grid in currentCase.grids) {
    
            currentCase.grids[grid].count =
                currentCase.grids[grid].volunteers.length;
    
        }
    
        currentCase.totalVolunteers =
            Object.keys(currentCase.volunteers).length;
    
        io.to(`case_${caseId}`).emit(
            "case_state",
            currentCase
        );
    
    });

    // ==========================
    // DISCONNECT
    // ==========================
    socket.on("disconnect", () => {

        console.log("Volunteer disconnected:", socket.id);

        for (const caseId in activeCases) {

            // Remove volunteer from case
            delete activeCases[caseId].volunteers[socket.id];

            // Remove volunteer from all grids
            for (const grid in activeCases[caseId].grids) {

                activeCases[caseId].grids[grid].volunteers =
                    activeCases[caseId].grids[grid].volunteers.filter(
                        id => id !== socket.id
                    );

                activeCases[caseId].grids[grid].count =
                    activeCases[caseId].grids[grid].volunteers.length;

            }

            activeCases[caseId].totalVolunteers =
                Object.keys(activeCases[caseId].volunteers).length;

            io.to(`case_${caseId}`).emit(
                "case_state",
                activeCases[caseId]
            );

        }

    });

});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});

connectDB();