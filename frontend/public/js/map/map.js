const API = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");

let caseType = params.get("caseType");

const socket = io(API, {
  withCredentials: true,
});

let application = null;

let watchId = null;

// =====================================
// SOCKET CONNECT
// =====================================

socket.on("connect", () => {
  console.log("Volunteer Socket Connected:", socket.id);
});

// =====================================
// LOAD CASE
// =====================================

async function loadApplication() {
  try {
    if (!caseId) {
      console.log("Missing Case ID");

      return;
    }

    const res = await fetch(`${API}/volunteer/application/${caseId}`, {
      credentials: "include",
    });

    const data = await res.json();

    application = data.application || data;

    console.log("Application:", application);

    // fallback from database

    if (!caseType) {
      caseType = application.caseType;
    }

    console.log("Case Type:", caseType);

    joinCaseRoom();

    startLocationTracking();

    initializeMap();

    if (typeof initializeChat === "function") {
      initializeChat(socket, caseId);
    }
  } catch (err) {
    console.log("Load Error:", err);
  }
}

// =====================================
// JOIN CASE ROOM
// =====================================

function joinCaseRoom() {
  if (!caseId) {
    return;
  }

 socket.emit(
"join_case",
{
    caseId: caseId,
    role:"Volunteer"
}
);



  console.log("Joined Case Room:", caseId);

  socket.emit("volunteer_joined", {
    caseId,

    name: localStorage.getItem("name") || "Volunteer",
  });
}

// =====================================
// MAP LOADING
// =====================================

function initializeMap() {
  switch (caseType) {
    case "missing-person":
      if (typeof loadMissingPersonMap === "function") {
        loadMissingPersonMap({
          application,

          socket,

          caseId,
        });
      }

      break;

    case "blood-report":

    case "elderly-assistance":

    case "community-sos":
      if (typeof loadRouteMap === "function") {
        loadRouteMap({
          application,

          socket,

          caseId,
        });
      }

      break;

    case "women-safety":
      if (typeof loadEscortMap === "function") {
        loadEscortMap({
          application,

          socket,

          caseId,
        });
      }

      break;

    case "civic-hazard":
      if (typeof loadHazardMap === "function") {
        loadHazardMap({
          application,

          socket,

          caseId,
        });
      }

      break;

    default:
      console.log("Unknown case type:", caseType);
  }
}

// =====================================
// LIVE LOCATION
// =====================================

function startLocationTracking() {
  if (!navigator.geolocation) {
    console.log("Location not supported");

    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        caseId,

        lat: position.coords.latitude,

        lng: position.coords.longitude,

        name: localStorage.getItem("name") || "Volunteer",

        time: new Date(),
      };

      console.log("Sending Location:", location);

      socket.emit("volunteer_location", location);
    },

    (error) => {
      console.log("Location Error:", error);
    },

    {
      enableHighAccuracy: true,

      maximumAge: 5000,

      timeout: 10000,
    },
  );
}

// =====================================
// CHAT BUTTON
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("chatToggle");

  if (chatBtn) {
    chatBtn.onclick = () => {
      window.location.href = `/chat-volunteer.html?id=${caseId}`;
    };
  }
});

// =====================================
// CLEANUP
// =====================================

window.addEventListener("beforeunload", () => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }

  socket.emit("volunteer_left", {
    caseId,

    name: localStorage.getItem("name") || "Volunteer",
  });
});

loadApplication();
