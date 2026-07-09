//======================================================
// GUARDIAN SECTION
//======================================================

function initGuardian() {

    const section = document.querySelector(".guardian-section");

    if (!section) return;

    const cards = gsap.utils.toArray(".guardian-card");
    const circle = document.querySelector(".guardian-circle");
    const glow = document.querySelector(".guardian-glow");
    const quote = document.querySelector(".quote-card");

    //------------------------------------
    // Initial States
    //------------------------------------

    gsap.set(".guardian-left", {
        x: -80,
        opacity: 0
    });

    gsap.set(cards, {
        x: 80,
        opacity: 0
    });

    gsap.set(".section-title", {
        y: 50,
        opacity: 0
    });

    //------------------------------------
    // Scroll Reveal
    //------------------------------------

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

    .to(".guardian-left", {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
    }, "-=.4")

    .to(cards, {
        x: 0,
        opacity: 1,
        duration: .7,
        stagger: .15,
        ease: "power3.out"
    }, "-=.7");

    //------------------------------------
    // Floating Circle
    //------------------------------------

    gsap.to(circle, {

        y: -12,

        duration: 3,

        repeat: -1,

        yoyo: true,

        ease: "sine.inOut"

    });

    //------------------------------------
    // Glow Breathing
    //------------------------------------

    gsap.to(glow, {

        scale: 1.15,

        opacity: .65,

        duration: 2.5,

        repeat: -1,

        yoyo: true,

        ease: "sine.inOut"

    });

    //------------------------------------
    // Quote Float
    //------------------------------------

    gsap.to(quote, {

        y: -8,

        duration: 2.5,

        repeat: -1,

        yoyo: true,

        ease: "sine.inOut"

    });

    //------------------------------------
    // Icon Pulse
    //------------------------------------

    gsap.to(".guardian-card .icon", {

        scale: 1.06,

        duration: 1.4,

        repeat: -1,

        yoyo: true,

        stagger: .12,

        ease: "sine.inOut"

    });

    //------------------------------------
    // Hover Animation
    //------------------------------------

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            gsap.to(card, {

                x: 12,

                scale: 1.02,

                duration: .35,

                ease: "power2.out"

            });

            gsap.to(card.querySelector(".icon"), {

                rotation: 10,

                scale: 1.15,

                duration: .35,

                ease: "back.out(2)"

            });

        });

        card.addEventListener("mouseleave", () => {

            gsap.to(card, {

                x: 0,

                scale: 1,

                duration: .35,

                ease: "power2.out"

            });

            gsap.to(card.querySelector(".icon"), {

                rotation: 0,

                scale: 1,

                duration: .35

            });

        });

    });

    //------------------------------------
    // Mouse Parallax
    //------------------------------------

    const moveX = gsap.quickTo(circle, "x", {

        duration: .8,

        ease: "power3.out"

    });

    const moveY = gsap.quickTo(circle, "y", {

        duration: .8,

        ease: "power3.out"

    });

    section.addEventListener("mousemove", (e) => {

        const x = (e.clientX / window.innerWidth - .5) * 30;
        const y = (e.clientY / window.innerHeight - .5) * 20;

        moveX(x);
        moveY(y);

    });

    section.addEventListener("mouseleave", () => {

        moveX(0);
        moveY(0);

    });

    //------------------------------------
    // Card Glow on Scroll
    //------------------------------------

    cards.forEach(card => {

        ScrollTrigger.create({

            trigger: card,

            start: "top 80%",

            onEnter: () => {

                gsap.fromTo(card,

                    {
                        boxShadow: "0 0 0 rgba(124,58,237,0)"
                    },

                    {
                        boxShadow: "0 20px 60px rgba(124,58,237,.18)",
                        duration: .8
                    }

                );

            }

        });

    });

}