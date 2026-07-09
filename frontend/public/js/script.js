//======================================================
// GSAP SETUP
//======================================================

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
    duration:1.1,
    smoothWheel:true
});

lenis.on("scroll",ScrollTrigger.update);

gsap.ticker.add((time)=>{
    lenis.raf(time*1000);
});

gsap.ticker.lagSmoothing(0);

//======================================================
// INITIAL STATES
//======================================================

gsap.set(".logo",{y:60,opacity:0});

gsap.set("nav a",{y:-40,opacity:0});

gsap.set(".join-btn",{y:-40,opacity:0});

gsap.set(".hero-content",{
    y:40,
    opacity:0,
    scale:1.08
});

gsap.set(".pin",{
    y:250,
    opacity:0,
    rotation:-8,
    scale:.85
});

gsap.set(".pin-glow",{
    opacity:0,
    scale:0
});

gsap.set(".rings",{
    opacity:0,
    scale:.8
});

gsap.set(".card-left",{
    x:-120,
    opacity:0,
    rotation:-10
});

gsap.set(".card-right",{
    x:120,
    opacity:0,
    rotation:10
});

gsap.set(".card-bottom",{
    y:80,
    opacity:0
});

//======================================================
// LOADER
//======================================================

window.addEventListener("load",()=>{

    createWindParticles();

    const loader=document.getElementById("loader");
    const percent=document.getElementById("loaderPercent");
    const bar=document.getElementById("loaderBar");

    let value=0;

    gsap.to({},{

        duration:1.5,

        onUpdate(){

            value=Math.round(this.progress()*100);

            percent.textContent=value;

            bar.style.width=value+"%";

        },

        onComplete(){

            gsap.to(loader,{
                opacity:0,
                duration:.6,
                onComplete(){

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

initHowItWorks(); // <-- ADD THIS;

                }
            });

        }

    });

});

//======================================================
// HERO INTRO
//======================================================

function heroIntro(){

const hero=gsap.timeline();

hero

.to(".logo",{

y:0,
opacity:1,
duration:.6

})

.to("nav a",{

y:0,
opacity:1,

stagger:.08,

duration:.45

},"<")

.to(".join-btn",{

y:0,
opacity:1

},"<")

.to(".hero-content",{

y:0,
opacity:1,
scale:1,

duration:.9,

ease:"power3.out"

},"-=.2")

.to(".pin",{

y:0,

opacity:1,

rotation:0,

scale:1,

duration:1,

ease:"back.out(1.5)"

},"-=.7")

.to(".card-left",{

x:0,

opacity:1,

rotation:0,

duration:.6

},"-=.8")

.to(".card-right",{

x:0,

opacity:1,

rotation:0,

duration:.6

},"<")

.to(".card-bottom",{

y:0,

opacity:1,

duration:.6

},"<")

.to(".pin-glow",{

opacity:1,

scale:1,

duration:.8

},"-=.8")

.to(".rings",{

opacity:1,

scale:1,

duration:.8

},"<");

}

//======================================================
// AMBIENT
//======================================================

function ambientAnimations(){

gsap.to(".pin",{

y:-8,

duration:4,

repeat:-1,

yoyo:true,

ease:"sine.inOut"

});

gsap.to(".card-left",{

y:-12,

repeat:-1,

yoyo:true,

duration:2.8,

ease:"sine.inOut"

});

gsap.to(".card-right",{

y:-15,

repeat:-1,

yoyo:true,

duration:3.2,

ease:"sine.inOut"

});

gsap.to(".card-bottom",{

y:-10,

repeat:-1,

yoyo:true,

duration:2.5,

ease:"sine.inOut"

});

gsap.to(".pin-glow",{

scale:1.12,

opacity:.65,

repeat:-1,

yoyo:true,

duration:2.2

});

gsap.to(".rings",{

rotation:360,

repeat:-1,

duration:80,

ease:"none"

});

gsap.to(".ring",{

scale:1.1,

opacity:.15,

repeat:-1,

yoyo:true,

stagger:.25,

duration:2

});

}
//======================================================
// PARALLAX
//======================================================

function initParallax(){

    const visual=document.querySelector(".hero-visual");

    if(!visual) return;

    const moveX=gsap.quickTo(visual,"x",{
        duration:.8,
        ease:"power3.out"
    });

    const moveY=gsap.quickTo(visual,"y",{
        duration:.8,
        ease:"power3.out"
    });

    window.addEventListener("mousemove",(e)=>{

        const x=(e.clientX-window.innerWidth/2)*0.018;
        const y=(e.clientY-window.innerHeight/2)*0.018;

        moveX(x);
        moveY(y);

    });

}

//======================================================
// DEPTH PARALLAX
//======================================================

function initDepthParallax(){

    const pin=document.querySelector(".pin");
    const left=document.querySelector(".card-left");
    const right=document.querySelector(".card-right");
    const bottom=document.querySelector(".card-bottom");

    if(!pin) return;

    window.addEventListener("mousemove",(e)=>{

        const x=(e.clientX-window.innerWidth/2)/140;
        const y=(e.clientY-window.innerHeight/2)/140;

        gsap.to(pin,{
            x:x,
            y:y,
            duration:.8,
            overwrite:"auto",
            ease:"power2.out"
        });

        gsap.to(left,{
            x:x*2,
            y:-10+y*2,
            duration:1
        });

        gsap.to(right,{
            x:x*2.4,
            y:-15+y*2.4,
            duration:1
        });

        gsap.to(bottom,{
            x:x*1.5,
            y:-8+y*1.5,
            duration:1
        });

    });

}

//======================================================
// MAGNETIC BUTTONS
//======================================================

function initMagneticButtons(){

document.querySelectorAll(".btn,.join-btn").forEach(button=>{

button.addEventListener("mousemove",(e)=>{

const rect=button.getBoundingClientRect();

const x=e.clientX-rect.left-rect.width/2;
const y=e.clientY-rect.top-rect.height/2;

gsap.to(button,{
x:x*.18,
y:y*.18,
duration:.3,
ease:"power3.out"
});

});

button.addEventListener("mouseleave",()=>{

gsap.to(button,{
x:0,
y:0,
duration:.55,
ease:"elastic.out(1,.4)"
});

});

});

}

//======================================================
// BUTTON GLOW
//======================================================

function initButtonGlow(){

document.querySelectorAll(".btn,.join-btn").forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

gsap.to(btn,{
scale:1.04,
boxShadow:"0 0 35px rgba(124,58,237,.45)",
duration:.3
});

});

btn.addEventListener("mouseleave",()=>{

gsap.to(btn,{
scale:1,
boxShadow:"0 0 0 rgba(124,58,237,0)",
duration:.3
});

});

});

}

//======================================================
// COUNTERS
//======================================================

function initCounters(){

const counters=document.querySelectorAll(".impact-number");

if(!counters.length) return;

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(!entry.isIntersecting) return;

const el=entry.target;

const target=parseInt(el.dataset.target);

const suffix=el.dataset.suffix||"";

gsap.fromTo({

value:0

},

{

value:target,

duration:1.6,

ease:"power3.out",

onUpdate(){

el.textContent=
Math.floor(this.targets()[0].value).toLocaleString()+suffix;

}

});

observer.unobserve(el);

});

},

{
threshold:.4
});

counters.forEach(counter=>observer.observe(counter));

}

//======================================================
// NAVBAR
//======================================================

function initNavbarBlur(){

const header=document.querySelector("header");

if(!header) return;

window.addEventListener("scroll",()=>{

if(window.scrollY>40){

gsap.to(header,{

background:"rgba(9,13,22,.82)",

backdropFilter:"blur(18px)",

duration:.35

});

}else{

gsap.to(header,{

background:"transparent",

backdropFilter:"blur(0px)",

duration:.35

});

}

});

}

//======================================================
// CTA
//======================================================

function initCTA(){

const signup=document.getElementById("signup");

if(!signup) return;

signup.addEventListener("click",()=>{

window.location.href="/role-selection";

});

}

//======================================================
// PERFORMANCE
//======================================================

document.addEventListener("visibilitychange",()=>{

if(document.hidden){

gsap.globalTimeline.pause();

}else{

gsap.globalTimeline.resume();

}

});

window.addEventListener("resize",()=>{

const container=document.querySelector(".wind-particles");

if(!container) return;

container.innerHTML="";

createWindParticles();

});

function scrollTopSmooth(){

lenis.scrollTo(0,{
duration:1.2
});

}

// gsap.utils.toArray(".circle").forEach((circle, index) => {
//   gsap.to(circle, {
//     y: 8,

//     duration: 2 + Math.random(),

//     repeat: -1,

//     yoyo: true,

//     ease: "sine.inOut",

//     delay: index * 0.2,
//   });
// });

// gsap.to(".circle", {
//   boxShadow: "0 0 45px rgba(124,58,237,.8),0 0 90px rgba(124,58,237,.25)",

//   repeat: -1,

//   yoyo: true,

//   duration: 1.8,

//   stagger: 0.25,

//   ease: "power1.inOut",
// });

// gsap.to(".timeline .line",{

//     "--shine":"120%",

//     repeat:-1,

//     duration:2.2,

//     ease:"none"

// });

// gsap.to(".circle i",{

//     scale:1.08,

//     duration:1.3,

//     repeat:-1,

//     yoyo:true,

//     stagger:.15,

//     ease:"sine.inOut"

// });

//======================================================
// HOW IT WORKS
//======================================================

function initHowItWorks(){

const section=document.querySelector(".how-it-works");

if(!section) return;

const line=document.querySelector(".timeline .line");
const steps=gsap.utils.toArray(".step");
const circles=gsap.utils.toArray(".circle");

//------------------------------------
// Initial States
//------------------------------------

gsap.set(".section-title",{
    y:50,
    opacity:0
});

gsap.set(line,{
    scaleX:0,
    transformOrigin:"left center"
});

gsap.set(steps,{
    y:80,
    opacity:0
});

//------------------------------------
// Scroll Reveal
//------------------------------------

const reveal=gsap.timeline({

scrollTrigger:{
trigger:section,
start:"top 70%",
once:true
}

});

reveal

.to(".section-title",{

y:0,
opacity:1,

duration:.8,

ease:"power3.out"

})

.to(line,{

scaleX:1,

duration:1.3,

ease:"power2.out"

},"-=.3")

.to(steps,{

y:0,

opacity:1,

stagger:.22,

duration:.8,

ease:"power3.out"

},"-=.8");

//------------------------------------
// Floating Circles
//------------------------------------

circles.forEach((circle,index)=>{

gsap.to(circle,{

y:gsap.utils.random(-8,8),

duration:2+Math.random(),

repeat:-1,

yoyo:true,

ease:"sine.inOut",

delay:index*.25

});

});

//------------------------------------
// Icon Float
//------------------------------------

gsap.to(".circle i",{

scale:1.08,

repeat:-1,

yoyo:true,

stagger:.2,

duration:1.3,

ease:"sine.inOut"

});

//------------------------------------
// Animated Shine
//------------------------------------

gsap.to(".timeline .line",{

"--shine":"120%",

repeat:-1,

duration:2.4,

ease:"none"

});

//------------------------------------
// Line Particles
//------------------------------------

for(let i=0;i<8;i++){

const dot=document.createElement("span");

dot.className="line-dot";

line.appendChild(dot);

}

gsap.utils.toArray(".line-dot").forEach((dot,i)=>{

gsap.set(dot,{
left:"-40px"
});

gsap.to(dot,{

left:"100%",

repeat:-1,

duration:3,

delay:i*.35,

ease:"none"

});

});

//------------------------------------
// Hover
//------------------------------------

circles.forEach(circle=>{

circle.addEventListener("mouseenter",()=>{

gsap.to(circle,{

scale:1.12,

rotation:6,

duration:.35,

ease:"back.out(2)"

});

});

circle.addEventListener("mouseleave",()=>{

gsap.to(circle,{

scale:1,

rotation:0,

duration:.35,

ease:"power2.out"

});

});

});

//------------------------------------
// Mouse Parallax
//------------------------------------

const moveX=gsap.quickTo(".timeline","x",{
duration:.8,
ease:"power3.out"
});

const moveY=gsap.quickTo(".timeline","y",{
duration:.8,
ease:"power3.out"
});

section.addEventListener("mousemove",(e)=>{

const x=(e.clientX/window.innerWidth-.5)*15;
const y=(e.clientY/window.innerHeight-.5)*10;

moveX(x);
moveY(y);

});

section.addEventListener("mouseleave",()=>{

moveX(0);
moveY(0);

});

}

const SignIn = document.getElementById("signup");

SignIn.addEventListener("click", () => {
  window.location.href = "/role-selection";
});
