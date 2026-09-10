import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "tmp-svg-candidates", "shelby-blueprint.svg");
const outDir = path.join(root, "src", "assets", "signature");
fs.mkdirSync(outDir, { recursive: true });

let svg = fs.readFileSync(src, "utf8");

svg = svg.replace(/<\?xml[\s\S]*?\?>/i, "");
svg = svg.replace(/<!DOCTYPE[\s\S]*?>/i, "");
svg = svg.replace(/<sodipodi:namedview[\s\S]*?\/>/gi, "");
svg = svg.replace(/<defs[\s\S]*?<\/defs>/gi, "");
svg = svg.replace(/<defs[\s\S]*?\/>/gi, "");
svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
svg = svg.replace(/<!--[\s\S]*?-->/g, "");
svg = svg.replace(/<rect\b[\s\S]*?id="rect9433"[\s\S]*?\/>/gi, "");
svg = svg.replace(/\s+inkscape:[a-zA-Z0-9\-]+=("[^"]*"|'[^']*')/g, "");
svg = svg.replace(/\s+sodipodi:[a-zA-Z0-9\-]+=("[^"]*"|'[^']*')/g, "");
svg = svg.replace(/\s+xmlns:(dc|cc|rdf|sodipodi|inkscape)="[^"]*"/g, "");

const openTag = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1307 1321" fill="none" class="signature__car" aria-hidden="true" focusable="false" data-sig-car>`;
svg = svg.replace(/<svg\b[\s\S]*?>/, openTag);

let pathIdx = 0;
const tierCounts = { main: 0, body: 0, panel: 0, detail: 0 };

function classify(tag, body, style) {
  const sw = parseFloat((style.match(/stroke-width\s*:\s*([0-9.]+)/i) || [])[1] || "2.5");
  let tier = "detail";
  let opacity = "0.55";
  let width = "1.1";
  if (sw >= 5) {
    tier = "main";
    opacity = "0.95";
    width = "1.55";
  } else if (sw >= 3.5) {
    tier = "body";
    opacity = "0.82";
    width = "1.3";
  } else if (sw >= 2.4) {
    tier = "panel";
    opacity = "0.7";
    width = "1.1";
  } else {
    tier = "detail";
    opacity = "0.48";
    width = "0.85";
  }

  if (tag === "circle") {
    const r = parseFloat((body.match(/\br="([0-9.]+)"/) || [])[1] || "0");
    if (r > 40) {
      tier = "main";
      opacity = "0.9";
      width = "1.35";
    } else if (r > 12) {
      tier = "body";
      opacity = "0.72";
      width = "1.1";
    } else {
      tier = "detail";
      opacity = "0.5";
      width = "0.9";
    }
  }
  return { tier, opacity, width };
}

svg = svg.replace(/<(path|circle|rect|ellipse)\b([\s\S]*?)\/>/gi, (m, tagRaw, body) => {
  const tag = tagRaw.toLowerCase();
  const styleMatch = body.match(/\bstyle="([^"]*)"/i);
  const style = styleMatch ? styleMatch[1] : "";

  if (/fill\s*:\s*#4d4793/i.test(style)) return "";
  if (/stroke\s*:\s*none/i.test(style) && !/fill\s*:\s*none/i.test(style)) return "";
  if (!/stroke\s*:/i.test(style)) return "";

  pathIdx += 1;
  const { tier, opacity, width } = classify(tag, body, style);
  tierCounts[tier] += 1;

  let attrs = body
    .replace(/\bstyle="[^"]*"/gi, "")
    .replace(/\bid="[^"]*"/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return `<${tag} id="stroke-${pathIdx}" class="signature__stroke-draw signature__stroke--${tier}" data-tier="${tier}" data-draw-order="${pathIdx}" stroke="currentColor" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${attrs} />`;
});

// Wrap existing root group content with our strokes class on outermost g
svg = svg.replace(
  /<g\b([^>]*)id="g9603"([^>]*)>/i,
  `<g class="signature__car-strokes" id="car-blueprint"$1$2>`,
);

// Clean empty lines
svg = svg.replace(/\n[ \t]*\n/g, "\n");

const outPath = path.join(outDir, "car-line.svg");
fs.writeFileSync(outPath, svg.endsWith("\n") ? svg : svg + "\n");
console.log("Wrote", outPath);
console.log("elements tagged:", pathIdx);
console.log("tiers", tierCounts);
console.log("bytes:", fs.statSync(outPath).size);
