//======================================================
// UI.JS
// Buttons • Navbar • Counters • CTA
//======================================================

//--------------------------------------
// MAGNETIC BUTTONS
//--------------------------------------

function initMagneticButtons() {

    document.querySelectorAll(".btn,.join-btn").forEach(button => {

        button.addEventListener("mousemove", (e) => {

            const rect = button.getBoundingClientRect();

            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(button, {

                x: x * .18,
                y: y * .18,

                duration: .3,

                ease: "power3.out"

            });

        });

        button.addEventListener("mouseleave", () => {

            gsap.to(button, {

                x: 0,
                y: 0,

                duration: .55,

                ease: "elastic.out(1,.4)"

            });

        });

    });

}

//--------------------------------------
// BUTTON GLOW
//--------------------------------------

function initButtonGlow() {

    document.querySelectorAll(".btn,.join-btn").forEach(btn => {

        btn.addEventListener("mouseenter", () => {

            gsap.to(btn, {

                scale: 1.04,

                boxShadow: "0 0 35px rgba(124,58,237,.45)",

                duration: .3

            });

        });

        btn.addEventListener("mouseleave", () => {

            gsap.to(btn, {

                scale: 1,

                boxShadow: "0 0 0 rgba(124,58,237,0)",

                duration: .3

            });

        });

    });

}

//--------------------------------------
// IMPACT COUNTERS
//--------------------------------------

function initCounters() {

    const counters = document.querySelectorAll(".impact-number");

    if (!counters.length) return;

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const el = entry.target;

            const target = parseInt(el.dataset.target);

            const suffix = el.dataset.suffix || "";

            gsap.fromTo({

                value: 0

            }, {

                value: target,

                duration: 1.6,

                ease: "power3.out",

                onUpdate() {

                    el.textContent =
                        Math.floor(this.targets()[0].value).toLocaleString() + suffix;

                }

            });

            observer.unobserve(el);

        });

    }, {

        threshold: .4

    });

    counters.forEach(counter => observer.observe(counter));

}

//--------------------------------------
// NAVBAR BLUR
//--------------------------------------

function initNavbarBlur() {

    const header = document.querySelector("header");

    if (!header) return;

    window.addEventListener("scroll", () => {

        if (window.scrollY > 40) {

            gsap.to(header, {

                background: "rgba(9,13,22,.82)",

                backdropFilter: "blur(18px)",

                borderBottom: "1px solid rgba(124,58,237,.15)",

                duration: .35

            });

        } else {

            gsap.to(header, {

                background: "transparent",

                backdropFilter: "blur(0px)",

                borderBottom: "1px solid transparent",

                duration: .35

            });

        }

    });

}

//--------------------------------------
// CTA BUTTON
//--------------------------------------

function initCTA() {

    const signup = document.getElementById("signup");

    if (!signup) return;

    signup.addEventListener("click", () => {

        window.location.href = "/role-selection";

    });

}

//--------------------------------------
// OPTIONAL
// Ripple Effect on Buttons
//--------------------------------------

document.querySelectorAll(".btn,.join-btn").forEach(button => {

    button.addEventListener("click", function(e) {

        const ripple = document.createElement("span");

        ripple.className = "ripple";

        const rect = this.getBoundingClientRect();

        ripple.style.left = (e.clientX - rect.left) + "px";

        ripple.style.top = (e.clientY - rect.top) + "px";

        this.appendChild(ripple);

        setTimeout(() => {

            ripple.remove();

        }, 600);

    });

});