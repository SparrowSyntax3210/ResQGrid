function loadMissingPersonMap({ application, socket, caseId }) {
  const lastSeenLocation = application.LastSeen;

  const gridRectangles = {};

  let activeMission = false;
  let activeGrid = null;

  // ======================================
  // CREATE MAP
  // ======================================

  const map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  // ======================================
  // SOCKET CONNECTION
  // ======================================

  socket.on("connect", () => {
    console.log("Socket Connected:", socket.id);

    console.log("Joining Case:", caseId);

    socket.emit("join_case", caseId);
  });

  // ======================================
  // HEARTBEAT
  // ======================================

  setInterval(() => {
    socket.emit("heartbeat", {
      caseId,
    });
  }, 20000);

  // ======================================
  // RECEIVE LIVE GRID DATA
  // ======================================

  socket.on("case_state", (state) => {
    if (!state.grids) return;

    for (const grid in state.grids) {
      const data = state.grids[grid];

      const rectangle = gridRectangles[grid];

      if (!rectangle) continue;

      // Don't overwrite volunteer's active grid

      if (grid === activeGrid) continue;

      let color = "#22c55e";
      let level = "Low";

      if (data.priority >= 80) {
        color = "#ef4444";
        level = "Critical";
      } else if (data.priority >= 50) {
        color = "#f59e0b";
        level = "Medium";
      }

      rectangle.setStyle({
        color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2,
      });

      rectangle.setTooltipContent(`
                <div>
                    <b>${grid}</b><br>
                    Priority: ${data.priority}/100<br>
                    Status: ${level}<br>
                    Searched: ${data.searched}%<br>
                    Volunteers: ${data.count}
                </div>
            `);
    }
  });

  // ======================================
  // PART 2 STARTS HERE
  // ======================================

  // ======================================
  // LOAD LAST SEEN LOCATION
  // ======================================

  async function showLocation() {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastSeenLocation)}`,
      );

      const data = await response.json();

      if (!data.length) {
        alert("Location not found");

        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      console.log("Coordinates:", lat, lon);

      map.setView([lat, lon], 16);

      L.circle([lat, lon], {
        radius: 1000,
      }).addTo(map);

      createGrid(lat, lon);
    } catch (err) {
      console.log("Map Error:", err);
    }
  }

  // ======================================
  // CREATE SEARCH GRID
  // ======================================

  function createGrid(lat, lon) {
    const latStep = 0.003;
    const lonStep = 0.003;

    const rows = ["A", "B", "C"];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const southWest = [lat + (i - 1) * latStep, lon + (j - 1) * lonStep];

        const northEast = [lat + i * latStep, lon + j * lonStep];

        const gridName = `${rows[i]}${j + 1}`;

        const rectangle = L.rectangle([southWest, northEast], {
          color: "#22c55e",
          fillColor: "#22c55e",
          fillOpacity: 0.25,
          weight: 2,
        }).addTo(map);

        gridRectangles[gridName] = rectangle;

        rectangle.bindTooltip(
          `
                    <div>
                        <b>${gridName}</b><br>
                        Priority: 0/100<br>
                        Searched: 0%<br>
                        Volunteers: 0
                    </div>
                    `,
          {
            permanent: true,
            direction: "center",
            className: "grid-label",
          },
        );

        // ======================================
        // PART 3 CONTINUES HERE
        // ======================================

        // ======================================
        // CLAIM GRID
        // ======================================

        rectangle.on("click", () => {
          if (activeMission) return;

          activeMission = true;
          activeGrid = gridName;

          console.log("Claimed Grid:", gridName);

          socket.emit("claim_grid", {
            caseId,
            gridId: gridName,
          });

          // Hide all other grids

          Object.entries(gridRectangles).forEach(([name, rect]) => {
            if (name !== gridName) {
              rect.setStyle({
                opacity: 0,
                fillOpacity: 0,
              });

              rect.unbindTooltip();
            }
          });

          // Highlight selected grid

          rectangle.setStyle({
            color: "#ff4d4f",
            fillColor: "#ff4d4f",
            fillOpacity: 0.18,
            weight: 3,
          });

          rectangle.bringToFront();

          rectangle.unbindTooltip();

          rectangle.bindTooltip(
            `
                        <div style="text-align:center">

                            <b>MISSION ACTIVE</b><br>

                            Grid: ${gridName}<br>

                            Coverage: 0%

                        </div>
                        `,

            {
              permanent: true,
              direction: "center",
              className: "grid-label",
            },
          );

          // Zoom to selected grid

          map.flyToBounds(rectangle.getBounds(), {
            padding: [20, 20],
            maxZoom: 20,
            duration: 2,
          });
        });

        // ======================================
        // MARK GRID SEARCHED
        // ======================================

        rectangle.on("contextmenu", () => {
          socket.emit("search_grid", {
            caseId,
            gridId: gridName,
          });
        });
      }
    }
  }

  // ======================================
  // START MAP
  // ======================================

  showLocation();
}
