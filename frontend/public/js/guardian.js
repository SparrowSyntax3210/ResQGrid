// =====================================================
// RESQGRID GUARDIAN DASHBOARD
// COMPLETE GUARDIAN.JS
// =====================================================

const API = "";

// =====================================================
// DOM
// =====================================================

const caseContainer = document.getElementById("caseContainer");

const profileName = document.querySelector("#profileName h4");
const profileRole = document.querySelector("#profileName small");

const guardianSOSBtn = document.getElementById("sosBtn");
const guardianStopSOSBtn = document.getElementById("stopSosBtn");
const guardianSubmitSOSBtn = document.getElementById("submitSosBtn");
const guardianSOSStatus = document.getElementById("sosStatus");

let currentCase = null;

// =====================================================
// SOS RECORDING VARIABLES
// =====================================================

let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let microphoneStream = null;

// =====================================================
// SOCKET.IO
// =====================================================

const socket = io(API, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

// =====================================================
// SOCKET CONNECT
// =====================================================

socket.on("connect", () => {
  console.log("=================================");
  console.log("🛡️ Guardian Socket Connected");
  console.log("Socket:", socket.id);
  console.log("=================================");

  socket.emit("join_guardians");
});

// =====================================================
// SOCKET DISCONNECT
// =====================================================

socket.on("disconnect", (reason) => {
  console.log("Guardian Socket Disconnected");
  console.log("Reason:", reason);
});

// =====================================================
// SOCKET CONNECT ERROR
// =====================================================

socket.on("connect_error", (error) => {
  console.error("Guardian Socket Error:", error.message);
});

// =====================================================
// LIVE CASE EVENTS
// =====================================================

socket.on("new_case", () => {
  console.log("📢 New case received");
  loadApplications();
});

socket.on("volunteer_joined", () => {
  console.log("🦺 Volunteer joined");
  loadApplications();
});

socket.on("case_updated", () => {
  console.log("🔄 Case updated");
  loadApplications();
});

socket.on("case_closed", () => {
  console.log("🔴 Case closed");
  loadApplications();
});

socket.on("guardian_case_created", () => {
  console.log("📁 Guardian case created");
  loadApplications();
});

// =====================================================
// SOS SOCKET EVENTS
// =====================================================

socket.on("sos:created", (sos) => {
  console.log("🚨 LIVE SOS CREATED:", sos);
});

socket.on("sos:updated", (sos) => {
  console.log("🔄 LIVE SOS UPDATED:", sos);
});

socket.on("sos:deleted", (data) => {
  console.log("🗑️ LIVE SOS DELETED:", data);
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
  console.log("🛡️ Guardian Dashboard Loaded");

  const createCaseBtn = document.getElementById("createCaseBtn");

  if (createCaseBtn) {
    createCaseBtn.addEventListener("click", () => {
      window.location.href = "/case-selection.html";
    });
  }

  loadUser();
  loadApplications();

  initializeGuardianSOS();
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

// =====================================================
// LOCATION
// =====================================================

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

// =====================================================
// PRIMARY INFORMATION
// =====================================================

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
// SAFE HTML
// =====================================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
      throw new Error(`Unable to load user (${res.status})`);
    }

    const user = await res.json();

    if (profileName) {
      profileName.innerText = user.name || "Guardian";
    }

    if (profileRole) {
      profileRole.innerText = user.role || "Guardian";
    }

    console.log("👤 Guardian:", user.name);
  } catch (err) {
    console.error("Load User Error:", err);
  }
}

// =====================================================
// LOAD APPLICATIONS
// =====================================================

async function loadApplications() {
  if (!caseContainer) {
    return;
  }

  try {
    const res = await fetch(`${API}/guardian/application`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Unable to load applications (${res.status})`);
    }

    const applications = await res.json();

    console.log("Applications:", applications);

    if (!Array.isArray(applications) || applications.length === 0) {
      caseContainer.innerHTML = `
        <div class="case-card empty-case">
          <h3>No Active Case</h3>
          <p>You currently have no active emergency case.</p>
        </div>
      `;

      updateStatistics([]);
      return;
    }

    caseContainer.innerHTML = applications
      .map((app) => createCard(app))
      .join("");

    attachHandlers();
    updateStatistics(applications);
  } catch (err) {
    console.error("Load Applications Error:", err);

    caseContainer.innerHTML = `
      <div class="case-card empty-case">
        <h3>Unable to Load Cases</h3>
        <p>Please refresh the dashboard or try again later.</p>
      </div>
    `;
  }
}

// =====================================================
// CREATE CASE CARD
// =====================================================

function createCard(app) {
  const config = getConfig(app.caseType);

  /*
   * IMPORTANT:
   *
   * Do NOT use:
   *
   * onerror="this.src='images/default-user.png'"
   *
   * because if that image also does not exist,
   * the browser enters an infinite error loop.
   */

  let imageHTML = "";

  if (app.Photo) {
    const imageURL = `${API}/uploads/${encodeURIComponent(app.Photo)}`;

    imageHTML = `
      <img
        src="${imageURL}"
        alt="${escapeHTML(app.Name || "User")}"
        class="case-user-image"
        onerror="this.onerror=null; this.style.display='none'; this.parentElement.classList.add('image-missing');"
      >
    `;
  } else {
    imageHTML = `
      <div class="case-user-placeholder">
        <i class="fa-solid fa-user"></i>
      </div>
    `;
  }

  const status = app.status || "active";

  const priority = app.priorityLevel || "Medium";

  const createdDate =
    app.createdAt || app.dateTime
      ? new Date(app.createdAt || app.dateTime).toLocaleString()
      : "Not Available";

  return `
    <div class="case-card fade-in">

      <div class="case-top">

        <div class="case-user">

          ${imageHTML}

          <div class="case-details">

            <h3>
              ${config.icon}
              ${escapeHTML(app.Name || "Unknown Person")}
            </h3>

            <p>
              ${escapeHTML(config.title)}
            </p>

            <small class="emergency-type">
              ${escapeHTML(getPrimaryInfo(app))}
            </small>

          </div>

        </div>

        <span class="status ${escapeHTML(status)}">
          ${escapeHTML(status.toUpperCase())}
        </span>

      </div>

      <div class="case-info">

        <div class="info-box">

          <h4>
            ${escapeHTML(config.locationLabel)}
          </h4>

          <p>
            ${escapeHTML(getLocation(app))}
          </p>

        </div>

        <div class="info-box">

          <h4>Created</h4>

          <p>
            ${escapeHTML(createdDate)}
          </p>

        </div>

        <div class="info-box">

          <h4>Priority</h4>

          <p class="priority-${escapeHTML(priority.toLowerCase())}">
            ${escapeHTML(priority)}
          </p>

        </div>

        <div class="info-box">

          <h4>Case Type</h4>

          <p>
            ${escapeHTML(config.title)}
          </p>

        </div>

      </div>

      <div class="case-buttons">

        <button
          class="track-btn"
          data-id="${escapeHTML(app._id)}"
          data-type="${escapeHTML(app.caseType)}"
        >
          📍 Track
        </button>

        <button
          class="chat-btn"
          data-id="${escapeHTML(app._id)}"
        >
          💬 Chat
        </button>

        <button
          class="close-btn"
          data-id="${escapeHTML(app._id)}"
        >
          ❌ Close
        </button>

      </div>

    </div>
  `;
}

// =====================================================
// BUTTON HANDLERS
// =====================================================

function attachHandlers() {
  // ===================================================
  // TRACK
  // ===================================================

  document.querySelectorAll(".track-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      currentCase = id;

      if (type === "missing-person") {
        window.location.href = `/case-grid-guardian.html?id=${encodeURIComponent(
          id,
        )}&caseType=${encodeURIComponent(type)}`;
      } else {
        window.location.href = `/case-tracking-guardian.html?id=${encodeURIComponent(
          id,
        )}&caseType=${encodeURIComponent(type)}`;
      }
    };
  });

  // ===================================================
  // CHAT
  // ===================================================

  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;

      window.location.href = `/chat-guardian.html?id=${encodeURIComponent(id)}`;
    };
  });

  // ===================================================
  // CLOSE CASE
  // ===================================================

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const confirmClose = confirm(
        "Are you sure you want to close this emergency?",
      );

      if (!confirmClose) {
        return;
      }

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

        await loadApplications();
      } catch (err) {
        console.error("Close Case Error:", err);

        alert(err.message);
      }
    };
  });
}

// =====================================================
// STATISTICS
// =====================================================

function updateStatistics(applications) {
  const statCards = document.querySelectorAll(".stat-card");

  if (!statCards.length) {
    return;
  }

  // Active Cases
  const activeCases = applications.filter(
    (app) => app.status !== "closed" && app.status !== "resolved",
  ).length;

  // Update first stat
  if (statCards[0]) {
    const value = statCards[0].querySelector("h2");

    if (value) {
      value.textContent = activeCases;
    }
  }

  // Volunteers
  if (statCards[1]) {
    const value = statCards[1].querySelector("h2");

    if (value) {
      value.textContent = "—";
    }
  }

  // Areas
  if (statCards[2]) {
    const value = statCards[2].querySelector("h2");

    if (value) {
      value.textContent = activeCases;
    }
  }

  // Sightings
  if (statCards[3]) {
    const value = statCards[3].querySelector("h2");

    if (value) {
      value.textContent = "—";
    }
  }
}

// =====================================================
// =====================================================
// GUARDIAN SOS
// =====================================================
// =====================================================

function initializeGuardianSOS() {
  if (!guardianSOSBtn) {
    console.warn("SOS button not found.");
    return;
  }

  // ===================================================
  // START SOS
  // ===================================================

  guardianSOSBtn.addEventListener("click", async () => {
    try {
      updateSOSStatus("🎙️ Requesting microphone...");

      await startSOSRecording();

      updateSOSStatus("🔴 Recording emergency... Speak clearly.");

      guardianSOSBtn.disabled = true;

      if (guardianStopSOSBtn) {
        guardianStopSOSBtn.disabled = false;
      }

      if (guardianSubmitSOSBtn) {
        guardianSubmitSOSBtn.disabled = true;
      }
    } catch (error) {
      console.error("❌ SOS recording error:", error);

      updateSOSStatus("❌ Could not start recording.");
    }
  });

  // ===================================================
  // STOP SOS
  // ===================================================

  guardianStopSOSBtn?.addEventListener("click", () => {
    try {
      stopSOSRecording();

      updateSOSStatus("✅ Recording stopped. Ready to send.");

      guardianSOSBtn.disabled = false;

      guardianStopSOSBtn.disabled = true;

      guardianSubmitSOSBtn.disabled = false;
    } catch (error) {
      console.error("❌ SOS stop error:", error);

      updateSOSStatus("❌ Could not stop recording.");
    }
  });

  // ===================================================
  // SEND SOS
  // ===================================================

  guardianSubmitSOSBtn?.addEventListener("click", submitGuardianSOS);
}

// =====================================================
// SOS STATUS
// =====================================================

function updateSOSStatus(message) {
  if (guardianSOSStatus) {
    guardianSOSStatus.textContent = message;
  }

  console.log("🚨 SOS:", message);
}

// =====================================================
// START RECORDING
// =====================================================

async function startSOSRecording() {
  // Reset previous recording
  audioChunks = [];
  audioBlob = null;

  // Check browser support
  if (!navigator.mediaDevices) {
    throw new Error("MediaDevices API is not supported.");
  }

  if (!navigator.mediaDevices.getUserMedia) {
    throw new Error("Microphone access is not supported.");
  }

  if (!window.MediaRecorder) {
    throw new Error("MediaRecorder is not supported.");
  }

  // Request microphone
  microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  console.log("🎙️ Microphone permission granted.");

  // ===================================================
  // SELECT SUPPORTED AUDIO FORMAT
  // ===================================================

  let mimeType = "";

  const possibleTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  for (const type of possibleTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }

  console.log("🎵 Recording MIME:", mimeType || "browser default");

  // ===================================================
  // CREATE RECORDER
  // ===================================================

  mediaRecorder = mimeType
    ? new MediaRecorder(microphoneStream, {
        mimeType,
      })
    : new MediaRecorder(microphoneStream);

  // ===================================================
  // DATA AVAILABLE
  // ===================================================

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  // ===================================================
  // RECORDING STOPPED
  // ===================================================

  mediaRecorder.onstop = () => {
    const actualMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";

    audioBlob = new Blob(audioChunks, {
      type: actualMimeType,
    });

    console.log("🎵 Audio recording created:", audioBlob.size, "bytes");

    console.log("🎵 Audio type:", audioBlob.type);

    // Stop microphone hardware
    if (microphoneStream) {
      microphoneStream.getTracks().forEach((track) => {
        track.stop();
      });

      microphoneStream = null;
    }
  };

  // ===================================================
  // RECORDER ERROR
  // ===================================================

  mediaRecorder.onerror = (event) => {
    console.error("MediaRecorder Error:", event.error);
  };

  // ===================================================
  // START
  // ===================================================

  mediaRecorder.start(1000);

  console.log("🔴 SOS recording started.");
}

// =====================================================
// STOP RECORDING
// =====================================================

function stopSOSRecording() {
  if (!mediaRecorder) {
    throw new Error("No active recording.");
  }

  if (mediaRecorder.state === "recording") {
    mediaRecorder.stop();

    console.log("⏹️ SOS recording stopped.");
  } else {
    console.warn("Recorder state:", mediaRecorder.state);
  }
}

// =====================================================
// SUBMIT SOS
// =====================================================

async function submitGuardianSOS() {
  if (!audioBlob) {
    alert("Please record your emergency first.");

    return;
  }

  updateSOSStatus("📍 Getting your location...");

  guardianSubmitSOSBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;

      const longitude = position.coords.longitude;

      console.log("📍 Guardian Location:", latitude, longitude);

      updateSOSStatus("📡 Sending SOS to ResQGrid...");

      const formData = new FormData();

      // =================================================
      // AUDIO
      // =================================================

      let extension = "webm";

      if (audioBlob.type.includes("ogg")) {
        extension = "ogg";
      }

      if (audioBlob.type.includes("mp4")) {
        extension = "mp4";
      }

      formData.append("audio", audioBlob, `sos-recording.${extension}`);

      // =================================================
      // LOCATION
      // =================================================

      formData.append("latitude", latitude);

      formData.append("longitude", longitude);

      try {
        const response = await fetch(`${API}/api/sos/analyze`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const result = await response.json();

        console.log("🚨 RESQGRID SOS RESULT:", result);

        if (!response.ok) {
          throw new Error(result.message || "SOS submission failed.");
        }

        const analysis = result.analysis || {};

        const priority =
          analysis.priority || result.data?.priority || "PROCESSING";

        updateSOSStatus(`🚨 SOS SENT — ${priority}`);

        console.log("🚨 SOS ID:", result.data?.sosId);

        console.log("Emergency Type:", analysis.emergencyType);

        console.log("Priority:", analysis.priority);

        console.log("Priority Score:", analysis.priorityScore);

        console.log("Transcript:", analysis.transcript);

        // Reset
        guardianSOSBtn.disabled = false;

        guardianStopSOSBtn.disabled = true;

        guardianSubmitSOSBtn.disabled = true;

        audioBlob = null;
        audioChunks = [];
      } catch (error) {
        console.error("❌ SOS submission failed:", error);

        updateSOSStatus("❌ Failed to send SOS.");

        guardianSubmitSOSBtn.disabled = false;
      }
    },

    (error) => {
      console.error("❌ Location error:", error);

      updateSOSStatus("❌ Location permission is required.");

      guardianSubmitSOSBtn.disabled = false;

      alert("Please allow location access to send an SOS.");
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(() => {
  if (document.visibilityState === "visible") {
    loadApplications();
  }
}, 20000);

// =====================================================
// END
// =====================================================

console.log("🛡️ ResQGrid Guardian JS Loaded");
