
async function loadUser() {
  try {
    const res = await fetch(`${API}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const user = await res.json();

    console.log("User:", user);

    profileName.textContent = user.name;

    profileRole.textContent = "Volunteer";
  } catch (error) {
    console.error("User Error:", error);
  }
}

const container = document.getElementById("caseContainer");

      // Socket Connection
      const socket = io("http://localhost:5000");

      socket.on("connect", () => {
        console.log("Connected:", socket.id);

        socket.emit("join_volunteers");
      });

      // Function to display a case
      function addCase(app) {
  container.innerHTML += `
    <div class="case-card" data-id="${app._id}">

      <div class="case-row">

        <div class="case-name">
        <img
  src="${
    app.Photo
      ? `http://localhost:5000/uploads/${app.Photo}`
      : "./images/default-user.png"
  }"
  alt="https://ui-avatars.com/api/?name=${encodeURIComponent(app.Name)}&background=7C3AED&color=fff&size=128"
>

        <div class="case-col">
          <small>Status</small>
          <strong>${app.status}</strong>
        </div>

        <div class="case-col">
          <small>Age</small>
          <strong>${app.Age}</strong>
        </div>

        <div class="case-col">
          <small>Last Seen</small>
          <strong>${app.LastSeen}</strong>
        </div>

        <div class="case-col">
          <small>Priority</small>
          <strong class="priority-high">${app.priorityLevel}</strong>
        </div>

      </div>

    </div>
  `;
}
document.addEventListener("click",(e)=>{

    const card = e.target.closest(".case-card");

    if(!card) return;

    const id = card.dataset.id;

    window.location.href =
    `/case-tracking-volunteer.html?id=${id}`;

}); 
      
    // Load existing active cases
      document.addEventListener("DOMContentLoaded", async () => {
          try {
            const res = await fetch(
  "http://localhost:5000/volunteer/application",
  {
    credentials: "include",
  }
);
            const data = await res.json();

            if (!res.ok) {
              console.error(data);

              alert(data.message || "Unable to load cases");

              return;
            }

            if (!Array.isArray(data)) {
              console.error(data);

              return;
            }

            container.innerHTML = "";

            data.forEach(addCase);
          } catch (err) {
            console.error(err);
          }
        });

      // Receive new cases in real time
      socket.on("new_case", (app) => {
        console.log("New Case Received:", app);

        addCase(app);
      });

      document.addEventListener("click", (e) => {

  if (e.target.closest(".accept-btn")) {

    const btn = e.target.closest(".accept-btn");

    const caseId = btn.dataset.id;
    const location = btn.dataset.location;

    window.location.href =
      `/map.html?id=${caseId}&location=${encodeURIComponent(location)}`;
  }

  if (e.target.closest(".chat-btn")) {

    const btn = e.target.closest(".chat-btn");

    const caseId = btn.dataset.id;

    window.location.href =
      `/chat-volunteer.html?id=${caseId}`;
  }

});

async function checkAuth() {
    try {
        const res = await fetch("/auth/status", {
            credentials: "include",
        });

        const data = await res.json();

        if (!data.loggedIn) {
            return window.location.replace("/login.html");
        }

        if (data.user.role.toLowerCase() !== "volunteer") {
            return window.location.replace(
                `/${data.user.role.toLowerCase()}.html`
            );
        }

    } catch (err) {
        window.location.replace("/login.html");
    }
}

checkAuth();