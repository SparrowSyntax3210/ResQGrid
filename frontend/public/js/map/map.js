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

    // ===============================
    // NORMALIZE COORDINATES
    // ===============================

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

    console.log("Application:", application);

    if (!caseType) {
      caseType = application.caseType;
    }

    joinCaseRoom();

    initializeMap();

    if (typeof initializeChat === "function") {
      initializeChat(socket, caseId);
    }
  } catch (error) {
    console.error("Application Load Error:", error);
  }
}

// ======================================
// JOIN CASE ROOM
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
// MAP SELECTOR
// ======================================

function initializeMap() {
  if (!caseType) {
    caseType = application.caseType;
  }

  caseType = caseType.toLowerCase();

  console.log("Case Type:", caseType);

  switch (caseType) {
    // ===============================
    // GRID BASED SEARCH
    // ===============================

    case "missing-person":
      if (typeof loadMissingPersonMap === "function") {
        stopLocationTracking();

        socket.off("volunteer_location");

        console.log("Missing Person Grid Mode");

        loadMissingPersonMap({
          application,

          socket,

          caseId,

          startGridTracking,
        });
      }

      break;

    // ===============================
    // GPS CASES
    // ===============================

    case "blood-report":

    case "elderly-assistance":

    case "community-sos":
      if (typeof loadRouteMap === "function") {
        loadRouteMap({
          application,

          socket,

          caseId,

          startLocationTracking,
        });
      }

      break;

    case "women-safety":
      if (typeof loadEscortMap === "function") {
        loadEscortMap({
          application,

          socket,

          caseId,

          startLocationTracking,
        });
      }

      break;

    case "civic-hazard":
      if (typeof loadHazardMap === "function") {
        loadHazardMap({
          application,

          socket,

          caseId,

          startLocationTracking,
        });
      }

      break;

    default:
      console.warn("Unknown Case Type:", caseType);
  }
}

// ======================================
// GRID ONLY TRACKING
// ======================================

function startGridTracking(gridId) {
  const payload = {
    caseId,

    name: localStorage.getItem("name") || "Volunteer",

    gridId,

    timestamp: Date.now(),
  };

  console.log("Sending Grid Update:", payload);

  socket.emit("volunteer_grid_update", payload);
}

// ======================================
// GPS TRACKING
// ======================================

function startLocationTracking() {
  if (caseType === "missing-person") {
    console.log("GPS blocked for missing-person case");

    return;
  }

  console.trace("GPS FUNCTION CALLED");

  if (!navigator.geolocation) {
    console.error("Geolocation Not Supported");

    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
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
      }

      const payload = {
        caseId,

        name: localStorage.getItem("name") || "Volunteer",

        lat: volunteerLat,

        lng: volunteerLng,

        targetLat,

        targetLng,

        distance,

        eta,

        timestamp: Date.now(),
      };

      console.log("Sending GPS:", payload);

      socket.emit("volunteer_location", payload);
    },

    (error) => {
      console.error("GPS Error:", error);
    },

    {
      enableHighAccuracy: true,

      maximumAge: 0,

      timeout: 15000,
    },
  );
}

function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);

    watchId = null;

    console.log("GPS stopped");
  }
}

// ======================================
// DISTANCE
// ======================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
}

// ======================================
// CHAT
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
