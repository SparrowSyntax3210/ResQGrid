//======================================================
// TIMELINE.JS
// How It Works Section
//======================================================

function initHowItWorks() {

    const section = document.querySelector(".how-it-works");

    if (!section) return;

    const line = document.querySelector(".timeline .line");
    const steps = gsap.utils.toArray(".step");
    const circles = gsap.utils.toArray(".circle");

    //--------------------------------------
    // Initial States
    //--------------------------------------

    gsap.set(".section-title", {
        y: 50,
        opacity: 0
    });

    gsap.set(line, {
        scaleX: 0,
        transformOrigin: "left center"
    });

    gsap.set(steps, {
        y: 80,
        opacity: 0
    });

    gsap.set(circles, {
        scale: 0
    });

    //--------------------------------------
    // Reveal Timeline
    //--------------------------------------

    const tl = gsap.timeline({

        scrollTrigger: {

            trigger: section,

            start: "top 70%",

            once: true

        }

    });

    tl

    .to(".section-title", {

        y: 0,

        opacity: 1,

        duration: .8,

        ease: "power3.out"

    })

    .to(line, {

        scaleX: 1,

        duration: 1.2,

        ease: "power2.out"

    }, "-=.3")

    .to(circles, {

        scale: 1,

        duration: .6,

        stagger: .18,

        ease: "back.out(1.8)"

    }, "-=.7")

    .to(steps, {

        y: 0,

        opacity: 1,

        duration: .7,

        stagger: .18,

        ease: "power3.out"

    }, "-=.5");

    //--------------------------------------
    // Floating Circles
    //--------------------------------------

    circles.forEach((circle, index) => {

        gsap.to(circle, {

            y: gsap.utils.random(-8, 8),

            duration: 2 + Math.random(),

            repeat: -1,

            yoyo: true,

            ease: "sine.inOut",

            delay: index * .2

        });

    });

    //--------------------------------------
    // Icon Pulse
    //--------------------------------------

    gsap.to(".circle i", {

        scale: 1.08,

        repeat: -1,

        yoyo: true,

        stagger: .18,

        duration: 1.2,

        ease: "sine.inOut"

    });

    //--------------------------------------
    // Circle Glow
    //--------------------------------------

    gsap.to(".circle", {

        boxShadow: "0 0 40px rgba(124,58,237,.65)",

        repeat: -1,

        yoyo: true,

        stagger: .2,

        duration: 1.8,

        ease: "sine.inOut"

    });

    //--------------------------------------
    // Line Shine
    //--------------------------------------

    gsap.to(".timeline .line", {

        "--shine": "120%",

        repeat: -1,

        duration: 2.3,

        ease: "none"

    });

    //--------------------------------------
    // Moving Dots
    //--------------------------------------

    if (!line.querySelector(".line-dot")) {

        for (let i = 0; i < 8; i++) {

            const dot = document.createElement("span");

            dot.className = "line-dot";

            line.appendChild(dot);

        }

    }

    gsap.utils.toArray(".line-dot").forEach((dot, i) => {

        gsap.set(dot, {
            left: "-40px"
        });

        gsap.to(dot, {

            left: "100%",

            duration: 3,

            delay: i * .35,

            repeat: -1,

            ease: "none"

        });

    });

    //--------------------------------------
    // Hover Animation
    //--------------------------------------

    circles.forEach(circle => {

        circle.addEventListener("mouseenter", () => {

            gsap.to(circle, {

                scale: 1.15,

                rotation: 6,

                duration: .35,

                ease: "back.out(2)"

            });

        });

        circle.addEventListener("mouseleave", () => {

            gsap.to(circle, {

                scale: 1,

                rotation: 0,

                duration: .35,

                ease: "power2.out"

            });

        });

    });

    //--------------------------------------
    // Mouse Parallax
    //--------------------------------------

    const moveX = gsap.quickTo(".timeline", "x", {

        duration: .8,

        ease: "power3.out"

    });

    const moveY = gsap.quickTo(".timeline", "y", {

        duration: .8,

        ease: "power3.out"

    });

    section.addEventListener("mousemove", (e) => {

        const x = (e.clientX / window.innerWidth - .5) * 15;

        const y = (e.clientY / window.innerHeight - .5) * 10;

        moveX(x);

        moveY(y);

    });

    section.addEventListener("mouseleave", () => {

        moveX(0);

        moveY(0);

    });

}