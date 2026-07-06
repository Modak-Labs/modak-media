// Renders the full-frame title cards as <video>/cards/<name>.png.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const LOGO = `<svg width="72" height="72" viewBox="0 0 640 640">
  <g fill="#e6e6e6">
    <circle cx="320" cy="320" r="36"/>
    <rect x="288" y="90" width="64" height="130" rx="32"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(45 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(90 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(135 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(180 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(225 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(270 320 320)"/>
    <rect x="288" y="90" width="64" height="130" rx="32" transform="rotate(315 320 320)"/>
  </g>
</svg>`;

function html({ title, sub, brand = false, small = "" }) {
  return `<!DOCTYPE html><html><head><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px; height: 1080px; background: #141414;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #e6e6e6; gap: 28px;
    }
    .brandrow { display: flex; align-items: center; gap: 22px; }
    .word { font-size: 84px; font-weight: 600; letter-spacing: 0.01em; }
    h1 { font-size: ${brand ? 84 : 58}px; font-weight: 600; letter-spacing: 0.01em; text-align: center; max-width: 1500px; }
    p  { font-size: 30px; font-weight: 400; color: #999999; text-align: center; max-width: 1300px; line-height: 1.5; }
    .small { font-size: 22px; color: #666666; margin-top: 18px;
      font-family: "SF Mono", ui-monospace, Menlo, monospace; }
  </style></head><body>
    ${brand ? `<div class="brandrow">${LOGO}<span class="word">tierdb</span></div>` : `<h1>${title}</h1>`}
    ${brand && title ? `<h1 style="font-size:40px;font-weight:400;color:#e6e6e6">${title}</h1>` : ""}
    ${sub ? `<p>${sub}</p>` : ""}
    ${small ? `<div class="small">${small}</div>` : ""}
  </body></html>`;
}

const cards = {
  explainer: {
    "card-intro": { brand: true, title: "", sub: "Fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg." },
    "card-outro": { brand: true, title: "", sub: "Fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg.", small: "watch the demo next &middot; github.com/Modak-Labs/tierdb" },
  },
  demo: {
    "card-intro": { brand: true, title: "The demo", sub: "An ordinary Postgres table, a worker moving data between tiers, and plain SQL over all of it. Live, no cuts." },
    "card-table": { title: "Start with an ordinary Postgres table", sub: "public.events has 5 rows across 3 range partitions, freshly registered with TierDB. The worker takes it from here." },
    "card-dml": { title: "Plain SQL. Any row. Either tier.", sub: "SELECT, INSERT, UPDATE, DELETE work across the whole timeline. Explain shows exactly where rows come from and go to." },
    "card-fold": { title: "Moments later", sub: "The worker folds the correction into Iceberg. The delta drains to zero, and the corrected row now lives in the lake." },
    "card-maint": { title: "Maintenance is optional", sub: "Compaction, snapshot expiry, and orphan cleanup run on a schedule with sane defaults. Or trigger a pass yourself: one click in the console, or one CLI command." },
    "card-outro": { brand: true, title: "", sub: "Fast, transparent and cost-effective data tiering between Postgres and Apache Iceberg.", small: "github.com/Modak-Labs/tierdb &middot; beta" },
  },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [video, specs] of Object.entries(cards)) {
  const out = path.join(import.meta.dirname, video, "cards");
  fs.mkdirSync(out, { recursive: true });
  for (const [name, spec] of Object.entries(specs)) {
    await page.setContent(html(spec));
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${name}.png` });
    console.log(`${out}/${name}.png`);
  }
}
await browser.close();
