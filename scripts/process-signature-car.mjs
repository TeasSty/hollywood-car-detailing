/**
 * Process Openclipart Concept Car Line Art 2 (PD) into signature SVG.
 * Source: https://openclipart.org/detail/313046/concept-car-line-art-2-by-leerosario
 */
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("tmp-svg-candidates/concept2.svg");
const dest = path.resolve("src/assets/signature/car-line.svg");

let svg = fs.readFileSync(src, "utf8");

// Normalize root
svg = svg.replace(/<\?xml[^?]+\?>\s*/i, "");
svg = svg.replace(/<!DOCTYPE[^>]+>\s*/i, "");

const viewBoxMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
const viewBox = viewBoxMatch?.[1] ?? "0 0 2600 975";

// Extract path elements only (line-art is fill-based compound shapes)
const pathRe = /<path\b[^>]*\/?>/gi;
const paths = [...svg.matchAll(pathRe)].map((m) => m[0]);

if (paths.length < 20) {
  console.error(`Expected many paths, got ${paths.length}`);
  process.exit(1);
}

/** Rough path centroid from first move command for draw ordering (front → rear) */
function pathOrderKey(d) {
  const m = /[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(d || "");
  if (!m) return 0;
  const x = Number(m[1]);
  const y = Number(m[2]);
  // Prefer left/front (lower x) then upper body
  return x * 1000 + y;
}

const prepared = paths
  .map((raw, i) => {
    const dMatch = raw.match(/\bd\s*=\s*["']([^"']*)["']/i);
    const d = dMatch?.[1] ?? "";
    const key = pathOrderKey(d);
    return { raw, d, key, i };
  })
  .sort((a, b) => a.key - b.key);

const n = prepared.length;
const outPaths = prepared.map((p, order) => {
  // Tier: early main silhouette, mid body panels, late fine detail
  const t = order / Math.max(n - 1, 1);
  const tier = t < 0.22 ? "main" : t < 0.72 ? "panel" : "detail";
  const opacity = tier === "main" ? "0.92" : tier === "panel" ? "0.78" : "0.55";
  // Keep only the d attribute from source; rest is controlled by classes
  const dEsc = p.d.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `    <path class="signature__stroke-draw signature__stroke--${tier}" data-tier="${tier}" data-draw-order="${order + 1}" data-sig-fill="1" fill="currentColor" stroke="none" opacity="${opacity}" d="${dEsc}" />`;
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" class="signature__car signature__car--fill-art" aria-hidden="true" focusable="false" data-sig-car data-sig-mode="fill">
  <title>Concept sedan line art</title>
  <g class="signature__car-strokes" id="car-line-art">
${outPaths.join("\n")}
  </g>
</svg>
`;

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out, "utf8");
console.log(`Wrote ${dest} with ${outPaths.length} paths, viewBox=${viewBox}`);
