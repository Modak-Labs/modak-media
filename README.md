# Modak media

Brand assets and the video toolchain for [Modak](https://github.com/Modak-Labs/modak).

- `images/`: logo, favicon, and console screenshots.
- `video/`: two videos, each around two minutes, assembled with ffmpeg and
  edge-tts narration: `build/modak-explainer.mp4` (what Modak is, the modes,
  how to choose) and `build/modak-demo.mp4` (the console demo, recorded with
  Playwright).

The video intermediates are committed (LFS), so a small change only
re-stitches: tweak one scene, re-record it, then run finalize. Raw scene
recordings live in `video/build/raw`, narration audio in `video/build/nar`,
title cards and captions in `video/build/cards` and `video/build/caps`.

## Building the videos

The demo scenes need `ffmpeg` on PATH and the Modak stack running with the
example data (`docker compose up -d --build`, then `./example/run.sh` in the
main repo). The explainer scenes only need `ffmpeg`.

```bash
cd video
npm install
python3 -m venv tts-venv && tts-venv/bin/pip install edge-tts

node cards.mjs
node captions.mjs

node explainer.mjs all      # animated explainer scenes
node finalize.mjs explainer

node record.mjs <scene>     # once per scene, see the list in record.mjs
node finalize.mjs demo
```

`shots.mjs` refreshes the console screenshots in `images/console`; copy them
into the main repo's `docs/assets` when they change.
