function loadRouteMap({ application, socket, caseId }) {
  console.log("Route Map Loading");

  const destinationLat = Number(application.latitude);
  const destinationLng = Number(application.longitude);

  if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) {
    console.error("Invalid destination coordinates");
    return;
  }

  const map = L.map("map").setView([destinationLat, destinationLng], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 500);

  // Destination marker

  L.marker([destinationLat, destinationLng])
    .addTo(map)
    .bindPopup("Destination")
    .openPopup();

  let volunteerMarker = null;

  let routingControl = null;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const volunteerLat = position.coords.latitude;

      const volunteerLng = position.coords.longitude;

      // Volunteer marker

      volunteerMarker = L.marker([volunteerLat, volunteerLng])
        .addTo(map)
        .bindPopup("Volunteer")
        .openPopup();

      // CREATE ROUTE

      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(volunteerLat, volunteerLng),

          L.latLng(destinationLat, destinationLng),
        ],

        routeWhileDragging: false,

        addWaypoints: false,

        draggableWaypoints: false,

        fitSelectedRoutes: true,

        showAlternatives: false,

        createMarker: function () {
          return null;
        },
      }).addTo(map);
    },

    (error) => {
      console.log("Location Error", error);
    },

    {
      enableHighAccuracy: true,
    },
  );

  // LIVE VOLUNTEER MOVEMENT

  socket.on("volunteer_location", (data) => {
    if (data.caseId !== caseId) return;

    const newPosition = [data.lat, data.lng];

    if (volunteerMarker) {
      volunteerMarker.setLatLng(newPosition);
    }

    // UPDATE ROUTE

    if (routingControl) {
      routingControl.setWaypoints([
        L.latLng(data.lat, data.lng),

        L.latLng(destinationLat, destinationLng),
      ]);
    }
  });
}
