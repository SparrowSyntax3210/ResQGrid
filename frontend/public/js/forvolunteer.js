//======================================================
// VOLUNTEER SECTION
//======================================================

function initVolunteerSection() {
  const section = document.querySelector(".volunteer-section");

  if (!section) return;

  //------------------------------------------
  // Elements
  //------------------------------------------

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,

      start: "top 72%",

      once: true,
    },
  });

  //------------------------------------------
  // Initial States
  //------------------------------------------

  gsap.set(".tag", {
    y: 40,

    opacity: 0,
  });

  gsap.set(".volunteer-left h2", {
    y: 60,

    opacity: 0,
  });

  gsap.set(".volunteer-left p", {
    y: 40,

    opacity: 0,
  });

  gsap.set(".volunteer-list li", {
    x: -40,

    opacity: 0,
  });

  gsap.set(".volunteer-left .primary-btn", {
    y: 40,

    opacity: 0,
  });

  gsap.set(".dashboard", {
    opacity: 0,

    scale: 0.85,

    rotationY: 18,

    y: 80,

    transformOrigin: "center center",
  });

  gsap.set(".floating-badge", {
    opacity: 0,

    scale: 0.8,
  });

  //------------------------------------------
  // Reveal Timeline
  //------------------------------------------

  tl.to(".tag", {
    y: 0,

    opacity: 1,

    duration: 0.6,

    ease: "power3.out",
  })

    .to(
      ".volunteer-left h2",
      {
        y: 0,

        opacity: 1,

        duration: 0.8,

        ease: "power3.out",
      },
      "-=.3",
    )

    .to(
      ".volunteer-left p",
      {
        y: 0,

        opacity: 1,

        duration: 0.6,
      },
      "-=.4",
    )

    .to(
      ".volunteer-list li",
      {
        x: 0,

        opacity: 1,

        stagger: 0.12,

        duration: 0.45,

        ease: "power2.out",
      },
      "-=.25",
    )

    .to(
      ".volunteer-left .primary-btn",
      {
        y: 0,

        opacity: 1,

        duration: 0.5,
      },
      "-=.2",
    )

    .to(
      ".dashboard",
      {
        opacity: 1,

        scale: 1,

        rotationY: 0,

        y: 0,

        duration: 1,

        ease: "back.out(1.5)",
      },
      "-=.8",
    )

    .to(
      ".floating-badge",
      {
        opacity: 1,

        scale: 1,

        stagger: 0.15,

        duration: 0.5,

        ease: "back.out(2)",
      },
      "-=.6",
    );

  //------------------------------------------
  // Floating Dashboard
  //------------------------------------------

  gsap.to(".dashboard", {
    y: -12,

    duration: 4,

    repeat: -1,

    yoyo: true,

    ease: "sine.inOut",
  });

  //------------------------------------------
  // Floating Badges
  //------------------------------------------

  gsap.utils.toArray(".floating-badge").forEach((badge, index) => {
    gsap.to(badge, {
      y: gsap.utils.random(-12, 12),

      duration: 2.8 + index,

      repeat: -1,

      yoyo: true,

      ease: "sine.inOut",
    });
  });

  //------------------------------------------
  // Avatar Pulse
  //------------------------------------------

  gsap.to(".avatar", {
    scale: 1.06,

    duration: 2,

    repeat: -1,

    yoyo: true,

    ease: "sine.inOut",
  });

  //------------------------------------------
  // Stat Cards Float
  //------------------------------------------

  gsap.utils.toArray(".stat-card").forEach((card, index) => {
    gsap.to(card, {
      y: gsap.utils.random(-8, 8),

      duration: 2 + Math.random(),

      repeat: -1,

      yoyo: true,

      delay: index * 0.15,

      ease: "sine.inOut",
    });
  });

  //------------------------------------------
  // Dashboard Glow
  //------------------------------------------

  gsap.to(".dashboard", {
    boxShadow: "0 30px 70px rgba(124,58,237,.30)",

    repeat: -1,

    yoyo: true,

    duration: 2.4,

    ease: "sine.inOut",
  });

  //------------------------------------------
  // Mouse Parallax
  //------------------------------------------

  const moveDashboard = gsap.quickTo(".dashboard", "x", {
    duration: 0.8,

    ease: "power3.out",
  });

  const moveDashboardY = gsap.quickTo(".dashboard", "y", {
    duration: 0.8,

    ease: "power3.out",
  });

  section.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 18;

    const y = (e.clientY / window.innerHeight - 0.5) * 12;

    moveDashboard(x);

    moveDashboardY(y);
  });

  section.addEventListener("mouseleave", () => {
    moveDashboard(0);

    moveDashboardY(0);
  });
}
