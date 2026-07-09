//======================================================
// MAIN.JS
// Entry Point
//======================================================

gsap.registerPlugin(ScrollTrigger);

//--------------------------------------
// Lenis
//--------------------------------------

const lenis = new Lenis({

    duration: 1.1,

    smoothWheel: true

});

window.lenis = lenis;

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {

    lenis.raf(time * 1000);

});

gsap.ticker.lagSmoothing(0);

//--------------------------------------
// Start App
//--------------------------------------

window.addEventListener("load", () => {

    loaderInit();

});