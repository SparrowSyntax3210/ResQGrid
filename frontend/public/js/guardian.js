
const caseContainer = document.getElementById("caseContainer");
const activityList = document.getElementById("activityList");
const volunteerContainer = document.getElementById("volunteerContainer");
const profileName = document.getElementById("profileName"); // add in UI

let currentCase = null;
let currentStatusBox = null;

// =======================================
// SOCKET SETUP
// =======================================

const socket = io("http://localhost:5000", {
    withCredentials: true
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

// =======================================
// LOAD LOGGED IN USER (SESSION BASED)
// =======================================

async function loadUser() {
    try {
        const res = await fetch("http://localhost:5000/auth/me", {
            credentials: "include"
        });

        if (!res.ok) return;

        const user = await res.json();

        if (profileName) {
            profileName.innerText = user.name;
        }

    } catch (err) {
        console.error("User load failed", err);
    }
}

// =======================================
// LOAD APPLICATIONS (ACTIVE CASES)
// =======================================

async function loadApplications() {
    try {
        const res = await fetch("http://localhost:5000/guardian/application", {
            credentials: "include"
        });

        const applications = await res.json();

        caseContainer.innerHTML = "";

        if (!applications.length) {
            caseContainer.innerHTML = `
                <div class="case-card">
                    <h3>No Active Cases</h3>
                    <button id="createCaseBtn">Create New Case</button>
                </div>
            `;

            document.getElementById("createCaseBtn").onclick = () => {
                window.location.href = "/application.html";
            };

            return;
        }

        applications.forEach(app => {

            caseContainer.innerHTML += `
                <div class="case-card">

                    <div class="case-top">
                        <div class="case-user">

                            <img src="${app.Photo || "https://via.placeholder.com/70"}">

                            <div>
                                <h3>${app.Name}</h3>
                                <p>Age ${app.Age} • ${app.status}</p>
                            </div>

                        </div>
                    </div>

                    <div class="case-info">

                        <div class="info-box">
                            <h4>Last Seen</h4>
                            <p>${app.LastSeen}</p>
                        </div>

                        <div class="info-box">
                            <h4>Missing Since</h4>
                            <p>${app.dateTime || "-"}</p>
                        </div>

                        <div class="info-box">
                            <h4>Volunteers</h4>
                            <p id="volunteer-${app._id}">0</p>
                        </div>

                    </div>

                    <div class="case-buttons">

                        <button class="track-btn" data-id="${app._id}">
                            Track Case
                        </button>

                        <button class="open-btn" data-id="${app._id}">
                            Open
                        </button>

                        <div id="status-${app._id}" class="status-box"></div>

                    </div>

                </div>
            `;
        });

        attachCaseHandlers();

    } catch (err) {
        console.error("Applications load failed:", err);
    }
}

// =======================================
// CASE BUTTON HANDLERS
// =======================================

function attachCaseHandlers() {

    // TRACK BUTTON
    document.querySelectorAll(".track-btn").forEach(btn => {

        btn.onclick = () => {

            const caseId = btn.dataset.id;
            const statusBox = document.getElementById(`status-${caseId}`);

            if (currentCase) socket.emit("leave_case", currentCase);

            currentCase = caseId;
            currentStatusBox = statusBox;

            currentStatusBox.innerHTML = "Connecting live updates...";

            socket.emit("join_case", caseId);
        };
    });

    // OPEN CASE (redirect or future detail page)
    document.querySelectorAll(".open-btn").forEach(btn => {

        btn.onclick = () => {
            const id = btn.dataset.id;
            window.location.href = `/case.html?id=${id}`;
        };
    });

    // CREATE NEW CASE (IMPORTANT FIX YOU ASKED)
    document.getElementById("caseContainer")?.addEventListener("click", (e) => {
        if (e.target.id === "createCaseBtn") {
            window.location.href = "/application.html";
        }
    });
}

// =======================================
// LIVE SOCKET UPDATES
// =======================================

socket.on("case_state", (state) => {

    if (!currentStatusBox) return;

    let html = `
        <h3>Live Status</h3>
        <p><b>Total Volunteers:</b> ${state.totalVolunteers}</p>
    `;

    if (state.grids) {
        html += "<h4>Grid Activity</h4>";

        for (const grid in state.grids) {
            html += `
                <p>${grid}: ${state.grids[grid].count} volunteers</p>
            `;
        }
    }

    currentStatusBox.innerHTML = html;
});

// =======================================
// VOLUNTEERS (BACKEND)
// =======================================

async function loadVolunteers() {
    try {
        const res = await fetch("http://localhost:5000/volunteers", {
            credentials: "include"
        });

        const volunteers = await res.json();

        volunteerContainer.innerHTML = "";

        volunteers.forEach(v => {
            volunteerContainer.innerHTML += `
                <div class="volunteer">

                    <div class="volunteer-left">

                        <img src="${v.img || "https://via.placeholder.com/50"}">

                        <div>
                            <h4>${v.name}</h4>
                            <p>${v.area}</p>
                        </div>

                    </div>

                </div>
            `;
        });

    } catch (err) {
        console.error("Volunteers failed:", err);
    }
}

// =======================================
// ACTIVITY FEED (BACKEND)
// =======================================

async function loadActivities() {
    try {
        const res = await fetch("http://localhost:5000/guardian/activity", {
            credentials: "include"
        });

        const activities = await res.json();

        activityList.innerHTML = "";

        activities.forEach(a => {
            activityList.innerHTML += `
                <li>
                    <div class="activity-icon" style="background:${a.color}">
                        <i class="fa-solid ${a.icon}"></i>
                    </div>

                    <div>
                        <h4>${a.text}</h4>
                        <span>${a.time}</span>
                    </div>
                </li>
            `;
        });

    } catch (err) {
        console.error("Activity failed:", err);
    }
}

// =======================================
// INIT
// =======================================

loadUser();
loadApplications();
loadVolunteers();
loadActivities();