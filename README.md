# Slope Deflection Calculator

Analyse continuous beams and rigid plane frames by the **slope-deflection method**, entirely in the browser. Enter the spans, supports and loads, and the app forms the slope-deflection equations, solves the joint-equilibrium system for the unknown rotations, and returns the member end moments, support reactions, and bending-moment and shear-force diagrams.

**Live demo → [slope-deflection-calculator-psi.vercel.app](https://slope-deflection-calculator-psi.vercel.app)**

No sign-up, no install, nothing stored — the whole analysis runs client-side.

- [Beam analysis](https://slope-deflection-calculator-psi.vercel.app/beams)
- [Frame analysis](https://slope-deflection-calculator-psi.vercel.app/frames)

## What it does

Give it a beam and it returns the full hand-calculation chain, each step shown rather than just the answer:

1. **Fixed-end moments** for every span, from the load type.
2. **Slope-deflection equations** for each member end, printed with their `EI` coefficients.
3. **Joint rotations**, from moment equilibrium at every joint free to rotate.
4. **Final member end moments**, back-substituted.
5. **Support reactions**, from span equilibrium.
6. **Bending-moment and shear-force diagrams**, with the critical values per span.

Because every intermediate step is displayed, the output can be checked against a hand solution line by line — which is the point for coursework and for sanity-checking a design.

### Beams

- Any number of spans, from a single span upward.
- Supports: **fixed**, **pinned**, **roller**, and **free** ends. Overhangs are handled as statically determinate cantilevers.
- Loads: UDL, triangular loads peaking at either end, a central point load, a point load at an arbitrary distance, and two or three equally spaced point loads.
- **Support settlement** (sinking supports), entered per support.
- Per-span moment of inertia, for beams whose stiffness changes between spans.

### Frames

Rigid plane frames with columns and beams, including sway. See [Status](#status) below.

## Worked example

Three equal 6 m spans, UDL of 20 kN/m throughout, all supports pinned or roller, `E = 200 × 10⁶ kN/m²`, `I = 1 × 10⁻⁴ m⁴`:

| Quantity | App | Closed form |
| --- | --- | --- |
| Moment over supports B and C | 72.00 kNm | 0.100 wL² = 72 |
| Max sagging moment, outer spans | 57.60 kNm | 0.080 wL² = 57.6 |
| Max sagging moment, middle span | 18.00 kNm | 0.025 wL² = 18 |
| End reactions R<sub>A</sub>, R<sub>D</sub> | 48.00 kN | 0.40 wL = 48 |
| Interior reactions R<sub>B</sub>, R<sub>C</sub> | 132.00 kN | 1.10 wL = 132 |

## Conventions and units

**Units are not converted** — enter a consistent set. With lengths in m, loads in kN and kN/m, `E` in kN/m² and `I` in m⁴, the moments come back in kNm and the reactions in kN.

**Per-span `I` is a multiplier on the global moment of inertia**, not an absolute value. A span with `I = 2` is twice as stiff as one with `I = 1`.

**Member end moments** follow the usual slope-deflection convention: hogging is positive at a member's right-hand end and negative at its left-hand end, matching `FEM_AB = −wL²/12` and `FEM_BA = +wL²/12` for a UDL. So a hogging moment over an interior support appears positive on the span to its left and negative on the span to its right, and the two sum to zero at the joint. The moment at a pinned, roller or free end is zero.

## Status

The **beam solver is checked against closed-form results** — propped cantilever, fixed-fixed, simply supported, two- and three-span continuous beams, support settlement, a central point load, an overhang, and unequal span stiffness all reproduce the textbook values exactly.

The **frame solver has not been verified to the same standard.** It still uses the earlier approach of building equations as text and recovering their coefficients by pattern matching, with a fixed set of unknowns — the design that produced incorrect results on the beam side before it was rewritten. Treat frame output as unverified and check it by hand before relying on it.

## How it works

The slope-deflection method writes each member end moment in terms of the unknown joint rotations:

```
M_ij = FEM_ij + (2EI/L)(2θ_i + θ_j − 3ψ)
```

where `FEM_ij` is the fixed-end moment and `ψ` the chord rotation from any support settlement. Requiring the member end moments to sum to zero at every joint free to rotate gives one equation per unknown rotation; at an end joint this reduces to "the moment at a pin is zero". Solving that square system and substituting the rotations back gives the final end moments, and span equilibrium then gives the reactions and the diagrams.

Each end moment is held as a constant plus a map of rotation coefficients, so the number of unknowns follows from the structure rather than being fixed in advance. The equations shown in the UI are rendered from those same coefficients, so what is displayed is what was solved.

## Tech stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · shadcn/ui (Radix UI)
- Framer Motion · next-themes (dark mode)
- Recharts / Chart.js (diagrams)

## Getting started

```bash
npm ci
npm run dev
```

Then open <http://localhost:3000>.

Production build:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## Project structure

```
├── app/
│   ├── page.tsx              # Landing page (Beams / Frames)
│   ├── beams/                # Beam analysis UI
│   ├── frames/               # Frame analysis UI
│   ├── components/           # Forms, charts, diagrams
│   └── utils/
│       ├── beamSolver.ts     # Slope-deflection system: assembly and solution
│       ├── calculations.ts   # Fixed-end moments per load type
│       ├── loadResultant.ts  # Load resultant and centroid per load type
│       ├── calculateReactions.ts
│       ├── calculateBMSF.ts  # Bending-moment / shear-force along each span
│       ├── criticalBMSF.ts   # Critical values per span
│       └── frame*.ts         # Frame analysis (see Status)
└── components/ui/            # shadcn/ui primitives
```

## Deployment

Deployed on Vercel from the repository root. The Next.js app sits at the root, so the Next.js preset builds it with no command overrides and no root-directory change:

- Framework preset: **Next.js**
- Root directory: repository root
- Build and install commands: leave at the defaults; `vercel.json` only declares the framework

## Contributing

Bug reports about the numbers are especially welcome — include the spans, supports, loads and the value you expected, so the case can be added to the checks.

---

Built by Abdullahi (Olamilekan) Abdulwasiu.
