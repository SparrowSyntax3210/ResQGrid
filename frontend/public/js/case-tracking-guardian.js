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

// ===============================
// DOM
// ===============================

const photo = document.getElementById("photo");

const nameBox = document.getElementById("name");

const statusBox = document.getElementById("status");

const locationBox = document.getElementById("location");

const createdBox = document.getElementById("created");

const priorityBox = document.getElementById("priority");

const activity = document.getElementById("activityFeed");

// ===============================
// SOCKET CONNECT
// ===============================

socket.on("connect", () => {
  console.log("Guardian connected", socket.id);

  socket.emit("join_case", {
    caseId,

    role: "Guardian",
  });

  console.log("Joined Case Room:", caseId);
});

// ===============================
// RECEIVE LOCATION
// ===============================

socket.on("volunteer_location", (data) => {
  console.log("LIVE LOCATION:", data);

  if (String(data.caseId) !== String(caseId)) return;

  if (!map) initializeMap();

  const pos = [data.lat, data.lng];

  if (!marker) {
    marker = L.marker(pos).addTo(map);
  } else {
    marker.setLatLng(pos);
  }

  map.setView(pos, 15);

  document.getElementById("volunteerName").innerText = data.name || "Volunteer";

  addActivity("Volunteer location updated");
});

// ===============================
// CASE STATE
// ===============================

socket.on("case_state", (data) => {
  console.log("CASE STATE", data);

  addActivity(data.message || "Case updated");
});

// ===============================
// LOAD CASE
// ===============================

async function loadCase() {
  try {
    const res = await fetch(
      `${API}/guardian/application`,

      {
        credentials: "include",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      console.log(data);

      return;
    }

    let cases = [];

    if (Array.isArray(data)) cases = data;
    else if (data.applications) cases = data.applications;
    else if (data.application) cases = [data.application];

    application = cases.find((c) => String(c._id) === String(caseId));

    if (!application) {
      console.log("Case not found");

      return;
    }

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

// ===============================
// RENDER
// ===============================

function renderCase() {
  photo.src = application.Photo
    ? `${API}/uploads/${application.Photo}`
    : "/images/default-user.png";

  nameBox.innerText = application.Name || "Emergency";

  statusBox.innerText = application.status;

  document.getElementById("caseType").innerText = caseType;

  locationBox.innerText =
    application.LastSeen ||
    application.Hospital ||
    application.Address ||
    application.CurrentLocation ||
    "-";

  createdBox.innerText = new Date(application.dateTime).toLocaleString();

  priorityBox.innerText = application.priorityLevel || "Pending";
}

// ===============================
// MAP
// ===============================

function initializeMap() {
  if (map) return;

  map = L.map("map").setView([28.6139, 77.209], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// ===============================
// ACTIVITY
// ===============================

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

// ===============================
// BUTTONS
// ===============================

document.getElementById("refreshBtn").onclick = loadCase;

document.getElementById("chatBtn").onclick = () => {
  location.href = `/chat-guardian.html?id=${caseId}`;
};

document.getElementById("closeBtn").onclick = async () => {
  await fetch(
    `${API}/guardian/application/close/${caseId}`,

    {
      method: "PATCH",

      credentials: "include",
    },
  );

  location.href = "/guardian.html";
};

loadCase();
