//======================================================
// HERO.JS
// Hero Animations & Parallax
//======================================================

//--------------------------------------
// INITIAL STATES
//--------------------------------------

function initHeroStates() {

    gsap.set(".logo", {
        y: 60,
        opacity: 0
    });

    gsap.set("nav a", {
        y: -40,
        opacity: 0
    });

    gsap.set(".join-btn", {
        y: -40,
        opacity: 0
    });

    gsap.set(".hero-content", {
        y: 40,
        opacity: 0,
        scale: 1.08
    });

    gsap.set(".pin", {
        y: 250,
        opacity: 0,
        rotation: -8,
        scale: .85
    });

    gsap.set(".pin-glow", {
        opacity: 0,
        scale: 0
    });

    gsap.set(".rings", {
        opacity: 0,
        scale: .8
    });

    gsap.set(".card-left", {
        x: -120,
        opacity: 0,
        rotation: -10
    });

    gsap.set(".card-right", {
        x: 120,
        opacity: 0,
        rotation: 10
    });

    gsap.set(".card-bottom", {
        y: 80,
        opacity: 0
    });

}

//--------------------------------------
// HERO INTRO
//--------------------------------------

function heroIntro() {

    const hero = gsap.timeline();

    hero

        .to(".logo", {
            y: 0,
            opacity: 1,
            duration: .6
        })

        .to("nav a", {
            y: 0,
            opacity: 1,
            stagger: .08,
            duration: .45
        }, "<")

        .to(".join-btn", {
            y: 0,
            opacity: 1
        }, "<")

        .to(".hero-content", {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: .9,
            ease: "power3.out"
        }, "-=.2")

        .to(".pin", {
            y: 0,
            opacity: 1,
            rotation: 0,
            scale: 1,
            duration: 1,
            ease: "back.out(1.5)"
        }, "-=.7")

        .to(".card-left", {
            x: 0,
            opacity: 1,
            rotation: 0,
            duration: .6
        }, "-=.8")

        .to(".card-right", {
            x: 0,
            opacity: 1,
            rotation: 0,
            duration: .6
        }, "<")

        .to(".card-bottom", {
            y: 0,
            opacity: 1,
            duration: .6
        }, "<")

        .to(".pin-glow", {
            opacity: 1,
            scale: 1,
            duration: .8
        }, "-=.8")

        .to(".rings", {
            opacity: 1,
            scale: 1,
            duration: .8
        }, "<");

}

//--------------------------------------
// AMBIENT ANIMATIONS
//--------------------------------------

function ambientAnimations() {

    gsap.to(".pin", {
        y: -8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    gsap.to(".card-left", {
        y: -12,
        repeat: -1,
        yoyo: true,
        duration: 2.8,
        ease: "sine.inOut"
    });

    gsap.to(".card-right", {
        y: -15,
        repeat: -1,
        yoyo: true,
        duration: 3.2,
        ease: "sine.inOut"
    });

    gsap.to(".card-bottom", {
        y: -10,
        repeat: -1,
        yoyo: true,
        duration: 2.5,
        ease: "sine.inOut"
    });

    gsap.to(".pin-glow", {
        scale: 1.12,
        opacity: .65,
        repeat: -1,
        yoyo: true,
        duration: 2.2
    });

    gsap.to(".rings", {
        rotation: 360,
        repeat: -1,
        duration: 80,
        ease: "none"
    });

    gsap.to(".ring", {
        scale: 1.1,
        opacity: .15,
        repeat: -1,
        yoyo: true,
        stagger: .25,
        duration: 2
    });

}

//--------------------------------------
// HERO PARALLAX
//--------------------------------------

function initParallax() {

    const visual = document.querySelector(".hero-visual");

    if (!visual) return;

    const moveX = gsap.quickTo(visual, "x", {
        duration: .8,
        ease: "power3.out"
    });

    const moveY = gsap.quickTo(visual, "y", {
        duration: .8,
        ease: "power3.out"
    });

    window.addEventListener("mousemove", (e) => {

        const x = (e.clientX - window.innerWidth / 2) * .018;
        const y = (e.clientY - window.innerHeight / 2) * .018;

        moveX(x);
        moveY(y);

    });

}

//--------------------------------------
// DEPTH PARALLAX
//--------------------------------------

function initDepthParallax() {

    const pin = document.querySelector(".pin");
    const left = document.querySelector(".card-left");
    const right = document.querySelector(".card-right");
    const bottom = document.querySelector(".card-bottom");

    if (!pin) return;

    window.addEventListener("mousemove", (e) => {

        const x = (e.clientX - window.innerWidth / 2) / 140;
        const y = (e.clientY - window.innerHeight / 2) / 140;

        gsap.to(pin, {
            x: x,
            y: y,
            duration: .8,
            overwrite: "auto",
            ease: "power2.out"
        });

        gsap.to(left, {
            x: x * 2,
            y: -10 + y * 2,
            duration: 1
        });

        gsap.to(right, {
            x: x * 2.4,
            y: -15 + y * 2.4,
            duration: 1
        });

        gsap.to(bottom, {
            x: x * 1.5,
            y: -8 + y * 1.5,
            duration: 1
        });

    });

}