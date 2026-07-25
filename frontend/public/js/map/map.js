const params = new URLSearchParams(window.location.search);

const caseId = params.get("id");

const caseType = params.get("caseType");

const API = "http://localhost:5000";

const socket = io(API, {
  withCredentials: true,
});

let application = null;

let destination = "";

// ================= LOAD APPLICATION =================

async function loadApplication() {
  try {
    if (!caseId) {
      console.error("No case id found");

      return;
    }

    const response = await fetch(`${API}/volunteer/application/${caseId}`, {
      credentials: "include",
    });

    const data = await response.json();

    console.log("Application:", data);

    // if backend returns {success:true, application:{}}

    application = data.application || data;

    console.log("Case Type From URL:", caseType);

    console.log("Case Type From DB:", application.caseType);

    initializeMap();

    initializeChat(socket, caseId);
  } catch (err) {
    console.error("Load Application Error:", err);
  }
}

// ================= INITIALIZE MAP =================

function initializeMap() {
  switch (caseType) {
    case "missing-person":
      loadMissingPersonMap({
        application,

        socket,

        caseId,
      });

      break;

    case "blood-report":
      destination = application.Hospital;

      loadRouteMap({
        application,

        socket,

        caseId,
      });

      break;

    case "elderly-assistance":
      destination = application.Address;

      loadRouteMap({
        application,

        socket,

        caseId,
      });

      break;

    case "community-sos":
      destination = application.CurrentLocation;

      loadRouteMap({
        application,

        socket,

        caseId,
      });

      break;

    case "women-safety":
      loadEscortMap({
        application,

        socket,

        caseId,
      });

      break;

    case "civic-hazard":
      loadHazardMap({
        application,

        socket,

        caseId,
      });

      break;

    default:
      console.log("Unknown Case Type:", caseType);
  }
}

loadApplication();

// ================= CHAT TOGGLE =================

document.addEventListener("DOMContentLoaded",()=>{

const chatToggle = document.getElementById("chatToggle");

const chatOverlay = document.getElementById("chatOverlay");

const closeChat = document.getElementById("closeChat");

const chatFrame = document.getElementById("chatFrame");

const chatBadge = document.getElementById("chatBadge");


let unreadMessages = 0;

chatToggle.addEventListener("click" , ()=> {
    window.location.href="/chat-volunteer.html?id=${caseId}"
})



if(!chatToggle || !chatOverlay){

    console.error("Chat elements missing");

    return;

}




// OPEN / CLOSE CHAT

chatToggle.addEventListener("click",()=>{


    if(chatOverlay.classList.contains("active")){


        chatOverlay.classList.remove("active");


    }

    else{


        if(!chatFrame.src){

            chatFrame.src =
            `/chat-volunteer.html?id=${caseId}`;

        }


        chatOverlay.classList.add("active");


        unreadMessages = 0;

        updateBadge();


    }


});





// CLOSE BUTTON

if(closeChat){

closeChat.addEventListener("click",()=>{


    chatOverlay.classList.remove("active");


});

}





function updateBadge(){


    chatBadge.innerText =
    unreadMessages;



    if(unreadMessages === 0){

        chatBadge.style.display="none";

    }
    else{

        chatBadge.style.display="flex";

    }


}



updateBadge();


window.addEventListener("message",(event)=>{


    if(event.data?.type==="new_message"){


        if(!chatOverlay.classList.contains("active")){


            unreadMessages++;


            updateBadge();


        }


    }


});


});