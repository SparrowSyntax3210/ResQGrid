const API = "http://localhost:5000";

const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");

const socket = io(API, {
  withCredentials: true,
});

let currentCase = null;

let activityFeed = [];

const gridIds = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

// =============================
// DOM
// =============================

const photo = document.getElementById("photo");
const name = document.getElementById("name");
const status = document.getElementById("status");

const age = document.getElementById("age");
const gender = document.getElementById("gender");
const height = document.getElementById("height");
const clothing = document.getElementById("clothing");
const medical = document.getElementById("medical");

const lastSeen = document.getElementById("lastSeen");
const dateTime = document.getElementById("dateTime");
const guardian = document.getElementById("guardian");
const description = document.getElementById("description");

const onlineCount = document.getElementById("onlineCount");

const completedCount = document.getElementById("completedCount");

const activeCount = document.getElementById("activeCount");

const remainingCount = document.getElementById("remainingCount");

const progressFill = document.getElementById("progressFill");

const progressText = document.getElementById("progressText");

const lastUpdated = document.getElementById("lastUpdated");

// =============================
// LOAD CASE
// =============================

async function loadCase() {
  try {
    const res = await fetch(`${API}/guardian/application`, {
      credentials: "include",
    });

    const data = await res.json();

    console.log("Applications Response:", data);

    let cases = [];

    if (Array.isArray(data)) {
      cases = data;
    } else if (Array.isArray(data.applications)) {
      cases = data.applications;
    } else if (Array.isArray(data.data)) {
      cases = data.data;
    } else {
      console.log("Invalid application response", data);

      return;
    }

    const app = cases.find((c) => String(c._id) === String(caseId));

    if (!app) {
      console.log("Case not found", caseId);

      return;
    }

    currentCase = app;

    renderCase(app);
  } catch (err) {
    console.log("LOAD CASE ERROR", err);
  }
}

// =============================
// RENDER CASE
// =============================

function renderCase(app) {
  photo.src = app.Photo
    ? `${API}/uploads/${app.Photo}`
    : "./images/default-user.png";

  name.innerText = app.Name || "Unknown";

  status.innerText = app.status || "Active";

  status.className = `status ${app.status || "active"}`;

  age.innerText = app.Age || "-";

  gender.innerText = app.Gender || "-";

  height.innerText = app.Height || "-";

  clothing.innerText = app.Clothing || "-";

  medical.innerText = app.MedicalConditions || "None";

  lastSeen.innerText = app.LastSeen || "-";

  dateTime.innerText = app.dateTime
    ? new Date(app.dateTime).toLocaleString()
    : "-";

  guardian.innerText = app.GuardianContact || "-";

  description.innerText = app.Description || "-";
}

// =============================
// SOCKET CONNECT
// =============================

socket.on("connect", () => {
  console.log("Socket Connected", socket.id);

  socket.emit("join_case", {
    caseId,
    role: "Guardian",
  });

  console.log("Joined Case Room", `case_${caseId}`);
});

// =============================
// CASE STATE UPDATE
// =============================

socket.on("case_state", (state) => {
  console.log("CASE STATE RECEIVED", state);

  if (!state.grids) {
    console.log("No grid data");

    return;
  }

  updateDashboard(state);
});

// =============================
// GRID UPDATE
// =============================

socket.on("grid_update", (data) => {
  console.log("GRID UPDATE", data);

  if (!data.gridId) return;

  addActivity(`${data.volunteer || "Volunteer"} joined ${data.gridId}`);
});

// =============================
// UPDATE GRID UI
// =============================

function updateDashboard(state) {
  let completed = 0;

  let active = 0;

  onlineCount.innerText = state.totalVolunteers || 0;

  gridIds.forEach((gridId) => {
    const box = document.getElementById(gridId);

    if (!box) return;

    const grid = state.grids[gridId];

    if (!grid) return;

    let text = "Waiting";

    let css = "grid-gray";

    if (grid.completed) {
      text = "Completed";

      css = "grid-green";

      completed++;
    } else if (grid.count > 0) {
      text = "Searching";

      css = "grid-yellow";

      active++;
    }

    box.className = `grid-box ${css}`;

    const span = box.querySelector("span");

    const small = box.querySelector("small");

    if (span) span.innerText = text;

    if (small)
      small.innerText = `${grid.count || 0} Volunteer${
        grid.count == 1 ? "" : "s"
      }`;
  });

  completedCount.innerText = `${completed} / 9`;

  activeCount.innerText = active;

  remainingCount.innerText = 9 - completed;

  const percent = Math.round((completed / 9) * 100);

  progressFill.style.width = percent + "%";

  progressText.innerText = percent + "%";

  lastUpdated.innerText = "Updated : " + new Date().toLocaleTimeString();

  renderActivities(state);
}

// =============================
// ACTIVITY
// =============================

function addActivity(text) {
  activityFeed.unshift({
    text,

    time: new Date().toLocaleTimeString(),
  });

  if (activityFeed.length > 20) activityFeed.pop();

  renderActivities();
}

function renderActivities(state) {
  const container = document.getElementById("activityFeed");

  container.innerHTML = "";

  if (activityFeed.length === 0) {
    container.innerHTML = `
<div class="activity">
Waiting for volunteers...
</div>
`;

    return;
  }

  activityFeed.forEach((item) => {
    container.innerHTML += `
<div class="activity">

<div>
${item.text}
</div>

<div class="activity-time">
${item.time}
</div>

</div>
`;
  });

  if (state) {
    gridIds.forEach((id) => {
      const grid = state.grids[id];

      if (!grid) return;

      if (grid.count > 0) {
        addActivity(`${grid.count} volunteer(s) searching ${id}`);
      }
    });
  }
}

// =============================
// BUTTONS
// =============================

document.getElementById("refreshBtn").onclick = loadCase;

document.getElementById("chatBtn").onclick = () => {
  window.location.href = `/chat-guardian.html?id=${caseId}`;
};

document.getElementById("closeCaseBtn").onclick = async () => {
  if (!confirm("Close this case?")) return;

  await fetch(`${API}/application/close/${caseId}`, {
    method: "PATCH",
    credentials: "include",
  });

  location.reload();
};

window.addEventListener("beforeunload", () => {
  socket.emit("leave_case", caseId);
});

// START

loadCase();
