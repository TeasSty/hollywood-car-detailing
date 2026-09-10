# Signature 3D car model

## Chosen asset (shipped)

| Field | Value |
| --- | --- |
| **File** | `public/models/car-concept.glb` |
| **Title** | CarConcept |
| **Source** | [Khronos glTF-Sample-Assets / CarConcept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept) |
| **Upstream** | Public-domain concept car by [Unity Fan on Sketchfab](https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e) (CC0), optimized by Darmstadt Graphics Group / Khronos |
| **License** | Upstream mesh **CC0**; Khronos packaging / logos — see sample asset README (attribution appreciated) |
| **Commercial use** | **Yes** — suitable for a commercial detailing website |
| **On-page credit** | `#signature` → `.signature__credit` |

Rendered as **dark studio + EdgesGeometry wireframe** (technical sketch). Scene persists after first load (scroll-away only pauses the render loop). First viewport entry plays a one-shot material reveal.

## Rejected: user-requested Audi e-tron GT

| Field | Value |
| --- | --- |
| **Model** | [2018 Audi e-tron GT Concept](https://sketchfab.com/3d-models/2018-audi-e-tron-gt-concept-e35726151c9e4a169c005d54509715fa) by Ddiaz Design |
| **Sketchfab license** | **CC Attribution-NonCommercial-ShareAlike (CC BY-NC-SA 4.0)** |
| **API requirements** | “Author must be credited. **No commercial use.** Modified versions must have the same license.” |
| **Additional risk** | Description: “Based on a Real Racing 3 3d model” (game-derived) |
| **Decision** | **Not used.** HOLLYWOOD CAR DETAILING is a commercial business site — NC forbids this use. We do not pirate / re-host it. |

### Legal alternatives (if swapping later)

1. **Khronos CarConcept** — shipped (this file).
2. **Sketchfab CC-BY commercial OK** examples (download via Sketchfab account; attribute author): e.g. “AUDI RS7 Free \| Low Poly” (`d54df8dbc0904a3980d0dd1a8095caf8`) — verify each model is not a game rip before shipping.
3. **Kenney Car Kit sedan (CC0)** — tiny / toy look; previously rejected for premium UX.
4. **Sketchfab embed** of the e-tron — legal for viewing, but cannot drive custom wireframe + projected hotspots.

## Hotspots ↔ prices

One hotspot lights **exactly one** price row (no multi-row “repeat” highlight). Zone list: оптика, плёнка, полировка, керамика, стёкла, салон, колёса/шумка, зад/антикор.
