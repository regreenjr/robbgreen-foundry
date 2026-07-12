import "@fontsource/big-shoulders-display/600.css";
import "@fontsource/big-shoulders-display/800.css";
import "@fontsource/big-shoulders-display/900.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountFurnace, type FurnaceHandle } from "./shader";

gsap.registerPlugin(ScrollTrigger);

/* Motion preference: URL ?motion=1|0 > localStorage > system setting.
   The MOTION control in the corner writes localStorage and reloads. */
const motionParam = new URLSearchParams(location.search).get("motion");
const motionStored = localStorage.getItem("foundry-motion");
const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reduceMotion =
  motionParam !== null ? motionParam === "0"
  : motionStored !== null ? motionStored === "0"
  : systemReduce;
const desktop = window.matchMedia("(min-width: 901px)");

const motionBtn = document.getElementById("motionBtn")!;
motionBtn.setAttribute("aria-pressed", String(!reduceMotion));
motionBtn.textContent = reduceMotion ? "MOTION OFF" : "MOTION ON";
motionBtn.addEventListener("click", () => {
  localStorage.setItem("foundry-motion", reduceMotion ? "1" : "0");
  location.reload();
});

/* ============================================================
   HERO — furnace shader + load choreography
   ============================================================ */
let furnace: FurnaceHandle | null = null;
const heroImg = document.getElementById("heroImg") as HTMLImageElement;
const heroCanvas = document.getElementById("heroCanvas") as HTMLCanvasElement;

/* The liquid layer (haze, embers, ripple) is ambient and contained, so it
   always runs; reduced-motion gets it dampened. Only the big moves
   (pin, parallax, choreography) are gated on reduceMotion below. */
function bootShader() {
  furnace = mountFurnace(heroCanvas, heroImg, {
    animate: true,
    calm: reduceMotion ? 0.55 : 1,
  });
  if (furnace) heroImg.style.visibility = "hidden";
}
if (heroImg.complete && heroImg.naturalWidth) bootShader();
else heroImg.addEventListener("load", bootShader, { once: true });

// intro reveal
if (!reduceMotion) {
  gsap.set(".hero .line__in", { yPercent: 112 });
  gsap.set(".hero__sub, .hero__cta, .hero__poptag", { autoAlpha: 0, y: 22 });
  gsap.set(".head", { autoAlpha: 0 });
  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power4.out" } });
  tl.to(".hero .line__in", { yPercent: 0, duration: 1.15, stagger: 0.12 })
    .to(".hero__poptag", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.7")
    .to(".hero__sub", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.55")
    .to(".hero__cta", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
    .to(".head", { autoAlpha: 1, duration: 0.6 }, "-=0.4");

}

/* scroll: pour the FOUNDRY fill for everyone; zoom/parallax only with motion */
const foundryFill = document.getElementById("foundryFill");
ScrollTrigger.create({
  trigger: "#hero",
  start: "top top",
  end: "bottom top",
  scrub: true,
  onUpdate(self) {
    const p = self.progress;
    const fill = Math.min(1, p / 0.42);
    if (foundryFill) foundryFill.style.clipPath = `inset(${(1 - fill) * 100}% 0 0 0)`;
    if (!reduceMotion) {
      furnace?.setScroll(p);
      const fade = Math.max(0, p - 0.38) * 1.7;
      gsap.set(".hero__content", { yPercent: p * -16, autoAlpha: 1 - fade });
    }
  },
});

/* ============================================================
   STAMP + FADE reveals
   ============================================================ */
if (!reduceMotion) {
  document.querySelectorAll<HTMLElement>("[data-stamp]").forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, scale: 1.06, filter: "blur(6px)" },
      {
        autoAlpha: 1, scale: 1, filter: "blur(0px)",
        duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 82%" },
      }
    );
  });
  document.querySelectorAll<HTMLElement>("[data-fade]").forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      }
    );
  });
}

/* ============================================================
   THE FLOOR — horizontal rail (desktop only)
   ============================================================ */
function setupFloor() {
  if (reduceMotion || !desktop.matches) {
    document.getElementById("floor")!.classList.add("floor--static");
    return;
  }
  const track = document.getElementById("floorTrack")!;
  const pin = document.querySelector<HTMLElement>(".floor__pin")!;
  const distance = () => track.scrollWidth - window.innerWidth;
  const pan = gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // depth: each machine image drifts against the rail
  document.querySelectorAll<HTMLElement>(".machine__fig img").forEach((img) => {
    gsap.fromTo(
      img,
      { x: "-3.5%" },
      {
        x: "0%",
        ease: "none",
        scrollTrigger: {
          trigger: img.closest(".machine"),
          containerAnimation: pan,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      }
    );
  });

  // each panel's contents stamp in as the bay arrives
  document.querySelectorAll<HTMLElement>(".machine__panel").forEach((panel) => {
    gsap.fromTo(
      panel.children,
      { autoAlpha: 0, x: 46 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: panel.closest(".machine"),
          containerAnimation: pan,
          start: "left 62%",
        },
      }
    );
  });
}
setupFloor();

/* ============================================================
   LEDGER counters
   ============================================================ */
document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  if (reduceMotion) {
    el.textContent = String(target);
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 1.4,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 85%" },
    onUpdate: () => (el.textContent = String(Math.round(obj.v))),
  });
});

/* ============================================================
   PROGRESS PIPE — molten fill down the page
   ============================================================ */
const pipeFill = document.getElementById("pipeFill")!;
const pipeReadout = document.getElementById("pipeReadout")!;
ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "bottom bottom",
  onUpdate(self) {
    const p = Math.round(self.progress * 100);
    pipeFill.style.height = `${self.progress * 100}%`;
    pipeReadout.textContent = `POUR ${p}%`;
  },
});

/* ============================================================
   OPERATOR — halftone portrait
   ============================================================ */
function halftone() {
  const canvas = document.getElementById("portraitCanvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  img.src = "/img/robb.jpg";
  img.onload = () => {
    const W = canvas.width, H = canvas.height;
    // draw source cover-fit to an offscreen buffer
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d")!;
    const s = Math.max(W / img.width, H / img.height);
    const dw = img.width * s, dh = img.height * s;
    octx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const data = octx.getImageData(0, 0, W, H).data;

    ctx.fillStyle = "#11130f";
    ctx.fillRect(0, 0, W, H);
    const cell = 7;
    for (let y = 0; y < H; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const i = ((y + Math.floor(cell / 2)) * W + x + Math.floor(cell / 2)) * 4;
        let lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        // contrast curve: the 100px source is soft, punch it up
        lum = Math.pow(Math.min(1, Math.max(0, (lum - 0.5) * 1.45 + 0.52)), 0.92);
        const r = (lum * cell) / 2 * 1.06;
        if (r < 0.4) continue;
        // brightest dots go molten, rest bone
        ctx.fillStyle = lum > 0.82 ? "#a8f53e" : "#e9e7da";
        ctx.globalAlpha = Math.min(1, 0.25 + lum);
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
}
halftone();

/* ============================================================
   FINALE — headline rises like the hero did
   ============================================================ */
if (!reduceMotion) {
  gsap.fromTo(
    ".finale .line__in",
    { yPercent: 112 },
    {
      yPercent: 0,
      duration: 1.05,
      stagger: 0.11,
      ease: "power4.out",
      scrollTrigger: { trigger: ".finale__title", start: "top 74%" },
    }
  );
  gsap.fromTo(
    ".finale .btn, .finale__note",
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: ".finale__title", start: "top 60%" },
    }
  );
}

/* ============================================================
   FINALE — rising embers
   ============================================================ */
function embers() {
  const canvas = document.getElementById("emberCanvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let W = 0, H = 0;
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.round(r.width);
    H = canvas.height = Math.round(r.height);
  };
  fit();
  new ResizeObserver(fit).observe(canvas);

  type Ember = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };
  const P: Ember[] = [];
  const spawn = (): Ember => ({
    x: Math.random() * W,
    y: H + 10,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(0.35 + Math.random() * 0.9),
    r: 0.6 + Math.random() * 1.7,
    life: 0,
    max: 240 + Math.random() * 200,
  });
  for (let i = 0; i < 46; i++) {
    const e = spawn();
    e.y = Math.random() * H;
    e.life = Math.random() * e.max;
    P.push(e);
  }

  let active = false;
  let raf = 0;
  const tick = () => {
    if (!active) return;
    ctx.clearRect(0, 0, W, H);
    for (const e of P) {
      e.life++;
      if (e.life > e.max || e.y < -12) Object.assign(e, spawn());
      e.x += e.vx + Math.sin((e.y + e.life) * 0.01) * 0.22;
      e.y += e.vy;
      const a = Math.sin((e.life / e.max) * Math.PI) * 0.85;
      ctx.beginPath();
      ctx.fillStyle = `rgba(190, 255, 110, ${a.toFixed(3)})`;
      ctx.shadowColor = "rgba(150, 235, 60, 0.8)";
      ctx.shadowBlur = 6;
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([en]) => {
    const on = en.isIntersecting;
    if (on && !active) {
      active = true;
      raf = requestAnimationFrame(tick);
    } else if (!on) {
      active = false;
      cancelAnimationFrame(raf);
    }
  }).observe(canvas);
}
embers();

/* ============================================================
   SOUND — foundry ambience + PA line (opt-in)
   ============================================================ */
const soundBtn = document.getElementById("soundBtn")!;
let audioCtx: AudioContext | null = null;
let ambienceGain: GainNode | null = null;
let ambienceEl: HTMLAudioElement | null = null;
let paPlayed = false;
let soundOn = false;

async function enableSound() {
  audioCtx ??= new AudioContext();
  await audioCtx.resume();

  if (!ambienceEl) {
    ambienceEl = new Audio("/audio/ambience.mp3");
    ambienceEl.loop = true;
    const src = audioCtx.createMediaElementSource(ambienceEl);
    ambienceGain = audioCtx.createGain();
    ambienceGain.gain.value = 0;
    src.connect(ambienceGain).connect(audioCtx.destination);
  }
  try {
    await ambienceEl.play();
    ambienceGain!.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 1.6);
  } catch {
    /* no ambience file yet: stay silent, PA may still work */
  }

  if (!paPlayed) {
    paPlayed = true;
    setTimeout(() => {
      if (!soundOn) return;
      const pa = new Audio("/audio/pa.mp3");
      pa.volume = 0.9;
      pa.play().catch(() => {});
    }, 1400);
  }
}

function disableSound() {
  if (ambienceGain && audioCtx) {
    ambienceGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    setTimeout(() => ambienceEl?.pause(), 600);
  }
}

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.setAttribute("aria-pressed", String(soundOn));
  soundBtn.querySelector(".ctrlbtn__label")!.textContent = soundOn ? "SOUND ON" : "SOUND OFF";
  soundOn ? enableSound() : disableSound();
});
