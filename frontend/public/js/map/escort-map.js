function loadEscortMap({ application, socket, caseId }) {
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

  let volunteerMarker = null;
  let requesterMarker = null;
  let routeControl = null;

  initializeEscort();

  async function initializeEscort() {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const volunteerLat = position.coords.latitude;
      const volunteerLng = position.coords.longitude;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`,
      );

      const data = await response.json();

      if (!data.length) {
        alert("Location not found");

        return;
      }

      const requesterLat = Number(data[0].lat);
      const requesterLng = Number(data[0].lon);

      map.setView([requesterLat, requesterLng], 15);

      volunteerMarker = L.marker([volunteerLat, volunteerLng])
        .addTo(map)
        .bindPopup("You");

      requesterMarker = L.marker([requesterLat, requesterLng])
        .addTo(map)
        .bindPopup("Requester")
        .openPopup();

      routeControl = L.Routing.control({
        waypoints: [
          L.latLng(volunteerLat, volunteerLng),
          L.latLng(requesterLat, requesterLng),
        ],

        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);
    });
  }

  // ==========================
  // Future Live Tracking
  // ==========================

  socket.on("escort_location_update", ({ lat, lng }) => {
    if (!requesterMarker) return;

    requesterMarker.setLatLng([lat, lng]);
  });
}
