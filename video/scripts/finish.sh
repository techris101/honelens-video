#!/usr/bin/env bash
# Joins rendered chunks into one master per film (single high-quality H.264 encode), then muxes the
# synthesized soundtrack: <name>.mp4 (music + sound design), <name>-sfx-only.mp4, <name>-silent.mp4.
# Runs on GitHub Actions after the render matrix. Needs ffmpeg and public/audio/*.wav (make-audio.mjs).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/final
encode() { # comp name
  local comp="$1" name="$2"
  ls out/chunks/"$comp"-*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > "out/$comp-list.txt"
  cat "out/$comp-list.txt"
  ffmpeg -hide_banner -loglevel warning -y -f concat -safe 0 -i "out/$comp-list.txt" \
    -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 60 -g 120 \
    -movflags +faststart -an "out/$comp-master.mp4"
  local kind; kind=$(echo "$comp" | tr '[:upper:]' '[:lower:]')
  ffmpeg -hide_banner -loglevel warning -y -i "out/$comp-master.mp4" -i "public/audio/$kind-full.wav" \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "out/final/$name.mp4"
  ffmpeg -hide_banner -loglevel warning -y -i "out/$comp-master.mp4" -i "public/audio/$kind-sfx.wav" \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "out/final/$name-sfx-only.mp4"
  cp "out/$comp-master.mp4" "out/final/$name-silent.mp4"
  ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate -of compact "out/final/$name.mp4"
}
encode Short "HoneLENS-short-55s-1080x1920"
encode Long "HoneLENS-long-2m46s-1920x1080"
ls -la out/final
