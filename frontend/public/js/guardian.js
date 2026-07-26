// =====================================================
// RESQGRID GUARDIAN DASHBOARD
// =====================================================

const API = "https://resqgrid-b1zt.onrender.com";

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

// =====================================================
// CASE CONFIG
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

  // Read application id from URL
  const params = new URLSearchParams(window.location.search);
  const applicationId = params.get("id");

  if (applicationId) {
    loadApplication(applicationId);
  } else {
    caseContainer.innerHTML = `
      <div class="case-card empty-case">
        <h3>No Active Case</h3>
        <p>Create a new emergency case.</p>
      </div>
    `;
  }
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

    if (!res.ok) return;

    const user = await res.json();

    profileName.innerText = user.name;
    profileRole.innerText = "Guardian";
  } catch (err) {
    console.error("Load User Error:", err);
  }
}

// =====================================================
// CARD
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
// LOAD APPLICATION
// =====================================================

async function loadApplication(id) {
  try {
    const res = await fetch(`${API}/guardian/application/${id}`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Application not found");
    }

    const application = await res.json();

    caseContainer.innerHTML = createCard(application);

    attachHandlers();
  } catch (err) {
    console.error("Load Application Error:", err);

    caseContainer.innerHTML = `
            <div class="case-card empty-case">

                <h3>No Active Case</h3>

                <p>
                    You currently have no active emergency case.
                </p>

            </div>
        `;
  }
}

// =====================================================
// BUTTON HANDLERS
// =====================================================

function attachHandlers() {
  // -----------------------------
  // TRACK
  // -----------------------------

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

  // -----------------------------
  // CHAT
  // -----------------------------

  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/chat-guardian.html?id=${btn.dataset.id}`;
    };
  });

  // -----------------------------
  // CLOSE
  // -----------------------------

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      const confirmClose = confirm("Are you sure you want to close this case?");

      if (!confirmClose) return;

      try {
        const res = await fetch(
          `${API}/guardian/application/close/${btn.dataset.id}`,

          {
            method: "PATCH",
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error("Unable to close case.");
        }

        caseContainer.innerHTML = `
                    <div class="case-card empty-case">

                        <h3>Case Closed</h3>

                        <p>
                            This emergency has been successfully closed.
                        </p>

                    </div>
                `;
      } catch (err) {
        console.error(err);

        alert(err.message);
      }
    };
  });
}

// =====================================================
// BUTTON HANDLERS
// =====================================================

function attachHandlers() {
  // Track
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

  // Chat
  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/chat-guardian.html?id=${btn.dataset.id}`;
    };
  });

  // Close Case
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Close this case?")) return;

      try {
        await fetch(`${API}/guardian/application/close/${btn.dataset.id}`, {
          method: "PATCH",
          credentials: "include",
        });

        // Remove id from URL
        history.replaceState({}, "", `${window.location.origin}/guardian.html`);

        loadApplication();
      } catch (err) {
        console.log(err);
      }
    };
  });
}
