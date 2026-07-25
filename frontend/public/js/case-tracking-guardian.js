let map = null;
let marker = null;
let destinationMarker = null;
let routingControl = null;
let application = null;

const API = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");
const caseType = params.get("caseType");

const socket = io(API, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

// =========================
// DOM
// =========================

const casePhoto = document.getElementById("casePhoto");
const caseName = document.getElementById("caseName");
const caseStatus = document.getElementById("caseStatus");
const headerCaseType = document.getElementById("headerCaseType");

const caseTypeBox = document.getElementById("caseType");
const caseLocation = document.getElementById("caseLocation");
const createdDate = document.getElementById("createdDate");
const priority = document.getElementById("priority");

const volunteerName = document.getElementById("volunteerName");
const distance = document.getElementById("distance");
const eta = document.getElementById("eta");

const activity = document.getElementById("activityFeed");

// =========================
// SOCKET DEBUG
// =========================

socket.onAny((event, data) => {
  console.log("SOCKET EVENT:", event, data);
});

socket.on("connect", () => {
  console.log("Connected");

  console.log(socket.id);

  socket.emit("join_case", {
    caseId,
    role: "Guardian",
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});

socket.on("connect_error", (err) => {
  console.log(err);
});

// =========================
// LOAD CASE
// =========================

async function loadCase() {
  try {
    const res = await fetch(`${API}/guardian/application/${caseId}`, {
      credentials: "include",
    });

    const data = await res.json();

    console.log(data);

    if (!data.success) return;

    application = data.application;

    renderCase();

    if (caseType !== "missing-person") {
      initializeMap();
    } else {
      document.getElementById("mapSection").style.display = "none";
    }
  } catch (err) {
    console.log(err);
  }
}

// =========================
// RENDER
// =========================

function renderCase() {
  if (!application) return;

  casePhoto.src = application.Photo
    ? `${API}/uploads/${application.Photo}`
    : `${API}/images/default-user.png`;

  caseName.textContent = application.Name || "Emergency";

  caseStatus.textContent = application.status || "Active";

  caseTypeBox.textContent = application.caseType || "-";

  headerCaseType.textContent = application.caseType || "-";

  caseLocation.textContent =
    application.LastSeen ||
    application.Hospital ||
    application.Address ||
    application.CurrentLocation ||
    "-";

  createdDate.textContent = application.dateTime
    ? new Date(application.dateTime).toLocaleString()
    : "-";

  priority.textContent = application.priorityLevel || "-";
}

// =========================
// LIVE LOCATION
// =========================

socket.on("volunteer_location", (data) => {
  console.log("Volunteer Location Received");
  console.log(data);

  if (!data) return;

  if (String(data.caseId) !== String(caseId)) return;

  if (!map) {
    initializeMap();
  }

  const volunteerLat = Number(data.lat);
  const volunteerLng = Number(data.lng);

  const targetLat = Number(data.targetLat);
  const targetLng = Number(data.targetLng);

  if (isNaN(volunteerLat) || isNaN(volunteerLng)) {
    console.log("Volunteer coordinates invalid");
    return;
  }

  volunteerName.textContent = data.name || "Volunteer";

  distance.textContent = data.distance != null ? `${data.distance} km` : "-";

  eta.textContent = data.eta != null ? `${data.eta} min` : "-";

  const volunteer = L.latLng(volunteerLat, volunteerLng);

  // -----------------------
  // Volunteer Marker
  // -----------------------

  if (!marker) {
    marker = L.marker(volunteer).addTo(map).bindPopup("Volunteer");
  } else {
    marker.setLatLng(volunteer);
  }

  // -----------------------
  // Destination exists?
  // -----------------------

  if (!isNaN(targetLat) && !isNaN(targetLng)) {
    const destination = L.latLng(targetLat, targetLng);

    if (!destinationMarker) {
      destinationMarker = L.marker(destination)
        .addTo(map)
        .bindPopup("Destination");
    } else {
      destinationMarker.setLatLng(destination);
    }

    if (!routingControl) {
      routingControl = L.Routing.control({
        waypoints: [volunteer, destination],

        addWaypoints: false,

        draggableWaypoints: false,

        fitSelectedRoutes: true,

        routeWhileDragging: false,

        show: false,

        createMarker: () => null,
      }).addTo(map);
    } else {
      routingControl.setWaypoints([volunteer, destination]);
    }

    map.fitBounds([volunteer, destination]);
  } else {
    console.log("Target coordinates missing");

    map.setView(volunteer, 16);
  }

  addActivity("Volunteer location updated");
});

// =========================
// CASE STATE
// =========================

socket.on("case_state", (data) => {
  console.log("CASE STATE");

  console.log(data);
});

// =========================
// MAP
// =========================

function initializeMap() {
  if (map) return;

  map = L.map("map").setView([28.6139, 77.209], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
}

// =========================
// ACTIVITY
// =========================

function addActivity(msg) {
  activity.innerHTML =
    `
        <div class="activity">
            <p>${msg}</p>
            <small>${new Date().toLocaleTimeString()}</small>
        </div>
    ` + activity.innerHTML;
}

loadCase();
