// =====================================================
// RESQGRID GUARDIAN DASHBOARD
// PART 1
// =====================================================

const API = "https://resqgrid-b1zt.onrender.com";

// =====================================================
// DOM
// =====================================================

const caseContainer = document.getElementById("caseContainer");
const profileName = document.querySelector("#profileName h4");
const profileRole = document.querySelector("#profileName small");

let currentCase = null;

// =====================================================
// SOCKET
// =====================================================

const socket = io(API, {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Guardian Socket Connected:", socket.id);

  socket.emit("join_guardians");
});

// Optional live update
socket.on("new_case", () => {
  console.log("New case received");
  loadApplications();
});

// =====================================================
// CASE CONFIGURATION
// =====================================================

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
    locationLabel: "Location",
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

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  const createCaseBtn = document.getElementById("createCaseBtn");

  if (createCaseBtn) {
    createCaseBtn.addEventListener("click", () => {
      window.location.href = "/case-selection.html";
    });
  }

  loadUser();

  // Load all active cases of logged in guardian
  loadApplications();
});

// =====================================================
// HELPERS
// =====================================================

function getConfig(type) {
  return (
    CASE_CONFIG[type] || {
      icon: "📌",
      title: "Emergency",
      locationLabel: "Location",
    }
  );
}

function getLocation(app) {
  return (
    app.LastSeen ||
    app.Hospital ||
    app.Address ||
    app.CurrentLocation ||
    app.Location ||
    "Not Available"
  );
}

function getPrimaryInfo(app) {
  switch (app.caseType) {
    case "blood-report":
      return `Blood Group : ${app.BloodGroup || "-"}`;

    case "elderly-assistance":
      return `Request : ${app.RequestType || "-"}`;

    case "women-safety":
      return `Request : ${app.RequestType || "-"}`;

    case "community-sos":
      return `SOS : ${app.SOSCategory || "-"}`;

    case "civic-hazard":
      return `Hazard : ${app.HazardType || "-"}`;

    default:
      return `Age : ${app.Age || "-"}`;
  }
}

// =====================================================
// LOAD USER
// =====================================================

async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Unable to load user");
    }

    const user = await res.json();

    profileName.innerText = user.name;
    profileRole.innerText = user.role || "Guardian";
  } catch (err) {
    console.error("Load User Error:", err);
  }
}

// =====================================================
// LOAD ALL ACTIVE APPLICATIONS
// =====================================================

async function loadApplications() {
  try {
    const res = await fetch(`${API}/guardian/application`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Unable to load applications");
    }

    const applications = await res.json();

    console.log("Applications:", applications);

    if (!applications || applications.length === 0) {
      caseContainer.innerHTML = `
        <div class="case-card empty-case">
            <h3>No Active Case</h3>
            <p>You currently have no active emergency case.</p>
        </div>
      `;
      return;
    }

    caseContainer.innerHTML = applications
      .map((app) => createCard(app))
      .join("");

    attachHandlers();
  } catch (err) {
    console.error("Load Applications Error:", err);

    caseContainer.innerHTML = `
      <div class="case-card empty-case">
          <h3>No Active Case</h3>
          <p>Unable to load your applications.</p>
      </div>
    `;
  }
}

// =====================================================
// CREATE CASE CARD
// =====================================================

function createCard(app) {
  const config = getConfig(app.caseType);

  const image = app.Photo
    ? `${API}/uploads/${app.Photo}`
    : "/images/default-user.png";

  return `

<div class="case-card">

    <div class="case-top">

        <div class="case-user">

            <img src="${image}" alt="${app.Name}">

            <div class="case-details">

                <h3>
                    ${config.icon}
                    ${app.Name}
                </h3>

                <p>${config.title}</p>

                <small class="emergency-type">
                    ${getPrimaryInfo(app)}
                </small>

            </div>

        </div>

    </div>

    <div class="case-info">

        <div>
            <h4>${config.locationLabel}</h4>
            <p>${getLocation(app)}</p>
        </div>

        <div>
            <h4>Created</h4>
            <p>${new Date(app.createdAt || app.dateTime).toLocaleString()}</p>
        </div>

        <div>
            <h4>Priority</h4>
            <p>${app.priorityLevel || "Pending"}</p>
        </div>

    </div>

    <div class="case-buttons">

        <button
            class="track-btn"
            data-id="${app._id}"
            data-type="${app.caseType}"
        >
            Track
        </button>

        <button
            class="chat-btn"
            data-id="${app._id}"
        >
            💬 Chat
        </button>

        <button
            class="close-btn"
            data-id="${app._id}"
        >
            Close
        </button>

    </div>

</div>

`;
}

// =====================================================
// BUTTON HANDLERS
// =====================================================

function attachHandlers() {
  // ------------------------------------
  // TRACK CASE
  // ------------------------------------

  document.querySelectorAll(".track-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      currentCase = id;

      if (type === "missing-person") {
        window.location.href = `/case-grid-guardian.html?id=${id}&caseType=${type}`;
      } else {
        window.location.href = `/case-tracking-guardian.html?id=${id}&caseType=${type}`;
      }
    };
  });

  // ------------------------------------
  // CHAT
  // ------------------------------------

  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;

      window.location.href = `/chat-guardian.html?id=${id}`;
    };
  });

  // ------------------------------------
  // CLOSE CASE
  // ------------------------------------

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const confirmClose = confirm(
        "Are you sure you want to close this emergency?",
      );

      if (!confirmClose) return;

      try {
        const res = await fetch(`${API}/guardian/application/close/${id}`, {
          method: "PATCH",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Unable to close case");
        }

        alert("Case closed successfully.");

        // Reload all active cases
        loadApplications();
      } catch (err) {
        console.error("Close Case Error:", err);

        alert(err.message);
      }
    };
  });
}

// =====================================================
// SOCKET EVENTS
// =====================================================

// New volunteer joined
socket.on("volunteer_joined", () => {
  console.log("Volunteer joined.");

  loadApplications();
});

// Volunteer updated case
socket.on("case_updated", () => {
  console.log("Case updated.");

  loadApplications();
});

// Case closed
socket.on("case_closed", () => {
  console.log("Case closed.");

  loadApplications();
});

// Guardian's new case created
socket.on("guardian_case_created", () => {
  console.log("Guardian created a new case.");

  loadApplications();
});

// =====================================================
// AUTO REFRESH
// =====================================================

// Refresh every 20 seconds

setInterval(() => {
  loadApplications();
}, 20000);
