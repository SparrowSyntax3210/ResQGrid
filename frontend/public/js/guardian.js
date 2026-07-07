const caseContainer = document.getElementById("caseContainer");

const profileName = document.querySelector("#profileName h4");
const profileRole = document.querySelector("#profileName small");

const API = "http://localhost:5000";

let currentCase = null;
let currentStatusBox = null;

// ===============================
// SOCKET
// ===============================

const socket = io(API, {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Socket Connected:", socket.id);
});

// ===============================
// LOAD USER
// ===============================

async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const user = await res.json();

    console.log("User:", user);

    profileName.textContent = user.name;

    profileRole.textContent = "Guardian";
  } catch (error) {
    console.error("User Error:", error);
  }
}

// ===============================
// LOAD APPLICATIONS
// ===============================

async function loadApplications() {
  try {
    const res = await fetch(
      `${API}/guardian/application`,

      {
        credentials: "include",
      },
    );

    if (!res.ok) {
      throw new Error("Failed loading applications");
    }

    const applications = await res.json();

    console.log("Applications:", applications);

    caseContainer.innerHTML = "";

    if (applications.length === 0) {
      caseContainer.innerHTML = `

<div class="case-card">

<h3>
No Active Cases
</h3>


<button id="createCaseBtn">
Create New Case
</button>


</div>

`;

      document.getElementById("createCaseBtn").onclick = () => {
        window.location.href = "/application.html";
      };

      return;
    }

    applications.forEach((app) => {
      caseContainer.innerHTML += `


<div class="case-card">


<div class="case-top">


<div class="case-user">


<img src="${app.Photo || "https://via.placeholder.com/70"}">


<div>

<h3>
${app.Name}
</h3>


<p>
Age ${app.Age}
•
${app.status}
</p>


</div>


</div>


</div>





<div class="case-info">



<div class="info-box">

<h4>
Last Seen
</h4>

<p>
${app.LastSeen}
</p>

</div>




<div class="info-box">

<h4>
Missing Since
</h4>


<p>
${new Date(app.dateTime).toLocaleString()}
</p>


</div>





<div class="info-box">

<h4>
Priority
</h4>


<p>

${app.priorityLevel || "Pending"}

<br>

Score:
${app.priorityScore || 0}/100

</p>


</div>



</div>





<div class="priority-reason">


<h4>
AI Analysis
</h4>


<p>

${app.priorityReason || "Analysing priority..."}

</p>


</div>






<div class="case-buttons">



<button 
class="track-btn"

data-id="${app._id}"

data-location="${encodeURIComponent(app.LastSeen)}">

Track Case

</button>





<button

class="close-btn"

data-id="${app._id}">

Close

</button>





<div 
id="status-${app._id}"
class="status-box">

</div>



</div>



</div>



`;
    });

    attachHandlers();
  } catch (error) {
    console.error("Application Error:", error);
  }
}

// ===============================
// BUTTON HANDLERS
// ===============================

function attachHandlers() {
  // TRACK

  document.querySelectorAll(".track-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;

      const location = decodeURIComponent(btn.dataset.location);

      console.log("Opening map:", id, location);

      window.location.href = `/map.html?id=${id}&location=${encodeURIComponent(location)}`;
    };
  });

  // CLOSE

  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const confirmClose = confirm("Are you sure you want to close this case?");

      if (!confirmClose) return;

      try {
        console.log("Closing:", id);

        const res = await fetch(
          `${API}/guardian/application/close/${id}`,

          {
            method: "PATCH",

            credentials: "include",
          },
        );

        const data = await res.json();

        console.log("Close Response:", data);

        if (!res.ok) {
          throw new Error(data.message || "Unable to close case");
        }

        alert(data.message);

        loadApplications();
      } catch (error) {
        console.error("Close Error:", error);

        alert(error.message);
      }
    };
  });

  // CREATE BUTTON

  const create = document.getElementById("createCaseBtn");

  if (create) {
    create.onclick = () => {
      window.location.href = "/application.html";
    };
  }
}

// ===============================
// SOCKET LIVE STATUS
// ===============================

socket.on(
  "case_state",

  (state) => {
    console.log("Live State:", state);

    if (!currentStatusBox) return;

    let html = `


<h3>
Live Status
</h3>


<p>
<b>Total Volunteers:</b>

${state.totalVolunteers}

</p>


`;

    for (const grid in state.grids) {
      const data = state.grids[grid];

      html += `


<div class="grid-status">


<b>
${grid}
</b>


<br>

Volunteers:
${data.count}


<br>

Priority:
${data.priority || 0}



</div>



`;
    }

    currentStatusBox.innerHTML = html;
  },
);

// ===============================
// START
// ===============================

loadUser();

loadApplications();
