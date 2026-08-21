const API = "https://resqgrid-b1zt.onrender.com";

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
// LIVE SOS SYSTEM
// =====================================================

const sosContainer = document.getElementById("sosContainer");

let activeSOS = new Map();

// =====================================================
// SOS HELPERS
// =====================================================

function getSOSPriorityClass(priority) {
  return String(priority || "MEDIUM").toLowerCase();
}

function getSOSIcon(type) {
  const icons = {
    MEDICAL: "fa-heart-pulse",
    AMBULANCE: "fa-truck-medical",
    RESCUE: "fa-life-ring",
    TRAPPED: "fa-person-circle-exclamation",
    EVACUATION: "fa-person-walking-arrow-right",
    FIRE: "fa-fire",
    ACCIDENT: "fa-car-burst",
    VIOLENCE: "fa-hand-fist",
    WOMEN_SAFETY: "fa-shield-halved",
    CHILD_EMERGENCY: "fa-child",
    EMERGENCY: "fa-triangle-exclamation",
    OTHER: "fa-triangle-exclamation",
  };

  return icons[type] || "fa-triangle-exclamation";
}

function formatSOSDate(date) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

function formatSOSLocation(sos) {
  if (sos.latitude === undefined || sos.longitude === undefined) {
    return "Location unavailable";
  }

  return `${Number(sos.latitude).toFixed(5)}, ${Number(sos.longitude).toFixed(
    5,
  )}`;
}

// =====================================================
// RENDER SOS
// =====================================================

function renderSOSCard(payload) {
  const sos = payload?.sos || payload;

  if (!sos) {
    return "";
  }

  const ai = payload?.ai || sos.aiAnalysis || {};

  const priority = sos.priority || ai.priority || "MEDIUM";

  const emergencyType = sos.type || ai.emergencyType || "EMERGENCY";

  const transcript =
    sos.description ||
    ai.transcript ||
    sos.aiAnalysis?.transcript ||
    "No emergency description provided.";

  const priorityScore =
    ai.priorityScore ?? sos.aiAnalysis?.priorityScore ?? "-";

  const confidence = ai.confidence ?? sos.aiAnalysis?.confidence ?? "-";

  const peopleCount = sos.peopleCount || 1;

  const status = sos.status || "PENDING";

  const sosId = sos.sosId || sos._id;

  return `

    <div
      class="sos-alert-card"
      data-sos-id="${sosId}"
    >

      <!-- =========================================
           TOP
      ========================================== -->

      <div class="sos-alert-top">

        <div class="sos-alert-title">

          <div class="sos-alert-icon">

            <i class="fa-solid ${getSOSIcon(emergencyType)}"></i>

          </div>

          <div>

            <h3>
              ${emergencyType.replaceAll("_", " ")}
            </h3>

            <p>
              SOS ID: ${sos.sosId || "N/A"}
            </p>

          </div>

        </div>

        <div
          class="sos-priority ${getSOSPriorityClass(priority)}"
        >
          ${priority}
        </div>

      </div>

      <!-- =========================================
           INFORMATION
      ========================================== -->

      <div class="sos-alert-info">

        <div class="sos-info-box">

          <span>Status</span>

          <strong>
            ${status}
          </strong>

        </div>

        <div class="sos-info-box">

          <span>Location</span>

          <strong>
            ${formatSOSLocation(sos)}
          </strong>

        </div>

        <div class="sos-info-box">

          <span>People</span>

          <strong>
            ${peopleCount}
          </strong>

        </div>

        <div class="sos-info-box">

          <span>AI Score</span>

          <strong>
            ${priorityScore}
          </strong>

        </div>

      </div>

      <!-- =========================================
           AI TRANSCRIPT
      ========================================== -->

      <div class="sos-transcript">

        <div class="sos-transcript-title">

          🎙️ AI Voice Report

        </div>

        <p>
          "${transcript}"
        </p>

      </div>

      <!-- =========================================
           FOOTER
      ========================================== -->

      <div class="sos-alert-footer">

        <div class="sos-status">

          <span class="sos-status-dot"></span>

          ${status}

          <span>
            • ${formatSOSDate(sos.createdAt)}
          </span>

        </div>

        <button
          class="sos-track-btn"
          data-sos-id="${sos._id || ""}"
          data-lat="${sos.latitude || ""}"
          data-lng="${sos.longitude || ""}"
        >

          <i class="fa-solid fa-location-dot"></i>

          View Location

        </button>

      </div>

    </div>

  `;
}

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
    },
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
  caseContainer.insertAdjacentHTML("beforeend", renderCaseCard(app));
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

      socket.emit("join_case", {
        caseId: id,
        role: "Volunteer",
      });

      window.location.href = `/case-tracking-volunteer.html?id=${id}&caseType=${caseType}`;
    };
  });

  // Chat

  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/chat-volunteer.html?id=${btn.dataset.id}`;
    };
  });
}

// =====================================================
// LOAD EXISTING SOS
// =====================================================

async function loadSOS() {
  if (!sosContainer) {
    console.warn("⚠️ sosContainer not found");

    return;
  }

  try {
    console.log("🚨 Loading existing SOS alerts...");

    const response = await fetch(`${API}/api/sos`, {
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load SOS alerts");
    }

    const requests = Array.isArray(result.data) ? result.data : [];

    console.log("🚨 Existing SOS:", requests);

    activeSOS.clear();

    requests.forEach((sos) => {
      if (sos.status !== "RESOLVED" && sos.status !== "CLOSED") {
        activeSOS.set(sos.sosId || sos._id, {
          sos,
          ai: sos.aiAnalysis || {},
        });
      }
    });

    renderAllSOS();
  } catch (error) {
    console.error("❌ Load SOS Error:", error);
  }
}
// =====================================================
// RENDER ALL SOS
// =====================================================

function renderAllSOS() {
  if (!sosContainer) {
    return;
  }

  const requests = Array.from(activeSOS.values());

  // ============================================
  // EMPTY
  // ============================================

  if (requests.length === 0) {
    sosContainer.innerHTML = `

      <div class="sos-empty">

        <i class="fa-solid fa-shield-heart"></i>

        <h3>No Active SOS Alerts</h3>

        <p>
          New emergency SOS requests will appear here automatically.
        </p>

      </div>

    `;

    return;
  }

  // ============================================
  // SORT
  // ============================================

  const priorityOrder = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  requests.sort((a, b) => {
    const priorityA = priorityOrder[a.sos.priority] || 0;

    const priorityB = priorityOrder[b.sos.priority] || 0;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    return new Date(b.sos.createdAt) - new Date(a.sos.createdAt);
  });

  sosContainer.innerHTML = requests
    .map((payload) => renderSOSCard(payload))
    .join("");

  attachSOSHandlers();

  animateSOSCards();
}

// =====================================================
// NEW SOS RECEIVED
// =====================================================

socket.on("sos:created", (payload) => {
  console.log("🚨 LIVE SOS RECEIVED:", payload);

  const sos = payload?.sos || payload;

  if (!sos) {
    return;
  }

  const id = sos.sosId || sos._id;

  if (!id) {
    return;
  }

  // Prevent duplicates

  if (activeSOS.has(id)) {
    console.log("⚠️ SOS already exists:", id);

    return;
  }

  activeSOS.set(id, {
    sos,
    ai: payload?.ai || sos.aiAnalysis || {},
  });

  renderAllSOS();

  // Browser notification

  showSOSNotification(sos);
});

// =====================================================
// SOS UPDATED
// =====================================================

socket.on("sos:updated", (payload) => {
  console.log("🔄 SOS UPDATED:", payload);

  const sos = payload?.sos || payload;

  if (!sos) {
    return;
  }

  const id = sos.sosId || sos._id;

  if (!id) {
    return;
  }

  // Remove resolved/closed SOS

  if (sos.status === "RESOLVED" || sos.status === "CLOSED") {
    activeSOS.delete(id);
  } else {
    activeSOS.set(id, {
      sos,
      ai: payload?.ai || sos.aiAnalysis || {},
    });
  }

  renderAllSOS();
});

// =====================================================
// SOS DELETED
// =====================================================

socket.on("sos:deleted", (data) => {
  console.log("🗑️ SOS DELETED:", data);

  const id = data?.sosId || data?.customSosId || data?.id;

  if (!id) {
    return;
  }

  activeSOS.delete(id);

  renderAllSOS();
});

// =====================================================
// SOS BUTTON HANDLERS
// =====================================================

function attachSOSHandlers() {
  document.querySelectorAll(".sos-track-btn").forEach((button) => {
    button.onclick = () => {
      const latitude = button.dataset.lat;

      const longitude = button.dataset.lng;

      if (!latitude || !longitude) {
        alert("SOS location is unavailable.");

        return;
      }

      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      window.open(mapUrl, "_blank");
    };
  });
}

// =====================================================
// SOS NOTIFICATION
// =====================================================

function showSOSNotification(sos) {
  console.log("🚨 NEW EMERGENCY:", sos.sosId);

  const priority = sos.priority || "MEDIUM";

  const type = sos.type || "EMERGENCY";

  // Browser notification

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`🚨 ${priority} SOS`, {
      body: `${type} emergency received.\n` + `SOS ID: ${sos.sosId}`,
    });
  }

  // Ask permission once
  else if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// =====================================================
// SOS ANIMATION
// =====================================================

function animateSOSCards() {
  if (typeof gsap === "undefined") {
    return;
  }

  gsap.from(".sos-alert-card", {
    opacity: 0,
    y: 25,
    stagger: 0.08,
    duration: 0.45,
    ease: "power3.out",
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
  const card = document.querySelector(`.case-card[data-id="${caseId}"]`);

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
  await loadUser();

  await loadCases();

  await loadSOS();
})();
