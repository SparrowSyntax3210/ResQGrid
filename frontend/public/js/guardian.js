const caseContainer = document.getElementById("caseContainer");
const Report = document.getElementById("Report");
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

gsap.fromTo(
    "#profileName",
    {
        opacity: 0,
        x: 20
    },
    {
        opacity: 1,
        x: 0,
        duration: .6,
        ease: "power3.out"
    }
);
  } catch (error) {
    console.error("User Error:", error);
  }
}

// ===============================
// LOAD APPLICATIONS
// ===============================

// ========================================
// Dashboard Dynamic Animations
// ========================================

function animateCaseCards() {

    gsap.from(".case-card",{

        opacity:0,

        y:35,

        duration:.55,

        stagger:.08,

        ease:"power3.out"

    });

}

function animateCreateButton(){

    gsap.from("#createCaseBtn",{

        opacity:0,

        scale:.92,

        duration:.45,

        delay:.15,

        ease:"back.out(2)"

    });

}

function animateCaseRemoval(card){

    return gsap.to(card,{

        opacity:0,

        x:80,

        duration:.4,

        ease:"power2.in"

    });

}

function pulseStat(card){

    gsap.fromTo(card,

        {

            scale:1

        },

        {

            scale:1.06,

            duration:.18,

            yoyo:true,

            repeat:1

        }

    );

}


async function loadApplications() {
  try {
    const res = await fetch(`${API}/guardian/application`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed loading applications");
    }

    const applications = await res.json();

    console.log("Applications:", applications);

    // Build HTML first
    let html = `
      <div class="create-case-card">
        <div class="create-left">
          <h2>Create a New Missing Person Case</h2>
          <p>
            Register a new missing person report and immediately notify nearby
            volunteers.
          </p>
        </div>

        <button id="createCaseBtn">
          <i class="fa-solid fa-plus"></i>
          Create New Case
        </button>
      </div>
    `;

    if (applications.length === 0) {
      html += `
        <div class="case-card">
          <h3>No Active Cases</h3>
          <p style="margin-top:10px;color:var(--muted);">
            You don't have any active missing person cases.
          </p>
        </div>
      `;
    } else {
      applications.forEach((app) => {
        html += `
          <div class="case-card">

            <div class="case-top">
              <div class="case-user">
                <img
                  src="${
                    app.Photo
                      ? `http://localhost:5000/uploads/${app.Photo}`
                      : "./images/default-user.png"
                  }"
                  alt="${app.Name}"
                >

                <div>
                  <h3>${app.Name}</h3>
                  <p>Age ${app.Age} • ${app.status}</p>
                </div>
              </div>
            </div>

            <div class="case-info">

              <div class="info-box">
                <h4>Last Seen</h4>
                <p>${app.LastSeen}</p>
              </div>

              <div class="info-box">
                <h4>Missing Since</h4>
                <p>${new Date(app.dateTime).toLocaleString()}</p>
              </div>

              <div class="info-box">
                <h4>Priority</h4>
                <p>
                  ${app.priorityLevel || "Pending"}
                  <br>
                  Score: ${app.priorityScore || 0}/100
                </p>
              </div>

            </div>

            <div class="priority-reason">
              <h4>AI Analysis</h4>
              <p>${app.priorityReason || "Analysing priority..."}</p>
            </div>

            <div class="case-buttons">

              <button
                class="track-btn"
                data-id="${app._id}"
                data-location="${encodeURIComponent(app.LastSeen)}">
                Track Case
              </button>

              <button
                class="chat-btn"
                data-id="${app._id}">
                💬 Chat
              </button>

              <button
                class="report-btn"
                data-id="${app._id}">
                Reports
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
    }

    // Render once
    caseContainer.innerHTML = html;
    animateCreateButton();
animateCaseCards();

    // Attach Create button AFTER rendering
    document.getElementById("createCaseBtn").onclick = () => {
      console.log("Create button clicked");
      window.location.href = "./case-selection.html";
    };

    // Attach other handlers
    attachHandlers();

  } catch (error) {
    console.error("Application Error:", error);
  }
}

// ===============================
// BUTTON HANDLERS
// ===============================

document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => {
        const id = btn.dataset.id;
        window.location.href = `/chat-guardian.html?id=${id}`;
    };
});


function attachHandlers() {
  // TRACK

  document.querySelectorAll(".track-btn").forEach((btn) => {

  btn.addEventListener("click", () => {

    const caseId = btn.dataset.id;
    const location = btn.dataset.location;

    window.location.href =
      `/case-tracking-guardian.html?id=${caseId}&location=${location}`;

  });

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
  
 document.querySelectorAll(".report-btn").forEach(btn=>{

btn.onclick=()=>{

window.location.href=
`/sighting-show.html?caseId=${btn.dataset.id}`;

};

});
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

async function checkAuth() {
    try {
        const res = await fetch("/auth/status", {
            credentials: "include",
        });

        const data = await res.json();

        if (!data.loggedIn) {
            return window.location.replace("/login.html");
        }

        if (data.user.role.toLowerCase() !== "guardian") {
            return window.location.replace(
                `/${data.user.role.toLowerCase()}.html`
            );
        }

    } catch (err) {
        window.location.replace("/login.html");
    }
}


// ===============================
// START
// ===============================

loadUser();

loadApplications();


checkAuth();

// ======================================================
// RESQGRID DASHBOARD ANIMATIONS
// ======================================================

gsap.registerPlugin(ScrollTrigger);

const DashboardAnimation = (() => {

    // -----------------------------
    // Main Page Timeline
    // -----------------------------

    function intro() {

        const tl = gsap.timeline({

            defaults: {
                ease: "power4.out"
            }

        });

        tl.from(".sidebar", {

            x: -70,
            opacity: 0,
            duration: .8

        });

        tl.from(".logo", {

            y: -20,
            opacity: 0,
            duration: .4

        }, "-=.45");

        tl.from(".menu li", {

            x: -25,
            opacity: 0,
            stagger: .05,
            duration: .35

        }, "-=.25");

        tl.from(".support-card", {

            opacity: 0,
            y: 25,
            duration: .5

        }, "-=.25");

        tl.from("header", {

            y: -35,
            opacity: 0,
            duration: .6

        }, "-=.5");

        tl.from(".stat-card", {

            opacity: 0,
            y: 40,
            scale: .96,
            stagger: .08,
            duration: .45

        }, "-=.25");

        tl.from(".panel", {

            opacity: 0,
            y: 45,
            stagger: .12,
            duration: .55

        }, "-=.2");

    }

    // -----------------------------
    // Hover Cards
    // -----------------------------

    function cardHover() {

        document.querySelectorAll(".stat-card,.panel").forEach(card => {

            card.addEventListener("mouseenter", () => {

                gsap.to(card, {

                    y: -8,
                    scale: 1.015,
                    duration: .25,
                    ease: "power2.out"

                });

            });

            card.addEventListener("mouseleave", () => {

                gsap.to(card, {

                    y: 0,
                    scale: 1,
                    duration: .25,
                    ease: "power2.out"

                });

            });

        });

    }

    // -----------------------------
    // Sidebar Hover
    // -----------------------------

    function sidebarHover() {

        document.querySelectorAll(".menu li").forEach(item => {

            item.addEventListener("mouseenter", () => {

                gsap.to(item, {

                    x: 8,
                    duration: .2

                });

            });

            item.addEventListener("mouseleave", () => {

                gsap.to(item, {

                    x: 0,
                    duration: .2

                });

            });

        });

    }

    // -----------------------------
    // Search
    // -----------------------------

    function searchAnimation() {

        const search = document.querySelector(".search");

        if (!search) return;

        search.addEventListener("focusin", () => {

            gsap.to(search, {

                scale: 1.015,
                duration: .25

            });

        });

        search.addEventListener("focusout", () => {

            gsap.to(search, {

                scale: 1,
                duration: .25

            });

        });

    }

    // -----------------------------
    // Notification Bell
    // -----------------------------

    function notificationBell() {

        const bell = document.querySelector(".notify");

        if (!bell) return;

        setInterval(() => {

            gsap.timeline()

                .to(bell, {

                    rotate: -12,
                    duration: .08

                })

                .to(bell, {

                    rotate: 12,
                    duration: .08,
                    repeat: 5,
                    yoyo: true

                })

                .to(bell, {

                    rotate: 0,
                    duration: .08

                });

        }, 12000);

    }

    // -----------------------------
    // Map Pins
    // -----------------------------

    function mapPins() {

        gsap.utils.toArray(".pin").forEach((pin, index) => {

            gsap.timeline({

                repeat: -1,
                delay: index * .5

            })

                .to(pin, {

                    scale: 1.25,
                    duration: .45,
                    ease: "power2.out"

                })

                .to(pin, {

                    scale: 1,
                    duration: .45

                });

        });

    }

    // -----------------------------
    // Active Menu Glow
    // -----------------------------

    function activeMenu() {

        gsap.to(".menu .active", {

            boxShadow: "0 0 18px rgba(110,86,239,.25)",

            duration: 2,

            repeat: -1,

            yoyo: true,

            ease: "sine.inOut"

        });

    }

    // -----------------------------
    // Button Press
    // -----------------------------

    function buttonPress() {

        document.querySelectorAll("button").forEach(btn => {

            btn.addEventListener("mousedown", () => {

                gsap.to(btn, {

                    scale: .97,
                    duration: .08

                });

            });

            btn.addEventListener("mouseup", () => {

                gsap.to(btn, {

                    scale: 1,
                    duration: .12

                });

            });

            btn.addEventListener("mouseleave", () => {

                gsap.to(btn, {

                    scale: 1,
                    duration: .12

                });

            });

        });

    }

    // -----------------------------
    // Profile Hover
    // -----------------------------

    function profileHover() {

        const profile = document.querySelector(".profile");

        if (!profile) return;

        profile.addEventListener("mouseenter", () => {

            gsap.to(profile, {

                y: -3,
                duration: .2

            });

        });

        profile.addEventListener("mouseleave", () => {

            gsap.to(profile, {

                y: 0,
                duration: .2

            });

        });

    }

    return {

        init() {

            intro();

            cardHover();

            sidebarHover();

            searchAnimation();

            notificationBell();

            mapPins();

            activeMenu();

            profileHover();

            buttonPress();

        }

    };

})();

window.addEventListener("load", () => {

    DashboardAnimation.init();

});