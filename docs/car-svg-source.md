# Signature car SVG source

## Chosen asset

| Field | Value |
| --- | --- |
| **File** | `src/assets/signature/car-line.svg` (processed from FreeSVG download) |
| **Title** | Blueprints car (Shelby Cobra orthographic blueprint) |
| **Source page** | https://freesvg.org/blueprints-car |
| **Download** | https://freesvg.org/download/187364 |
| **Upstream** | Openclipart remix of Shelby Cobra blueprint (Public Domain) |
| **License** | **Public Domain / CC0** (FreeSVG: “Public Domain”; Creative Commons CC0 1.0 deed linked on page) |
| **Commercial use** | Yes — PD/CC0 allows copy, modify, distribute, and commercial use without attribution |

## Why this one (not an icon)

- **~162 stroked vector primitives** (paths, circles, rects) with thin line work — not a 10–20 path pictogram.
- Classic **multi-view technical blueprint**: top, side, front, and rear orthographic projections.
- Includes body panels, wheel arches, wire-spoke wheels, cockpit/seats, grille, lights, exhaust, and panel seams — suitable for stroke-dasharray “draw” animation.
- Explicit **stroke-based** geometry (`fill:none` + strokes), which is required for dashoffset animation. Higher-detail Ferrari/Alpine FreeSVG technical drawings were evaluated but are **fill-based CorelDRAW compound paths** and cannot drive a clean stroke draw.

## Candidates reviewed (rejected or runner-up)

1. **Ferrari 275 GTB 1964** — https://freesvg.org/ferrari-275gtb-1964 — Public Domain. Extremely detailed 4-view technical art (~400KB). **Rejected for integration:** fill-only compound paths (5 paths), not stroke-dasharray friendly.
2. **Renault Alpine A310 V6 1977** — https://freesvg.org/renault-alpine-a310-v6-1977 — Public Domain. Same fill-based technical style as Ferrari. **Rejected** for the same reason.
3. **SVG Repo “Sedan Car Model”** and similar outline icons — **Rejected** as flat icons / silhouettes.
4. **Wikimedia VW Golf 3 profile** — CC0, but colored filled side illustration, not a technical line blueprint.

## Honest quality note

This is a **genuine technical blueprint** (classic sports car / Cobra-style roadster), not a luxury sedan ¾ view. Free stroke-based premium-sedan SVGs with commercial-safe licenses were not found at comparable detail. Among free PD/CC0 options that support scroll draw animation, this was the strongest match.
