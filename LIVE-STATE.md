# The Green Foundry (robbgreen.com) — LIVE STATE
Updated: 2026-07-14 · by Claude Code session

## Goal
robbgreen.com rebuilt as an award-style capability showcase (dark foundry pouring
molten green). Site is LIVE and stable; remaining work is brand rollout (LinkedIn)
and optional polish.

## Done (recent)
- 07-12: RG monogram favicon LIVE (svg+png+ico+apple-touch, cut from Big Shoulders
  900 outlines via tools/make_favicon.py). Verified 200s on robbgreen.com 07-14.
- 07-12: Hero subline + meta changed to "I build AI systems that deliver ROI."
- 07-12: 3 foundry-graded headshots (base: "Robb headshot 2023.png") on Desktop:
  robbgreen-headshot-{pour,foundry-smile,embers}.png. Robb prefers this base.
- 07-11: LinkedIn cover (1584x396) + copy doc on Desktop (robbgreen-linkedin-*).
- 07-11: Motion TIERED after Robb saw static prod: liquid layer (shader/fill/pipe/
  embers) always on, calm=0.55 under reduce-motion; big moves stay gated.
- 07-11: robbgreen.com + www moved OFF project robbgreen-console → robbgreen-foundry
  (via Vercel API detach/attach). Old console still at robbgreen-console.vercel.app.
- 07-11: Site built + shipped: WebGL heat-mask hero, GSAP machine rail, scroll-poured
  wordmark, halftone operator card, ElevenLabs ambience + PA line ("Foundry line").

## In-flight
- Nothing running. No background tasks, dev server stopped, repo clean & pushed.

## Next (ordered)
1. LinkedIn rollout (Robb, manual): upload ~/Desktop/robbgreen-linkedin-cover.png,
   pick headshot (rec: robbgreen-headshot-pour.png), paste headline/About from
   ~/Desktop/robbgreen-linkedin-copy.md. NOTE: copy doc still says "businesses
   actually pay for"; site now says "deliver ROI" — regenerate doc if he wants match.
2. Optional: point console.robbgreen.com at project robbgreen-console (one
   `vercel domains add` + API attach) if the old console should stay reachable.
3. Optional polish: Lighthouse pass on prod; real-iPhone QA of the stacked floor;
   consider swapping og.jpg to a version with the RG mark.
4. If Robb wants kie.ai working: paste real key into ~/clawd/secrets/kie.env
   (currently PLACEHOLDER; all gen ran via OpenRouter instead).

## Gotchas & decisions
- HOME (~) IS A GIT REPO. Any `git add` in a folder without its own .git stages the
  entire home dir. ALWAYS `git rev-parse --show-toplevel` before git ops. Also:
  `git init` under sandbox writes a broken partial .git — init sandbox-off.
- Robb's Mac has macOS Reduce Motion ON (all his machines assume so). Motion is
  tiered in code; his Chrome has localStorage foundry-motion=1 → full cinematics.
  URL overrides: ?motion=1|0. Do NOT regress the always-on liquid tier.
- Deploy = `git push` then `vercel deploy --prod --scope solving-alphas-projects`
  from repo root. No git integration; CLI only. Vercel CLI v54 prints JSON with
  next[] commands; `vercel domains add <domain> <project>` needs the project arg;
  cross-project domain moves need the REST API (token in ~/.vercel/auth.json or
  ~/Library/Application Support/com.vercel.cli/auth.json).
- Sandbox traps hit this session: sips can't write its temp dir (use ffmpeg);
  dig/localhost-curl/dev-server need sandbox-off; qlmanage renders svg→png fine.
- Image gen: tools/gen_images.py → OpenRouter google/gemini-3.1-flash-image;
  supports img2img via per-item "image" field; --only <ids> regenerates subsets.
  Curl transport (urllib IncompleteRead on big bodies). ~$0.04/image.
- Voice/SFX: tools/gen_audio.sh → ElevenLabs TTS (voice Daniel onwK4e9ZLuTAKqWW03F9)
  + sound-generation; PA post-processed with ffmpeg tannoy chain. PA script says
  "The Foundry line is live, and taking payments."
- WebGL + CDP screenshots: canvas needs preserveDrawingBuffer:true or it captures
  black; never kill the rAF loop from an IntersectionObserver (gate draws instead).
- Em-dash ban + design-taste pre-flight applied to all copy; keep new copy compliant.
- LinkedIn banner compositor: tools/linkedin-banner.html (serve via `npx vite
  --port 5199` sandbox-off, element-screenshot, ffmpeg crop 3168:792:116:304 → 1584x396).

## Data & locations
- Repo: ~/robbgreen-foundry · GitHub regreenjr/robbgreen-foundry (public, main)
- Vercel: project robbgreen-foundry, team solving-alphas-projects (scope flag)
- Live: https://robbgreen.com (+ www 308→apex) · old site: robbgreen-console.vercel.app
- Desktop deliverables: robbgreen-linkedin-cover.png, robbgreen-linkedin-copy.md,
  robbgreen-headshot-{pour,foundry-smile,embers}.png
- Source photos: ~/Desktop/Robb 1.4.26/Robb Green Headshots/ (best: Artica 4402px,
  "Robb headshot 2023.png" = Robb's preferred base)
- Generated assets: generated/{batch1,licover,headshot}/ + manifests; site images
  public/img/; audio public/audio/
- Secrets (names only): ~/clawd/secrets/openrouter.env (real), elevenlabs.env (real),
  kie.env (PLACEHOLDER)
- Memory notes: [[project-robbgreen-foundry]], [[reference-reduce-motion-robb-mac]]

## Other sessions / agents
- None. No other agent has claimed work on this project.
