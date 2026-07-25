// =====================================================
// RESQGRID VOLUNTEER DASHBOARD
// PART 1
// =====================================================

const API = "http://localhost:5000";

// =====================================================
// SOCKET
// =====================================================

const socket = io(API, {
  withCredentials: true,
});

// =====================================================
// DOM
// =====================================================

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const coinBalance = document.getElementById("coinBalance");
const rewardsBtn = document.getElementById("Rewards");

const caseContainer = document.getElementById("caseContainer");

// =====================================================
// STATE
// =====================================================

let currentCase = null;

// =====================================================
// CASE CONFIG
// =====================================================

const CASE_CONFIG = {
  "missing-person": {
    icon: "👤",
    title: "Missing Person",
    locationLabel: "Last Seen",
    primaryField: "Age",
  },

  "blood-report": {
    icon: "🩸",
    title: "Blood Emergency",
    locationLabel: "Hospital",
    primaryField: "Blood Group",
  },

  "elderly-assistance": {
    icon: "👴",
    title: "Elderly Assistance",
    locationLabel: "Address",
    primaryField: "Request",
  },

  "community-sos": {
    icon: "🚨",
    title: "Community SOS",
    locationLabel: "Current Location",
    primaryField: "SOS",
  },

  "women-safety": {
    icon: "🛡️",
    title: "Women Safety",
    locationLabel: "Pickup Point",
    primaryField: "Request",
  },

  "civic-hazard": {
    icon: "⚠️",
    title: "Civic Hazard",
    locationLabel: "Hazard Location",
    primaryField: "Hazard",
  },
};

// =====================================================
// HELPERS
// =====================================================

function getCaseConfig(type) {
  return (
    CASE_CONFIG[type] || {
      icon: "📌",
      title: "Emergency",
      locationLabel: "Location",
      primaryField: "Information",
    }
  );
}

function getDisplayLocation(app) {
  return (
    app.LastSeen ||
    app.Hospital ||
    app.Address ||
    app.CurrentLocation ||
    app.PickupPoint ||
    app.Location ||
    "Not Available"
  );
}

function getPrimaryValue(app) {
  switch (app.caseType) {
    case "blood-report":
      return app.BloodGroup || "-";

    case "elderly-assistance":
      return app.RequestType || "-";

    case "community-sos":
      return app.SOSCategory || "-";

    case "women-safety":
      return app.RequestType || "-";

    case "civic-hazard":
      return app.HazardType || "-";

    default:
      return app.Age || "-";
  }
}

// =====================================================
// GSAP HELPERS
// =====================================================

function animateCards() {
  gsap.from(".case-card", {
    opacity: 0,
    y: 40,
    stagger: 0.08,
    duration: 0.55,
    ease: "power3.out",
  });
}

function pulseCard(card) {
  gsap.fromTo(
    card,
    {
      scale: 1,
    },
    {
      scale: 1.05,
      repeat: 1,
      yoyo: true,
      duration: 0.18,
    }
  );
}

// =====================================================
// LOAD USER
// =====================================================

async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const user = await res.json();

    profileName.textContent = user.name;
    profileRole.textContent = "Volunteer";
    coinBalance.textContent = `Coins : ${user.coins || 0}`;

    gsap.from(".profile", {
      opacity: 0,
      x: 20,
      duration: 0.6,
      ease: "power3.out",
    });

  } catch (err) {
    console.error(err);
  }
}

// =====================================================
// REWARDS
// =====================================================

if (rewardsBtn) {
  rewardsBtn.addEventListener("click", () => {
    window.location.href = "/rewards.html";
  });
}

// =====================================================
// CARD HTML
// =====================================================

function renderCaseCard(app) {

  const config = getCaseConfig(app.caseType);

  const image = app.Photo
    ? `${API}/uploads/${app.Photo}`
    : "./images/default-user.png";

  return `

<div
class="case-card"
data-id="${app._id}"
data-case="${app.caseType}">

<div class="case-top">

<div class="case-user">

<img
src="${image}"
alt="${app.Name}">

<div>

<h3>

${config.icon}
${app.Name}

</h3>

<p>

${config.title}

</p>

<small>

${config.primaryField} :
${getPrimaryValue(app)}

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

Status

</h4>

<p>

${app.status || "Active"}

</p>

</div>

<div class="info-box">

<h4>

Priority

</h4>

<p>

${app.priorityLevel || "Pending"}

</p>

</div>

</div>

<div class="priority-reason">

<h4>

AI Recommendation

</h4>

<p>

${app.priorityReason || "Waiting for AI analysis..."}

</p>

</div>

<div class="case-buttons">

<button
class="accept-btn"
data-id="${app._id}"
data-case="${app.caseType}">

Accept Mission

</button>

<button
class="chat-btn"
data-id="${app._id}">

💬 Chat

</button>

</div>

</div>

`;
}

// =====================================================
// ADD SINGLE CARD
// =====================================================

function addCase(app) {
  caseContainer.insertAdjacentHTML(
    "beforeend",
    renderCaseCard(app)
  );
}

// ===============================================
// LOAD ALL ACTIVE CASES
// ===============================================

async function loadCases() {
  try {
    const res = await fetch(`${API}/volunteer/application`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      return;
    }

    caseContainer.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      caseContainer.innerHTML = `
        <div class="case-card">
            <h3>No Active Cases</h3>
            <p>There are currently no emergency cases.</p>
        </div>
      `;
      return;
    }

    data.forEach((app) => addCase(app));

    animateCards();

    attachHandlers();

  } catch (err) {
    console.error(err);
  }
}

// ===============================================
// BUTTON HANDLERS
// ===============================================

function attachHandlers() {

  // Accept Mission

  document.querySelectorAll(".accept-btn").forEach((btn) => {

    btn.onclick = () => {

  const id = btn.dataset.id;
  const caseType = btn.dataset.case;

  currentCase = id;

  socket.emit("join_case", id);

  window.location.href =
    `/case-tracking-volunteer.html?id=${id}&caseType=${caseType}`;

};

  });

  // Chat

  document.querySelectorAll(".chat-btn").forEach((btn) => {

    btn.onclick = () => {

      window.location.href =
        `/chat-volunteer.html?id=${btn.dataset.id}`;

    };

  });

}

// ===============================================
// DASHBOARD STATS
// ===============================================

function updateDashboardStats(stats) {

  const cards = document.querySelectorAll(".stat-card h2");

  if (cards.length < 4) return;

  cards[0].textContent = stats.activeCases ?? 0;

  cards[1].textContent = stats.totalVolunteers ?? 0;

  cards[2].textContent = stats.activeGrids ?? 0;

  cards[3].textContent = stats.totalSightings ?? 0;

  cards.forEach((card) => {

    pulseCard(card);

  });

}

// ===============================================
// AUTH CHECK
// ===============================================

async function checkAuth() {

  try {

    const res = await fetch(`${API}/auth/status`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!data.loggedIn) {

      window.location.replace("/login.html");

      return;

    }

    if (data.user.role.toLowerCase() !== "volunteer") {

      window.location.replace(
        `/${data.user.role.toLowerCase()}.html`
      );

      return;

    }

  } catch (err) {

    console.error(err);

    window.location.replace("/login.html");

  }

}
// ===============================================
// SOCKET CONNECTION
// ===============================================

socket.on("connect", () => {

  console.log("Volunteer Connected :", socket.id);

  socket.emit("join_volunteers");

});

socket.on("disconnect", () => {

  console.log("Volunteer Disconnected");

});

// ===============================================
// NEW CASE
// ===============================================

socket.on("new_case", (app) => {

  console.log("New Case :", app);

  if (document.querySelector(`.case-card[data-id="${app._id}"]`)) {
    return;
  }

  addCase(app);

  animateCards();

  attachHandlers();

});

// ===============================================
// CASE CLOSED
// ===============================================

socket.on("case_closed", ({ caseId }) => {

  const card = document.querySelector(
    `.case-card[data-id="${caseId}"]`
  );

  if (!card) return;

  gsap.to(card, {

    opacity: 0,

    x: 80,

    duration: 0.4,

    ease: "power2.in",

    onComplete: () => {

      card.remove();

    },

  });

});

// ===============================================
// VOLUNTEER JOINED
// ===============================================

socket.on("volunteer_joined", (data) => {

  console.log("Volunteer Joined :", data);

});

// ===============================================
// VOLUNTEER LEFT
// ===============================================

socket.on("volunteer_left", (data) => {

  console.log("Volunteer Left :", data);

});

// ===============================================
// LIVE SIGHTING
// ===============================================

socket.on("new_sighting", (data) => {

  console.log("New Sighting :", data);

});

// ===============================================
// LIVE CASE STATE
// ===============================================

socket.on("case_state", (state) => {

  console.log("Case State :", state);

});

// ===============================================
// DASHBOARD STATS
// ===============================================

socket.on("dashboard_stats", (stats) => {

  updateDashboardStats(stats);

});

// ===============================================
// GSAP PAGE ANIMATIONS
// ===============================================

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {

  gsap.from(".sidebar", {

    x: -60,

    opacity: 0,

    duration: 0.8,

    ease: "power3.out",

  });

  gsap.from("header", {

    y: -35,

    opacity: 0,

    duration: 0.6,

    delay: 0.2,

    ease: "power3.out",

  });

  gsap.from(".stat-card", {

    y: 40,

    opacity: 0,

    stagger: 0.08,

    duration: 0.45,

    delay: 0.35,

    ease: "power3.out",

  });

  gsap.from(".panel", {

    y: 50,

    opacity: 0,

    stagger: 0.12,

    duration: 0.55,

    delay: 0.45,

    ease: "power3.out",

  });

});

// ===============================================
// INITIALIZATION
// ===============================================

(async function init() {

  await checkAuth();

  await loadUser();

  await loadCases();

})();