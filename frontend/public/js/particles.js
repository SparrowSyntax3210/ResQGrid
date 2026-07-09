//======================================================
// PARTICLES.JS
// Wind Particle System
//======================================================

function createWindParticles() {

    const container = document.querySelector(".wind-particles");

    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 70; i++) {

        const wind = document.createElement("span");

        wind.className = "wind";

        const width = gsap.utils.random(20, 80);

        wind.style.width = width + "px";

        wind.style.left = gsap.utils.random(-10, 100) + "vw";

        wind.style.top = gsap.utils.random(0, 100) + "vh";

        wind.style.opacity = gsap.utils.random(0.15, 0.6);

        container.appendChild(wind);

        animateWind(wind);

    }

}

function animateWind(el) {

    const duration = gsap.utils.random(6, 14);

    gsap.fromTo(

        el,

        {
            x: -250,
            y: 0,
            opacity: 0
        },

        {
            x: window.innerWidth + 300,

            y: gsap.utils.random(-60, 60),

            opacity: gsap.utils.random(0.2, 0.7),

            duration: duration,

            ease: "none",

            repeat: -1,

            delay: gsap.utils.random(0, 8),

            onRepeat() {

                gsap.set(el, {

                    x: -250,

                    left: gsap.utils.random(-10, 0) + "vw",

                    top: gsap.utils.random(0, 100) + "vh"

                });

            }

        }

    );

}