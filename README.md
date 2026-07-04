# Modak media

Brand assets and the video toolchain for [Modak](https://github.com/Modak-Labs/modak).

## Building the videos

The demo scenes need `ffmpeg` on PATH and the Modak stack running with the example data (`docker compose up -d --build`, then `./example/run.sh` in the main repo). The explainer scenes only need `ffmpeg`.

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

`shots.mjs` refreshes the console screenshots in `images/console`, copy them into the main repo's `docs/assets` when they change.
