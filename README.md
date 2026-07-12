# THE GREEN FOUNDRY

robbgreen.com rebuilt as a concept piece: a heavy-industrial works with a
population of one. The site is a descent through a foundry that pours molten
green metal. Every product is a machine on the floor; Robb is Operator No. 001.

## Run

```bash
npm install
npm run dev        # http://localhost:5199 (or default vite port)
npm run build      # production build -> dist/
```

## The techniques in the build

1. **Custom WebGL shader (raw GLSL, no three.js)** on the hero: reads the
   molten regions of the generated image (green-channel heat mask) and
   animates only them: rising heat haze, drifting embers, breathing glow, plus a
   cursor-reactive ripple. `src/shader.ts`.
2. **GSAP scroll cinematics**: pinned horizontal rail through the four
   machines with per-slide image parallax (containerAnimation) and staggered
   panel reveals; scroll-poured molten fill inside the outlined FOUNDRY
   wordmark; masked-line typography reveals.
3. **Molten progress pipe**: a fixed pipeline down the left edge fills with
   green as you descend (POUR n%) - the site's scroll progress as plumbing.
4. **Canvas halftone portrait**: the operator ID photo is re-rendered live as
   phosphor halftone dots with a contrast curve. `halftone()` in `src/main.ts`.
5. **Generated sound design (opt-in)**: ElevenLabs foundry-ambience loop
   (crossfaded seamless via ffmpeg) + a PA announcement pushed through a
   tannoy chain (bandpass, bitcrush, slap echo). SOUND toggle, bottom right.
6. **Ember particle canvas** over the finale pour.

## Motion accessibility (two tiers)

The **liquid layer** (furnace haze, embers, cursor ripple, molten wordmark
fill, progress pipe) always runs; under `prefers-reduced-motion` it is
dampened via the shader's `u_calm` uniform. The **big moves** (pinned
horizontal rail, parallax, reveal choreography) follow the system preference,
with a MOTION ON/OFF override (bottom right, persisted in localStorage,
`?motion=1|0` URL override). With motion off, the floor stacks vertically.

## Assets

All imagery generated for this build (Gemini image model via OpenRouter,
prompts in `tools/prompts-batch1.json`, generator `tools/gen_images.py`).
Audio generated via ElevenLabs (`tools/gen_audio.sh`). Total spend ~$0.75.

The kie.ai key at `~/clawd/secrets/kie.env` is a placeholder
(`PASTE_..._HERE`), so generation ran on the OpenRouter + ElevenLabs keys
instead. Paste a real KIE key there to use the kie-z-image-batch skill.

## Stack

Vite + TypeScript + GSAP/ScrollTrigger. Fonts self-hosted via Fontsource:
Big Shoulders Display / IBM Plex Mono / IBM Plex Sans. No other runtime deps.
Prod bundle: ~50 KB JS gzipped.
