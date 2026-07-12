/* ============================================================
   Hero furnace shader.
   Raw WebGL1. Reads the molten (green) regions of the texture
   and animates ONLY them: heat haze, ember drift, cursor ripple.
   ============================================================ */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_texRes;
uniform float u_time;
uniform vec2 u_mouse;      // px, smoothed
uniform float u_mouseAmp;  // 0..1 ripple energy
uniform float u_scroll;    // 0..1 across hero scroll
uniform float u_calm;      // 1 = full ambience, <1 = dampened (reduced motion)

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

// cover-fit uv
vec2 coverUV(vec2 uv) {
  float ca = u_res.x / u_res.y;
  float ta = u_texRes.x / u_texRes.y;
  vec2 s = vec2(1.0);
  if (ca > ta) { s.y = ta / ca; } else { s.x = ca / ta; }
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = coverUV(v_uv);

  // slow scroll zoom + drift down
  float z = 1.0 + u_scroll * 0.14;
  uv = (uv - 0.5) / z + 0.5;
  uv.y += u_scroll * 0.05;
  uv.y = 1.0 - uv.y;

  // molten mask from a cheap pre-read
  vec3 base = texture2D(u_tex, uv).rgb;
  float heat = clamp(base.g - max(base.r, base.b) * 0.9, 0.0, 1.0);
  heat = smoothstep(0.03, 0.35, heat);

  // rising heat haze, strongest over molten areas
  vec2 flow = vec2(0.0, u_time * 0.32);
  float n = fbm(uv * 7.0 + flow);
  vec2 haze = vec2(n - 0.5, fbm(uv * 7.0 + flow + 4.7) - 0.5);
  vec2 warp = haze * (0.0035 + heat * 0.016) * u_calm;

  // cursor ripple
  vec2 m = u_mouse / u_res;
  m.y = 1.0 - m.y;
  m = coverUV(m);
  float d = distance(uv * vec2(u_texRes.x / u_texRes.y, 1.0), m * vec2(u_texRes.x / u_texRes.y, 1.0));
  float ring = sin(d * 34.0 - u_time * 4.2) * exp(-d * 7.0);
  warp += normalize(uv - m + 1e-5) * ring * 0.006 * u_mouseAmp;

  vec3 col = texture2D(u_tex, uv + warp).rgb;

  // ember sparks drifting upward, only near hot zones
  vec2 gp = uv * vec2(90.0, 60.0);
  vec2 cell = floor(gp + vec2(0.0, -u_time * 6.0));
  float h = hash(cell);
  vec2 cuv = fract(gp + vec2(0.0, -u_time * 6.0)) - 0.5;
  float spark = smoothstep(0.12, 0.0, length(cuv + (vec2(h, hash(cell + 9.1)) - 0.5) * 0.6));
  float twinkle = step(0.986, h) * (0.55 + 0.45 * sin(u_time * 9.0 + h * 40.0));
  col += vec3(0.62, 0.95, 0.25) * spark * twinkle * heat * 1.7 * u_calm;

  // molten breathing glow
  float pulse = 0.92 + 0.08 * sin(u_time * 1.6 + uv.x * 3.0) * u_calm;
  col += vec3(0.30, 0.62, 0.10) * heat * 0.20 * pulse;

  // cursor hotspot lift
  col += vec3(0.5, 0.9, 0.2) * exp(-d * 10.0) * 0.10 * u_mouseAmp;

  // vignette + scroll dim
  float vig = 1.0 - smoothstep(0.42, 1.25, length(v_uv - 0.5));
  col *= mix(0.72, 1.0, vig);
  col *= 1.0 - u_scroll * 0.35;

  gl_FragColor = vec4(col, 1.0);
}`;

export interface FurnaceHandle {
  setScroll(v: number): void;
  destroy(): void;
}

export function mountFurnace(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  opts: { animate: boolean; calm?: number }
): FurnaceHandle | null {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U("u_res"), uTexRes = U("u_texRes"), uTime = U("u_time"),
    uMouse = U("u_mouse"), uAmp = U("u_mouseAmp"), uScroll = U("u_scroll"),
    uCalm = U("u_calm");

  gl.uniform2f(uTexRes, img.naturalWidth, img.naturalHeight);
  gl.uniform1f(uCalm, opts.calm ?? 1);

  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.round(r.width * dpr);
    H = Math.round(r.height * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
      gl!.viewport(0, 0, W, H);
      gl!.uniform2f(uRes, W, H);
    }
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let mx = W / 2, my = H * 0.45, tx = mx, ty = my, amp = 0, tAmp = 0;
  let scroll = 0;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    tx = (e.clientX - r.left) * dpr;
    ty = (e.clientY - r.top) * dpr;
    tAmp = 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // rAF stays alive; drawing is gated by visibility so a missed observer
  // event can never kill the render loop permanently.
  let raf = 0;
  let visible = true;
  let alive = true;
  let t = 0;
  let last = performance.now();
  let needsDraw = true;

  function frame(now: number) {
    if (!alive) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (visible && (opts.animate || needsDraw)) {
      t += dt;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      tAmp *= 0.97;
      amp += (tAmp - amp) * 0.08;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uMouse, mx, my);
      gl!.uniform1f(uAmp, amp);
      gl!.uniform1f(uScroll, scroll);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      needsDraw = false;
    }
    raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) needsDraw = true;
  });
  io.observe(canvas);
  raf = requestAnimationFrame(frame);

  return {
    setScroll(v: number) {
      scroll = v;
      needsDraw = true;
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    },
  };
}
