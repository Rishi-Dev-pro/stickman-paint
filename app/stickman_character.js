/**
 * Stickman Character Engine — A Living, Expressive, Stylish Artist Companion
 * REBUILT WITH MAXIMUM VISUAL IMPACT & SWAG (HEROIC 140PX+ ON-SCREEN SCALE):
 * 
 * - Bold comic-weight line work (6.0px limbs, 5.5px head, 26px head radius)
 * - Huge, unmistakable Angular Anime Sigma Sunglasses (46px wide, obsidian black, bold white gleam, gold twinkle)
 * - Wide confident cocky smirk with upturned dimple notch
 * - Massive Tactical Fountain Pen (90px long, 11px wide, glowing cyan crystal orb, tactile grip ribs, fountain nib)
 * - Iconic "Sigma Stance & Swagger Walk": pen rested horizontally across shoulders like a blade,
 *   hand-on-hip akimbo with wide diamond elbow, puffed-out chest, cocked hip, and billowing cape-scarf
 * - Real Signature Sigma Moment: smooth multi-stage transition between Upper Half (Sigma Swagger) and Lower Half (Drawing Ready)
 * - Low-center-of-gravity planted drawing power stance with glowing ink contact aura
 * - Extreme aerodynamic Sprint stance (46° lean, speed lines, dual dust clouds)
 * - Sub-pixel zero-drift pencil tip anchor & zero-drift horizontal flip alignment
 */

class LivingStickman {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.scale = options.scale || 1.0;
    this.currentColor = options.color || '#2563eb';

    // Large canvas for bold, high-impact character rendering
    this.width = 300;
    this.height = 320;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'stickman-canvas';
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.display = 'block';
    this.ctx = this.canvas.getContext('2d');

    const existingImg = this.container.querySelector('#stickman-sprite');
    if (existingImg) {
      existingImg.style.display = 'none';
    }
    this.container.appendChild(this.canvas);

    // Master Animation State Machine
    this.state = 'IDLE'; // IDLE, WALKING, RUNNING, SPRINTING, DRAWING, FAST_DRAWING, STOPPING, THINKING, CELEBRATING, SURPRISED, TIRED, SIGMA
    this.flip = 1;
    this.flipSmoothed = 1;

    // Expression system with bold morph targets
    this.currentExpression = 'NORMAL';
    this.expressionWeights = {
      eyeOpen: 1.0,        // 0 to 1
      eyeSquint: 0.0,      // 0 to 1
      eyebrowAngle: 0.35,  // inward confident angle
      eyebrowHeight: 0.0,  // -1 to 1
      mouthCurve: 0.50,    // bold confident smirk
      mouthOpen: 0.0,      // 0 to 1
      pupilX: 0.0,         // -1 to 1
      pupilY: 0.0,         // -1 to 1
      sigmaGlasses: 0.0,   // 0 (none) to 1 (huge dark shades)
      sweatDrop: 0.0,      // 0 to 1
      sparkle: 0.0,        // 0 to 1
      exclamation: 0.0,    // 0 to 1 (!)
      questionMark: 0.0,   // 0 to 1 (?)
      brokenHeart: 0.0     // 0 to 1 (💔)
    };

    // Locomotion & Physics Cycle
    this.walkPhase = 0;
    this.walkSpeed = 0;
    this.leanAngle = 0;
    this.bounceY = 0;
    this.smoothedVelocity = 0;

    // Procedural Flowing Scarf Nodes (bold cape-like ribbons trailing behind neck)
    this.scarfTail1 = [
      { x: 0, y: 0 },
      { x: -20, y: 10 },
      { x: -44, y: 22 },
      { x: -70, y: 35 }
    ];
    this.scarfTail2 = [
      { x: 0, y: 0 },
      { x: -16, y: 8 },
      { x: -35, y: 18 },
      { x: -55, y: 26 }
    ];

    // Pen State & Kinematics
    this.penMode = 'down'; // 'down', 'up', 'shoulder', 'drawing'
    this.penElevation = 0; // 0 = down toward canvas, 1 = up horizontally over shoulder
    this.targetElevation = 0;
    this.penTwirlAngle = 0;
    this.isTwirling = false;

    // Upper/Lower Canvas Awareness & Signature Sigma Moment Transition
    this.isInUpperCanvas = false;
    this.sigmaTransition = 0.0; // 0 to 1 progress during region shift
    this.penSwingProgress = 1.0;
    this.penSwingDirection = 1;

    // Stop reaction timer
    this.stopReactionTime = 0;
    this.isStopReacting = false;

    // Inactivity & idle behaviors
    this.nextTwirlTime = performance.now() + 10000 + Math.random() * 6000;
    this.blinkTime = performance.now() + 2500;
    this.isBlinking = false;

    // Visual particles (speed lines, victory sparkles, skid dust clouds)
    this.particles = [];

    // Master Reference: Local coordinates of the pencil tip inside canvas space
    this.pencilTipLocal = { x: 215, y: 275 };
  }

  /* ==========================================================================
     Expression Controller with Smooth Morphing
     ========================================================================== */
  setExpression(exprName, duration = 0) {
    this.currentExpression = exprName;
    if (duration > 0) {
      clearTimeout(this.exprTimeout);
      this.exprTimeout = setTimeout(() => {
        this.currentExpression = this.getDefaultExpressionForState();
      }, duration);
    }
  }

  getDefaultExpressionForState() {
    switch (this.state) {
      case 'DRAWING': return 'FOCUSED';
      case 'FAST_DRAWING': return 'DETERMINED';
      case 'SPRINTING': return 'DETERMINED';
      case 'CELEBRATING': return 'CELEBRATION';
      case 'THINKING': return 'THINKING';
      case 'SURPRISED': return 'SURPRISED';
      case 'TIRED': return 'TIRED';
      case 'SIGMA': return 'SIGMA';
      case 'WALKING': return this.penElevation > 0.4 ? 'SIGMA' : 'NORMAL';
      default: return this.penElevation > 0.4 ? 'SIGMA' : 'NORMAL';
    }
  }

  updateExpressionWeights(dt) {
    const targets = {
      eyeOpen: 1.0,
      eyeSquint: 0.0,
      eyebrowAngle: 0.35,
      eyebrowHeight: 0.0,
      mouthCurve: 0.50, // Bold visible smirk
      mouthOpen: 0.0,
      pupilX: 0.0,
      pupilY: 0.0,
      sigmaGlasses: 0.0,
      sweatDrop: 0.0,
      sparkle: 0.0,
      exclamation: 0.0,
      questionMark: 0.0,
      brokenHeart: 0.0
    };

    // When pen elevation is high (upper canvas), Sigma Glasses ALWAYS engage
    if (this.penElevation > 0.35) {
      targets.sigmaGlasses = Math.min(1.0, (this.penElevation - 0.25) / 0.5);
      targets.mouthCurve = 0.70; // Big cocky smirk
      targets.sparkle = targets.sigmaGlasses;
    }

    const expr = this.currentExpression;
    if (expr === 'NORMAL') {
      targets.eyeOpen = 1.0;
      targets.eyeSquint = 0.15;
      targets.eyebrowAngle = 0.45;
      targets.mouthCurve = 0.55;
      targets.pupilX = 0.25;
    } else if (expr === 'SIGMA') {
      targets.eyeOpen = 0.60;
      targets.eyeSquint = 0.60;
      targets.eyebrowAngle = 0.30;
      targets.eyebrowHeight = 0.10;
      targets.mouthCurve = 0.75; // Wide cocky smirk
      targets.sigmaGlasses = 1.0; // HUGE SHADES
      targets.sparkle = 1.0;
      targets.pupilX = 0.4;
      targets.pupilY = -0.1;
    } else if (expr === 'FOCUSED') {
      targets.eyeOpen = 0.80;
      targets.eyeSquint = 0.60;
      targets.eyebrowAngle = 0.75; // Deep V-brow focused on drawing
      targets.eyebrowHeight = -0.30;
      targets.mouthCurve = 0.05;   // Firm focused mouth
      targets.pupilX = 0.70;       // Locked on fountain nib
      targets.pupilY = 0.80;
      targets.sigmaGlasses = 0.0;
    } else if (expr === 'DETERMINED') {
      targets.eyeOpen = 0.95;
      targets.eyeSquint = 0.75;
      targets.eyebrowAngle = 1.0;  // Sharp intense brow ("cooking")
      targets.eyebrowHeight = -0.45;
      targets.mouthCurve = 0.45;   // Gritted confident grin
      targets.mouthOpen = 0.25;
      targets.pupilX = 0.80;
      targets.pupilY = 0.65;
      targets.sigmaGlasses = 0.0;
    } else if (expr === 'HAPPY') {
      targets.eyeOpen = 0.05;      // Closed crescent eyes (^ ^)
      targets.eyeSquint = 1.0;
      targets.eyebrowAngle = -0.15;
      targets.eyebrowHeight = 0.50;
      targets.mouthCurve = 0.95;   // Broad happy crescent smile
      targets.mouthOpen = 0.50;
    } else if (expr === 'SURPRISED') {
      targets.eyeOpen = 1.55;      // Huge round eyes
      targets.eyeSquint = 0.0;
      targets.eyebrowAngle = -0.45;
      targets.eyebrowHeight = 0.95;
      targets.mouthCurve = 0.0;
      targets.mouthOpen = 1.0;     // Big open 'O' mouth
      targets.pupilX = 0.0;
      targets.pupilY = 0.0;
      targets.exclamation = 1.0;   // Floating comic ! symbol
      targets.sigmaGlasses = 0.0;
    } else if (expr === 'THINKING') {
      targets.eyeOpen = 0.85;
      targets.eyeSquint = 0.25;
      targets.eyebrowAngle = -0.60;
      targets.eyebrowHeight = 0.60;
      targets.mouthCurve = -0.20;
      targets.pupilX = -0.70;
      targets.pupilY = -0.75;
      targets.questionMark = 1.0;  // Floating comic ? symbol
    } else if (expr === 'TIRED') {
      targets.eyeOpen = 0.35;
      targets.eyeSquint = 0.80;
      targets.eyebrowAngle = -0.80;
      targets.eyebrowHeight = -0.15;
      targets.mouthCurve = -0.40;
      targets.sweatDrop = 1.0;     // Big cyan sweat drop
      targets.pupilY = 0.35;
      targets.sigmaGlasses = 0.0;
    } else if (expr === 'CELEBRATION') {
      targets.eyeOpen = 0.10;
      targets.eyeSquint = 0.95;
      targets.eyebrowAngle = -0.25;
      targets.eyebrowHeight = 0.55;
      targets.mouthCurve = 0.98;   // Triumphant open smile
      targets.mouthOpen = 0.75;
      targets.sparkle = 1.0;       // Floating gold star sparkles
    }

    // Natural eye blink cycle
    const now = performance.now();
    if (now > this.blinkTime && expr !== 'SIGMA' && expr !== 'HAPPY') {
      this.isBlinking = true;
      targets.eyeOpen = 0.05;
      if (now > this.blinkTime + 130) {
        this.isBlinking = false;
        this.blinkTime = now + 2600 + Math.random() * 3200;
      }
    }

    // Smooth exponential lerp
    const lerpRate = 0.28;
    for (const key in this.expressionWeights) {
      this.expressionWeights[key] += (targets[key] - this.expressionWeights[key]) * lerpRate;
    }
  }

  /* ==========================================================================
     Procedural Flowing Scarf Simulation (Dramatic Cape Wave)
     ========================================================================== */
  updateScarfPhysics(dt, now, neckX, neckY) {
    const dragX = -this.flip * (this.smoothedVelocity * 1.3 + 18);
    const windWave = Math.sin(now * 0.005) * 6;
    const waveFreq = this.state === 'SPRINTING' ? 0.018 : 0.009;

    // Tail 1 (Long primary ribbon)
    this.scarfTail1[0].x = neckX;
    this.scarfTail1[0].y = neckY + 2;

    for (let i = 1; i < this.scarfTail1.length; i++) {
      const prev = this.scarfTail1[i - 1];
      const curr = this.scarfTail1[i];
      const segLen = 22;

      const wave = Math.sin(now * waveFreq + i * 0.9) * (9 + this.smoothedVelocity * 0.20);
      const targetX = prev.x + (dragX * (i / 3)) * 0.90;
      const targetY = prev.y + (this.state === 'SPRINTING' ? 3 : (9 + i * 2.8)) + wave + windWave * 0.40;

      curr.x += (targetX - curr.x) * 0.35;
      curr.y += (targetY - curr.y) * 0.35;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy);
      if (dist > segLen) {
        curr.x = prev.x + (dx / dist) * segLen;
        curr.y = prev.y + (dy / dist) * segLen;
      }
    }

    // Tail 2 (Secondary overlapping ribbon)
    this.scarfTail2[0].x = neckX - this.flip * 4;
    this.scarfTail2[0].y = neckY + 4;

    for (let i = 1; i < this.scarfTail2.length; i++) {
      const prev = this.scarfTail2[i - 1];
      const curr = this.scarfTail2[i];
      const segLen = 17;

      const wave = Math.cos(now * waveFreq + i * 1.1) * (8 + this.smoothedVelocity * 0.16);
      const targetX = prev.x + (dragX * (i / 2.5)) * 0.80;
      const targetY = prev.y + (this.state === 'SPRINTING' ? -1 : (8 + i * 2.5)) + wave;

      curr.x += (targetX - curr.x) * 0.38;
      curr.y += (targetY - curr.y) * 0.38;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy);
      if (dist > segLen) {
        curr.x = prev.x + (dx / dist) * segLen;
        curr.y = prev.y + (dy / dist) * segLen;
      }
    }
  }

  /* ==========================================================================
     Master Update Loop
     ========================================================================== */
  update({
    now,
    dt,
    velocity,
    dx,
    dy,
    isDrawing,
    cursorX,
    cursorY,
    canvasRect,
    tool,
    strokeSize,
    color
  }) {
    if (color) this.currentColor = color;

    // Velocity smoothing & flip
    this.smoothedVelocity += (velocity - this.smoothedVelocity) * 0.24;

    if (Math.abs(dx) > 1.8) {
      this.flip = dx > 0 ? 1 : -1;
    }
    this.flipSmoothed += (this.flip - this.flipSmoothed) * 0.25;

    // Upper vs Lower Canvas Awareness (Sigma Walk vs Drawing Stance)
    if (canvasRect && canvasRect.height > 0) {
      const relY = (cursorY - canvasRect.top) / canvasRect.height;
      const inUpper = relY < 0.48; // Upper 48% is Sigma territory
      if (inUpper !== this.isInUpperCanvas && !isDrawing) {
        this.isInUpperCanvas = inUpper;
        this.penSwingProgress = 0.0;
        this.penSwingDirection = inUpper ? 1 : -1;
      }
    }

    // State Machine
    if (isDrawing) {
      this.isStopReacting = false;
      this.state = this.smoothedVelocity > 14 ? 'FAST_DRAWING' : 'DRAWING';
      this.targetElevation = 0; // Firmly anchored to paper
    } else if (this.isStopReacting) {
      if (now - this.stopReactionTime > 550) {
        this.isStopReacting = false;
        this.state = this.isInUpperCanvas ? 'WALKING' : 'IDLE';
      } else {
        this.state = 'STOPPING';
      }
    } else {
      if (this.smoothedVelocity > 25) {
        this.state = 'SPRINTING';
        this.targetElevation = this.isInUpperCanvas ? 1.0 : 0.45;
      } else if (this.smoothedVelocity > 12) {
        this.state = 'RUNNING';
        this.targetElevation = this.isInUpperCanvas ? 1.0 : 0.25;
      } else if (this.smoothedVelocity > 0.8) {
        this.state = 'WALKING';
        this.targetElevation = this.isInUpperCanvas ? 1.0 : 0.0;
      } else {
        if (this.state !== 'THINKING' && this.state !== 'CELEBRATING' && this.state !== 'TIRED') {
          this.state = 'IDLE';
          this.targetElevation = this.isInUpperCanvas ? 1.0 : 0.0;
        }
      }
    }

    // Pen Elevation & Swing Arc Animation
    if (this.penSwingProgress < 1.0) {
      this.penSwingProgress = Math.min(1.0, this.penSwingProgress + dt * 0.0035);
      const t = this.penSwingProgress;
      const ease = 1 - Math.pow(1 - t, 3);
      this.penElevation = this.penSwingDirection > 0 ? ease : (1.0 - ease);
    } else {
      this.penElevation += (this.targetElevation - this.penElevation) * 0.18;
    }

    // Directional Lean Physics (Deep athletic lean)
    let targetLean = 0;
    if (this.state === 'SPRINTING') {
      targetLean = 46; // Deep ninja sprint lean
    } else if (this.state === 'RUNNING') {
      targetLean = 24;
    } else if (this.state === 'WALKING') {
      targetLean = 9;
    } else if (this.state === 'STOPPING') {
      targetLean = -16; // Braced skid lean
    } else if (this.state === 'DRAWING' || this.state === 'FAST_DRAWING') {
      targetLean = 14;  // Planted forward lean toward paper
    }
    this.leanAngle += (targetLean - this.leanAngle) * 0.22;

    // Parametric Gait & Vertical Bounce
    if (this.state === 'WALKING' || this.state === 'RUNNING' || this.state === 'SPRINTING') {
      const speedMultiplier = this.state === 'SPRINTING' ? 0.032 : (this.state === 'RUNNING' ? 0.022 : 0.014);
      this.walkPhase += this.smoothedVelocity * speedMultiplier;
      const bounceIntensity = this.state === 'SPRINTING' ? 6.0 : (this.state === 'RUNNING' ? 4.0 : 2.2);
      this.bounceY = -Math.abs(Math.sin(this.walkPhase * 2)) * bounceIntensity;
    } else {
      this.bounceY = Math.sin(now * 0.0035) * 2.0; // Idle breathing
    }

    // Idle Pen Twirl
    if (this.state === 'IDLE' && now > this.nextTwirlTime && !this.isTwirling && !isDrawing) {
      this.isTwirling = true;
      this.twirlStartTime = now;
      this.nextTwirlTime = now + 12000 + Math.random() * 8000;
    }
    if (this.isTwirling) {
      const elapsed = now - this.twirlStartTime;
      const duration = 650;
      if (elapsed >= duration) {
        this.isTwirling = false;
        this.penTwirlAngle = 0;
      } else {
        const p = elapsed / duration;
        this.penTwirlAngle = Math.sin(p * Math.PI * 2) * (Math.PI * 2);
      }
    }

    // Particles
    if (this.state === 'SPRINTING' && Math.random() < 0.50) {
      this.addSpeedLineParticle();
    }
    if (this.state === 'STOPPING' && Math.random() < 0.65) {
      this.addSkidDustParticle();
    }
    this.updateParticles(dt, now);

    // Expressions & Rendering
    this.updateExpressionWeights(dt);
    this.render(now);
  }

  /* ==========================================================================
     Skeletal Rendering Engine (Heroic Proportions & Comic Ink Linework)
     ========================================================================== */
  render(now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Center base anchor
    const rootX = 145;
    const rootY = 220 + this.bounceY;

    // Draw background particles (speed lines)
    this.drawParticles(ctx, 'back');

    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate((this.leanAngle * Math.PI) / 180);

    // Skeletal Keypoints
    const hipX = 0;
    const hipY = 0;

    // Torso: Puffed chest leaning back proudly in Sigma stance
    const isSigmaStance = this.penElevation > 0.40;
    const chestHeight = isSigmaStance ? 66 : 58;
    const chestAngle = isSigmaStance ? -0.20 : 0.06;
    const chestX = Math.sin(chestAngle) * chestHeight;
    const chestY = -Math.cos(chestAngle) * chestHeight;

    // Neck & Head (Enlarged for bold, immediate readability)
    const headRadius = 26; // Massive, readable head circle
    const neckX = chestX;
    const neckY = chestY - 14;
    const headCenterX = neckX;
    const headCenterY = neckY - headRadius;

    // Update Flowing Scarf
    this.updateScarfPhysics(16, now, neckX, neckY);

    // 1. Draw Flowing Scarf Tails (Back layer)
    this.renderScarfTails(ctx, neckX, neckY, now);

    // 2. Draw Legs (Bold Comic Limbs)
    this.renderLegs(ctx, hipX, hipY, now);

    // 3. Draw Torso (Thick, confident comic line)
    ctx.beginPath();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(chestX, chestY);
    ctx.stroke();

    // 4. Draw Back Arm (Hand on hip akimbo when in Sigma)
    this.renderArm(ctx, chestX - 7, chestY + 3, 'back', now);

    // 5. Draw Scarf Neck Collar
    this.renderScarfCollar(ctx, neckX, neckY, now);

    // 6. Draw Head & Animated Facial Features
    this.renderHead(ctx, headCenterX, headCenterY);

    // 7. Draw Front Arm & Chunky Tactical Pen
    this.renderArmAndPen(ctx, chestX + 7, chestY + 3, 'front', now);

    ctx.restore();

    // Foreground particles (sparkles, dust, emotion glyphs)
    this.drawParticles(ctx, 'front');

    ctx.restore();
  }

  /* ==========================================================================
     Flowing Scarf Renderer (Bold Anime Cape-Scarf)
     ========================================================================== */
  renderScarfTails(ctx, neckX, neckY, now) {
    ctx.save();
    // Ribbon 1: Long main tail
    if (this.scarfTail1.length >= 4) {
      const pts = this.scarfTail1;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 12.0;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glowing Cyan outer hem
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.8;
      ctx.stroke();
    }

    // Ribbon 2: Secondary tail
    if (this.scarfTail2.length >= 4) {
      const pts = this.scarfTail2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 8.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderScarfCollar(ctx, neckX, neckY, now) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2.8;

    ctx.beginPath();
    ctx.ellipse(neckX, neckY + 4, 13.0, 7.0, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.6;
    ctx.moveTo(neckX - 7, neckY + 4);
    ctx.lineTo(neckX + 5, neckY + 5);
    ctx.stroke();
    ctx.restore();
  }

  /* ==========================================================================
     Legs Gait Engine (Bold Comic Limbs & Wide Stances)
     ========================================================================== */
  renderLegs(ctx, hipX, hipY, now) {
    const isStationary = this.state === 'DRAWING' || this.state === 'FAST_DRAWING' || this.state === 'IDLE' || this.state === 'THINKING' || this.state === 'CELEBRATING' || this.state === 'STOPPING';

    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 6.0;
    ctx.lineCap = 'round';

    if (this.state === 'STOPPING') {
      // COOL STOP SKID POSE (Deep braced stance)
      const foot1X = hipX + 28;
      const foot1Y = hipY + 68;
      const knee1X = hipX + 16;
      const knee1Y = hipY + 34;

      ctx.beginPath();
      ctx.moveTo(hipX + 5, hipY);
      ctx.lineTo(knee1X, knee1Y);
      ctx.lineTo(foot1X, foot1Y);
      ctx.stroke();

      const foot2X = hipX - 26;
      const foot2Y = hipY + 68;
      const knee2X = hipX - 12;
      const knee2Y = hipY + 30;

      ctx.beginPath();
      ctx.moveTo(hipX - 5, hipY);
      ctx.lineTo(knee2X, knee2Y);
      ctx.lineTo(foot2X, foot2Y);
      ctx.stroke();
      return;
    }

    if (isStationary) {
      if (this.penElevation > 0.40) {
        // SIGMA STAND (Straight locked left leg + casual bent right leg kicked out wide)
        const foot1X = hipX - 6;
        const foot1Y = hipY + 68;
        ctx.beginPath();
        ctx.moveTo(hipX - 5, hipY);
        ctx.lineTo(hipX - 6, hipY + 32);
        ctx.lineTo(foot1X, foot1Y);
        ctx.stroke();

        const foot2X = hipX + 28;
        const foot2Y = hipY + 68;
        const knee2X = hipX + 18;
        const knee2Y = hipY + 34;
        ctx.beginPath();
        ctx.moveTo(hipX + 5, hipY);
        ctx.lineTo(knee2X, knee2Y);
        ctx.lineTo(foot2X, foot2Y);
        ctx.stroke();
      } else {
        // Planted Artist Stance (Wide, low center of gravity)
        const isDraw = this.state.includes('DRAWING');
        const leg1Angle = isDraw ? -0.44 : -0.22;
        const knee1X = hipX - (isDraw ? 20 : 12) + Math.sin(leg1Angle) * 32;
        const knee1Y = hipY + Math.cos(leg1Angle) * 32;
        const foot1X = knee1X - (isDraw ? 12 : 6);
        const foot1Y = hipY + 68;

        ctx.beginPath();
        ctx.moveTo(hipX - 5, hipY);
        ctx.lineTo(knee1X, knee1Y);
        ctx.lineTo(foot1X, foot1Y);
        ctx.stroke();

        const leg2Angle = isDraw ? 0.48 : 0.22;
        const knee2X = hipX + (isDraw ? 18 : 12) + Math.sin(leg2Angle) * 32;
        const knee2Y = hipY + Math.cos(leg2Angle) * 32;
        const foot2X = knee2X + (isDraw ? 14 : 6);
        const foot2Y = hipY + 68;

        ctx.beginPath();
        ctx.moveTo(hipX + 5, hipY);
        ctx.lineTo(knee2X, knee2Y);
        ctx.lineTo(foot2X, foot2Y);
        ctx.stroke();
      }
    } else {
      // Dynamic Parametric Gait
      const stride = this.state === 'SPRINTING' ? 52 : (this.state === 'RUNNING' ? 40 : 26);
      const legLift = this.state === 'SPRINTING' ? 28 : (this.state === 'RUNNING' ? 20 : 11);

      // Leg 1 (Lead)
      const p1 = this.walkPhase;
      const foot1OffsetX = Math.sin(p1) * stride;
      const foot1OffsetY = Math.max(0, -Math.cos(p1) * legLift);
      const knee1X = hipX - 4 + foot1OffsetX * 0.45;
      const knee1Y = hipY + 32 - (foot1OffsetY * 0.3);
      const foot1X = hipX - 4 + foot1OffsetX;
      const foot1Y = hipY + 68 - foot1OffsetY;

      ctx.beginPath();
      ctx.moveTo(hipX - 5, hipY);
      ctx.lineTo(knee1X, knee1Y);
      ctx.lineTo(foot1X, foot1Y);
      ctx.stroke();

      // Leg 2 (Trail)
      const p2 = this.walkPhase + Math.PI;
      const foot2OffsetX = Math.sin(p2) * stride;
      const foot2OffsetY = Math.max(0, -Math.cos(p2) * legLift);
      const knee2X = hipX + 4 + foot2OffsetX * 0.45;
      const knee2Y = hipY + 32 - (foot2OffsetY * 0.3);
      const foot2X = hipX + 4 + foot2OffsetX;
      const foot2Y = hipY + 68 - foot2OffsetY;

      ctx.beginPath();
      ctx.moveTo(hipX + 5, hipY);
      ctx.lineTo(knee2X, knee2Y);
      ctx.lineTo(foot2X, foot2Y);
      ctx.stroke();
    }
  }

  /* ==========================================================================
     Animated Head & Facial Expression Renderer (Bold, High Contrast, Huge Shades)
     ========================================================================== */
  renderHead(ctx, hx, hy) {
    const r = 26; // Massive, readable head circle

    // 1. Crisp White Head Circle with Thick Black Outline
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 5.5;
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Head Tilt (Cocky swagger tilt in Sigma mode)
    ctx.save();
    ctx.translate(hx, hy);
    if (this.penElevation > 0.40) {
      ctx.rotate(0.24); // Bold swagger tilt
    } else if (this.state === 'STOPPING') {
      ctx.rotate(0.26);
    } else if (this.state === 'THINKING') {
      ctx.rotate(-0.24);
    }

    const w = this.expressionWeights;

    // --- EYEBROWS ---
    const browY = -8 + w.eyebrowHeight * 6;
    const browAngle = w.eyebrowAngle * 0.55;

    ctx.beginPath();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    // Left eyebrow
    ctx.moveTo(-13, browY - Math.sin(-browAngle) * 9);
    ctx.lineTo(-4, browY + Math.sin(-browAngle) * 9);
    // Right eyebrow
    ctx.moveTo(4, browY + Math.sin(browAngle) * 9);
    ctx.lineTo(13, browY - Math.sin(browAngle) * 9);
    ctx.stroke();

    // --- EYES ---
    const eyeY = -1;
    const eyeOpenH = Math.max(2.0, 8.0 * w.eyeOpen);
    const pupilOffX = w.pupilX * 3.5;
    const pupilOffY = w.pupilY * 3.5;

    if (w.sigmaGlasses > 0.25) {
      // HUGE, BOLD, UNMISTAKABLE ANGULAR ANIME SHADES (46px wide!)
      ctx.save();
      ctx.fillStyle = '#0a0f1d'; // Deep obsidian black

      // Left Lens Polygon (Aggressive angular wing)
      ctx.beginPath();
      ctx.moveTo(-23, eyeY - 7.5); // High outer wing
      ctx.lineTo(-2.5, eyeY - 3.5); // Inner bridge
      ctx.lineTo(-3.0, eyeY + 5.5); // Inner bottom
      ctx.lineTo(-12.5, eyeY + 9.5);// Sharp bottom point
      ctx.lineTo(-23.5, eyeY + 2.5);// Outer bottom
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Right Lens Polygon
      ctx.beginPath();
      ctx.moveTo(2.5, eyeY - 3.5);  // Inner bridge
      ctx.lineTo(23, eyeY - 7.5);   // High outer wing
      ctx.lineTo(23.5, eyeY + 2.5);  // Outer bottom
      ctx.lineTo(12.5, eyeY + 9.5);  // Sharp bottom point
      ctx.lineTo(3.0, eyeY + 5.5);   // Inner bottom
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bold Bridge Line
      ctx.beginPath();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 3.2;
      ctx.moveTo(-3.5, eyeY - 3.0);
      ctx.lineTo(3.5, eyeY - 3.0);
      ctx.stroke();

      // BOLD WHITE SPECULAR GLEAM SLASHES (Crisp & High Contrast)
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.moveTo(-19.5, eyeY - 4.0);
      ctx.lineTo(-10.0, eyeY + 6.0);
      ctx.moveTo(5.0, eyeY - 2.5);
      ctx.lineTo(16.0, eyeY + 6.0);
      ctx.stroke();

      // Gold Sparkle Twinkle Star at Outer Temple
      if (w.sparkle > 0.35) {
        ctx.fillStyle = '#f59e0b';
        const sx = 26, sy = eyeY - 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 7);
        ctx.lineTo(sx + 2.2, sy - 2.2);
        ctx.lineTo(sx + 7, sy);
        ctx.lineTo(sx + 2.2, sy + 2.2);
        ctx.lineTo(sx, sy + 7);
        ctx.lineTo(sx - 2.2, sy + 2.2);
        ctx.lineTo(sx - 7, sy);
        ctx.lineTo(sx - 2.2, sy - 2.2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (w.eyeOpen < 0.25) {
      // Happy / Celebratory closed crescents (^ ^)
      ctx.beginPath();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 3.8;
      ctx.arc(-8.0, eyeY + 2, 5.5, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8.0, eyeY + 2, 5.5, Math.PI, 0);
      ctx.stroke();
    } else {
      // Big Readable Expressive Eyes
      // Left eye
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2.8;
      ctx.ellipse(-8.0, eyeY, 5.5, eyeOpenH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#050505';
      const pupilR = w.exclamation > 0.5 ? 1.8 : Math.min(3.5, eyeOpenH * 0.65);
      ctx.arc(-8.0 + pupilOffX, eyeY + pupilOffY, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2.8;
      ctx.ellipse(8.0, eyeY, 5.5, eyeOpenH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#050505';
      ctx.arc(8.0 + pupilOffX, eyeY + pupilOffY, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- MOUTH (Wide, Prominent Cocky Smirk) ---
    const mouthY = 11;
    ctx.beginPath();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';

    if (w.mouthOpen > 0.35) {
      // Big open cheer or surprised O
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, mouthY, 6.0, 6.0 * w.mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // WIDE COCKY SMIRK WITH UPTURNED TICK
      const curve = w.mouthCurve * 5.5;
      ctx.beginPath();
      ctx.moveTo(-6, mouthY - curve * 0.2);
      ctx.quadraticCurveTo(1.5, mouthY + curve * 0.65, 10, mouthY - curve * 0.65);
      ctx.stroke();

      // Upturned dimple notch
      ctx.beginPath();
      ctx.moveTo(10, mouthY - curve * 0.65);
      ctx.lineTo(12.5, mouthY - curve * 0.65 - 3.5);
      ctx.stroke();
    }

    // --- FLOATING COMIC REACTION GLYPHS ---
    if (w.sweatDrop > 0.3) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(17, -12, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(13, -11.5);
      ctx.lineTo(17, -19);
      ctx.lineTo(21, -11.5);
      ctx.closePath();
      ctx.fill();
    }

    if (w.exclamation > 0.4) {
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.roundRect(22, -26, 4.2, 12, 2.0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(24.1, -10.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (w.questionMark > 0.4) {
      ctx.fillStyle = '#050505';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('?', 20, -14);
    }

    if (w.brokenHeart > 0.4) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '20px sans-serif';
      ctx.fillText('💔', 18, -14);
    }

    if (w.sparkle > 0.5 && this.state === 'CELEBRATING') {
      ctx.fillStyle = '#f59e0b';
      const sx = 22, sy = -22;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 8);
      ctx.lineTo(sx + 2.5, sy - 2.5);
      ctx.lineTo(sx + 8, sy);
      ctx.lineTo(sx + 2.5, sy + 2.5);
      ctx.lineTo(sx, sy + 8);
      ctx.lineTo(sx - 2.5, sy + 2.5);
      ctx.lineTo(sx - 8, sy);
      ctx.lineTo(sx - 2.5, sy - 2.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /* ==========================================================================
     Arm & Massive Tactical Pen Kinematics (90px Length, Big Glowing Crystal)
     ========================================================================== */
  renderArm(ctx, sx, sy, layer, now) {
    if (layer === 'back') {
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 5.8;
      ctx.lineCap = 'round';

      if (this.penElevation > 0.40) {
        // HAND ON HIP (Wide akimbo triangle — bold, swaggering, unbothered)
        const elbowX = sx - 26; // Elbow jutting out wide to side
        const elbowY = sy + 20;
        const handX = sx - 6;
        const handY = sy + 34;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = '#050505';
        ctx.arc(handX, handY, 5.0, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      // Counter-swing during locomotion
      let armAngle = 0;
      if (this.state === 'SPRINTING') {
        armAngle = -Math.sin(this.walkPhase) * 1.40;
      } else if (this.state === 'RUNNING') {
        armAngle = -Math.sin(this.walkPhase) * 1.05;
      } else if (this.state === 'WALKING') {
        armAngle = -Math.sin(this.walkPhase) * 0.65;
      } else if (this.state.includes('DRAWING')) {
        armAngle = -0.60;
      } else if (this.state === 'CELEBRATING') {
        armAngle = -2.5; // High fist pump
      }

      const elbowX = sx + Math.sin(armAngle) * 24;
      const elbowY = sy + Math.cos(armAngle) * 24;
      const handX = elbowX + Math.sin(armAngle + 0.3) * 22;
      const handY = elbowY + Math.cos(armAngle + 0.3) * 22;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#050505';
      ctx.arc(handX, handY, 5.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderArmAndPen(ctx, sx, sy, layer, now) {
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 5.8;
    ctx.lineCap = 'round';

    let handTargetX = 0;
    let handTargetY = 0;
    let penAngle = 0;

    const isDrawingState = this.state === 'DRAWING' || this.state === 'FAST_DRAWING';

    if (isDrawingState) {
      // Planted drawing hand firmly extending to fountain nib
      handTargetX = 60;
      handTargetY = 40;
      penAngle = 0.12; // Pointing down to paper anchor
    } else if (this.state === 'THINKING') {
      handTargetX = 18;
      handTargetY = -30;
      penAngle = -2.4;
    } else if (this.state === 'CELEBRATING') {
      handTargetX = 44;
      handTargetY = -72;
      penAngle = -2.8;
    } else if (this.state === 'STOPPING') {
      handTargetX = -26;
      handTargetY = 20;
      penAngle = -2.1;
    } else if (this.state === 'SPRINTING') {
      handTargetX = -30;
      handTargetY = 14;
      penAngle = -2.4; // Pen held backward like a blade
    } else if (this.isTwirling) {
      handTargetX = 42;
      handTargetY = 16;
      penAngle = this.penTwirlAngle;
    } else {
      const elev = this.penElevation;
      if (elev > 0.40) {
        // PEN RESTED HORIZONTALLY OVER SHOULDER (Iconic Sigma Pose from Reference)
        // Hand grips near collar, pen barrel rests flat across top of shoulders
        handTargetX = 22;
        handTargetY = -16;
        penAngle = 1.35; // Horizontal from left-back to right-front
      } else {
        handTargetX = 48 - (elev * 26);
        handTargetY = 26 - (elev * 42);
        penAngle = 0.28 - (elev * 2.20);
      }

      if (this.state === 'WALKING' || this.state === 'RUNNING') {
        const swing = Math.sin(this.walkPhase) * (this.state === 'RUNNING' ? 12 : 6);
        handTargetX += swing * 0.4;
        handTargetY += swing * 0.3;
      }
    }

    const targetHx = sx + handTargetX;
    const targetHy = sy + handTargetY;

    // Mid-elbow
    const midX = (sx + targetHx) / 2 + (this.penElevation > 0.40 ? 14 : 11);
    const midY = (sy + targetHy) / 2;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(midX, midY);
    ctx.lineTo(targetHx, targetHy);
    ctx.stroke();

    // Hand Grip
    ctx.beginPath();
    ctx.fillStyle = '#050505';
    ctx.arc(targetHx, targetHy, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // --- RENDER MASSIVE TACTICAL FOUNTAIN PEN (90px Long, 11px Wide) ---
    ctx.save();
    ctx.translate(targetHx, targetHy);
    ctx.rotate(penAngle);

    const penLength = 90;
    const penTipOffset = 56; // Distance from hand to nib tip

    // 1. Glowing Cyan Pommel Power Orb at Tail
    const tailY = -penLength + penTipOffset;
    ctx.beginPath();
    const gradOrb = ctx.createRadialGradient(0, tailY, 1.2, 0, tailY, 9);
    gradOrb.addColorStop(0, '#ffffff');
    gradOrb.addColorStop(0.35, '#38bdf8');
    gradOrb.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = gradOrb;
    ctx.arc(0, tailY, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#38bdf8';
    ctx.arc(0, tailY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dark Metallic Gunmetal Rear Barrel
    ctx.beginPath();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2.4;
    ctx.roundRect(-5.5, tailY + 6, 11, 12, 2.5);
    ctx.fill();
    ctx.stroke();

    // 3. Silver Tactical Ring & Textured Ribbed Grip
    ctx.beginPath();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-5.5, tailY + 18, 11, 6);
    ctx.stroke();

    // 4. Main Ink Reservoir Barrel (Color synced with active brush)
    ctx.beginPath();
    ctx.fillStyle = this.currentColor || '#2563eb';
    ctx.roundRect(-5.5, tailY + 24, 11, penLength - 44, 2.5);
    ctx.fill();
    ctx.stroke();

    // Glossy Specular Highlight Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.moveTo(-2.5, tailY + 26);
    ctx.lineTo(-2.5, penTipOffset - 19);
    ctx.stroke();

    // 5. Silver Tapered Cone Ferrule
    ctx.beginPath();
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2.4;
    ctx.fillRect(-4.2, penTipOffset - 17, 8.4, 7);
    ctx.stroke();

    // 6. Distinctive Fountain Pen Nib
    ctx.beginPath();
    ctx.fillStyle = '#0f172a';
    ctx.moveTo(-4.2, penTipOffset - 10);
    ctx.lineTo(4.2, penTipOffset - 10);
    ctx.lineTo(0, penTipOffset); // Sharp point!
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nib Center Split Slit Line
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.moveTo(0, penTipOffset - 10);
    ctx.lineTo(0, penTipOffset - 2.5);
    ctx.stroke();

    // 7. Glowing Ink Contact Aura (When Drawing)
    if (isDrawingState) {
      ctx.beginPath();
      const gradGlow = ctx.createRadialGradient(0, penTipOffset, 1.5, 0, penTipOffset, 12);
      gradGlow.addColorStop(0, '#38bdf8');
      gradGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
      gradGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = gradGlow;
      ctx.arc(0, penTipOffset, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ink deposit dot at the very tip
    ctx.beginPath();
    ctx.fillStyle = this.currentColor;
    ctx.arc(0, penTipOffset, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Pencil Tip Calculation in local canvas coordinate space
    const cosA = Math.cos(penAngle);
    const sinA = Math.sin(penAngle);
    const tipRelX = -sinA * penTipOffset;
    const tipRelY = cosA * penTipOffset;

    const leanRad = (this.leanAngle * Math.PI) / 180;
    const cosL = Math.cos(leanRad);
    const sinL = Math.sin(leanRad);

    const fullLocalX = targetHx + tipRelX;
    const fullLocalY = targetHy + tipRelY;

    this.pencilTipLocal.x = 145 + (cosL * fullLocalX - sinL * fullLocalY);
    this.pencilTipLocal.y = 220 + this.bounceY + (sinL * fullLocalX + cosL * fullLocalY);

    ctx.restore();
  }

  /* ==========================================================================
     Special Actions & Reactions
     ========================================================================== */
  triggerTwirl() {
    this.isTwirling = true;
    this.twirlStartTime = performance.now();
    this.penTwirlAngle = 0;
    this.setExpression('SIGMA', 1200);
  }

  triggerStoppingReaction() {
    this.isStopReacting = true;
    this.stopReactionTime = performance.now();
    this.setExpression('SIGMA', 750);
    for (let i = 0; i < 6; i++) {
      this.addSkidDustParticle();
    }
  }

  triggerVictory() {
    this.state = 'CELEBRATING';
    this.setExpression('CELEBRATION', 1600);
    this.addVictorySparkles();
    setTimeout(() => {
      this.state = this.isInUpperCanvas ? 'WALKING' : 'IDLE';
    }, 1600);
  }

  triggerDisappointed() {
    this.setExpression('TIRED', 850);
    this.expressionWeights.brokenHeart = 1.0;
  }

  triggerConfident() {
    this.setExpression('SIGMA', 1100);
  }

  triggerSurprise() {
    this.state = 'SURPRISED';
    this.setExpression('SURPRISED', 750);
    setTimeout(() => {
      this.state = this.isInUpperCanvas ? 'WALKING' : 'IDLE';
    }, 750);
  }

  /* ==========================================================================
     Particle & FX System
     ========================================================================== */
  addSpeedLineParticle() {
    this.particles.push({
      type: 'speedline',
      layer: 'back',
      x: 130 - (this.flip * (40 + Math.random() * 35)),
      y: 200 + (Math.random() - 0.5) * 70,
      len: 35 + Math.random() * 45,
      speed: 6 + Math.random() * 5,
      alpha: 0.85,
      color: '#94a3b8'
    });
  }

  addSkidDustParticle() {
    this.particles.push({
      type: 'dust',
      layer: 'front',
      x: 145 + (Math.random() - 0.5) * 36,
      y: 285,
      r: 4.0 + Math.random() * 6.0,
      alpha: 0.75,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -Math.random() * 2.2
    });
  }

  addVictorySparkles() {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        type: 'sparkle',
        layer: 'front',
        x: 145 + (Math.random() - 0.5) * 80,
        y: 130 + (Math.random() - 0.5) * 70,
        r: 4.0 + Math.random() * 4.5,
        alpha: 1.0,
        color: ['#f59e0b', '#38bdf8', '#ec4899', '#10b981'][i % 4],
        vy: -1.2 - Math.random() * 1.6
      });
    }
  }

  updateParticles(dt, now) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.alpha -= dt * 0.0026;
      if (p.type === 'speedline') {
        p.x -= this.flip * p.speed;
      } else if (p.type === 'dust') {
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.12;
      } else if (p.type === 'sparkle') {
        p.y += p.vy;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles(ctx, targetLayer) {
    this.particles.forEach(p => {
      if (p.layer !== targetLayer) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.type === 'speedline') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - this.flip * p.len, p.y);
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        const sx = p.x, sy = p.y, r = p.r;
        ctx.beginPath();
        ctx.moveTo(sx, sy - r * 1.5);
        ctx.lineTo(sx + r * 0.4, sy - r * 0.4);
        ctx.lineTo(sx + r * 1.5, sy);
        ctx.lineTo(sx + r * 0.4, sy + r * 0.4);
        ctx.lineTo(sx, sy + r * 1.5);
        ctx.lineTo(sx - r * 0.4, sy + r * 0.4);
        ctx.lineTo(sx - r * 1.5, sy);
        ctx.lineTo(sx - r * 0.4, sy - r * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

window.LivingStickman = LivingStickman;
