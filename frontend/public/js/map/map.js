const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");

const API = "http://localhost:5000";

const socket = io(API, {
    withCredentials: true
});

let application = null;


let destination = "";

async function loadApplication() {

    try {

        const response = await fetch(`/guardian/application/${caseId}`, {
            credentials: "include"
        });

        application = await response.json();

        console.log(application);

        initializeMap();

        initializeChat(socket, caseId);

    } catch (err) {

        console.log(err);

    }

}


switch(application.caseType){

case "blood-report":

destination = application.Hospital;
    break;

case "elderly-assistance":

    

    break;

case "community-sos":

    

    break;

}

function initializeMap() {

    switch (application.caseType) {

        case "missing-person":

            loadMissingPersonMap({
                application,
                socket,
                caseId
            });

            

            break;

        case "blood-report":

            loadRouteMap({
                application,
                socket,
                caseId
            });

            break;

        case "elderly-assistance":

            loadRouteMap({
                application,
                socket,
                caseId
            });

            destination = application.Address;

            break;

        case "community-sos":

            loadRouteMap({
                application,
                socket,
                caseId
            });

            destination = application.CurrentLocation;

            break;

        case "women-safety":

            loadEscortMap({
                application,
                socket,
                caseId
            });

            break;

        case "civic-hazard":

            loadHazardMap({
                application,
                socket,
                caseId
            });

            break;

        default:

            console.log("Unknown Case");

    }

}

loadApplication();