import sharp from "sharp";
import fs from "node:fs";

const svg = fs.readFileSync("src/assets/signature/car-line.svg", "utf8");
const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="620" viewBox="0 0 2637.1 887.5">
  <rect width="2637.1" height="887.5" fill="#050505"/>
  <g style="color:#E8E4DC">${inner}</g>
</svg>`;

await sharp(Buffer.from(wrapped)).png().toFile("tmp-svg-candidates/qa-car-render.png");
console.log("wrote tmp-svg-candidates/qa-car-render.png");
