/**
 * Stickman Paint — Expanded Tricks & Master Drawing Engine
 * 15 Composed Aesthetic Illustration Scenes & Reusable Primitives
 */

(function (window) {
  'use strict';

  /* ==========================================================================
     REUSABLE DRAWING PRIMITIVES
     ========================================================================== */

  const Primitives = {
    // 1. Clouds
    drawCloud(ctx, x, y, scale = 1, fillColor = 'rgba(255, 255, 255, 0.95)', strokeColor = '#cbd5e1') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5 / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.bezierCurveTo(-55, -25, -25, -45, 0, -35);
      ctx.bezierCurveTo(15, -55, 55, -50, 60, -25);
      ctx.bezierCurveTo(80, -25, 90, -5, 80, 15);
      ctx.bezierCurveTo(85, 30, 65, 40, 45, 35);
      ctx.bezierCurveTo(35, 45, -35, 45, -45, 30);
      ctx.bezierCurveTo(-65, 30, -70, 10, -50, 0);
      ctx.closePath();
      ctx.fill();
      if (strokeColor) ctx.stroke();
      ctx.restore();
    },

    // 2. Radiant Sun
    drawSun(ctx, cx, cy, radius, rays = 12, rayLen = 25, sunColor = '#f59e0b', rayColor = '#fbbf24') {
      ctx.save();
      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius + rayLen);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + rayLen, 0, Math.PI * 2);
      ctx.fill();

      // Sun Disc
      ctx.fillStyle = sunColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sun Rays
      ctx.strokeStyle = rayColor;
      ctx.lineWidth = Math.max(2, radius * 0.08);
      ctx.lineCap = 'round';
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays;
        const r1 = radius + 6;
        const r2 = radius + rayLen;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
        ctx.stroke();
      }
      ctx.restore();
    },

    // 3. Mountain Ridge
    drawMountainRidge(ctx, points, strokeColor = '#334155', fillColor = '#64748b', lineWidth = 3.5) {
      if (!points || points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (fillColor) {
        ctx.lineTo(points[points.length - 1].x, ctx.canvas.height);
        ctx.lineTo(points[0].x, ctx.canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    },

    // 4. Stylized Trees
    drawTree(ctx, x, y, scale = 1, type = 'pine', options = {}) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'pine') {
        const trunkCol = options.trunk || '#78350f';
        const foliageCol = options.foliage || '#065f46';
        const outlineCol = options.outline || '#022c22';

        // Trunk
        ctx.fillStyle = trunkCol;
        ctx.fillRect(-7, 40, 14, 35);

        // 3 Tiers of Pine foliage
        ctx.fillStyle = foliageCol;
        ctx.strokeStyle = outlineCol;
        ctx.lineWidth = 3;

        // Bottom tier
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(45, 45);
        ctx.lineTo(-45, 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Middle tier
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(36, 15);
        ctx.lineTo(-36, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top tier
        ctx.beginPath();
        ctx.moveTo(0, -65);
        ctx.lineTo(26, -15);
        ctx.lineTo(-26, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (type === 'oak') {
        const trunkCol = options.trunk || '#854d0e';
        const foliageCol = options.foliage || '#15803d';

        // Trunk
        ctx.fillStyle = trunkCol;
        ctx.beginPath();
        ctx.moveTo(-12, 60);
        ctx.quadraticCurveTo(-15, 10, -8, -10);
        ctx.lineTo(8, -10);
        ctx.quadraticCurveTo(15, 10, 12, 60);
        ctx.closePath();
        ctx.fill();

        // Foliage Crown
        ctx.fillStyle = foliageCol;
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -45, 40, 0, Math.PI * 2);
        ctx.arc(-28, -25, 32, 0, Math.PI * 2);
        ctx.arc(28, -25, 32, 0, Math.PI * 2);
        ctx.arc(-18, 5, 26, 0, Math.PI * 2);
        ctx.arc(18, 5, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },

    // 5. Stylized Flower
    drawFlower(ctx, x, y, scale = 1, type = 'daisy', petalColor = '#ec4899', centerColor = '#facc15') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, 30, -5, 60);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(-14, 35, 14, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Petals
      ctx.fillStyle = petalColor;
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.8;

      if (type === 'tulip') {
        ctx.beginPath();
        ctx.moveTo(-16, -10);
        ctx.quadraticCurveTo(-22, -35, 0, -45);
        ctx.quadraticCurveTo(22, -35, 16, -10);
        ctx.quadraticCurveTo(0, 5, -16, -10);
        ctx.fill();
        ctx.stroke();
      } else {
        // Multi-petal Daisy / Sunflower
        const petals = 8;
        for (let i = 0; i < petals; i++) {
          const angle = (i * Math.PI * 2) / petals;
          const px = Math.cos(angle) * 16;
          const py = Math.sin(angle) * 16;
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        // Center Core
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    // 6. Flying Bird Silhouette
    drawBird(ctx, x, y, scale = 1, color = '#1e293b') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.quadraticCurveTo(-8, -8, 0, 0);
      ctx.quadraticCurveTo(8, -8, 16, 4);
      ctx.stroke();
      ctx.restore();
    },

    // 7. Butterfly
    drawButterfly(ctx, x, y, scale = 1, angle = 0, wingColor1 = '#f97316', wingColor2 = '#fbbf24') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Left Wing Upper
      ctx.fillStyle = wingColor1;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(-25, -35, -45, -10, -32, 8);
      ctx.bezierCurveTo(-20, 20, -5, 8, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Left Wing Lower
      ctx.fillStyle = wingColor2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-25, 10, -28, 30, -12, 32);
      ctx.bezierCurveTo(-4, 30, -2, 16, 0, 8);
      ctx.fill();
      ctx.stroke();

      // Right Wing Upper
      ctx.fillStyle = wingColor1;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(25, -35, 45, -10, 32, 8);
      ctx.bezierCurveTo(20, 20, 5, 8, 0, 0);
      ctx.fill();
      ctx.stroke();

      // Right Wing Lower
      ctx.fillStyle = wingColor2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(25, 10, 28, 30, 12, 32);
      ctx.bezierCurveTo(4, 30, 2, 16, 0, 8);
      ctx.fill();
      ctx.stroke();

      // Body & Antennae
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 8, 3.5, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, -6);
      ctx.quadraticCurveTo(-6, -16, -12, -18);
      ctx.moveTo(1, -6);
      ctx.quadraticCurveTo(6, -16, 12, -18);
      ctx.stroke();
      ctx.restore();
    },

    // 8. Distant Star / Sparkle
    drawStar(ctx, x, y, size = 6, color = '#ffffff') {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
      ctx.restore();
    },

    // 9. Luminous Moon
    drawMoon(ctx, cx, cy, radius, crescent = false, moonColor = '#fef08a', glowColor = 'rgba(254, 240, 138, 0.25)') {
      ctx.save();
      // Aura
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 2.2);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.fillStyle = moonColor;
      if (crescent) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI * 0.2, Math.PI * 1.5, false);
        ctx.bezierCurveTo(cx - radius * 0.2, cy - radius * 0.4, cx - radius * 0.2, cy + radius * 0.4, cx + radius * Math.cos(Math.PI * 0.2), cy + radius * Math.sin(Math.PI * 0.2));
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters
        ctx.fillStyle = 'rgba(202, 138, 4, 0.25)';
        ctx.beginPath();
        ctx.arc(cx - radius * 0.35, cy - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.arc(cx + radius * 0.25, cy - radius * 0.4, radius * 0.14, 0, Math.PI * 2);
        ctx.arc(cx + radius * 0.1, cy + radius * 0.35, radius * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    // 10. Water Wave Ripple
    drawWave(ctx, sx, sy, width, waveCount = 5, color = '#38bdf8', lineWidth = 3) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const step = width / waveCount;
      for (let i = 0; i < waveCount; i++) {
        const x1 = sx + i * step + step * 0.5;
        const y1 = sy - 6;
        const x2 = sx + (i + 1) * step;
        const y2 = sy;
        ctx.quadraticCurveTo(x1, y1, x2, y2);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  /* ==========================================================================
     THE 15 COMPLETE ARTIST TRICK SCENES
     ========================================================================== */

  const TRICK_GALLERY = [
    // ------------------------------------------------------------------------
    // CLASSIC 1: Warrior Peak (Existing Trick 1)
    // ------------------------------------------------------------------------
    {
      id: 'trick-mountain',
      name: 'Warrior Peak',
      category: 'Classics',
      difficulty: 'Easy',
      badge: '⛰️',
      description: 'Layered mountain summit with high-altitude blue combat ledges and summit flag.',
      draw(ctx, w, h) {
        ctx.save();
        // Radiant Sun
        Primitives.drawSun(ctx, w * 0.65, h * 0.35, w * 0.06, 16, w * 0.035, '#f59e0b', '#fbbf24');

        // Background Mountain
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = Math.max(2, w * 0.003);
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.85);
        ctx.lineTo(w * 0.35, h * 0.42);
        ctx.lineTo(w * 0.55, h * 0.58);
        ctx.lineTo(w * 0.75, h * 0.44);
        ctx.lineTo(w * 0.95, h * 0.85);
        ctx.stroke();

        // Foreground Ridge
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, w * 0.0045);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.85);
        ctx.lineTo(w * 0.25, h * 0.58);
        ctx.lineTo(w * 0.38, h * 0.64);
        ctx.lineTo(w * 0.6, h * 0.22);
        ctx.lineTo(w * 0.78, h * 0.54);
        ctx.lineTo(w * 0.88, h * 0.48);
        ctx.lineTo(w, h * 0.85);
        ctx.stroke();

        // Horizon
        ctx.beginPath();
        ctx.moveTo(0, h * 0.85);
        ctx.lineTo(w, h * 0.85);
        ctx.stroke();

        // Electric Blue Ledges
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(3, w * 0.0045);
        const steps = [
          { x: w * 0.22, y: h * 0.76, len: w * 0.05 },
          { x: w * 0.32, y: h * 0.64, len: w * 0.055 },
          { x: w * 0.44, y: h * 0.50, len: w * 0.06 },
          { x: w * 0.54, y: h * 0.34, len: w * 0.065 }
        ];
        steps.forEach(s => {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.len, s.y);
          ctx.stroke();
        });

        // Summit Flag
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(2, w * 0.0028);
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.22);
        ctx.lineTo(w * 0.6, h * 0.14);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.14);
        ctx.lineTo(w * 0.65, h * 0.17);
        ctx.lineTo(w * 0.6, h * 0.20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // CLASSIC 2: Golden Sunrise (Existing Trick 2)
    // ------------------------------------------------------------------------
    {
      id: 'trick-sun',
      name: 'Golden Sunburst',
      category: 'Classics',
      difficulty: 'Beginner',
      badge: '☀️',
      description: 'Luminous central warrior sunburst with concentric precision aura rays.',
      draw(ctx, w, h) {
        ctx.save();
        Primitives.drawSun(ctx, w * 0.5, h * 0.42, w * 0.08, 18, w * 0.055, '#f59e0b', '#fbbf24');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // CLASSIC 3: Ninja Ledges (Existing Trick 3)
    // ------------------------------------------------------------------------
    {
      id: 'trick-stairs',
      name: 'Ninja Ledges',
      category: 'Classics',
      difficulty: 'Beginner',
      badge: '🪜',
      description: 'Ascending tactical combat footholds spanning the canvas.',
      draw(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(3, w * 0.0045);
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const sx = w * 0.15 + i * (w * 0.11);
          const sy = h * 0.8 - i * (h * 0.1);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + w * 0.07, sy);
          ctx.stroke();
        }
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // CLASSIC 4: Crown Battle Flag (Existing Trick 4)
    // ------------------------------------------------------------------------
    {
      id: 'trick-flag',
      name: 'Crown Battle Flag',
      category: 'Classics',
      difficulty: 'Beginner',
      badge: '🚩',
      description: 'Honor standard planted firmly on the warrior training grounds.',
      draw(ctx, w, h) {
        ctx.save();
        const x = w * 0.5;
        const y = h * 0.45;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, w * 0.0035);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.16);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w * 0.06, y + h * 0.04);
        ctx.lineTo(x, y + h * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 1: Sunny Landscape (Prompt Req 2 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-sunrise-landscape',
      name: 'Sunny Landscape',
      category: 'Landscapes',
      difficulty: 'Medium',
      badge: '🌅',
      description: 'Panoramic dawn landscape with layered mountain ranges, winding river, and pine meadows.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Soft Morning Sky wash
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
        skyGrad.addColorStop(0, '#fef3c7');
        skyGrad.addColorStop(0.5, '#fed7aa');
        skyGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.75);

        // 2. Rising Sun & Rays
        Primitives.drawSun(ctx, w * 0.72, h * 0.32, w * 0.065, 14, w * 0.04, '#f59e0b', '#fbbf24');

        // 3. Drifting Morning Clouds
        Primitives.drawCloud(ctx, w * 0.22, h * 0.2, w * 0.0008, 'rgba(255, 255, 255, 0.92)');
        Primitives.drawCloud(ctx, w * 0.48, h * 0.15, w * 0.00065, 'rgba(255, 255, 255, 0.85)');

        // 4. Distant Purple Mountain Range
        ctx.fillStyle = '#c084fc';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.lineTo(w * 0.2, h * 0.38);
        ctx.lineTo(w * 0.38, h * 0.52);
        ctx.lineTo(w * 0.62, h * 0.32);
        ctx.lineTo(w * 0.85, h * 0.56);
        ctx.lineTo(w, h * 0.48);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Midground Emerald Hills
        ctx.fillStyle = '#34d399';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.55, h * 0.68);
        ctx.quadraticCurveTo(w * 0.8, h * 0.78, w, h * 0.64);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 6. Winding Blue River Through Valley
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.54, h * 0.68);
        ctx.bezierCurveTo(w * 0.45, h * 0.75, w * 0.65, h * 0.85, w * 0.42, h);
        ctx.lineTo(w * 0.25, h);
        ctx.bezierCurveTo(w * 0.48, h * 0.85, w * 0.35, h * 0.75, w * 0.52, h * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 7. Foreground Grass & Trees
        Primitives.drawTree(ctx, w * 0.12, h * 0.62, w * 0.00085, 'pine');
        Primitives.drawTree(ctx, w * 0.19, h * 0.66, w * 0.00065, 'pine');
        Primitives.drawTree(ctx, w * 0.88, h * 0.68, w * 0.00095, 'pine');

        // 8. Soaring Morning Birds
        Primitives.drawBird(ctx, w * 0.58, h * 0.24, w * 0.0008);
        Primitives.drawBird(ctx, w * 0.64, h * 0.28, w * 0.0006);
        Primitives.drawBird(ctx, w * 0.52, h * 0.29, w * 0.0005);
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 2: Flower Garden (Prompt Req 3 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-flower-garden',
      name: 'Flower Garden',
      category: 'Nature',
      difficulty: 'Easy',
      badge: '🌸',
      description: 'Lush meadow bursting with multi-colored sunflowers, tulips, and dancing butterflies.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Soft Sky
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        sky.addColorStop(0, '#e0f2fe');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.6);

        // 2. Distant Sun & Clouds
        Primitives.drawSun(ctx, w * 0.85, h * 0.22, w * 0.05, 12, w * 0.025, '#fbbf24', '#f59e0b');
        Primitives.drawCloud(ctx, w * 0.25, h * 0.18, w * 0.0008);

        // 3. Gentle Meadow Rolling Hills
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.6);
        ctx.quadraticCurveTo(w * 0.4, h * 0.5, w, h * 0.58);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.quadraticCurveTo(w * 0.55, h * 0.65, w, h * 0.7);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // 4. Stepping Stones
        const stones = [
          { x: w * 0.35, y: h * 0.85, rx: 24, ry: 10 },
          { x: w * 0.46, y: h * 0.88, rx: 28, ry: 11 },
          { x: w * 0.58, y: h * 0.86, rx: 22, ry: 9 }
        ];
        stones.forEach(s => {
          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // 5. Flower Ensemble
        Primitives.drawFlower(ctx, w * 0.14, h * 0.68, w * 0.0012, 'daisy', '#ec4899', '#fde047');
        Primitives.drawFlower(ctx, w * 0.22, h * 0.72, w * 0.0009, 'tulip', '#ef4444');
        Primitives.drawFlower(ctx, w * 0.30, h * 0.65, w * 0.0013, 'daisy', '#38bdf8', '#fef08a');
        Primitives.drawFlower(ctx, w * 0.68, h * 0.67, w * 0.0014, 'daisy', '#eab308', '#78350f');
        Primitives.drawFlower(ctx, w * 0.77, h * 0.70, w * 0.0010, 'tulip', '#a855f7');
        Primitives.drawFlower(ctx, w * 0.86, h * 0.66, w * 0.0012, 'daisy', '#f43f5e', '#facc15');

        // 6. Fluttering Butterflies
        Primitives.drawButterfly(ctx, w * 0.25, h * 0.45, w * 0.0007, -0.2, '#f97316', '#fde047');
        Primitives.drawButterfly(ctx, w * 0.72, h * 0.48, w * 0.0006, 0.3, '#38bdf8', '#c084fc');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 3: Cozy House (Prompt Req 4 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-cozy-house',
      name: 'Cozy House',
      category: 'Storybook',
      difficulty: 'Medium',
      badge: '🏡',
      description: 'Charming storybook cottage with smoking chimney, warm windows, garden fence, and oak tree.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Sky & Sun
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        sky.addColorStop(0, '#bae6fd');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.7);

        Primitives.drawSun(ctx, w * 0.84, h * 0.22, w * 0.05, 12, w * 0.025, '#f59e0b', '#fbbf24');
        Primitives.drawCloud(ctx, w * 0.24, h * 0.18, w * 0.00085);

        // 2. Grassy Ground
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.74);
        ctx.lineTo(w, h * 0.74);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Shady Oak Tree to the Left
        Primitives.drawTree(ctx, w * 0.18, h * 0.62, w * 0.0013, 'oak');

        // 4. Cobblestone Pathway
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.48, h * 0.74);
        ctx.quadraticCurveTo(w * 0.52, h * 0.85, w * 0.58, h);
        ctx.lineTo(w * 0.46, h);
        ctx.quadraticCurveTo(w * 0.43, h * 0.85, w * 0.44, h * 0.74);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. The Cottage
        const hx = w * 0.46;
        const hy = h * 0.54;
        const hw = w * 0.26;
        const hh = h * 0.22;

        // Chimney with Smoke
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(hx + hw * 0.7, hy - hh * 0.7, hw * 0.16, hh * 0.55);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(hx + hw * 0.7, hy - hh * 0.7, hw * 0.16, hh * 0.55);

        // Curly smoke puffs
        Primitives.drawCloud(ctx, hx + hw * 0.78, hy - hh * 0.9, w * 0.00028, 'rgba(255, 255, 255, 0.7)', null);
        Primitives.drawCloud(ctx, hx + hw * 0.86, hy - hh * 1.15, w * 0.00035, 'rgba(255, 255, 255, 0.6)', null);

        // Main Walls
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(hx, hy, hw, hh);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(hx, hy, hw, hh);

        // Gabled Roof
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(hx - hw * 0.1, hy);
        ctx.lineTo(hx + hw * 0.5, hy - hh * 0.65);
        ctx.lineTo(hx + hw * 1.1, hy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Arched Door
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(hx + hw * 0.22, hy + hh * 0.48, hw * 0.1, Math.PI, 0, false);
        ctx.lineTo(hx + hw * 0.32, hy + hh);
        ctx.lineTo(hx + hw * 0.12, hy + hh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Door knob
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(hx + hw * 0.29, hy + hh * 0.65, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Windows
        const drawWindow = (wx, wy, size) => {
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(wx, wy, size, size);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(wx, wy, size, size);
          // Panes
          ctx.beginPath();
          ctx.moveTo(wx + size / 2, wy);
          ctx.lineTo(wx + size / 2, wy + size);
          ctx.moveTo(wx, wy + size / 2);
          ctx.lineTo(wx + size, wy + size / 2);
          ctx.stroke();
        };
        drawWindow(hx + hw * 0.52, hy + hh * 0.25, hw * 0.32);

        // 6. White Picket Fence
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const fx = hx + hw + 10 + i * (w * 0.024);
          ctx.fillRect(fx, h * 0.68, w * 0.015, h * 0.08);
          ctx.strokeRect(fx, h * 0.68, w * 0.015, h * 0.08);
        }
        ctx.fillRect(hx + hw + 6, h * 0.71, w * 0.14, 5);
        ctx.strokeRect(hx + hw + 6, h * 0.71, w * 0.14, 5);

        // 7. Garden Flowers along front
        Primitives.drawFlower(ctx, hx - 20, h * 0.76, w * 0.0009, 'tulip', '#ef4444');
        Primitives.drawFlower(ctx, hx - 45, h * 0.78, w * 0.0008, 'daisy', '#ec4899', '#facc15');
        Primitives.drawFlower(ctx, hx + hw + 30, h * 0.78, w * 0.0009, 'daisy', '#38bdf8', '#fef08a');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 4: Forest Adventure (Prompt Req 5 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-forest',
      name: 'Forest Adventure',
      category: 'Nature',
      difficulty: 'Advanced',
      badge: '🌲',
      description: 'Lush 3-tier deep evergreen woods with sunlight rays cutting through misty mountains.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Atmosphere Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        sky.addColorStop(0, '#fef08a');
        sky.addColorStop(0.5, '#bbf7d0');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.6);

        // 2. Distant Alpine Peaks
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.55);
        ctx.lineTo(w * 0.35, h * 0.25);
        ctx.lineTo(w * 0.55, h * 0.42);
        ctx.lineTo(w * 0.75, h * 0.22);
        ctx.lineTo(w * 0.95, h * 0.55);
        ctx.lineTo(w, h * 0.55);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Sunbeams (God rays)
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.2, h);
        ctx.lineTo(w * 0.35, h);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.6, h);
        ctx.lineTo(w * 0.75, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. Background Pine Layer (Lighter Green)
        const bgPines = [w * 0.15, w * 0.28, w * 0.42, w * 0.6, w * 0.74, w * 0.88];
        bgPines.forEach(x => {
          Primitives.drawTree(ctx, x, h * 0.46, w * 0.00065, 'pine', { foliage: '#15803d', trunk: '#78350f' });
        });

        // 5. Middleground Forest Ridge
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.66);
        ctx.quadraticCurveTo(w * 0.5, h * 0.58, w, h * 0.64);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        const midPines = [w * 0.08, w * 0.22, w * 0.38, w * 0.66, w * 0.82, w * 0.94];
        midPines.forEach(x => {
          Primitives.drawTree(ctx, x, h * 0.56, w * 0.00095, 'pine', { foliage: '#166534', trunk: '#451a03' });
        });

        // 6. Winding Forest Trail
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.52, h * 0.62);
        ctx.bezierCurveTo(w * 0.45, h * 0.74, w * 0.62, h * 0.85, w * 0.5, h);
        ctx.lineTo(w * 0.35, h);
        ctx.bezierCurveTo(w * 0.48, h * 0.85, w * 0.38, h * 0.74, w * 0.48, h * 0.62);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 7. Foreground Heavy Timber Pines
        Primitives.drawTree(ctx, w * 0.05, h * 0.68, w * 0.0014, 'pine', { foliage: '#064e3b', trunk: '#292524' });
        Primitives.drawTree(ctx, w * 0.88, h * 0.68, w * 0.0015, 'pine', { foliage: '#064e3b', trunk: '#292524' });

        // 8. Forest Birds Soaring
        Primitives.drawBird(ctx, w * 0.38, h * 0.22, w * 0.0008);
        Primitives.drawBird(ctx, w * 0.46, h * 0.26, w * 0.0006);
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 5: Rainbow Valley (Prompt Req 6 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-rainbow',
      name: 'Rainbow Valley',
      category: 'Landscapes',
      difficulty: 'Easy',
      badge: '🌈',
      description: 'Grand 6-colored curved rainbow arching between cumulus clouds across an alpine river valley.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Sky & Sun
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
        sky.addColorStop(0, '#bae6fd');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.65);

        Primitives.drawSun(ctx, w * 0.88, h * 0.18, w * 0.05, 12, w * 0.025, '#fbbf24', '#f59e0b');

        // 2. The Grand Rainbow
        const rx = w * 0.48;
        const ry = h * 0.68;
        const rColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        const rThickness = Math.max(6, w * 0.009);

        rColors.forEach((color, i) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = rThickness;
          ctx.beginPath();
          ctx.arc(rx, ry, w * 0.34 - i * rThickness, Math.PI, 0, false);
          ctx.stroke();
        });

        // 3. Fluffy Clouds Terminating the Rainbow
        Primitives.drawCloud(ctx, rx - w * 0.34, ry + 15, w * 0.001);
        Primitives.drawCloud(ctx, rx + w * 0.34, ry + 15, w * 0.001);

        // 4. Emerald Valley Rolling Hills
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.68);
        ctx.quadraticCurveTo(w * 0.3, h * 0.58, w * 0.55, h * 0.68);
        ctx.quadraticCurveTo(w * 0.8, h * 0.78, w, h * 0.64);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. River Valley Stream
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.52, h * 0.68);
        ctx.bezierCurveTo(w * 0.42, h * 0.78, w * 0.62, h * 0.88, w * 0.45, h);
        ctx.lineTo(w * 0.32, h);
        ctx.bezierCurveTo(w * 0.52, h * 0.88, w * 0.32, h * 0.78, w * 0.46, h * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 6. Meadow Trees & Flowers
        Primitives.drawTree(ctx, w * 0.16, h * 0.62, w * 0.0009, 'oak');
        Primitives.drawTree(ctx, w * 0.82, h * 0.65, w * 0.00095, 'oak');
        Primitives.drawFlower(ctx, w * 0.28, h * 0.75, w * 0.001, 'daisy', '#ec4899', '#fde047');
        Primitives.drawFlower(ctx, w * 0.68, h * 0.76, w * 0.001, 'tulip', '#ef4444');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 6: Road Trip Cruiser (Prompt Req 7 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-car',
      name: 'Road Trip Cruiser',
      category: 'Adventure',
      difficulty: 'Medium',
      badge: '🚗',
      description: 'Stylized crimson roadster tearing down the highway toward scenic mountain horizon.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Warm Sunset Horizon
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        sky.addColorStop(0, '#fdba74');
        sky.addColorStop(0.5, '#fed7aa');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.6);

        Primitives.drawSun(ctx, w * 0.5, h * 0.36, w * 0.06, 16, w * 0.03, '#f97316', '#fbbf24');

        // 2. Distant Horizon Mountain Silhouette
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.52);
        ctx.lineTo(w * 0.22, h * 0.38);
        ctx.lineTo(w * 0.44, h * 0.48);
        ctx.lineTo(w * 0.68, h * 0.35);
        ctx.lineTo(w * 0.88, h * 0.46);
        ctx.lineTo(w, h * 0.42);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // 3. Desert / Roadside Verges
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, h * 0.52, w, h * 0.48);

        // 4. Perspective Asphalt Highway
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.45, h * 0.52);
        ctx.lineTo(w * 0.55, h * 0.52);
        ctx.lineTo(w * 0.82, h);
        ctx.lineTo(w * 0.18, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dashed Center Highway Marking
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 14]);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.53);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Stylized Red Cruiser Car
        const cx = w * 0.56;
        const cy = h * 0.66;
        const carW = w * 0.28;
        const carH = h * 0.12;

        ctx.translate(cx, cy);

        // Car Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, carH * 0.62, carW * 0.55, carH * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Main Body
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-carW * 0.45, carH * 0.45);
        ctx.lineTo(carW * 0.45, carH * 0.45);
        ctx.quadraticCurveTo(carW * 0.52, carH * 0.2, carW * 0.45, 0);
        ctx.lineTo(carW * 0.22, 0);
        ctx.lineTo(carW * 0.1, -carH * 0.45);
        ctx.lineTo(-carW * 0.24, -carH * 0.45);
        ctx.lineTo(-carW * 0.36, 0);
        ctx.lineTo(-carW * 0.5, 0);
        ctx.quadraticCurveTo(-carW * 0.54, carH * 0.2, -carW * 0.45, carH * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Windshield Glass & Windows
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(carW * 0.19, -0.02);
        ctx.lineTo(carW * 0.08, -carH * 0.4);
        ctx.lineTo(-carW * 0.04, -carH * 0.4);
        ctx.lineTo(-carW * 0.04, -0.02);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-carW * 0.08, -0.02);
        ctx.lineTo(-carW * 0.08, -carH * 0.4);
        ctx.lineTo(-carW * 0.22, -carH * 0.4);
        ctx.lineTo(-carW * 0.32, -0.02);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Chrome Headlight & Bumper
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(carW * 0.44, carH * 0.08, 12, 10);
        ctx.strokeRect(carW * 0.44, carH * 0.08, 12, 10);

        // Wheels
        const drawWheel = (wx) => {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(wx, carH * 0.45, carH * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Rim
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(wx, carH * 0.45, carH * 0.16, 0, Math.PI * 2);
          ctx.fill();
        };
        drawWheel(-carW * 0.28);
        drawWheel(carW * 0.28);

        // Roadside Speed Sign
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.88, h * 0.78);
        ctx.lineTo(w * 0.88, h * 0.62);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.fillRect(w * 0.84, h * 0.58, w * 0.08, h * 0.07);
        ctx.strokeRect(w * 0.84, h * 0.58, w * 0.08, h * 0.07);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(w * 0.016)}px sans-serif`;
        ctx.fillText('SPEED', w * 0.85, h * 0.62);
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 7: Butterfly Garden (Prompt Req 8 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-butterfly-garden',
      name: 'Monarch Butterfly',
      category: 'Nature',
      difficulty: 'Medium',
      badge: '🦋',
      description: 'Intricate centerpiece Monarch butterfly hovering over colorful blooming wildflowers.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Soft Warm Ambient Glow
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.45, w * 0.6);
        bg.addColorStop(0, '#fef9c3');
        bg.addColorStop(0.6, '#ecfdf5');
        bg.addColorStop(1, '#ffffff');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // 2. Background Soft Garden Foliage
        Primitives.drawTree(ctx, w * 0.1, h * 0.5, w * 0.0011, 'oak');
        Primitives.drawTree(ctx, w * 0.9, h * 0.5, w * 0.0011, 'oak');

        // 3. Lower Flower Bed
        Primitives.drawFlower(ctx, w * 0.18, h * 0.72, w * 0.0013, 'daisy', '#ec4899', '#fde047');
        Primitives.drawFlower(ctx, w * 0.32, h * 0.76, w * 0.0011, 'tulip', '#ef4444');
        Primitives.drawFlower(ctx, w * 0.68, h * 0.75, w * 0.0012, 'daisy', '#8b5cf6', '#fef08a');
        Primitives.drawFlower(ctx, w * 0.82, h * 0.72, w * 0.0014, 'daisy', '#f59e0b', '#78350f');

        // 4. Little Companion Butterflies
        Primitives.drawButterfly(ctx, w * 0.24, h * 0.28, w * 0.0007, -0.35, '#38bdf8', '#c084fc');
        Primitives.drawButterfly(ctx, w * 0.78, h * 0.32, w * 0.00065, 0.4, '#ec4899', '#fde047');

        // 5. The Grand Hero Centerpiece Monarch Butterfly
        Primitives.drawButterfly(ctx, w * 0.5, h * 0.42, w * 0.0028, 0, '#f97316', '#fbbf24');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 8: Cat's Garden (Prompt Req 9 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-cat-garden',
      name: "Cat's Garden",
      category: 'Nature',
      difficulty: 'Medium',
      badge: '🐱',
      description: 'Charming warrior kitten perched on a garden wooden fence under sunny skies.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Garden Background
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
        sky.addColorStop(0, '#bae6fd');
        sky.addColorStop(1, '#ffffff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.65);

        Primitives.drawSun(ctx, w * 0.15, h * 0.22, w * 0.05, 12, w * 0.025, '#fbbf24', '#f59e0b');
        Primitives.drawCloud(ctx, w * 0.72, h * 0.18, w * 0.00085);

        // 2. Lush Green Garden Grass
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.rect(0, h * 0.65, w, h * 0.35);
        ctx.fill();

        // 3. Wooden Garden Fence
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        const postW = w * 0.038;
        for (let i = 0; i < 9; i++) {
          const px = w * 0.08 + i * (w * 0.1);
          ctx.beginPath();
          ctx.moveTo(px, h * 0.54);
          ctx.lineTo(px + postW * 0.5, h * 0.5);
          ctx.lineTo(px + postW, h * 0.54);
          ctx.lineTo(px + postW, h * 0.85);
          ctx.lineTo(px, h * 0.85);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        // Horizontal Railings
        ctx.fillRect(w * 0.05, h * 0.58, w * 0.9, h * 0.035);
        ctx.strokeRect(w * 0.05, h * 0.58, w * 0.9, h * 0.035);
        ctx.fillRect(w * 0.05, h * 0.72, w * 0.9, h * 0.035);
        ctx.strokeRect(w * 0.05, h * 0.72, w * 0.9, h * 0.035);

        // 4. The Cat Perched in Center
        const cx = w * 0.5;
        const cy = h * 0.56;
        const cScale = w * 0.0016;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(cScale, cScale);

        // Tail
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(25, 10);
        ctx.bezierCurveTo(55, 15, 60, -35, 45, -45);
        ctx.stroke();

        // Cat Body
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat Head
        ctx.beginPath();
        ctx.arc(-14, -28, 22, 0, Math.PI * 2);
        ctx.fill();

        // Pointy Ears
        ctx.beginPath();
        ctx.moveTo(-30, -36);
        ctx.lineTo(-34, -58);
        ctx.lineTo(-18, -46);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-10, -46);
        ctx.lineTo(4, -58);
        ctx.lineTo(0, -36);
        ctx.closePath();
        ctx.fill();

        // Inner Pink Ears
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(-28, -38);
        ctx.lineTo(-31, -52);
        ctx.lineTo(-20, -44);
        ctx.closePath();
        ctx.fill();

        // Big Green Eyes
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(-22, -28, 4, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(-8, -28, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Black pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-22, -28, 2.5, 0, Math.PI * 2);
        ctx.arc(-8, -28, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pink Nose & Whiskers
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(-15, -20, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Left whiskers
        ctx.moveTo(-18, -20);
        ctx.lineTo(-38, -24);
        ctx.moveTo(-18, -18);
        ctx.lineTo(-36, -16);
        // Right whiskers
        ctx.moveTo(-12, -20);
        ctx.lineTo(8, -24);
        ctx.moveTo(-12, -18);
        ctx.lineTo(6, -16);
        ctx.stroke();

        // Paws
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-20, 18, 7, 0, Math.PI * 2);
        ctx.arc(-6, 18, 7, 0, Math.PI * 2);
        ctx.arc(10, 18, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Garden Flowers and Butterfly
        Primitives.drawFlower(ctx, w * 0.22, h * 0.78, w * 0.0011, 'tulip', '#ec4899');
        Primitives.drawFlower(ctx, w * 0.78, h * 0.76, w * 0.0012, 'daisy', '#facc15', '#b45309');
        Primitives.drawButterfly(ctx, w * 0.38, h * 0.42, w * 0.00065, -0.4, '#38bdf8', '#fbbf24');
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 9: Space Odyssey Rocket (Prompt Req 10 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-rocket',
      name: 'Space Adventure',
      category: 'Space',
      difficulty: 'Advanced',
      badge: '🚀',
      description: 'Aerodynamic rocket blasting through deep cosmos with glowing planets, stars, and flame trail.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Deep Space Canvas Background
        const space = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.1, w * 0.5, h * 0.5, w * 0.7);
        space.addColorStop(0, '#1e1b4b');
        space.addColorStop(0.6, '#0f172a');
        space.addColorStop(1, '#020617');
        ctx.fillStyle = space;
        ctx.fillRect(0, 0, w, h);

        // 2. Starfield
        const stars = [
          { x: w * 0.08, y: h * 0.15, s: 5 },
          { x: w * 0.18, y: h * 0.35, s: 7 },
          { x: w * 0.32, y: h * 0.12, s: 4 },
          { x: w * 0.45, y: h * 0.28, s: 6 },
          { x: w * 0.72, y: h * 0.16, s: 8 },
          { x: w * 0.88, y: h * 0.25, s: 5 },
          { x: w * 0.12, y: h * 0.75, s: 6 },
          { x: w * 0.82, y: h * 0.78, s: 7 },
          { x: w * 0.92, y: h * 0.55, s: 4 }
        ];
        stars.forEach(st => Primitives.drawStar(ctx, st.x, st.y, st.s, '#ffffff'));

        // 3. Ringed Saturn-like Planet
        const px = w * 0.82;
        const py = h * 0.32;
        const pr = w * 0.065;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-Math.PI / 6);

        // Back ring
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, pr * 1.8, pr * 0.4, 0, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Planet body
        const pGrad = ctx.createLinearGradient(-pr, -pr, pr, pr);
        pGrad.addColorStop(0, '#f97316');
        pGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, pr, 0, Math.PI * 2);
        ctx.fill();

        // Front ring
        ctx.beginPath();
        ctx.ellipse(0, 0, pr * 1.8, pr * 0.4, 0, 0, Math.PI);
        ctx.stroke();
        ctx.restore();

        // 4. Distant Moon
        Primitives.drawMoon(ctx, w * 0.22, h * 0.72, w * 0.045, false, '#fef08a', 'rgba(254, 240, 138, 0.3)');

        // 5. The Rocket Ship in Flight
        const rx = w * 0.46;
        const ry = h * 0.52;
        const rScale = w * 0.0018;

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(Math.PI / 4);
        ctx.scale(rScale, rScale);

        // Rocket Exhaust Blast & Smoke
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-16, 55);
        ctx.lineTo(0, 110);
        ctx.lineTo(16, 55);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-10, 55);
        ctx.lineTo(0, 85);
        ctx.lineTo(10, 55);
        ctx.closePath();
        ctx.fill();

        // Stabilizer Fins
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-24, 25);
        ctx.lineTo(-48, 55);
        ctx.lineTo(-24, 52);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(24, 25);
        ctx.lineTo(48, 55);
        ctx.lineTo(24, 52);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rocket Fuselage
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(0, -65);
        ctx.bezierCurveTo(32, -25, 28, 35, 24, 55);
        ctx.lineTo(-24, 55);
        ctx.bezierCurveTo(-28, 35, -32, -25, 0, -65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crimson Nose Cone
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(0, -65);
        ctx.bezierCurveTo(16, -42, 14, -28, 14, -24);
        ctx.lineTo(-14, -24);
        ctx.bezierCurveTo(-14, -28, -16, -42, 0, -65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Blue Porthole Window
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Window reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-4, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // NEW 10: Moonlight Night (Prompt Req 11 & 29)
    // ------------------------------------------------------------------------
    {
      id: 'trick-moonlight',
      name: 'Moonlight Night',
      category: 'Landscapes',
      difficulty: 'Advanced',
      badge: '🌙',
      description: 'Luminous crescent moon over serene midnight mountain ridges, silhouette pines, and fireflies.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Midnight Deep Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        sky.addColorStop(0, '#090d16');
        sky.addColorStop(0.6, '#0f172a');
        sky.addColorStop(1, '#1e293b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.7);

        // 2. Giant Luminous Moon
        Primitives.drawMoon(ctx, w * 0.78, h * 0.28, w * 0.08, true, '#fef08a', 'rgba(254, 240, 138, 0.2)');

        // 3. Twinkling Stars
        const stars = [
          { x: w * 0.12, y: h * 0.18, s: 4 },
          { x: w * 0.25, y: h * 0.28, s: 6 },
          { x: w * 0.42, y: h * 0.15, s: 5 },
          { x: w * 0.58, y: h * 0.22, s: 4 },
          { x: w * 0.35, y: h * 0.38, s: 5 }
        ];
        stars.forEach(st => Primitives.drawStar(ctx, st.x, st.y, st.s, '#ffffff'));

        // 4. Distant Mountain Silhouettes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.lineTo(w * 0.25, h * 0.36);
        ctx.lineTo(w * 0.48, h * 0.52);
        ctx.lineTo(w * 0.72, h * 0.32);
        ctx.lineTo(w * 0.92, h * 0.55);
        ctx.lineTo(w, h * 0.48);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // 5. Dark Forest Ground & Pines
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.quadraticCurveTo(w * 0.5, h * 0.65, w, h * 0.7);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Pine Silhouettes
        Primitives.drawTree(ctx, w * 0.12, h * 0.62, w * 0.0012, 'pine', { foliage: '#020617', outline: '#334155' });
        Primitives.drawTree(ctx, w * 0.24, h * 0.65, w * 0.00095, 'pine', { foliage: '#020617', outline: '#334155' });
        Primitives.drawTree(ctx, w * 0.88, h * 0.66, w * 0.0013, 'pine', { foliage: '#020617', outline: '#334155' });

        // 6. Cozy Little Cabin in the Woods
        const cx = w * 0.54;
        const cy = h * 0.68;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx, cy, w * 0.12, h * 0.1);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx, cy, w * 0.12, h * 0.1);

        // Roof
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + (w * 0.06), cy - h * 0.06);
        ctx.lineTo(cx + (w * 0.12) + 10, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Yellow Cabin Window
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx + w * 0.04, cy + h * 0.025, w * 0.04, h * 0.045);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + w * 0.04, cy + h * 0.025, w * 0.04, h * 0.045);

        // 7. Glowing Fireflies
        const fireflies = [
          { x: w * 0.38, y: h * 0.76 },
          { x: w * 0.44, y: h * 0.82 },
          { x: w * 0.68, y: h * 0.78 },
          { x: w * 0.74, y: h * 0.84 },
          { x: w * 0.82, y: h * 0.80 }
        ];
        fireflies.forEach(f => {
          ctx.fillStyle = '#a3e635';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
    },

    // ------------------------------------------------------------------------
    // BONUS 11: Tropical Summer Beach (Prompt Req 12)
    // ------------------------------------------------------------------------
    {
      id: 'trick-beach',
      name: 'Tropical Beach',
      category: 'Landscapes',
      difficulty: 'Advanced',
      badge: '🏖️',
      description: 'Postcard tropical summer scene with swaying palm trees, rolling waves, and beach umbrella.',
      draw(ctx, w, h) {
        ctx.save();
        // 1. Tropical Sun & Sky
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#fed7aa');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.55);

        Primitives.drawSun(ctx, w * 0.82, h * 0.18, w * 0.055, 14, w * 0.03, '#f59e0b', '#fbbf24');
        Primitives.drawCloud(ctx, w * 0.28, h * 0.16, w * 0.00075);

        // 2. Turquoise Ocean
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(0, h * 0.48, w, h * 0.22);

        // Ocean Wave Lines
        Primitives.drawWave(ctx, w * 0.1, h * 0.52, w * 0.3, 4, '#ffffff', 2.5);
        Primitives.drawWave(ctx, w * 0.55, h * 0.56, w * 0.35, 5, '#ffffff', 2.5);

        // 3. Sandy Shore
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.quadraticCurveTo(w * 0.45, h * 0.6, w, h * 0.7);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Swaying Palm Tree
        const px = w * 0.22;
        const py = h * 0.75;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(6, w * 0.012);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + w * 0.04, py - h * 0.2, px - w * 0.02, py - h * 0.38);
        ctx.stroke();

        // Palm Fronds
        const topX = px - w * 0.02;
        const topY = py - h * 0.38;
        ctx.fillStyle = '#15803d';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2.5;

        const fronds = [-0.8, -0.4, 0, 0.4, 0.8, 1.2];
        fronds.forEach(fa => {
          ctx.save();
          ctx.translate(topX, topY);
          ctx.rotate(fa);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(w * 0.08, -h * 0.06, w * 0.12, 0);
          ctx.quadraticCurveTo(w * 0.06, h * 0.04, 0, 0);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // 5. Beach Umbrella
        const ux = w * 0.62;
        const uy = h * 0.76;
        // Pole
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(ux + 12, uy - h * 0.15);
        ctx.stroke();

        // Canopy
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ux + 12, uy - h * 0.15, w * 0.065, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Yellow Stripe
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(ux + 12, uy - h * 0.15);
        ctx.arc(ux + 12, uy - h * 0.15, w * 0.065, Math.PI * 1.3, Math.PI * 1.7, false);
        ctx.closePath();
        ctx.fill();

        // Distant Sailboat
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.49);
        ctx.lineTo(w * 0.74, h * 0.45);
        ctx.lineTo(w * 0.74, h * 0.49);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  ];

  /* ==========================================================================
     TRICKS GALLERY MODAL CONTROLLER
     ========================================================================== */

  class TrickGalleryManager {
    constructor(paintApp) {
      this.paintApp = paintApp;
      this.currentCategory = 'All';
      this.modal = null;
      this.initModal();
    }

    initModal() {
      // Create Trick Gallery Modal Structure
      const modal = document.createElement('div');
      modal.className = 'trick-gallery-modal';
      modal.id = 'trick-gallery-modal';
      modal.innerHTML = `
        <div class="trick-gallery-backdrop" id="trick-gallery-backdrop"></div>
        <div class="trick-gallery-dialog" role="dialog" aria-label="Special Moves & Tricks Gallery">
          <!-- Header -->
          <div class="trick-gallery-header">
            <div class="trick-header-title-wrap">
              <span class="trick-badge-icon">✦</span>
              <div>
                <h2 class="trick-gallery-title">ARTIST SPECIAL MOVES & TRICKS GALLERY</h2>
                <p class="trick-gallery-subtitle">Aesthetic illustration sequences & procedural master drawings</p>
              </div>
            </div>
            <button class="trick-gallery-close-btn" id="btn-close-trick-gallery" aria-label="Close Gallery">✕</button>
          </div>

          <!-- Filter Category Tabs -->
          <div class="trick-filter-bar" id="trick-filter-bar">
            <button class="trick-filter-chip active" data-cat="All">All (${TRICK_GALLERY.length})</button>
            <button class="trick-filter-chip" data-cat="Landscapes">Landscapes</button>
            <button class="trick-filter-chip" data-cat="Nature">Nature</button>
            <button class="trick-filter-chip" data-cat="Storybook">Storybook</button>
            <button class="trick-filter-chip" data-cat="Adventure">Adventure</button>
            <button class="trick-filter-chip" data-cat="Space">Space</button>
            <button class="trick-filter-chip" data-cat="Classics">Classics</button>
          </div>

          <!-- Cards Grid -->
          <div class="trick-cards-grid" id="trick-cards-grid"></div>
        </div>
      `;
      document.body.appendChild(modal);
      this.modal = modal;

      // Event bindings
      const backdrop = document.getElementById('trick-gallery-backdrop');
      const closeBtn = document.getElementById('btn-close-trick-gallery');
      if (backdrop) backdrop.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      // Filter chips
      const chips = modal.querySelectorAll('.trick-filter-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.currentCategory = chip.dataset.cat;
          this.renderCards();
        });
      });

      this.renderCards();
    }

    renderCards() {
      const grid = document.getElementById('trick-cards-grid');
      if (!grid) return;
      grid.innerHTML = '';

      const filtered = this.currentCategory === 'All'
        ? TRICK_GALLERY
        : TRICK_GALLERY.filter(t => t.category === this.currentCategory);

      filtered.forEach(trick => {
        const card = document.createElement('div');
        card.className = 'trick-card';
        card.dataset.trickId = trick.id;

        const diffClass = `diff-${trick.difficulty.toLowerCase()}`;

        card.innerHTML = `
          <div class="trick-card-preview-wrap">
            <canvas class="trick-card-canvas" width="240" height="135"></canvas>
            <span class="trick-diff-badge ${diffClass}">${trick.difficulty}</span>
          </div>
          <div class="trick-card-body">
            <div class="trick-card-header-row">
              <span class="trick-card-name">${trick.badge} ${trick.name}</span>
              <span class="trick-category-tag">${trick.category}</span>
            </div>
            <p class="trick-card-desc">${trick.description}</p>
            <button class="trick-execute-btn" data-trick-id="${trick.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>EXECUTE SPECIAL MOVE</span>
            </button>
          </div>
        `;

        // Render actual live miniature illustration into the preview canvas
        const canvas = card.querySelector('.trick-card-canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          trick.draw(ctx, canvas.width, canvas.height, this.paintApp);
        }

        // Execute click
        const execBtn = card.querySelector('.trick-execute-btn');
        if (execBtn) {
          execBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.executeTrick(trick);
          });
        }
        card.addEventListener('click', () => this.executeTrick(trick));

        grid.appendChild(card);
      });
    }

    executeTrick(trick) {
      if (!trick || !this.paintApp) return;

      this.close();

      // 1. Stickman Focused Pose & Sound
      if (this.paintApp.stickman) {
        this.paintApp.stickman.setExpression('FOCUSED', 450);
        this.paintApp.setStickmanPose('drawing');
      }
      this.paintApp.playPencilAudio();

      // 2. Render Artwork onto Active Layer
      const layer = this.paintApp.getActiveLayer();
      if (layer && layer.ctx) {
        const ctx = layer.ctx;
        ctx.save();
        trick.draw(ctx, this.paintApp.canvasWidth, this.paintApp.canvasHeight, this.paintApp);
        ctx.restore();
        this.paintApp.saveHistory(`Trick: ${trick.name}`);
      }

      // 3. Stickman Victory Celebration
      setTimeout(() => {
        this.paintApp.stopPencilAudio();
        if (this.paintApp.stickman) {
          this.paintApp.stickman.triggerVictory();
        }
        this.paintApp.showToast(`Trick Mastered: ${trick.name}`);
      }, 300);
    }

    open() {
      if (!this.modal) return;
      this.modal.classList.add('open');
      this.renderCards();
    }

    close() {
      if (!this.modal) return;
      this.modal.classList.remove('open');
    }
  }

  // Export to window
  window.TRICK_GALLERY = TRICK_GALLERY;
  window.TrickGalleryManager = TrickGalleryManager;

})(window);
