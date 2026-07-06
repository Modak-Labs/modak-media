// Assembles the explainer and demo videos from recorded scenes, cards,
// captions, and edge-tts narration.
// Usage: node finalize.mjs <explainer|demo>
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DIR = import.meta.dirname;

const sh = cmd => execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const dur = f => parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`));

const TTS = process.env.TTS || "edge";
const VOICE = process.env.VOICE || (TTS === "say" ? "Samantha" : "en-US-AndrewMultilingualNeural");
const EDGE = path.join(DIR, "tts-venv", "bin", "edge-tts");

const PLAYLISTS = {
  explainer: {
    out: "tierdb-explainer.mp4",
    parts: [
      { name: "card-intro", card: true, minDur: 3.4,
        say: "TierDB: fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg. Recent rows stay hot, history moves to the lake, and queries stay consistent across both." },
      { name: "problem", scene: true,
        say: "Most tables age. Recent rows are written and read constantly, while history piles up, bloating the heap and indexes, crowding hot rows out of cache, and slowing every vacuum and backup." },
      { name: "cutline", scene: true,
        say: "TierDB splits the table at a cut line. Rows above it live in Postgres, rows below it live in Iceberg, and one plain SQL query reads the whole timeline as a single table." },
      { name: "modes", scene: true,
        say: "Data reaches the lake one of two ways. Tiered moves whole partitions in bulk and drops them from Postgres. Mirrored trails every change by CDC while Postgres keeps its full copy." },
      { name: "choosing", scene: true,
        say: "The mode is a choice, not an assumption. Entity data mirrors fully. Aging data asks two questions. Should Postgres keep the whole copy? Keep-heap tiers batches without deleting anything. And must the lake trail in seconds? Then mirror with heap retention. Otherwise, plain tiered is the cheapest at scale." },
      { name: "corrections", scene: true,
        say: "Writes stay plain SQL everywhere. Updates to rows already in the lake land in a delta buffer, visible immediately, and the worker folds them into Iceberg moments later." },
      { name: "surfaces", scene: true,
        say: "The extension is the best experience: everything is plain SQL, transparent reads and DML across both tiers. The seam protocol is public, so connectors serve the same view without it: Spark today, a JVM client library to build on, Flink and Trino coming. And for streaming and backfills, Stream Load and bulk ingest beat plain SQL anyway." },
      { name: "card-outro", card: true, minDur: 3.6,
        say: "TierDB. Fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg. Watch the demo next." },
    ],
  },
  demo: {
    out: "tierdb-demo.mp4",
    parts: [
      { name: "card-intro", card: true, minDur: 3.2,
        say: "The demo. Plain Postgres, plain SQL, and a worker moving data between tiers, live." },
      { name: "overview", speed: 1.15,
        say: "The console shows every registered table, its cut line, its snapshot, and the worker's activity, live." },
      { name: "card-table", card: true, minDur: 3.0,
        say: "We start with an ordinary Postgres table, freshly registered with TierDB. The worker takes it from here." },
      { name: "tiering", speed: 1.5,
        say: "Both cold partitions move to Iceberg and are dropped from Postgres, live." },
      { name: "card-dml", card: true, minDur: 3.0,
        say: "Now, plain SQL against both tiers." },
      { name: "select", speed: 1.3,
        say: "One plain SELECT returns every row. Recent rows come from the heap, history from Iceberg." },
      { name: "explain", speed: 1.3,
        say: "Explain shows the routing. A pinned Iceberg snapshot serves the history." },
      { name: "update", speed: 1.6,
        say: "A plain UPDATE of a cold row is rewritten into two halves. The correction lands in the delta, visible immediately." },
      { name: "card-fold", card: true, minDur: 2.8,
        say: "Moments later, the worker folds the delta into Iceberg." },
      { name: "folded", speed: 1.5,
        say: "The delta is empty, and the corrected row is now served straight from the lake." },
      { name: "insert", speed: 1.7,
        say: "One INSERT, two destinations. The recent row goes to the heap, the historical row to the delta." },
      { name: "card-maint", card: true, minDur: 3.0,
        say: "Maintenance is optional. It runs on a schedule with sane defaults, or on demand." },
      { name: "maintenance", speed: 1.8,
        say: "Lake health, per table. One click files a maintenance request, and the worker journals the pass: compaction, snapshot expiry, orphan cleanup." },
      { name: "outro", speed: 1.25,
        say: "Tiering, folding, maintenance, and partition premake, all in the background, all visible." },
      { name: "card-outro", card: true, minDur: 3.6,
        say: "TierDB. Fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg." },
    ],
  },
};

const which = process.argv[2];
if (!PLAYLISTS[which]) {
  console.error("usage: node finalize.mjs <explainer|demo>");
  process.exit(1);
}
const { out, parts } = PLAYLISTS[which];
process.chdir(path.join(DIR, which));
for (const d of ["segments", "narration"]) fs.mkdirSync(d, { recursive: true });

// Phonetic respellings steer the TTS voice; verb uses of "live" are left alone.
for (const p of parts) {
  const txt = p.say
    .replace(/Postgres/g, "Postgress")
    .replace(/, live([.,])/g, ", lyve$1")
    .replace(/^Live([.,])/g, "Lyve$1")
    .replace(/"/g, '\\"');
  if (TTS === "say") {
    execSync(`say -v "${VOICE}" -o narration/${p.name}.aiff "${txt}"`);
    p.nar = `narration/${p.name}.aiff`;
  } else {
    execSync(`${EDGE} --voice "${VOICE}" --text "${txt}" --write-media narration/${p.name}.mp3`);
    p.nar = `narration/${p.name}.mp3`;
  }
  p.narDur = dur(p.nar);
}

for (const p of parts) {
  if (p.card) {
    p.outDur = Math.max(p.minDur, p.narDur + 1.0);
    const fadeOut = (p.outDur - 0.4).toFixed(2);
    execSync(
      `ffmpeg -y -v error -loop 1 -t ${p.outDur.toFixed(2)} -i cards/${p.name}.png ` +
      `-vf "fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=0.4,format=yuv420p" ` +
      `-c:v libx264 -crf 18 -preset medium segments/${p.name}.mp4`
    );
  } else if (p.scene) {
    const inDur = dur(`scenes/${p.name}.webm`);
    p.outDur = inDur;
    const fadeOut = (p.outDur - 0.4).toFixed(2);
    execSync(
      `ffmpeg -y -v error -i scenes/${p.name}.webm ` +
      `-vf "fps=30,fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.35,format=yuv420p" ` +
      `-an -c:v libx264 -crf 18 -preset medium segments/${p.name}.mp4`
    );
    p.outDur = dur(`segments/${p.name}.mp4`);
  } else {
    const inDur = dur(`scenes/${p.name}.webm`);
    p.outDur = inDur / p.speed;
    const fadeOut = (p.outDur - 0.4).toFixed(2);
    execSync(
      `ffmpeg -y -v error -i scenes/${p.name}.webm -i captions/${p.name}.png ` +
      `-filter_complex "[0:v]setpts=PTS/${p.speed},fps=30[v];[v][1:v]overlay=0:0,` +
      `fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.35,format=yuv420p[out]" ` +
      `-map "[out]" -an -c:v libx264 -crf 18 -preset medium segments/${p.name}.mp4`
    );
    p.outDur = dur(`segments/${p.name}.mp4`);
  }
  console.log(`${p.name}: video ${p.outDur.toFixed(1)}s, narration ${p.narDur.toFixed(1)}s`);
}

let t = 0;
for (const p of parts) {
  p.offset = t + 0.4;
  if (p.narDur + 0.4 > p.outDur + 1.5) {
    console.warn(`WARN ${p.name}: narration ${p.narDur.toFixed(1)}s vs segment ${p.outDur.toFixed(1)}s`);
  }
  t += p.outDur;
}
console.log(`total ${t.toFixed(1)}s`);

fs.writeFileSync("segments/list.txt", parts.map(p => `file '${p.name}.mp4'`).join("\n") + "\n");
execSync(`ffmpeg -y -v error -f concat -safe 0 -i segments/list.txt -c copy segments/video-only.mp4`);

const inputs = parts.map(p => `-i ${p.nar}`).join(" ");
const delays = parts
  .map((p, i) => {
    const ms = Math.round(p.offset * 1000);
    return `[${i + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=${ms}|${ms}[a${i}]`;
  })
  .join(";");
const mix = parts.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${parts.length}:normalize=0[a]`;
execSync(
  `ffmpeg -y -v error -i segments/video-only.mp4 ${inputs} ` +
  `-filter_complex "${delays};${mix}" ` +
  `-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -shortest ${out}`
);
console.log(sh(`ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 ${out}`));
console.log("DONE");
