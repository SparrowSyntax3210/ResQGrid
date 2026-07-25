// ===============================================
// RESQGRID GUARDIAN DASHBOARD
// ===============================================

const API = "http://localhost:5000";

const caseContainer = document.getElementById("caseContainer");

const profileName = document.querySelector("#profileName h4");
const profileRole = document.querySelector("#profileName small");

let currentCase = null;
let currentStatusBox = null;

// ===============================================
// SOCKET
// ===============================================

const socket = io(API, {
  withCredentials: true,
});



// ===============================================
// CASE CONFIGURATION
// ===============================================

const CASE_CONFIG = {
  "missing-person": {
    icon: "👤",
    title: "Missing Person",
    locationLabel: "Last Seen",
  },

  "blood-report": {
    icon: "🩸",
    title: "Blood Emergency",
    locationLabel: "Hospital",
  },

  "elderly-assistance": {
    icon: "👴",
    title: "Elderly Assistance",
    locationLabel: "Address",
  },

  "community-sos": {
    icon: "🚨",
    title: "Community SOS",
    locationLabel: "Current Location",
  },

  "women-safety": {
    icon: "🛡️",
    title: "Women Safety",
    locationLabel: "Pickup Point",
  },

  "civic-hazard": {
    icon: "⚠️",
    title: "Civic Hazard",
    locationLabel: "Hazard Location",
  },
};

// ===============================================
// HELPERS
// ===============================================

function getCaseConfig(type) {
  return (
    CASE_CONFIG[type] || {
      icon: "📌",

      title: "Emergency",

      locationLabel: "Location",
    }
  );
}

function getDisplayLocation(app) {
  return (
    app.LastSeen ||
    app.Hospital ||
    app.Address ||
    app.CurrentLocation ||
    "Not Available"
  );
}

function getPrimaryInfo(app) {
  switch (app.caseType) {
    case "blood-report":
      return `Blood Group : ${app.BloodGroup || "-"}`;

    case "elderly-assistance":
      return `Request : ${app.RequestType || "-"}`;

    case "community-sos":
      return `SOS : ${app.SOSCategory || "-"}`;

    case "women-safety":
      return `Request : ${app.RequestType || "-"}`;

    case "civic-hazard":
      return `Hazard : ${app.HazardType || "-"}`;

    default:
      return `Age ${app.Age}`;
  }
}

function getCreateCard() {
  return `

<div class="create-case-card">

    <div class="create-left">

        <h2>Create a New Emergency Case</h2>

        <p>

            Report Missing Persons, Blood Emergencies,

            Elderly Assistance, Community SOS,

            Women Safety and Civic Hazards.

        </p>

    </div>

    <button id="createCaseBtn">

        <i class="fa-solid fa-plus"></i>

        Create New Case

    </button>

</div>

`;
}

// ===============================================
// ANIMATIONS
// ===============================================

function animateCaseCards() {
  gsap.from(".case-card", {
    opacity: 0,

    y: 35,

    stagger: 0.08,

    duration: 0.55,

    ease: "power3.out",
  });
}

function animateCreateButton() {
  gsap.from("#createCaseBtn", {
    opacity: 0,

    scale: 0.92,

    duration: 0.45,

    delay: 0.15,

    ease: "back.out(2)",
  });
}

function animateCaseRemoval(card) {
  return gsap.to(card, {
    opacity: 0,

    x: 80,

    duration: 0.4,

    ease: "power2.in",
  });
}

function pulseStat(card) {
  gsap.fromTo(
    card,

    {
      scale: 1,
    },

    {
      scale: 1.06,

      duration: 0.18,

      yoyo: true,

      repeat: 1,
    },
  );
}

// ===============================================
// LOAD USER
// ===============================================

async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const user = await res.json();

    profileName.textContent = user.name;
    profileRole.textContent = "Guardian";

    gsap.fromTo(
      "#profileName",
      {
        opacity: 0,
        x: 20,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
      },
    );
  } catch (err) {
    console.log(err);
  }
}

// ===============================================
// RENDER SINGLE CARD
// ===============================================

function renderCaseCard(app) {
  const config = getCaseConfig(app.caseType);

  const image = app.Photo
    ? `http://localhost:5000/uploads/${app.Photo}`
    : "./images/default-user.png";

  return `

<div class="case-card">

    <div class="case-top">

        <div class="case-user">

            <img src="${image}" alt="${app.Name}">

            <div>

                <h3>

                    ${config.icon}

                    ${app.Name}

                </h3>

                <p>

                    ${config.title}

                </p>

                <small>

                    ${getPrimaryInfo(app)}

                </small>

            </div>

        </div>

    </div>

    <div class="case-info">

        <div class="info-box">

            <h4>

                ${config.locationLabel}

            </h4>

            <p>

                ${getDisplayLocation(app)}

            </p>

        </div>

        <div class="info-box">

            <h4>

                Created

            </h4>

            <p>

                ${new Date(app.dateTime).toLocaleString()}

            </p>

        </div>

        <div class="info-box">

            <h4>

                Priority

            </h4>

            <p>

                ${app.priorityLevel || "Pending"}

                <br>

                Score :

                ${app.priorityScore || 0}/100

            </p>

        </div>

    </div>

    <div class="priority-reason">

        <h4>

            AI Analysis

        </h4>

        <p>

            ${app.priorityReason || "Analysing..."}

        </p>

    </div>

    <div class="case-buttons">

        <button
            class="track-btn"
            data-id="${app._id}">

            Track

        </button>

        <button
            class="chat-btn"
            data-id="${app._id}">

            💬 Chat

        </button>

        <button
            class="report-btn"
            data-id="${app._id}">

            Reports

        </button>

        <button
            class="close-btn"
            data-id="${app._id}">

            Close

        </button>

        <div
            class="status-box"
            id="status-${app._id}">

        </div>

    </div>

</div>

`;
}

// ===============================================
// LOAD APPLICATIONS
// ===============================================

async function loadApplications() {
  try {
    const res = await fetch(
      `${API}/guardian/application`,

      {
        credentials: "include",
      },
    );

    if (!res.ok) {
      throw new Error("Unable to load cases");
    }

    const applications = await res.json();

    let html = getCreateCard();

    if (!applications.length) {
      html += `

<div class="case-card">

    <h3>

        No Active Cases

    </h3>

    <p>

        You currently don't have any active emergency cases.

    </p>

</div>

`;
    } else {
      applications.forEach((app) => {
        html += renderCaseCard(app);
      });
    }

    caseContainer.innerHTML = html;

    animateCreateButton();

    animateCaseCards();

    document.getElementById("createCaseBtn").onclick = () => {
      window.location.href = "/case-selection.html";
    };

    attachHandlers();
  } catch (err) {
    console.log(err);
  }
}

// ===============================================
// BUTTON HANDLERS
// ===============================================

function attachHandlers() {
  // Track Case

  document.querySelectorAll(".track-btn").forEach((btn) => {
    btn.onclick = () => {

    const id = btn.dataset.id;
    const caseType = btn.dataset.case;

    currentCase = id;
    currentStatusBox = document.getElementById(`status-${id}`);

    socket.emit("join_case", id);

    window.location.href =
`/case-tracking-guardian.html?id=${id}&caseType=${caseType}`;

};
  });

  // Chat

  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/chat-guardian.html?id=${btn.dataset.id}`;
    };
  });

  // Reports

  document.querySelectorAll(".report-btn").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/sighting-show.html?caseId=${btn.dataset.id}`;
    };
  });

  // Close Case

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Close this emergency case?")) return;

      try {
        const res = await fetch(
          `${API}/guardian/application/close/${btn.dataset.id}`,

          {
            method: "PATCH",
            credentials: "include",
          },
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        loadApplications();
      } catch (err) {
        alert(err.message);
      }
    };
  });
}


// ===============================================
// AUTH CHECK
// ===============================================

async function checkAuth() {
  try {
    const res = await fetch("/auth/status", {
      credentials: "include",
    });

    const data = await res.json();

    if (!data.loggedIn) {
      return window.location.replace("/login.html");
    }

    if (data.user.role.toLowerCase() !== "guardian") {
      return window.location.replace(`/${data.user.role.toLowerCase()}.html`);
    }
  } catch {
    window.location.replace("/login.html");
  }
}

// ===============================================
// INITIALIZE
// ===============================================

checkAuth();

loadUser();

loadApplications();

// ===============================================
// SOCKET
// ===============================================

socket.on("connect", () => {

    console.log("Socket Connected:", socket.id);

    socket.emit("join_guardians");

});

socket.on("disconnect", () => {
  console.log("Socket Disconnected");
});

// -----------------------------------------------
// NEW CASE CREATED
// -----------------------------------------------

socket.on("new_case", (app) => {
  console.log("New Case :", app);

  loadApplications();
});

// -----------------------------------------------
// CASE CLOSED
// -----------------------------------------------

socket.on("case_closed", (data) => {
  console.log("Case Closed :", data);

  loadApplications();
});

// -----------------------------------------------
// VOLUNTEER JOINED
// -----------------------------------------------

socket.on("volunteer_joined", (data) => {
  console.log("Volunteer Joined :", data);
});

// -----------------------------------------------
// VOLUNTEER LEFT
// -----------------------------------------------

socket.on("volunteer_left", (data) => {
  console.log("Volunteer Left :", data);
});

// -----------------------------------------------
// LIVE CASE STATE
// -----------------------------------------------

socket.on("case_state", (state) => {
  if (!currentCase) return;

  if (state.caseId !== currentCase) return;

  if (!currentStatusBox) return;

  let html = `

        <h3>Mission Status</h3>

        <p>

            <b>Active Volunteers :</b>

            ${state.totalVolunteers}

        </p>

    `;

  Object.entries(state.grids || {}).forEach(([grid, data]) => {
    html += `

        <div class="grid-status">

            <strong>${grid}</strong>

            <br>

            Volunteers :
            ${data.count}

            <br>

            Coverage :
            ${data.searched}%

            <br>

            Priority :
            ${data.priority}

        </div>

        `;
  });

  currentStatusBox.innerHTML = html;
});

// -----------------------------------------------
// LIVE SIGHTING
// -----------------------------------------------

socket.on("new_sighting", (data) => {
  console.log("New Sighting :", data);
});

// -----------------------------------------------
// DASHBOARD STATS
// -----------------------------------------------

socket.on("dashboard_stats", (stats) => {
  updateDashboardStats(stats);
});

// ===============================================
// DASHBOARD ANIMATIONS
// ===============================================

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  gsap.from(".sidebar", {
    x: -60,
    opacity: 0,
    duration: 0.8,
  });

  gsap.from("header", {
    y: -40,
    opacity: 0,
    duration: 0.7,
    delay: 0.2,
  });

  gsap.from(".stat-card", {
    y: 40,
    opacity: 0,
    stagger: 0.08,
    duration: 0.45,
    delay: 0.4,
  });

  gsap.from(".panel", {
    y: 50,
    opacity: 0,
    stagger: 0.15,
    duration: 0.55,
    delay: 0.5,
  });
});

// ===============================================
// UPDATE DASHBOARD STATS
// ===============================================

function updateDashboardStats(stats) {
  const cards = document.querySelectorAll(".stat-card h2");

  if (cards.length < 4) return;

  cards[0].textContent = stats.activeCases ?? 0;

  cards[1].textContent = stats.totalVolunteers ?? 0;

  cards[2].textContent = stats.activeGrids ?? 0;

  cards[3].textContent = stats.totalSightings ?? 0;

  cards.forEach((card) => pulseStat(card));
}
