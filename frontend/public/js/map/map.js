const API = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");
let caseType = params.get("caseType");

const socket = io(API, {
  withCredentials: true,
});

let application = null;
let watchId = null;

// ======================================
// SOCKET
// ======================================

socket.on("connect", () => {
  console.log("Volunteer Connected:", socket.id);
});

// ======================================
// LOAD APPLICATION
// ======================================

async function loadApplication() {
  try {
    if (!caseId) {
      console.error("Missing Case ID");
      return;
    }

    const res = await fetch(`${API}/volunteer/application/${caseId}`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Unable to load application");
    }

    const data = await res.json();

    application = data.application || data;

    // -------------------------------
    // Normalize Coordinates
    // -------------------------------

    application.latitude = Number(
      application.latitude ??
        application.lat ??
        application.location?.lat ??
        application.location?.latitude ??
        application.LastSeen?.lat ??
        application.LastSeen?.latitude,
    );

    application.longitude = Number(
      application.longitude ??
        application.lng ??
        application.location?.lng ??
        application.location?.longitude ??
        application.LastSeen?.lng ??
        application.LastSeen?.longitude,
    );

    console.log("Application Loaded:", application);

    console.log("Case Coordinates:", {
      lat: application.latitude,
      lng: application.longitude,
    });

    if (!caseType) {
      caseType = application.caseType;
    }

    joinCaseRoom();
    initializeMap();
    startLocationTracking();

    if (typeof initializeChat === "function") {
      initializeChat(socket, caseId);
    }
  } catch (err) {
    console.error("Application Load Error:", err);
  }
}

// ======================================
// JOIN ROOM
// ======================================

function joinCaseRoom() {
  socket.emit("join_case", {
    caseId,
    role: "Volunteer",
  });

  socket.emit("volunteer_joined", {
    caseId,
    name: localStorage.getItem("name") || "Volunteer",
  });

  console.log("Joined Case:", caseId);
}

// ======================================
// MAP
// ======================================

function initializeMap() {

    if (!caseType) {
    caseType = application.caseType;
}

// normalize case type
caseType = caseType.toLowerCase();

console.log("Normalized Case Type:", caseType);

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
      console.warn("Unknown Case Type:", caseType);
  }
}
// ======================================
// CALCULATE DISTANCE
// ======================================

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((R * c).toFixed(2));
}

// ======================================
// LOCATION TRACKING
// ======================================

function startLocationTracking() {
  if (!navigator.geolocation) {
    console.error("Geolocation Not Supported");

    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const volunteerLat = position.coords.latitude;
      const volunteerLng = position.coords.longitude;

      const targetLat = Number(application.latitude);
      const targetLng = Number(application.longitude);

      let distance = null;
      let eta = null;

      if (Number.isFinite(targetLat) && Number.isFinite(targetLng)) {
        distance = calculateDistance(
          volunteerLat,
          volunteerLng,
          targetLat,
          targetLng,
        );

        eta = Math.round((distance / 40) * 60);
      } else {
        console.warn("Case location missing.");
      }

      const payload={

caseId,

name:
localStorage.getItem("name") || "Volunteer",

lat: volunteerLat,

lng: volunteerLng,


targetLat,

targetLng,


distance,

eta,


gridId:
window.activeGrid || null,


timestamp:Date.now()

};

      console.log("Sending Volunteer Location");

      console.table(payload);

      socket.emit("volunteer_location", payload);
    },

    (err) => {
      console.error("Location Error:", err);
    },

    {
      enableHighAccuracy: true,

      maximumAge: 0,

      timeout: 15000,
    },
  );
}

// ======================================
// CHAT BUTTON
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("chatToggle");

  if (chatBtn) {
    chatBtn.addEventListener("click", () => {
      window.location.href = `/chat-volunteer.html?id=${caseId}`;
    });
  }
});

// ======================================
// CLEANUP
// ======================================

window.addEventListener("beforeunload", () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  socket.emit("volunteer_left", {
    caseId,

    name: localStorage.getItem("name") || "Volunteer",
  });
});

// ======================================
// START
// ======================================

loadApplication();
