function stopLocationTracking(){

if(watchId !== null){

navigator.geolocation.clearWatch(
watchId
);

watchId = null;

console.log(
"GPS stopped"
);

}

}

function loadMissingPersonMap({
  application,
  socket,
  caseId,
  startGridTracking,
}) {


  if(navigator.geolocation){

    navigator.geolocation.clearWatch(
      watchId
    );

  }


  socket.off("volunteer_location");


  console.log(
    "Missing Person Grid Map Loading"
  );



  const lastSeenLocation = application.LastSeen;

  const gridRectangles = {};

  let activeMission = false;

  let activeGrid = null;

  // =====================================
  // MAP CREATE
  // =====================================

  const map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",

    maxZoom: 20,

    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 500);

  

  // =====================================
  // RECEIVE GRID STATE
  // =====================================

  socket.on("case_state", (state) => {
    if (!state.grids) return;

    Object.keys(state.grids).forEach((gridId) => {
      const rectangle = gridRectangles[gridId];

      if (!rectangle) return;

      const data = state.grids[gridId];

      let color = "#22c55e";

      if (data.priority >= 80) {
        color = "#ef4444";
      } else if (data.priority >= 50) {
        color = "#f59e0b";
      }

      if (gridId === activeGrid) {
        color = "#7c3aed";
      }

      rectangle.setStyle({
        color,

        fillColor: color,

        fillOpacity: 0.35,

        weight: 3,
      });

      rectangle.setTooltipContent(
        `
<b>${gridId}</b>

<br>

Priority:
${data.priority}/100

<br>

Volunteers:
${data.count}

<br>

Searched:
${data.searched}%

`,
      );
    });
  });

  // =====================================
  // LOAD LOCATION
  // =====================================

  async function loadLocation() {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastSeenLocation)}`,
      );

      const data = await response.json();

      if (!data.length) {
        console.log("Location not found");

        return;
      }

      const lat = Number(data[0].lat);

      const lng = Number(data[0].lon);

      console.log("Last Seen:", lat, lng);

      map.setView([lat, lng], 16);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup("Last Seen Location")
        .openPopup();

      L.circle([lat, lng], {
        radius: 1000,

        color: "#ef4444",
      }).addTo(map);

      createGrid(lat, lng);
    } catch (error) {
      console.error("Map Error:", error);
    }
  }

  // =====================================
  // CREATE SEARCH GRID
  // =====================================

  function createGrid(lat, lng) {
    const step = 0.003;

    const rows = ["A", "B", "C"];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const southWest = [lat + (i - 1) * step, lng + (j - 1) * step];

        const northEast = [lat + i * step, lng + j * step];

        const gridId = `${rows[i]}${j + 1}`;

        const rectangle = L.rectangle(
          [southWest, northEast],

          {
            color: "#22c55e",

            fillColor: "#22c55e",

            fillOpacity: 0.25,

            weight: 2,
          },
        ).addTo(map);

        gridRectangles[gridId] = rectangle;

        rectangle.bindTooltip(
          `

<b>${gridId}</b>

<br>

Volunteers:0

<br>

Priority:0

`,

          {
            permanent: true,

            direction: "center",

            className: "grid-label",
          },
        );

        // =================================
        // CLAIM GRID
        // =================================

        rectangle.on("click", () => {
          if (activeMission) return;

          activeMission = true;

          activeGrid = gridId;

          console.log("Claimed Grid:", gridId);

          // =============================
          // ONLY GRID IS SENT HERE
          // =============================

          startGridTracking(gridId);

          socket.emit("claim_grid", {
            caseId,

            gridId,
          });

          Object.entries(gridRectangles).forEach(([id, rect]) => {
            if (id !== gridId) {
              rect.setStyle({
                opacity: 0,

                fillOpacity: 0,
              });

              rect.unbindTooltip();
            }
          });

          rectangle.setStyle({
            color: "#7c3aed",

            fillColor: "#7c3aed",

            fillOpacity: 0.4,

            weight: 4,
          });

          rectangle.bindTooltip(
            `

<b>ACTIVE MISSION</b>

<br>

Grid:
${gridId}

`,

            {
              permanent: true,

              direction: "center",

              className: "grid-label",
            },
          );

          map.flyToBounds(
            rectangle.getBounds(),

            {
              padding: [30, 30],

              maxZoom: 19,
            },
          );
        });

        // =================================
        // COMPLETE SEARCH
        // =================================

        rectangle.on("contextmenu", () => {
          console.log("Completed:", gridId);

          socket.emit("search_grid", {
            caseId,

            gridId,
          });
        });
      }
    }
  }

  // =====================================
  // START
  // =====================================

  loadLocation();
}
