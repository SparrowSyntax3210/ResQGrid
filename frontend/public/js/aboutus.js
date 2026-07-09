//======================================================
// ABOUT US SECTION
//======================================================

function initAboutSection() {
  const section = document.querySelector(".about-section");

  if (!section) return;

  const visual = document.querySelector(".about-visual");
  const glow = document.querySelector(".about-glow");
  const circle = document.querySelector(".about-circle");

  const header = document.querySelector(".about-header");

  const cards = gsap.utils.toArray(".mission-card");
  const stats = gsap.utils.toArray(".impact-box");

  const cta = document.querySelector(".about-cta");

  //--------------------------------------------------
  // Initial States
  //--------------------------------------------------

  gsap.set(header, {
    y: 60,
    opacity: 0,
  });

  gsap.set(visual, {
    scale: 0.7,
    opacity: 0,
    rotation: -12,
  });

  gsap.set(cards, {
    y: 70,
    opacity: 0,
  });

  gsap.set(stats, {
    y: 60,
    opacity: 0,
    scale: 0.92,
  });

  gsap.set(cta, {
    y: 60,
    opacity: 0,
  });

  //--------------------------------------------------
  // Reveal Timeline
  //--------------------------------------------------

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,

      start: "top 65%",

      once: true,
    },
  });

  tl.to(header, {
    y: 0,
    opacity: 1,

    duration: 0.9,

    ease: "power3.out",
  })

    .to(
      visual,
      {
        scale: 1,

        opacity: 1,

        rotation: 0,

        duration: 1,

        ease: "back.out(1.6)",
      },
      "-=.45",
    )

    .to(
      cards,
      {
        y: 0,

        opacity: 1,

        stagger: 0.18,

        duration: 0.7,

        ease: "power3.out",
      },
      "-=.4",
    )

    .to(
      stats,
      {
        y: 0,

        opacity: 1,

        scale: 1,

        stagger: 0.15,

        duration: 0.6,

        ease: "power3.out",
      },
      "-=.2",
    )

    .to(
      cta,
      {
        y: 0,

        opacity: 1,

        duration: 0.8,

        ease: "power3.out",
      },
      "-=.2",
    );

  //--------------------------------------------------
  // Floating Visual
  //--------------------------------------------------

  gsap.to(circle, {
    y: -12,

    duration: 3,

    repeat: -1,

    yoyo: true,

    ease: "sine.inOut",
  });

  gsap.to(glow, {
    scale: 1.12,

    opacity: 0.65,

    duration: 2.5,

    repeat: -1,

    yoyo: true,

    ease: "sine.inOut",
  });

  gsap.to(circle, {
    rotation: 360,

    duration: 70,

    repeat: -1,

    ease: "none",
  });

  //--------------------------------------------------
  // Mission Card Hover
  //--------------------------------------------------

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        y: -12,

        scale: 1.04,

        duration: 0.35,

        ease: "power3.out",

        boxShadow: "0 25px 70px rgba(124,58,237,.28)",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        y: 0,

        scale: 1,

        duration: 0.35,

        ease: "power2.out",

        boxShadow: "none",
      });
    });
  });

  //--------------------------------------------------
  // Impact Card Hover
  //--------------------------------------------------

  stats.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        scale: 1.05,

        duration: 0.3,
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        scale: 1,

        duration: 0.3,
      });
    });
  });

  //--------------------------------------------------
  // Mouse Parallax
  //--------------------------------------------------

  const moveX = gsap.quickTo(visual, "x", {
    duration: 0.8,

    ease: "power3.out",
  });

  const moveY = gsap.quickTo(visual, "y", {
    duration: 0.8,

    ease: "power3.out",
  });

  section.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;

    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    moveX(x);

    moveY(y);
  });

  section.addEventListener("mouseleave", () => {
    moveX(0);

    moveY(0);
  });

  //--------------------------------------------------
  // Counter Animation
  //--------------------------------------------------

  gsap.utils.toArray(".impact-number").forEach((counter) => {
    ScrollTrigger.create({
      trigger: counter,

      start: "top 85%",

      once: true,

      onEnter: () => {
        const target = parseInt(counter.dataset.target);

        if (!target) return;

        gsap.fromTo(
          {
            value: 0,
          },
          {
            value: target,

            duration: 2,

            ease: "power2.out",

            onUpdate() {
              counter.textContent =
                Math.floor(this.targets()[0].value).toLocaleString() + "+";
            },
          },
        );
      },
    });
  });

  //--------------------------------------------------
  // CTA Buttons
  //--------------------------------------------------

  gsap.utils.toArray(".about-cta .btn").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, {
        scale: 1.05,

        duration: 0.3,
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, {
        scale: 1,

        duration: 0.3,
      });
    });
  });
}
