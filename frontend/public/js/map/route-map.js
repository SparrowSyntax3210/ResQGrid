function loadRouteMap({ application, socket, caseId }) {
  const destination = application.LastSeen;

  const map = L.map("map").setView([20.5937, 78.9629], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  socket.on("connect", () => {
    socket.emit("join_case", caseId);
  });

  showRoute();

  async function showRoute() {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const volunteerLat = position.coords.latitude;
        const volunteerLng = position.coords.longitude;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`,
        );

        const data = await response.json();

        if (!data.length) {
          alert("Destination not found");

          return;
        }

        const guardianLat = Number(data[0].lat);
        const guardianLng = Number(data[0].lon);

        map.setView([guardianLat, guardianLng], 14);

        L.marker([guardianLat, guardianLng])
          .addTo(map)
          .bindPopup("Destination")
          .openPopup();

        L.marker([volunteerLat, volunteerLng]).addTo(map).bindPopup("You");

        L.Routing.control({
          waypoints: [
            L.latLng(volunteerLat, volunteerLng),

            L.latLng(guardianLat, guardianLng),
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
