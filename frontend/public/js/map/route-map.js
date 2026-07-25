function loadRouteMap({ application, socket, caseId, startLocationTracking }) {
  socket.off("volunteer_location");

  console.log("Route Map Loading");

  const destinationLat = Number(application.latitude);

  const destinationLng = Number(application.longitude);

  if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) {
    console.error("Invalid destination coordinates");

    return;
  }

  // =====================================
  // CREATE MAP
  // =====================================

  const map = L.map("map").setView([destinationLat, destinationLng], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    subdomains: "abcd",

    maxZoom: 20,

    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 500);

  // =====================================
  // DESTINATION
  // =====================================

  L.marker([destinationLat, destinationLng])
    .addTo(map)
    .bindPopup("Destination")
    .openPopup();

  let volunteerMarker = null;

  let routingControl = null;

  // =====================================
  // INITIAL VOLUNTEER LOCATION
  // =====================================

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const volunteerLat = position.coords.latitude;

      const volunteerLng = position.coords.longitude;

      volunteerMarker = L.marker([volunteerLat, volunteerLng])
        .addTo(map)
        .bindPopup("Volunteer")
        .openPopup();

      createRoute(
        volunteerLat,

        volunteerLng,
      );
    },

    (error) => {
      console.log("Initial Location Error:", error);
    },

    {
      enableHighAccuracy: true,
    },
  );

  // =====================================
  // CREATE ROUTE
  // =====================================

  function createRoute(lat, lng) {
    if (routingControl) {
      map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
      waypoints: [L.latLng(lat, lng), L.latLng(destinationLat, destinationLng)],

      routeWhileDragging: false,

      addWaypoints: false,

      draggableWaypoints: false,

      fitSelectedRoutes: true,

      showAlternatives: false,

      createMarker: function () {
        return null;
      },
    }).addTo(map);
  }

  // =====================================
  // RECEIVE LIVE VOLUNTEER LOCATION
  // =====================================

  socket.on("volunteer_location", (data) => {
    if (data.caseId !== caseId) return;

    const newPosition = [data.lat, data.lng];

    if (volunteerMarker) {
      volunteerMarker.setLatLng(newPosition);
    } else {
      volunteerMarker = L.marker(newPosition).addTo(map).bindPopup("Volunteer");
    }

    // update route

    if (routingControl) {
      routingControl.setWaypoints([
        L.latLng(data.lat, data.lng),

        L.latLng(destinationLat, destinationLng),
      ]);
    }
  });

  // =====================================
  // START GPS TRACKING
  // =====================================

  startLocationTracking();
}
