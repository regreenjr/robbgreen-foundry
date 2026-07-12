#!/usr/bin/env python3
"""Generate images via OpenRouter image models (Gemini image). Saves PNGs + manifest."""
import base64, json, os, re, subprocess, sys, tempfile, time, argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

SECRETS = Path.home() / "clawd/secrets/openrouter.env"
API = "https://openrouter.ai/api/v1/chat/completions"

def key():
    for line in SECRETS.read_text().splitlines():
        if line.startswith("OPENROUTER_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("no OPENROUTER_API_KEY")

def gen_one(k, model, item, aspect, outdir):
    body = {
        "model": model,
        "messages": [{"role": "user", "content": item["prompt"]}],
        "modalities": ["image", "text"],
        "image_config": {"aspect_ratio": aspect},
    }
    t0 = time.time()
    last_err = None
    for attempt in range(3):
        try:
            with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
                json.dump(body, tf)
                bp = tf.name
            p = subprocess.run(
                ["curl", "-sS", "--max-time", "240", "--retry", "2", API,
                 "-H", f"Authorization: Bearer {k}", "-H", "Content-Type: application/json",
                 "--data", f"@{bp}"],
                capture_output=True, text=True, timeout=300)
            os.unlink(bp)
            if p.returncode != 0:
                raise RuntimeError(f"curl: {p.stderr[:200]}")
            d = json.loads(p.stdout)
            if "error" in d:
                raise RuntimeError(str(d["error"])[:300])
            msg = d["choices"][0]["message"]
            imgs = msg.get("images") or []
            if not imgs:
                raise RuntimeError(f"no image in response: {str(msg)[:200]}")
            url = imgs[0]["image_url"]["url"]
            m = re.match(r"data:image/(\w+);base64,(.*)", url, re.S)
            if not m:
                raise RuntimeError(f"unexpected image url: {url[:80]}")
            ext, b64 = m.group(1), m.group(2)
            fp = Path(outdir) / f"{item['id']}.{ 'png' if ext=='png' else ext }"
            fp.write_bytes(base64.b64decode(b64))
            usage = d.get("usage", {})
            return {"id": item["id"], "status": "success", "path": str(fp),
                    "secs": round(time.time() - t0, 1), "usage": usage}
        except Exception as e:
            last_err = str(e)[:300]
            time.sleep(3 * (attempt + 1))
    return {"id": item["id"], "status": "error", "error": last_err}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompts-json", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="google/gemini-3.1-flash-image")
    ap.add_argument("--aspect", default="16:9")
    ap.add_argument("--only", default=None, help="comma-separated ids to regenerate")
    a = ap.parse_args()
    items = json.load(open(a.prompts_json))
    if a.only:
        want = set(a.only.split(","))
        items = [i for i in items if i["id"] in want]
    os.makedirs(a.out, exist_ok=True)
    k = key()
    results = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(gen_one, k, i.get("model", a.model), i, i.get("aspect", a.aspect), a.out): i for i in items}
        for f in as_completed(futs):
            r = f.result()
            results.append(r)
            print(r["id"], r["status"], r.get("secs", ""), r.get("error", ""))
    mp = Path(a.out) / "manifest.json"
    mp.write_text(json.dumps({"model": a.model, "results": results}, indent=2))
    ok = sum(1 for r in results if r["status"] == "success")
    print(f"done: {ok}/{len(results)} ok -> {a.out}")

if __name__ == "__main__":
    main()
