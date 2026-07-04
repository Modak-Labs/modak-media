# Modak media

Video toolchain and assets for [Modak](https://github.com/Modak-Labs/modak).
Two videos, each around two minutes, assembled with ffmpeg and edge-tts
narration: `build/modak-explainer.mp4` (what Modak is, the modes, how to
choose) and `build/modak-demo.mp4` (the console demo, recorded live with
Playwright).

The intermediates are committed (LFS), so a small change only re-stitches:
tweak one scene, re-record that scene, then run finalize. Raw scene
recordings live in `build/raw`, narration audio in `build/nar`, title cards
and captions in `build/cards` and `build/caps`.

The demo scenes need `ffmpeg` on PATH and the Modak stack running with the
example data (`docker compose up -d --build`, then `./example/run.sh` in the
main repo). The explainer scenes only need `ffmpeg`.

```bash
npm install
python3 -m venv tts-venv && tts-venv/bin/pip install edge-tts

node cards.mjs
node captions.mjs

node explainer.mjs all      # animated explainer scenes
node finalize.mjs explainer

node record.mjs <scene>     # once per scene, see the list in record.mjs
node finalize.mjs demo
```

`shots.mjs` refreshes the console screenshots in the main repo's
`docs/assets` instead.
