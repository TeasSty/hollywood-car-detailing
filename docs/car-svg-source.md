# Signature car SVG source

## Chosen asset

| Field | Value |
| --- | --- |
| **File** | `src/assets/signature/car-line.svg` (processed from Openclipart) |
| **Title** | Concept Car Line Art 2 By LeeRosario |
| **Source page** | https://openclipart.org/detail/313046/concept-car-line-art-2-by-leerosario |
| **Mirror** | https://freesvg.org/1545945717 (related Concept Car Line Art series) |
| **Upstream** | GDJ remix from Pixabay concept-car photograph → vector line art |
| **License** | **Public Domain / CC0** (Openclipart PD dedication) |
| **Commercial use** | Yes — PD/CC0 allows copy, modify, distribute, and commercial use without attribution |

## Why this one

- **¾ front premium sedan / concept coupe** — matches the gold-callout mockup intent far better than orthographic Shelby Cobra blueprints.
- **~218 filled vector primitives** forming fine technical line work (not a 10–20 path pictogram).
- Reads as **white wireframe on dark** when `fill` is set to `currentColor`.
- Scroll “draw” uses **progressive opacity reveal** (fill-based art); gold hotspots, elbow callouts, and price sync stay unchanged.

## Candidates reviewed

1. **Shelby Cobra orthographic blueprint** (FreeSVG / Openclipart CC0) — strong stroke-dasharray candidate; **replaced** because multi-view roadster ≠ premium sedan ¾.
2. **Ferrari 275 GTB 1964 / Alpine A310** — PD technical sheets; fill-only CorelDRAW compounds; classic sports cars, not sedan ¾.
3. **Mercedes Class A W169 outline** (Openclipart PD) — stroke-based side outline; too sparse / side-only for callout theatre.
4. **Honda S2000 outline** — stroke-based; sports roadster, incomplete visual weight.
5. **Car lineart (halftone vintage)** — ¾ view but comic/halftone, not technical premium.
6. **SVG Repo / silhouette sedans** — rejected as flat icons.
7. **Kenney / low-poly GLB** — previously rejected by user as toy-like; quality free commercial sedans on Sketchfab are often rip-derived or NC — not shipped.

## Processing

`scripts/process-signature-car.mjs` strips metadata, sorts paths front→rear, tags `data-tier` / `data-draw-order`, and writes `src/assets/signature/car-line.svg`.

## Honest quality note

This is a **genuine detailed concept-sedan line drawing** in ¾ view. It is **fill-based** (line shapes as filled paths), so animation is opacity reveal rather than stroke-dashoffset. Free **stroke-based** commercial-OK premium-sedan ¾ SVGs at this detail level were not found after thorough search.
