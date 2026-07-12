#!/bin/bash
# Generate foundry audio via ElevenLabs: ambience loop + PA announcement.
set -e
KEY=$(head -1 ~/clawd/secrets/elevenlabs.env | tr -d '[:space:]')
OUT="$(dirname "$0")/../public/audio"
mkdir -p "$OUT"

echo "--- sound effect: foundry ambience (22s)"
curl -sS -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"text":"Deep industrial foundry interior ambience. Low continuous furnace rumble, soft molten metal hiss, occasional distant metal clank echoing in a vast hall. Steady, loopable, no music, no voices.","duration_seconds":22,"prompt_influence":0.4}' \
  -o "$OUT/ambience-raw.mp3"
file "$OUT/ambience-raw.mp3" | head -1

echo "--- PA voice line"
curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9?output_format=mp3_44100_128" \
  -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"text":"Attention all floors. The Foundry line is live, and taking payments. The operator will see you now.","model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.55,"similarity_boost":0.7,"style":0.35}}' \
  -o "$OUT/pa-raw.mp3"
file "$OUT/pa-raw.mp3" | head -1

echo "--- post-process: PA through a tannoy chain (bandpass + crush + slap echo)"
ffmpeg -y -loglevel error -i "$OUT/pa-raw.mp3" \
  -af "highpass=f=400,lowpass=f=3200,acrusher=level_in=4:level_out=1:bits=10:mode=log:aa=1,aecho=0.7:0.28:38|63:0.32|0.18,volume=2.2,alimiter=limit=0.9" \
  "$OUT/pa.mp3"

echo "--- post-process: ambience seamless-ish loop (crossfade tail into head)"
DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT/ambience-raw.mp3")
ffmpeg -y -loglevel error -i "$OUT/ambience-raw.mp3" -i "$OUT/ambience-raw.mp3" \
  -filter_complex "[0:a]atrim=0:$(echo "$DUR-2.5" | bc)[a];[1:a]atrim=$(echo "$DUR-2.5" | bc),asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=2.2,lowpass=f=7000,volume=1.0[out]" \
  -map "[out]" "$OUT/ambience.mp3"
rm -f "$OUT/ambience-raw.mp3" "$OUT/pa-raw.mp3"
ls -la "$OUT"
