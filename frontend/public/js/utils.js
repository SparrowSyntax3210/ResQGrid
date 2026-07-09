//======================================================
// UTILS.JS
// Performance & Utility Functions
//======================================================

//--------------------------------------
// Pause Animations on Hidden Tab
//--------------------------------------

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {

        gsap.globalTimeline.pause();

    } else {

        gsap.globalTimeline.resume();

    }

});

//--------------------------------------
// Recreate Particles on Resize
//--------------------------------------

window.addEventListener("resize", () => {

    const container = document.querySelector(".wind-particles");

    if (!container) return;

    container.innerHTML = "";

    createWindParticles();

});

//--------------------------------------
// Smooth Scroll to Top
//--------------------------------------

function scrollTopSmooth() {

    if (!window.lenis) return;

    lenis.scrollTo(0, {

        duration: 1.2

    });

}