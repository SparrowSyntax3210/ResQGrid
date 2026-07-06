const connectDB = require("../backend/config/db");
const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST","PATCH"]
    }
});

app.set("io",io);

const activeCases={};

io.on("connection",(socket)=>{

    console.log("Socket Connected:",socket.id);

    // Volunteer Dashboard
    socket.on("join_volunteers",()=>{

        socket.join("volunteers");

        console.log(socket.id,"joined volunteer room");

    });

    // Guardian or Volunteer joins case
    socket.on("join_case",(caseId)=>{

        socket.join(`case_${caseId}`);

        console.log(socket.id,"joined",caseId);

        if(!activeCases[caseId]){

            activeCases[caseId]={

                totalVolunteers:0,

                volunteers:{},

                grids:{
                    A1:{volunteers:[],count:0},
                    A2:{volunteers:[],count:0},
                    A3:{volunteers:[],count:0},
                    B1:{volunteers:[],count:0},
                    B2:{volunteers:[],count:0},
                    B3:{volunteers:[],count:0},
                    C1:{volunteers:[],count:0},
                    C2:{volunteers:[],count:0},
                    C3:{volunteers:[],count:0}
                }

            };

        }

        // Count volunteer only once
        if(!activeCases[caseId].volunteers[socket.id]){

            activeCases[caseId].volunteers[socket.id]=true;

        }

        activeCases[caseId].totalVolunteers=
        Object.keys(activeCases[caseId].volunteers).length;

        io.to(`case_${caseId}`).emit("case_state",{

            caseId,

            ...activeCases[caseId]

        });

    });

    socket.on("leave_case",(caseId)=>{

        socket.leave(`case_${caseId}`);

    });

    socket.on("claim_grid",({caseId,gridId})=>{

        const currentCase=activeCases[caseId];

        if(!currentCase) return;

        for(const grid in currentCase.grids){

            currentCase.grids[grid].volunteers=
            currentCase.grids[grid].volunteers.filter(
                id=>id!==socket.id
            );

        }

        currentCase.grids[gridId].volunteers.push(socket.id);

        for(const grid in currentCase.grids){

            currentCase.grids[grid].count=
            currentCase.grids[grid].volunteers.length;

        }

        io.to(`case_${caseId}`).emit("case_state",{

            caseId,

            ...currentCase

        });

    });

    socket.on("disconnect",()=>{

        console.log(socket.id,"Disconnected");

        for(const caseId in activeCases){

            delete activeCases[caseId].volunteers[socket.id];

            for(const grid in activeCases[caseId].grids){

                activeCases[caseId].grids[grid].volunteers=
                activeCases[caseId].grids[grid].volunteers.filter(
                    id=>id!==socket.id
                );

                activeCases[caseId].grids[grid].count=
                activeCases[caseId].grids[grid].volunteers.length;

            }

            activeCases[caseId].totalVolunteers=
            Object.keys(activeCases[caseId].volunteers).length;

            io.to(`case_${caseId}`).emit("case_state",{

                caseId,

                ...activeCases[caseId]

            });

        }

    });

});

server.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
});

connectDB();