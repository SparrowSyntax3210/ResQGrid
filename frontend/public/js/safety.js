//======================================================
// SAFETY SECTION
//======================================================

function initSafetySection() {

    const section = document.querySelector(".safety-tools");
    const wrapper = document.querySelector(".horizontal-wrapper");
    const track = document.querySelector(".cards-track");
    const cards = gsap.utils.toArray(".safety-card");
    const fill = document.querySelector(".progress-fill");
    const current = document.getElementById("currentCard");

    if (!section || !track || !cards.length) return;

    //--------------------------------------------------
    // Initial States
    //--------------------------------------------------

    gsap.set(cards, {
        scale: .88,
        opacity: .45,
        filter: "blur(2px)"
    });

    gsap.set(cards[0], {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)"
    });

    //--------------------------------------------------
    // Horizontal Scroll
    //--------------------------------------------------

    const scrollAmount =
        track.scrollWidth - window.innerWidth;

    const horizontalTween = gsap.to(track, {

        x: -scrollAmount,

        ease: "none",

        scrollTrigger: {
    trigger: wrapper,
    start: "top+=40 top",
    end: () => "+=" + scrollAmount,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true
}

    });

    //--------------------------------------------------
    // Active Card
    //--------------------------------------------------

    cards.forEach((card, index) => {

        ScrollTrigger.create({

            trigger: card,

            containerAnimation: horizontalTween,

            start: "left center",

            end: "right center",

            onEnter: () => activate(index),

            onEnterBack: () => activate(index)

        });

    });

    function activate(index) {

        cards.forEach((card, i) => {

            gsap.to(card, {

                scale: i === index ? 1 : .88,

                opacity: i === index ? 1 : .45,

                filter: i === index ? "blur(0px)" : "blur(2px)",

                duration: .45,

                overwrite: true

            });

        });

        //------------------------------------------------
        // Progress
        //------------------------------------------------

        current.textContent =
            String(index + 1).padStart(2, "0");

        gsap.to(fill, {

            width: ((index + 1) / cards.length) * 100 + "%",

            duration: .4,

            ease: "power2.out"

        });

    }

    //--------------------------------------------------
    // Floating Icons
    //--------------------------------------------------

    gsap.utils.toArray(".card-icon").forEach((icon, i) => {

        gsap.to(icon, {

            y: gsap.utils.random(-8, 8),

            duration: 2 + Math.random(),

            repeat: -1,

            yoyo: true,

            ease: "sine.inOut",

            delay: i * .2

        });

    });

    //--------------------------------------------------
    // Icon Pulse
    //--------------------------------------------------

    gsap.to(".card-icon i", {

        scale: 1.08,

        duration: 1.2,

        repeat: -1,

        yoyo: true,

        stagger: .12,

        ease: "sine.inOut"

    });

    //--------------------------------------------------
    // Card Hover
    //--------------------------------------------------

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            gsap.to(card, {

                y: -12,

                duration: .35,

                boxShadow:
                    "0 35px 90px rgba(124,58,237,.35),0 0 60px rgba(124,58,237,.22)",

                overwrite: true

            });

        });

        card.addEventListener("mouseleave", () => {

            gsap.to(card, {

                y: 0,

                duration: .35,

                boxShadow:
                    "0 30px 80px rgba(0,0,0,.35),0 0 40px rgba(124,58,237,.12)",

                overwrite: true

            });

        });

    });

    //--------------------------------------------------
    // Mouse Parallax
    //--------------------------------------------------

    const moveX = gsap.quickTo(track, "x", {
        duration: .8,
        ease: "power3.out"
    });

    section.addEventListener("mousemove", (e) => {

        if (window.innerWidth < 992) return;

        const offset =
            (e.clientX / window.innerWidth - .5) * 20;

        moveX(gsap.getProperty(track, "x") + offset);

    });

    section.addEventListener("mouseleave", () => {

        gsap.to(track, {
            x: gsap.getProperty(track, "x"),
            duration: .4
        });

    });

    //--------------------------------------------------
    // Refresh
    //--------------------------------------------------

    ScrollTrigger.refresh();

}