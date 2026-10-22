# Stickman Paint — Warrior Edition 🎨⚔️

An interactive, responsive digital drawing studio featuring the **Living Stickman** — an animated martial artist character who observes your painting, synchronizes with your pen strokes, and physically draws procedural master illustrations on the canvas.

---

## 🚀 Features

- **Living Stickman Companion**: Synchronizes in real time with drawing tools (idle, hover, drawing, thinking, victory celebration).
- **Physical Trick Playback Engine**: Watch the Stickman physically walk to and draw 15 master scenes stroke-by-stroke with interactive speed controls (0.5× to 3×), pause, resume, and partial-draw state retention.
- **15 Master Illustration Katas**: From layered alpine mountain summits and sunrises to cozy cottages, deep forests, cosmos adventures, and tropical coastlines.
- **Full Drawing Studio**: Pencil, Brush, Eraser, Fill Bucket, Color Picker, Eyedropper, Shapes (Rect, Circle, Triangle, Line), Text Tool, Multi-layer Management, Undo/Redo history, and pure 1-click PNG export.
- **Mobile Responsive**: Adaptive touch interface for smartphones, tablets, and desktop workstations.

---

## 💻 Tech Stack

- **Core**: Vanilla HTML5, Vanilla JavaScript (ES6+), Canvas 2D API.
- **Styling**: Vanilla CSS with modern custom properties, dark-mode dojo palette, glassmorphism, and responsive media queries.
- **Zero Build Dependencies**: Pure static web application ready for immediate deployment on modern CDNs.

---

## 🛠️ Local Development & Testing

### Running Locally
To launch locally using any static web server:

```bash
# Using npm
npm start

# Or directly open in any modern browser:
# Open app/index.html
```

### Running Automated Test Suites
Run the comprehensive headless verification test suite (Trick playback engine, E2E browser simulation, and production deployment checks):

```bash
npm test
```

---

## ☁️ Vercel Deployment Guide

Stickman Paint is pre-configured for seamless production deployment on **Vercel** with zero build configuration.

### Deployment Steps:
1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Import Project"**.
3. Select this repository.
4. Deployment settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `.` *(or select `app`)*
   - **Build Command**: *(leave empty)*
   - **Output Directory**: `app` *(pre-configured in `vercel.json`)*
5. Click **"Deploy"**.

The bundled `vercel.json` automatically configures `outputDirectory: "app"`, clean URLs, `/app` redirects, and security headers for deterministic static delivery.
