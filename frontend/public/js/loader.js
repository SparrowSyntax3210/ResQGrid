//======================================================
// LOADER.JS
//======================================================

function loaderInit() {

    createWindParticles();

    initHeroStates();

    const loader = document.getElementById("loader");
    const percent = document.getElementById("loaderPercent");
    const bar = document.getElementById("loaderBar");

    let value = 0;

    gsap.to({}, {

        duration: 1.5,

        onUpdate() {

            value = Math.round(this.progress() * 100);

            percent.textContent = value;

            bar.style.width = value + "%";

        },

        onComplete() {

            gsap.to(loader, {

                opacity: 0,

                duration: .6,

                onComplete() {

                    loader.remove();

                    heroIntro();

                    ambientAnimations();

                    initParallax();

                    initDepthParallax();

                    initMagneticButtons();

                    initButtonGlow();

                    initNavbarBlur();

                    initCounters();

                    initCTA();

                    initHowItWorks();
                    initHowItWorks();

                    initVolunteerSection();
                    initSafetySection();
                    initAboutSection();
                    initGuardian();

                }

            });

        }

    });

}