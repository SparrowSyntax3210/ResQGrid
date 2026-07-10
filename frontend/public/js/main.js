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

const JoinBtn = document.querySelector(".join-btn");

JoinBtn.addEventListener("click", () => {

    window.location.href = "http://localhost:5000/role-selection.html";
});

const GuardianHomeBtn = document.querySelector(".primary-btn");

GuardianHomeBtn.addEventListener("click", () => {

    window.location.href = "http://localhost:5000/register.html?role=Guardian";

});

const VolunteerHomeBtn = document.querySelector(".secondary-btn");

VolunteerHomeBtn.addEventListener("click", () => {

    window.location.href = "http://localhost:5000/register.html?role=Volunteer";
});

const GuardianBtn = document.querySelector("#GuardianBtn");
GuardianBtn.addEventListener("click", () => {
    window.location.href = "http://localhost:5000/register.html?role=Guardian";
});

const VolunteerBtn = document.querySelectorAll("#VolunteerBtn");

VolunteerBtn.forEach((btn) => {
    btn.addEventListener("click", () => {
        window.location.href = "http://localhost:5000/register.html?role=Volunteer";
    });
}); 