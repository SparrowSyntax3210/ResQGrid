const API = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");

const caseType = params.get("caseType");

const socket = io(API, {
  withCredentials: true,
});

let map = null;

let marker = null;

let application = null;

// =============================
// DOM REFERENCES
// =============================

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

// =============================
// LOAD CASE
// =============================

async function loadCase() {
  try {
    const res = await fetch(`${API}/guardian/application/${caseId}`, {
      credentials: "include",
    });

    const data = await res.json();

    console.log("Guardian Case:", data);

    if (!data.success) {
      console.log("Case not found");

      return;
    }

    application = data.application;

    renderCase();

    if (caseType === "missing-person") {
      document.getElementById("mapSection").style.display = "none";
    } else {
      initializeMap();
    }
  } catch (error) {
    console.log(error);
  }
}

// =============================
// RENDER CASE
// =============================

function renderCase() {
  if (!application) return;

  console.log("Rendering Case", application);

  casePhoto.src = application.Photo
    ? `${API}/uploads/${application.Photo}`
    : "/images/default-user.png";

  caseName.innerText = application.Name || "Emergency";

  caseStatus.innerText = application.status || "Active";

  caseTypeBox.innerText = application.caseType || "-";

  headerCaseType.innerText = application.caseType || "Emergency Case";

  caseLocation.innerText =
    application.LastSeen ||
    application.Hospital ||
    application.Address ||
    application.CurrentLocation ||
    "-";

  createdDate.innerText = application.dateTime
    ? new Date(application.dateTime).toLocaleString()
    : "-";

  priority.innerText = application.priorityLevel || "Pending";
}

// =============================
// SOCKET CONNECTION
// =============================

socket.on("connect", () => {
  console.log("Guardian Connected", socket.id);

  socket.emit("join_case", {
    caseId,
    role: "Guardian",
  });

  console.log("Joined Case Room", caseId);
});

// =============================
// LIVE LOCATION
// =============================

socket.on("volunteer_location", (data) => {
  console.log("LIVE LOCATION", data);

  if (String(data.caseId) !== String(caseId)) return;

  volunteerName.innerText = data.name || data.volunteerName || "Volunteer";

  distance.innerText = data.distance ? `${data.distance} km` : "-";

  eta.innerText = data.eta ? `${data.eta} min` : "-";

  if (!map) initializeMap();

  const position = [data.lat, data.lng];

  if (!marker) {
    marker = L.marker(position).addTo(map);
  } else {
    marker.setLatLng(position);
  }

  map.setView(position, 15);

  addActivity("Volunteer location updated");
});

// =============================
// CASE STATE
// =============================

socket.on("case_state", (data) => {
  console.log("CASE STATE", data);

  if (data.message) addActivity(data.message);
});

// =============================
// CASE LOADED
// =============================

socket.on("case_loaded", (app) => {
  console.log("CASE LOADED", app);

  application = app;

  renderCase();
});

// =============================
// MAP
// =============================

function initializeMap() {
  if (map) return;

  map = L.map("map").setView([28.6139, 77.209], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// =============================
// ACTIVITY
// =============================

function addActivity(text) {
  activity.innerHTML =
    `

<div class="activity">

<p>
${text}
</p>

<small>
${new Date().toLocaleTimeString()}
</small>


</div>

` + activity.innerHTML;
}

// =============================
// BUTTONS
// =============================

document.getElementById("refreshBtn").onclick = loadCase;

document.getElementById("chatBtn").onclick = () => {
  location.href = `/chat-guardian.html?id=${caseId}`;
};

document.getElementById("closeBtn").onclick = async () => {
  await fetch(`${API}/guardian/application/close/${caseId}`, {
    method: "PATCH",

    credentials: "include",
  });

  location.href = "/guardian.html";
};

loadCase();
