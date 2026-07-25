function loadHazardMap({ application, socket, caseId }) {
  const destination =
    application.HazardLocation ||
    application.LastSeen ||
    application.CurrentLocation;

  const map = L.map("map").setView([20.5937, 78.9629], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  socket.on("connect", () => {
    socket.emit("join_case", caseId);
  });

  showHazard();

  async function showHazard() {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const volunteerLat = position.coords.latitude;
        const volunteerLng = position.coords.longitude;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`,
        );

        const data = await response.json();

        if (!data.length) {
          alert("Hazard location not found.");

          return;
        }

        const hazardLat = Number(data[0].lat);
        const hazardLng = Number(data[0].lon);

        map.setView([hazardLat, hazardLng], 16);

        // Hazard Marker
        L.marker([hazardLat, hazardLng])
          .addTo(map)
          .bindPopup(
            `
                        <b>⚠️ Civic Hazard</b><br>
                        ${application.HazardType || "Hazard"}<br>
                        ${destination}
                        `,
          )
          .openPopup();

        // Danger Zone
        L.circle([hazardLat, hazardLng], {
          radius: 150,

          color: "#ff3b30",

          fillColor: "#ff3b30",

          fillOpacity: 0.25,

          weight: 2,
        }).addTo(map);

        // Volunteer Marker
        L.marker([volunteerLat, volunteerLng]).addTo(map).bindPopup("📍 You");

        // Route
        L.Routing.control({
          waypoints: [
            L.latLng(volunteerLat, volunteerLng),

            L.latLng(hazardLat, hazardLng),
          ],

          routeWhileDragging: false,

          addWaypoints: false,

          draggableWaypoints: false,

          fitSelectedRoutes: true,

          showAlternatives: false,
        }).addTo(map);
      });
    } catch (err) {
      console.log(err);
    }
  }
}
