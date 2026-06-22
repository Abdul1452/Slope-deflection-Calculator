# Slope Deflection Calculator

A web app for structural engineers to analyse **beams and frames** with the **slope-deflection method** — computing fixed-end moments, member end moments, bending-moment and shear-force diagrams, and support reactions, all in the browser.

> A powerful tool for structural engineers to calculate beam deflections and moments using the slope deflection method.

## Features

- **Beam analysis** — define spans, supports (fixed, pinned, roller, free), and loads (UDL and point loads), with support settlement (sinking supports) and per-span moment of inertia.
- **Frame analysis** — analyse rigid plane frames, including sway.
- Automatic generation of the **slope-deflection equations** and solution of the simultaneous joint-equilibrium (boundary-condition) equations.
- **Final member end moments**, **bending-moment and shear-force (BMSF) diagrams**, and **support reactions**.
- Identification of **critical BMSF** values along each span.
- Interactive charts and diagrams, with light/dark theme.

## Tech stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · shadcn/ui (Radix UI)
- Framer Motion (animation) · next-themes (dark mode)
- Chart.js / Recharts (diagrams)

## Getting started

The application lives in the `duale_sdc-main/` folder.

```bash
cd duale_sdc-main
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Build for production:

```bash
npm run build
npm start
```

## How it works

The slope-deflection method writes each member's end moments in terms of the unknown joint rotations (and sway), combining the member's fixed-end moments with terms in `2EI/L`. Enforcing moment equilibrium at every joint produces a system of simultaneous equations; solving it yields the rotations, which are back-substituted into the slope-deflection equations to give the final member end moments. From those, the app derives the bending-moment and shear-force diagrams and the support reactions.

## Project structure

```
duale_sdc-main/
├── app/
│   ├── page.tsx        # Landing page (Beams / Frames)
│   ├── beams/          # Beam analysis UI
│   ├── frames/         # Frame analysis UI
│   ├── components/     # Forms, charts, diagrams
│   └── utils/          # Slope-deflection, FEM, BMSF, reactions logic
├── components/ui/      # shadcn/ui primitives
└── ...
```

## Deployment

Configured for Vercel — `vercel.json` sets `duale_sdc-main` as the build target.

---

Built by Abdullahi (Olamilekan) Abdulwasiu.
