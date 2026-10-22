/**
 * Stickman Paint — Refined Creative Canvas Engine
 * High-performance, distraction-free drawing suite with animated Stickman companion
 */

class StickmanPaintApp {
  constructor() {
    // Canvas Specifications
    this.canvasWidth = 1280;
    this.canvasHeight = 720;
    this.zoom = 1.0;

    // Tool & Brush State
    this.currentTool = 'pencil'; // 'pencil', 'brush', 'eraser', 'bucket', 'eyedropper', 'shape'
    this.currentBrush = 'pencil'; // 'pencil', 'ink', 'marker', 'crayon', 'watercolor', 'airbrush'
    this.currentShape = 'line'; // 'line', 'rect', 'circle', 'triangle', 'arrow', 'star'
    this.shapeFill = false;
    this.strokeSize = 4;
    this.currentColor = '#000000';
    this.eraseAllLayers = false;

    // Stickman Living Cursor Physics & Living State Machine
    this.stickmanPose = 'hover'; // 'hover', 'drawing', 'thinking', 'idle'
    this.stickmanScale = 1.0; // Heroic character scale (~125px on-screen height)
    this.stickmanFlip = 1; // 1 = right, -1 = left
    this.stickmanVisible = false;

    // Animation State System
    this.animState = 'hover'; // 'idle', 'hover', 'drawing', 'fastDrawing', 'stopping', 'thinking'
    this.lastActivityTime = performance.now();
    this.drawStopTime = 0;
    this.microMoveStartTime = 0;
    this.microMoveDuration = 1200;
    this.microMoveTarget = 0;
    this.nextMicroMoveTime = performance.now() + 3500;
    this.idleGlanceStartTime = 0;
    this.idleGlanceDuration = 0;
    this.idleGlanceTarget = 0;
    this.nextIdleGlanceTime = performance.now() + 6500;

    // Smooth Physics State
    this.targetX = -9999;
    this.targetY = -9999;
    this.currentX = -9999;
    this.currentY = -9999;
    this.prevX = 0;
    this.prevY = 0;
    this.velocity = 0;
    this.tiltAngle = 0;

    // Drawing Interaction State
    this.isDrawing = false;
    this.stabilizer = true;
    this.strokePoints = [];
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;

    // Audio Engine
    this.soundEnabled = false;
    this.audioCtx = null;
    this.isAudioDrawing = false;

    // Layers System
    this.layers = [];
    this.activeLayerIndex = 0;
    this.layerIdCounter = 1;

    // History System
    this.historyStack = [];
    this.historyIndex = -1;
    this.maxHistory = 30;

    this.initDOM();
    this.initLayers();
    this.initEvents();
    this.initAudio();
    this.startStickmanLoop();
    this.saveHistory('Initial Canvas');
    this.fitCanvasToViewport();
  }

  /* ==========================================================================
     DOM Caching
     ========================================================================== */
  initDOM() {
    this.app = document.getElementById('app');
    this.workspace = document.getElementById('drawing-workspace');
    this.canvasStage = document.getElementById('canvas-stage');
    this.canvasInkWrapper = document.getElementById('canvas-ink-wrapper');
    this.paperContainer = document.getElementById('paper-container');
    this.paperSheet = document.getElementById('paper-sheet');
    this.layersContainer = document.getElementById('layers-container');
    this.previewCanvas = document.getElementById('preview-canvas');
    this.previewCtx = this.previewCanvas.getContext('2d');

    // Stickman Actor
    this.stickmanActor = document.getElementById('stickman-actor');
    this.stickmanBody = document.getElementById('stickman-body');
    this.stickmanSprite = document.getElementById('stickman-sprite');
    this.cursorCrosshair = document.getElementById('cursor-crosshair');

    // Living Character Engine
    if (typeof LivingStickman !== 'undefined') {
      this.stickman = new LivingStickman(this.stickmanBody, {
        scale: this.stickmanScale,
        color: this.currentColor
      });
    }

    // Panels & Controls
    this.layersList = document.getElementById('layers-list');
    this.brushSizeSlider = document.getElementById('brush-size-slider');
    this.brushSizeVal = document.getElementById('brush-size-val');
    this.strokePreviewPath = document.getElementById('stroke-preview-path');
    this.colorWheelCanvas = document.getElementById('color-wheel-canvas');
    this.nativeColorPicker = document.getElementById('native-color-picker');
    this.zoomValue = document.getElementById('zoom-value');

    // Popovers
    this.shapesPopover = document.getElementById('shape-popover-wrapper');
    this.tricksPopover = document.getElementById('tricks-popover-wrapper');
    this.settingsPopover = document.getElementById('settings-popover-wrapper');

    // Toast
    this.toast = document.getElementById('toast');
    this.toastMsg = document.getElementById('toast-msg');

    this.initColorWheel();
  }

  /* ==========================================================================
     Multi-Layer Engine
     ========================================================================== */
  initLayers() {
    this.layersContainer.innerHTML = '';
    this.layers = [];
    this.paperSheet.style.width = `${this.canvasWidth}px`;
    this.paperSheet.style.height = `${this.canvasHeight}px`;
    this.previewCanvas.width = this.canvasWidth;
    this.previewCanvas.height = this.canvasHeight;

    // 1. Background Layer (Pure White Paper)
    const bg = this.addLayer('Background', true);
    bg.ctx.fillStyle = '#ffffff';
    bg.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2. Initial Drawing Layers matching Reference (Layer 1, Layer 2, Layer 3)
    this.addLayer('Layer 1', false);
    this.addLayer('Layer 2', false);
    this.addLayer('Layer 3', false);
    this.renderLayersUI();
  }

  addLayer(name = null, isBg = false) {
    const id = this.layerIdCounter++;
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    canvas.className = 'canvas-layer';
    canvas.id = `layer-${id}`;

    this.layersContainer.appendChild(canvas);

    const layer = {
      id,
      name: name || `Layer ${id}`,
      canvas,
      ctx: canvas.getContext('2d'),
      visible: true,
      opacity: 1.0,
      isBackground: isBg
    };

    this.layers.push(layer);
    this.activeLayerIndex = this.layers.length - 1;
    this.renderLayersUI();
    return layer;
  }

  getActiveLayer() {
    return this.layers[this.activeLayerIndex] || this.layers[0];
  }

  renderLayersUI() {
    if (!this.layersList) return;
    this.layersList.innerHTML = '';
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const item = document.createElement('div');
      item.className = `warrior-layer-row ${i === this.activeLayerIndex ? 'active' : ''}`;
      
      const eyeSvg = layer.visible
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      
      const thumbClass = layer.isBackground ? 'layer-thumb-box' : 'layer-thumb-box checker';
      const rightAction = layer.isBackground
        ? `<span class="layer-row-action" title="Locked"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>`
        : `<span class="layer-row-action" title="Options"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg></span>`;

      item.innerHTML = `
        <button class="layer-eye-btn" title="Toggle visibility" aria-label="Toggle visibility">${eyeSvg}</button>
        <div class="${thumbClass}"></div>
        <span class="layer-row-title">${layer.name}</span>
        ${rightAction}
      `;

      item.addEventListener('click', (e) => {
        const visBtn = e.target.closest('.layer-eye-btn');
        if (visBtn) {
          layer.visible = !layer.visible;
          layer.canvas.style.display = layer.visible ? 'block' : 'none';
          this.renderLayersUI();
          return;
        }
        this.activeLayerIndex = i;
        this.renderLayersUI();
      });

      this.layersList.appendChild(item);
    }
  }

  deleteActiveLayer() {
    if (this.layers.length <= 1) return;
    const layer = this.layers[this.activeLayerIndex];
    if (layer.isBackground) return; // Background locked
    layer.canvas.remove();
    this.layers.splice(this.activeLayerIndex, 1);
    this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
    this.renderLayersUI();
    this.saveHistory('Delete Layer');
  }

  /* ==========================================================================
     HSV Color Wheel Engine
     ========================================================================== */
  initColorWheel() {
    if (!this.colorWheelCanvas) return;
    const canvas = this.colorWheelCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const outerR = cx - 2;
    const innerR = outerR - 14;

    this.currentHue = 200; // Warrior cyan-blue initial hue
    this.currentSat = 1.0;
    this.currentVal = 1.0;

    const drawWheel = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Outer Rainbow Hue Ring
      for (let angle = 0; angle < 360; angle += 1) {
        const startRad = (angle - 1.5) * Math.PI / 180;
        const endRad = (angle + 1.5) * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startRad, endRad);
        ctx.arc(cx, cy, innerR, endRad, startRad, true);
        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
      }

      // Outer ring border
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Inner Saturation-Value box (50x50)
      const boxSize = 50;
      const bx = cx - boxSize / 2;
      const by = cy - boxSize / 2;

      // Base pure hue fill
      ctx.fillStyle = `hsl(${this.currentHue}, 100%, 50%)`;
      ctx.fillRect(bx, by, boxSize, boxSize);

      // White horizontal gradient (saturation)
      const gradWhite = ctx.createLinearGradient(bx, by, bx + boxSize, by);
      gradWhite.addColorStop(0, 'rgba(255,255,255,1)');
      gradWhite.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradWhite;
      ctx.fillRect(bx, by, boxSize, boxSize);

      // Black vertical gradient (brightness/value)
      const gradBlack = ctx.createLinearGradient(bx, by, bx, by + boxSize);
      gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
      gradBlack.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gradBlack;
      ctx.fillRect(bx, by, boxSize, boxSize);

      // SV box subtle border
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxSize, boxSize);
    };

    drawWheel();
    this.drawColorWheel = drawWheel;

    const pickColor = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (width / rect.width);
      const y = (e.clientY - rect.top) * (height / rect.height);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      const boxSize = 50;
      const bx = cx - boxSize / 2;
      const by = cy - boxSize / 2;

      if (dist >= innerR - 2 && dist <= outerR + 4) {
        // Hue ring selected
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        this.currentHue = Math.round(angle);
        drawWheel();
        this.updateColorFromHSV();
      } else if (x >= bx && x <= bx + boxSize && y >= by && y <= by + boxSize) {
        // Inside SV box
        this.currentSat = Math.max(0, Math.min(1, (x - bx) / boxSize));
        this.currentVal = Math.max(0, Math.min(1, 1 - (y - by) / boxSize));
        this.updateColorFromHSV();
      }
    };

    let isPicking = false;
    canvas.addEventListener('pointerdown', (e) => {
      isPicking = true;
      canvas.setPointerCapture(e.pointerId);
      pickColor(e);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (isPicking) pickColor(e);
    });
    const stopPick = () => { isPicking = false; };
    canvas.addEventListener('pointerup', stopPick);
    canvas.addEventListener('pointercancel', stopPick);
  }

  updateColorFromHSV() {
    const h = this.currentHue;
    const s = this.currentSat;
    const v = this.currentVal;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    const hex = `#${rHex}${gHex}${bHex}`;
    this.setColor(hex);
  }

  /* ==========================================================================
     Living Stickman Cursor (Smooth 60 FPS Physics Loop & Alive Animation)
     ========================================================================== */
  startStickmanLoop() {
    let lastTime = performance.now();

    const updatePhysics = () => {
      if (this.stickmanVisible) {
        const now = performance.now();
        const dt = Math.min(now - lastTime, 64);
        lastTime = now;

        // 1. Velocity & Tracking
        // When drawing, snap 100% tightly so pencil tip is EXACTLY on cursor with ZERO latency:
        const lerpFactor = this.isDrawing ? 1.0 : (this.animState === 'stopping' ? 0.70 : 0.40);
        this.currentX += (this.targetX - this.currentX) * lerpFactor;
        this.currentY += (this.targetY - this.currentY) * lerpFactor;

        const dx = this.targetX - this.prevX;
        const dy = this.targetY - this.prevY;
        this.velocity = Math.sqrt(dx * dx + dy * dy);

        // Directional Flip: Face drawing direction (threshold 2.5px to avoid flutter)
        if (Math.abs(dx) > 2.5) {
          this.stickmanFlip = dx > 0 ? 1 : -1;
        }

        // Edge turnaround awareness: when close to viewport edges, turn toward center
        if (this.currentX < 85) this.stickmanFlip = 1;
        else if (this.currentX > window.innerWidth - 85) this.stickmanFlip = -1;

        if (this.stickman) {
          this.stickman.flip = this.stickmanFlip;
        }

        // 2. Update LivingStickman character engine
        if (this.stickman) {
          const canvasRect = this.paperSheet.getBoundingClientRect();
          this.stickman.update({
            now,
            dt,
            velocity: this.velocity,
            dx,
            dy,
            isDrawing: this.isDrawing,
            cursorX: this.currentX,
            cursorY: this.currentY,
            canvasRect,
            tool: this.currentTool,
            strokeSize: this.strokeSize,
            color: this.currentColor
          });
        }

        this.prevX = this.targetX;
        this.prevY = this.targetY;

        this.renderStickmanTransform();
      } else {
        lastTime = performance.now();
      }

      requestAnimationFrame(updatePhysics);
    };

    requestAnimationFrame(updatePhysics);
  }

  setStickmanPose(pose) {
    if (this.stickmanPose === pose) return;
    this.stickmanPose = pose;

    if (this.stickman) {
      if (pose === 'drawing') this.stickman.setExpression('FOCUSED');
      else if (pose === 'thinking') this.stickman.setExpression('THINKING');
      else if (pose === 'idle') this.stickman.setExpression('NORMAL');
      else this.stickman.setExpression('NORMAL');
    }

    let spriteUrl = '';
    if (typeof STICKMAN_SPRITES !== 'undefined') {
      if (pose === 'drawing') spriteUrl = STICKMAN_SPRITES.stickman_drawing;
      else if (pose === 'thinking') spriteUrl = STICKMAN_SPRITES.stickman_thinking;
      else if (pose === 'idle') spriteUrl = STICKMAN_SPRITES.stickman_idle;
      else spriteUrl = STICKMAN_SPRITES.stickman_hover;
    } else {
      spriteUrl = `assets/stickman_${pose}.png`;
    }

    if (this.stickmanSprite) {
      this.stickmanSprite.src = spriteUrl;
    }
  }

  renderStickmanTransform() {
    if (this.stickman) {
      const tip = this.stickman.pencilTipLocal;
      const canvasW = this.stickman.width;
      const canvasH = this.stickman.height;

      const anchorX = tip.x / canvasW;
      const anchorY = tip.y / canvasH;

      const baseWidth = 175 * this.stickmanScale;
      const baseHeight = 190 * this.stickmanScale;

      const offsetX = anchorX * baseWidth;
      const offsetY = anchorY * baseHeight;

      const posX = this.currentX - offsetX;
      const posY = this.currentY - offsetY;

      if (!window._loggedAnchor) {
        window._loggedAnchor = true;
        console.log('STICKMAN_DEBUG:', JSON.stringify({
          currentX: Math.round(this.currentX),
          currentY: Math.round(this.currentY),
          tipX: Math.round(tip.x),
          tipY: Math.round(tip.y),
          anchorX: anchorX.toFixed(3),
          anchorY: anchorY.toFixed(3),
          baseWidth: Math.round(baseWidth),
          baseHeight: Math.round(baseHeight),
          offsetX: Math.round(offsetX),
          offsetY: Math.round(offsetY),
          posX: Math.round(posX),
          posY: Math.round(posY)
        }));
      }

      this.stickmanActor.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      this.stickmanBody.style.width = `${baseWidth}px`;
      this.stickmanBody.style.height = `${baseHeight}px`;
      this.stickmanBody.style.transformOrigin = `${anchorX * 100}% ${anchorY * 100}%`;
      this.stickmanBody.style.transform = `scaleX(${this.stickman.flip})`;

      // Position crosshair dot at exact cursor tip (dead-centered)
      this.cursorCrosshair.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) translate(-50%, -50%)`;
      return;
    }

    // Fallback to legacy sprite anchors if LivingStickman is unavailable
    let anchorX = 0.7764;
    let anchorY = 0.9976;

    if (this.stickmanPose === 'hover') {
      anchorX = 0.4242;
      anchorY = 0.4908;
    } else if (this.stickmanPose === 'thinking' || this.stickmanPose === 'idle') {
      anchorX = 0.5;
      anchorY = 0.95;
    }

    const baseWidth = 105 * this.stickmanScale;
    const baseHeight = baseWidth * 1.28;

    const offsetX = anchorX * baseWidth;
    const offsetY = anchorY * baseHeight;

    const posX = this.currentX - offsetX;
    const posY = this.currentY - offsetY;

    this.stickmanActor.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
    this.stickmanBody.style.width = `${baseWidth}px`;
    this.stickmanBody.style.transformOrigin = `${anchorX * 100}% ${anchorY * 100}%`;
    this.stickmanBody.style.transform = `scaleX(${this.stickmanFlip})`;

    // Position crosshair dot at exact cursor tip (dead-centered)
    this.cursorCrosshair.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) translate(-50%, -50%)`;
  }

  /* ==========================================================================
     Pointer Events & Sub-Pixel Coordinate Mapping
     ========================================================================== */
  getCanvasCoords(e) {
    const rect = this.paperSheet.getBoundingClientRect();
    const scaleX = this.canvasWidth / rect.width;
    const scaleY = this.canvasHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  initEvents() {
    // 1. Workspace Pointer Events
    this.workspace.addEventListener('pointerenter', (e) => {
      this.stickmanVisible = true;
      this.stickmanActor.classList.add('visible');
      this.targetX = e.clientX;
      this.targetY = e.clientY;
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      this.lastActivityTime = performance.now();
      if (this.animState === 'idle') {
        this.animState = 'hover';
        this.setStickmanPose('hover');
      }
    });

    this.workspace.addEventListener('pointerleave', () => {
      this.stickmanVisible = false;
      this.stickmanActor.classList.remove('visible');
    });

    this.workspace.addEventListener('pointermove', (e) => {
      const distFromPrev = Math.hypot(e.clientX - this.targetX, e.clientY - this.targetY);
      // Sudden big jump (> 75px in 1 frame) triggers SURPRISED reaction
      if (distFromPrev > 75 && this.stickman && !this.isDrawing) {
        this.stickman.triggerSurprise();
      }

      this.targetX = e.clientX;
      this.targetY = e.clientY;
      this.lastActivityTime = performance.now();
      if (this.animState === 'idle') {
        this.animState = 'hover';
        this.setStickmanPose('hover');
      }

      if (this.currentTool === 'text' && this.isDraggingTextBox) {
        const pt = this.getCanvasCoords(e);
        this.lastX = pt.x;
        this.lastY = pt.y;
        this.previewTextBox(this.textBoxStartX, this.textBoxStartY, pt.x, pt.y);
        return;
      }

      if (this.currentTool === 'select') {
        const pt = this.getCanvasCoords(e);
        this.lastX = pt.x;
        this.lastY = pt.y;
        this.handleSelectPointerMove(pt.x, pt.y);
        return;
      }

      if (!this.isDrawing) return;
      const pt = this.getCanvasCoords(e);
      this.drawStroke(pt.x, pt.y);
    });

    this.paperSheet.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const pt = this.getCanvasCoords(e);

      // 1. Text Tool Drag Box Creation (Like Select Tool)
      if (this.currentTool === 'text') {
        if (this.activeTextBox && this.activeTextBox.wrap.contains(e.target)) {
          return;
        }
        this.commitTextBox();

        this.isDrawing = true;
        this.isDraggingTextBox = true;
        this.textBoxStartX = pt.x;
        this.textBoxStartY = pt.y;
        this.lastX = pt.x;
        this.lastY = pt.y;
        try { this.paperSheet.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }

      // 2. Marquee Selection
      if (this.currentTool === 'select') {
        this.isDrawing = true;
        this.handleSelectPointerDown(pt.x, pt.y);
        return;
      }

      this.isDrawing = true;
      this.animState = 'drawing';
      this.lastActivityTime = performance.now();
      this.strokeDistance = 0;
      this.paperSheet.setPointerCapture(e.pointerId);

      this.startX = pt.x;
      this.startY = pt.y;
      this.lastX = pt.x;
      this.lastY = pt.y;
      this.strokePoints = [{ x: pt.x, y: pt.y }];

      // Transition Stickman into active drawing pose
      this.setStickmanPose('drawing');
      this.playPencilAudio();

      // Single-click dot deposit for fine details
      if (this.currentTool === 'pencil' || this.currentTool === 'brush' || this.currentTool === 'eraser') {
        this.drawDot(pt.x, pt.y);
      }

      if (this.currentTool === 'bucket') {
        this.floodFill(Math.round(pt.x), Math.round(pt.y), this.currentColor);
        this.isDrawing = false;
        this.animState = 'hover';
        this.setStickmanPose('hover');
        return;
      }

      if (this.currentTool === 'eyedropper') {
        this.pickColor(Math.round(pt.x), Math.round(pt.y));
        this.isDrawing = false;
        this.animState = 'hover';
        this.setStickmanPose('hover');
        return;
      }

      if (this.currentTool === 'shape') {
        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
    });

    const stopDrawing = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      // Finish Text Box dragging
      if (this.currentTool === 'text' && this.isDraggingTextBox) {
        this.isDraggingTextBox = false;
        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        const x = Math.min(this.textBoxStartX, this.lastX);
        const y = Math.min(this.textBoxStartY, this.lastY);
        let w = Math.abs(this.lastX - this.textBoxStartX);
        let h = Math.abs(this.lastY - this.textBoxStartY);

        if (w < 40 || h < 25) {
          w = 260;
          h = 75;
        }

        this.spawnTextBox(x, y, w, h);
        return;
      }

      if (this.currentTool === 'select') {
        this.handleSelectPointerUp();
        return;
      }

      this.stopPencilAudio();
      this.drawStopTime = performance.now();
      this.animState = 'stopping';
      this.lastActivityTime = performance.now();

      if (e && e.pointerId && this.paperSheet.hasPointerCapture && this.paperSheet.hasPointerCapture(e.pointerId)) {
        try { this.paperSheet.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      if (this.currentTool === 'shape') {
        const layer = this.getActiveLayer();
        layer.ctx.drawImage(this.previewCanvas, 0, 0);
        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.saveHistory(`Draw ${this.currentShape}`);
      } else {
        this.saveHistory(`Draw ${this.currentTool}`);
      }

      // Stickman reactions on stopping
      if (this.strokeDistance > 1100 && this.stickman) {
        this.stickman.setExpression('TIRED', 700);
        setTimeout(() => {
          if (this.stickman) this.stickman.triggerConfident();
        }, 700);
      } else if (this.stickman) {
        this.stickman.triggerStoppingReaction();
      }
      this.strokeDistance = 0;
    };
    this.stopDrawing = stopDrawing;

    this.paperSheet.addEventListener('pointerup', stopDrawing);
    this.paperSheet.addEventListener('pointercancel', stopDrawing);
    window.addEventListener('pointerup', stopDrawing);
    window.addEventListener('pointercancel', stopDrawing);

    // 2. Tool Navigation
    const bindToolBtn = (id, tool) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this.setActiveTool(tool));
      }
    };
    bindToolBtn('tool-pencil', 'pencil');
    bindToolBtn('tool-eraser', 'eraser');
    bindToolBtn('tool-bucket', 'bucket');
    bindToolBtn('tool-eyedropper', 'eyedropper');
    bindToolBtn('tool-text', 'text');
    bindToolBtn('tool-select', 'select');

    // 3. Brush Styles Slots (Left Column)
    document.querySelectorAll('.brush-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brush-slot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentBrush = btn.dataset.brush;
        this.setActiveTool('pencil');
        this.reactStickmanThinking(200);
      });
    });

    // 4. Brush Size Slider & Quick Presets
    if (this.brushSizeSlider) {
      this.brushSizeSlider.addEventListener('input', (e) => {
        this.setStrokeSize(parseInt(e.target.value));
      });
    }

    document.querySelectorAll('.preset-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sz = parseInt(btn.dataset.size);
        this.setStrokeSize(sz);
      });
    });

    // 5. Shapes Popover
    const shapeBtn = document.getElementById('tool-shapes-btn');
    if (shapeBtn) {
      shapeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopover(this.shapesPopover);
      });
    }

    document.querySelectorAll('.shape-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shape-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentShape = btn.dataset.shape;
        this.setActiveTool('shape');
        this.closePopovers();
      });
    });

    const shapeFillChk = document.getElementById('chk-shape-fill');
    if (shapeFillChk) {
      shapeFillChk.addEventListener('change', (e) => {
        this.shapeFill = e.target.checked;
      });
    }

    // 6. Warrior Tricks Popover
    const tricksBtn = document.getElementById('btn-stickman-tricks');
    if (tricksBtn) {
      tricksBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopover(this.tricksPopover);
      });
    }

    const bindTrick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          this.closePopovers();
          fn();
        });
      }
    };
    bindTrick('trick-mountain', () => this.executeTrickMountain());
    bindTrick('trick-sun', () => this.executeTrickSun());
    bindTrick('trick-stairs', () => this.executeTrickStairs());
    bindTrick('trick-flag', () => this.executeTrickFlag());

    // 7. Palette Swatches
    document.querySelectorAll('.swatch-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.swatch-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setColor(btn.dataset.color);
      });
    });

    if (this.nativeColorPicker) {
      this.nativeColorPicker.addEventListener('input', (e) => {
        this.setColor(e.target.value);
      });
    }

    // 8. Functional Controls (Undo, Redo, Zoom, Layers, Clear, Save, Settings)
    const undoBtn = document.getElementById('btn-undo');
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());

    const redoBtn = document.getElementById('btn-redo');
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());

    const zoomInBtn = document.getElementById('btn-zoom-in');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom + 0.1));

    const zoomOutBtn = document.getElementById('btn-zoom-out');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom - 0.1));

    const addLayerBtn = document.getElementById('btn-add-layer');
    if (addLayerBtn) {
      addLayerBtn.addEventListener('click', () => {
        this.addLayer();
        this.saveHistory('Add Layer');
      });
    }

    const clearCanvasBtn = document.getElementById('btn-clear-canvas');
    if (clearCanvasBtn) clearCanvasBtn.addEventListener('click', () => this.clearCanvas());

    const savePngBtn = document.getElementById('btn-save-png');
    if (savePngBtn) savePngBtn.addEventListener('click', () => this.exportPNG());

    // Settings
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePopover(this.settingsPopover);
      });
    }

    const eraseAllLayersChk = document.getElementById('chk-erase-all-layers');
    if (eraseAllLayersChk) {
      eraseAllLayersChk.addEventListener('change', (e) => {
        this.eraseAllLayers = e.target.checked;
      });
    }

    const cursorIndChk = document.getElementById('chk-cursor-indicator');
    if (cursorIndChk) {
      cursorIndChk.addEventListener('change', (e) => {
        if (this.cursorCrosshair) {
          this.cursorCrosshair.style.display = e.target.checked ? 'block' : 'none';
        }
      });
    }

    const smoothDrawChk = document.getElementById('chk-smooth-drawing');
    if (smoothDrawChk) {
      smoothDrawChk.addEventListener('change', (e) => {
        this.stabilizer = e.target.checked;
      });
    }

    const stickmanScaleSlider = document.getElementById('slider-stickman-scale');
    if (stickmanScaleSlider) {
      stickmanScaleSlider.addEventListener('input', (e) => {
        this.stickmanScale = parseFloat(e.target.value);
        if (this.stickman) this.stickman.scale = this.stickmanScale;
      });
    }

    // Close popovers on click outside
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.popover-wrapper')) {
        this.closePopovers();
      }
    });

    // Window Resize Handling
    window.addEventListener('resize', () => this.fitCanvasToViewport());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) this.redo();
          else this.undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          this.redo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.exportPNG();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'p') this.setActiveTool('pencil');
      else if (key === 'b') this.setActiveTool('pencil');
      else if (key === 'e') this.setActiveTool('eraser');
      else if (key === 'g') this.setActiveTool('bucket');
      else if (key === 'i') this.setActiveTool('eyedropper');
      else if (key === 't') this.setActiveTool('text');
      else if (key === 's') this.setActiveTool('select');
      else if (key === 'delete' || key === 'backspace') {
        if (this.selection) {
          e.preventDefault();
          this.deleteSelection();
        }
      } else if (key === 'enter') {
        if (this.selection) {
          e.preventDefault();
          this.commitSelection();
        }
      } else if (key === 'escape') {
        if (this.selection) {
          e.preventDefault();
          this.commitSelection();
        }
        if (this.activeTextBox) {
          e.preventDefault();
          this.cancelTextBox();
        }
      }
    });
  }

  setStrokeSize(size) {
    this.strokeSize = Math.max(1, Math.min(64, size));
    if (this.brushSizeSlider) this.brushSizeSlider.value = this.strokeSize;
    if (this.brushSizeVal) this.brushSizeVal.textContent = `${this.strokeSize}px`;
    if (this.strokePreviewPath) {
      const previewW = Math.min(18, Math.max(2, this.strokeSize));
      this.strokePreviewPath.setAttribute('stroke-width', previewW);
    }
    this.updateEraserIndicator();
  }

  fitCanvasToViewport() {
    if (!this.workspace || !this.paperSheet) return;
    const stage = this.canvasStage || document.getElementById('canvas-stage') || this.workspace;
    const stageRect = stage.getBoundingClientRect();

    // Leave margin so ink frame breathes beautifully and never overlaps panels
    const availW = Math.max(300, stageRect.width - 24);
    const availH = Math.max(180, stageRect.height - 24);

    let targetW = availW;
    let targetH = targetW * (9 / 16);
    if (targetH > availH) {
      targetH = availH;
      targetW = targetH * (16 / 9);
    }

    if (this.canvasInkWrapper) {
      this.canvasInkWrapper.style.width = `${Math.floor(targetW)}px`;
      this.canvasInkWrapper.style.height = `${Math.floor(targetH)}px`;
    }

    const scale = targetW / this.canvasWidth;
    this.paperSheet.style.transform = `scale(${scale})`;
    this.zoom = scale;
    if (this.zoomValue) {
      this.zoomValue.textContent = `${Math.round(this.zoom * 100)}%`;
    }
    this.updateEraserIndicator();
  }

  setZoom(level) {
    const clamped = Math.max(0.25, Math.min(3.0, level));
    this.zoom = clamped;
    this.paperSheet.style.transform = `scale(${this.zoom})`;
    if (this.canvasInkWrapper) {
      this.canvasInkWrapper.style.width = `${Math.round(this.canvasWidth * this.zoom)}px`;
      this.canvasInkWrapper.style.height = `${Math.round(this.canvasHeight * this.zoom)}px`;
    }
    if (this.zoomValue) {
      this.zoomValue.textContent = `${Math.round(this.zoom * 100)}%`;
    }
    this.updateEraserIndicator();
  }

  setActiveTool(tool) {
    if (this.isDrawing && this.stopDrawing) {
      this.stopDrawing();
    }
    if (this.currentTool === 'select' && tool !== 'select') {
      this.commitSelection();
    }
    if (this.currentTool === 'text' && tool !== 'text') {
      this.commitTextBox();
    }
    this.currentTool = tool;
    this.stickmanActor.classList.toggle('tool-eraser', tool === 'eraser');
    this.updateEraserIndicator();
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    if (tool === 'text') {
      this.showToast('Text Tool: Drag a box on canvas to write (create multiple boxes!)');
    } else if (tool === 'select') {
      this.showToast('Select Tool: Drag box to select and move');
    }
  }

  /* ==========================================================================
     Drag-and-Write Multi-TextBox System
     ========================================================================== */
  previewTextBox(startX, startY, curX, curY) {
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);

    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.previewCtx.save();
    this.previewCtx.strokeStyle = '#38bdf8';
    this.previewCtx.lineWidth = 1.8;
    this.previewCtx.setLineDash([5, 3]);
    this.previewCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    this.previewCtx.fillRect(x, y, w, h);
    this.previewCtx.strokeRect(x, y, w, h);

    // Text badge indicator
    this.previewCtx.fillStyle = '#38bdf8';
    this.previewCtx.font = "bold 11px 'Outfit', sans-serif";
    this.previewCtx.fillText("TEXT BOX", x + 6, y + 15);
    this.previewCtx.restore();
  }

  spawnTextBox(x, y, w, h) {
    // If a text box was already active, commit it so the user can make multiple boxes
    this.commitTextBox();

    const fontSize = Math.max(16, Math.min(64, Math.round(this.strokeSize * 1.6 + 14)));

    const wrap = document.createElement('div');
    wrap.className = 'canvas-textbox-wrapper';
    wrap.style.left = `${Math.round(x)}px`;
    wrap.style.top = `${Math.round(y)}px`;
    wrap.style.width = `${Math.round(w)}px`;
    wrap.style.height = `${Math.round(h)}px`;

    const textarea = document.createElement('textarea');
    textarea.className = 'canvas-textbox-input';
    textarea.placeholder = 'Type here... (Enter = new line, Ctrl+Enter or drag another box to place)';
    textarea.style.color = this.currentColor;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.lineHeight = '1.25';

    // Commit button in top right of box
    const commitBtn = document.createElement('button');
    commitBtn.className = 'textbox-commit-btn';
    commitBtn.innerHTML = '✓';
    commitBtn.title = 'Place Text';
    commitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.commitTextBox();
    });

    wrap.appendChild(textarea);
    wrap.appendChild(commitBtn);
    this.paperSheet.appendChild(wrap);

    this.activeTextBox = {
      wrap,
      textarea,
      x,
      y,
      w,
      h,
      fontSize,
      color: this.currentColor
    };

    setTimeout(() => textarea.focus(), 15);

    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
      // Ctrl+Enter or Cmd+Enter commits immediately
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.commitTextBox();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelTextBox();
      }
    });
  }

  commitTextBox() {
    if (!this.activeTextBox) return;
    const { wrap, textarea, x, y, w, h, fontSize, color } = this.activeTextBox;
    const text = textarea.value.trim();
    wrap.remove();
    this.activeTextBox = null;

    if (!text) return;

    const layer = this.getActiveLayer();
    if (!layer || !layer.visible) return;

    const ctx = layer.ctx;
    ctx.save();
    ctx.font = `900 ${fontSize}px 'Permanent Marker', 'Outfit', sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 1.5;

    const lineHeight = fontSize * 1.25;
    const maxBoxWidth = Math.max(w - 12, 50);

    // Auto-wrap lines so text stays within designated box width
    const rawParagraphs = text.split('\n');
    let currentY = y + 4;

    rawParagraphs.forEach(para => {
      const words = para.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxBoxWidth && currentLine) {
          ctx.fillText(currentLine, x + 4, currentY);
          currentLine = words[i];
          currentY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        ctx.fillText(currentLine, x + 4, currentY);
        currentY += lineHeight;
      }
    });

    ctx.restore();
    this.saveHistory(`Add Text Box "${text.slice(0, 10)}"`);
    this.showToast('Text placed — drag another box to write again!');
    if (this.stickman) this.stickman.triggerConfident();
  }

  cancelTextBox() {
    if (!this.activeTextBox) return;
    this.activeTextBox.wrap.remove();
    this.activeTextBox = null;
  }

  /* ==========================================================================
     Marquee Select Tool System
     ========================================================================== */
  handleSelectPointerDown(x, y) {
    if (this.selection && this.isInsideSelection(x, y)) {
      this.isMovingSelection = true;
      this.moveStartX = x;
      this.moveStartY = y;
      this.initialSelX = this.selection.x;
      this.initialSelY = this.selection.y;
      return;
    }

    this.commitSelection();
    this.isSelecting = true;
    this.selStartX = x;
    this.selStartY = y;
    this.selection = null;
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  isInsideSelection(x, y) {
    if (!this.selection) return false;
    const { x: sx, y: sy, w: sw, h: sh } = this.selection;
    return x >= sx && x <= sx + sw && y >= sy && y <= sy + sh;
  }

  handleSelectPointerMove(x, y) {
    if (this.isMovingSelection && this.selection) {
      const dx = x - this.moveStartX;
      const dy = y - this.moveStartY;
      this.selection.x = Math.round(this.initialSelX + dx);
      this.selection.y = Math.round(this.initialSelY + dy);
      this.renderSelectionPreview();
      return;
    }

    if (this.isSelecting) {
      const x1 = Math.min(this.selStartX, x);
      const y1 = Math.min(this.selStartY, y);
      const w = Math.abs(x - this.selStartX);
      const h = Math.abs(y - this.selStartY);

      this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.previewCtx.save();
      this.previewCtx.strokeStyle = '#38bdf8';
      this.previewCtx.lineWidth = 1.5;
      this.previewCtx.setLineDash([6, 4]);
      this.previewCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      this.previewCtx.fillRect(x1, y1, w, h);
      this.previewCtx.strokeRect(x1, y1, w, h);
      this.previewCtx.restore();
    }
  }

  handleSelectPointerUp() {
    if (this.isMovingSelection) {
      this.isMovingSelection = false;
      return;
    }

    if (this.isSelecting) {
      this.isSelecting = false;
      const x = Math.round(Math.min(this.selStartX, this.lastX));
      const y = Math.round(Math.min(this.selStartY, this.lastY));
      const w = Math.round(Math.abs(this.lastX - this.selStartX));
      const h = Math.round(Math.abs(this.lastY - this.selStartY));

      if (w > 6 && h > 6) {
        const layer = this.getActiveLayer();
        if (layer && layer.visible) {
          const imgData = layer.ctx.getImageData(x, y, w, h);
          const selCanvas = document.createElement('canvas');
          selCanvas.width = w;
          selCanvas.height = h;
          selCanvas.getContext('2d').putImageData(imgData, 0, 0);

          layer.ctx.clearRect(x, y, w, h);

          this.selection = {
            canvas: selCanvas,
            x,
            y,
            w,
            h,
            sourceLayer: layer
          };

          this.renderSelectionPreview();
          this.showToast('Area selected — drag to reposition');
        }
      } else {
        this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.selection = null;
      }
    }
  }

  renderSelectionPreview() {
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    if (!this.selection) return;

    const { canvas, x, y, w, h } = this.selection;
    this.previewCtx.drawImage(canvas, x, y);

    this.previewCtx.save();
    this.previewCtx.strokeStyle = '#38bdf8';
    this.previewCtx.lineWidth = 1.5;
    this.previewCtx.setLineDash([6, 4]);
    this.previewCtx.strokeRect(x, y, w, h);
    this.previewCtx.restore();
  }

  commitSelection() {
    if (!this.selection) return;
    const { canvas, x, y, sourceLayer } = this.selection;
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (sourceLayer) {
      sourceLayer.ctx.drawImage(canvas, x, y);
      this.saveHistory('Move Selection');
    }
    this.selection = null;
  }

  deleteSelection() {
    if (!this.selection) return;
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.selection = null;
    this.saveHistory('Delete Selection');
    this.showToast('Selection deleted');
  }

  getEraserRadius() {
    switch (this.strokeSize) {
      case 2: return 5;
      case 4: return 8;
      case 8: return 12;
      case 16: return 18;
      case 28: return 26;
      default: return Math.round(this.strokeSize * 0.9 + 3);
    }
  }

  updateEraserIndicator() {
    const radius = this.getEraserRadius();
    const diameter = radius * 2 * this.zoom;
    this.app.style.setProperty('--eraser-indicator-size', `${Math.round(diameter)}px`);
  }

  setColor(color) {
    this.currentColor = color;
    this.currentColorPreview.style.backgroundColor = color;
    if (this.stickman) {
      this.stickman.currentColor = color;
      this.stickman.triggerConfident();
    } else {
      this.reactStickmanThinking(180);
    }
  }

  togglePopover(wrapper) {
    const wasOpen = wrapper.classList.contains('open');
    this.closePopovers();
    if (!wasOpen) wrapper.classList.add('open');
  }

  closePopovers() {
    document.querySelectorAll('.popover-wrapper').forEach(p => p.classList.remove('open'));
  }

  reactStickmanThinking(duration = 250) {
    this.animState = 'thinking';
    this.setStickmanPose('thinking');
    clearTimeout(this.reactTimer);
    this.reactTimer = setTimeout(() => {
      if (!this.isDrawing) {
        this.animState = 'hover';
        this.setStickmanPose('hover');
      }
    }, duration);
  }

  showToast(msg) {
    this.toastMsg.textContent = msg;
    this.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 1500);
  }

  /* ==========================================================================
     Drawing Execution & Distinct Brushes
     ========================================================================== */
  drawDot(x, y) {
    if (this.currentTool === 'eraser') {
      const radius = this.getEraserRadius();
      if (this.eraseAllLayers) {
        // Cross-layer mode (Advanced): erase across all visible non-background layers
        this.layers.forEach(l => {
          if (!l.visible || l.isBackground) return;
          const lCtx = l.ctx;
          lCtx.save();
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.beginPath();
          lCtx.arc(x, y, radius, 0, Math.PI * 2);
          lCtx.fill();
          lCtx.restore();
        });
      } else {
        // Standard mode (Default): erase ONLY on currently selected layer
        const layer = this.getActiveLayer();
        if (layer && !layer.isBackground && layer.visible) {
          const lCtx = layer.ctx;
          lCtx.save();
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.beginPath();
          lCtx.arc(x, y, radius, 0, Math.PI * 2);
          lCtx.fill();
          lCtx.restore();
        } else if (layer && layer.isBackground) {
          this.showToast('Background is locked against erasing');
        }
      }
      return;
    }

    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    ctx.save();
    ctx.fillStyle = this.currentColor;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, this.strokeSize / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawStroke(x, y) {
    this.strokeDistance = (this.strokeDistance || 0) + Math.hypot(x - this.lastX, y - this.lastY);
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;

    if (this.currentTool === 'pencil') {
      ctx.save();
      ctx.strokeStyle = this.currentColor;
      ctx.lineWidth = this.strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (this.stabilizer) {
        this.strokePoints.push({ x, y });
        if (this.strokePoints.length > 2) {
          const p1 = this.strokePoints[this.strokePoints.length - 2];
          const midX = (p1.x + x) / 2;
          const midY = (p1.y + y) / 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.restore();
      this.lastX = x;
      this.lastY = y;
    } else if (this.currentTool === 'brush') {
      this.renderBrush(ctx, x, y);
    } else if (this.currentTool === 'eraser') {
      const radius = this.getEraserRadius();
      const width = radius * 2;

      if (this.eraseAllLayers) {
        // Cross-layer mode (Advanced): erase across all visible non-background layers
        this.layers.forEach(l => {
          if (!l.visible || l.isBackground) return;
          const lCtx = l.ctx;
          lCtx.save();
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.lineWidth = width;
          lCtx.lineCap = 'round';
          lCtx.lineJoin = 'round';
          lCtx.beginPath();
          lCtx.moveTo(this.lastX, this.lastY);
          lCtx.lineTo(x, y);
          lCtx.stroke();
          lCtx.restore();
        });
      } else {
        // Standard mode (Default): erase ONLY on currently selected layer
        const layer = this.getActiveLayer();
        if (layer && !layer.isBackground && layer.visible) {
          const lCtx = layer.ctx;
          lCtx.save();
          lCtx.globalCompositeOperation = 'destination-out';
          lCtx.lineWidth = width;
          lCtx.lineCap = 'round';
          lCtx.lineJoin = 'round';
          lCtx.beginPath();
          lCtx.moveTo(this.lastX, this.lastY);
          lCtx.lineTo(x, y);
          lCtx.stroke();
          lCtx.restore();
        }
      }
      this.lastX = x;
      this.lastY = y;
    } else if (this.currentTool === 'shape') {
      this.previewShape(this.startX, this.startY, x, y);
    }
  }

  renderBrush(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = this.currentColor;
    ctx.fillStyle = this.currentColor;

    switch (this.currentBrush) {
      case 'pencil':
        ctx.lineWidth = this.strokeSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'ink':
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const dynamicWidth = Math.max(1, this.strokeSize * 2 - speed * 0.14);
        ctx.lineWidth = dynamicWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'marker':
        ctx.lineWidth = this.strokeSize * 2.5;
        ctx.globalAlpha = 0.45;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'crayon':
        ctx.lineWidth = this.strokeSize * 1.8;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 3; i++) {
          const jx = (Math.random() - 0.5) * 3;
          const jy = (Math.random() - 0.5) * 3;
          ctx.beginPath();
          ctx.moveTo(this.lastX + jx, this.lastY + jy);
          ctx.lineTo(x + jx, y + jy);
          ctx.stroke();
        }
        break;

      case 'watercolor':
        ctx.lineWidth = this.strokeSize * 3;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case 'airbrush':
        const radius = this.strokeSize * 3;
        for (let i = 0; i < 18; i++) {
          const r = Math.random() * radius;
          const angle = Math.random() * Math.PI * 2;
          const px = x + r * Math.cos(angle);
          const py = y + r * Math.sin(angle);
          ctx.globalAlpha = 0.14;
          ctx.beginPath();
          ctx.arc(px, py, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
    ctx.restore();
    this.lastX = x;
    this.lastY = y;
  }

  /* ==========================================================================
     Shape Rendering
     ========================================================================== */
  previewShape(x1, y1, x2, y2) {
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    const ctx = this.previewCtx;
    ctx.save();
    ctx.strokeStyle = this.currentColor;
    ctx.fillStyle = this.currentColor;
    ctx.lineWidth = this.strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    ctx.beginPath();
    switch (this.currentShape) {
      case 'line':
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        break;
      case 'rect':
        ctx.rect(minX, minY, w, h);
        break;
      case 'circle':
        ctx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case 'triangle':
        ctx.moveTo(minX + w / 2, minY);
        ctx.lineTo(minX + w, minY + h);
        ctx.lineTo(minX, minY + h);
        ctx.closePath();
        break;
      case 'arrow':
        const aw = w * 0.4;
        const ah = h * 0.3;
        ctx.moveTo(minX, minY + ah);
        ctx.lineTo(minX + w - aw, minY + ah);
        ctx.lineTo(minX + w - aw, minY);
        ctx.lineTo(minX + w, minY + h / 2);
        ctx.lineTo(minX + w - aw, minY + h);
        ctx.lineTo(minX + w - aw, minY + h - ah);
        ctx.lineTo(minX, minY + h - ah);
        ctx.closePath();
        break;
      case 'star':
        this.drawStar(ctx, minX + w / 2, minY + h / 2, 5, w / 2, w / 4);
        break;
    }

    if (this.shapeFill) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  /* ==========================================================================
     Stickman Playful Tricks
     ========================================================================== */
  executeTrickMountain() {
    this.reactStickmanThinking(300);
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.save();
    // 1. Radiant Sun
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.35, 75, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sun Rays
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const x1 = (w * 0.65) + Math.cos(a) * 90;
      const y1 = (h * 0.35) + Math.sin(a) * 90;
      const x2 = (w * 0.65) + Math.cos(a) * 125;
      const y2 = (h * 0.35) + Math.sin(a) * 125;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Background Mountain
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.85);
    ctx.lineTo(w * 0.35, h * 0.42);
    ctx.lineTo(w * 0.55, h * 0.58);
    ctx.lineTo(w * 0.75, h * 0.44);
    ctx.lineTo(w * 0.95, h * 0.85);
    ctx.stroke();

    // 4. Foreground Ridge
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.85);
    ctx.lineTo(w * 0.25, h * 0.58);
    ctx.lineTo(w * 0.38, h * 0.64);
    ctx.lineTo(w * 0.6, h * 0.22); // Summit
    ctx.lineTo(w * 0.78, h * 0.54);
    ctx.lineTo(w * 0.88, h * 0.48);
    ctx.lineTo(w, h * 0.85);
    ctx.stroke();

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(0, h * 0.85);
    ctx.lineTo(w, h * 0.85);
    ctx.stroke();

    // 5. Electric Blue Ledges
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    const steps = [
      { x: w * 0.22, y: h * 0.76, len: 60 },
      { x: w * 0.32, y: h * 0.64, len: 65 },
      { x: w * 0.44, y: h * 0.50, len: 70 },
      { x: w * 0.54, y: h * 0.34, len: 75 }
    ];
    steps.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y);
      ctx.stroke();
    });

    // 6. Summit Flag
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
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
    this.saveHistory('Trick: Mountain');
    if (this.stickman) this.stickman.triggerVictory();
    this.showToast('Mountain Drawn');
  }

  executeTrickSun() {
    this.reactStickmanThinking(250);
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(this.canvasWidth / 2, this.canvasHeight * 0.35, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const x1 = (this.canvasWidth / 2) + Math.cos(a) * 95;
      const y1 = (this.canvasHeight * 0.35) + Math.sin(a) * 95;
      const x2 = (this.canvasWidth / 2) + Math.cos(a) * 145;
      const y2 = (this.canvasHeight * 0.35) + Math.sin(a) * 145;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
    this.saveHistory('Trick: Sun');
    if (this.stickman) this.stickman.triggerVictory();
    this.showToast('Sunrise Drawn');
  }

  executeTrickStairs() {
    this.reactStickmanThinking(250);
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const sx = 200 + i * 140;
      const sy = this.canvasHeight * 0.8 - i * 70;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 90, sy);
      ctx.stroke();
    }
    ctx.restore();
    this.saveHistory('Trick: Stairs');
    if (this.stickman) this.stickman.triggerVictory();
    this.showToast('Ledges Drawn');
  }

  executeTrickFlag() {
    this.reactStickmanThinking(250);
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    const x = this.canvasWidth / 2;
    const y = this.canvasHeight * 0.45;
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + 100);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60, y + 25);
    ctx.lineTo(x, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    this.saveHistory('Trick: Flag');
    if (this.stickman) this.stickman.triggerVictory();
    this.showToast('Flag Planted');
  }

  /* ==========================================================================
     High-Performance Flood Fill
     ========================================================================== */
  floodFill(startX, startY, fillColorHex) {
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    const imgData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    const data = imgData.data;

    const fillR = parseInt(fillColorHex.slice(1, 3), 16);
    const fillG = parseInt(fillColorHex.slice(3, 5), 16);
    const fillB = parseInt(fillColorHex.slice(5, 7), 16);
    const fillA = 255;

    const startIndex = (startY * this.canvasWidth + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    if (Math.abs(targetR - fillR) < 5 && Math.abs(targetG - fillG) < 5 && Math.abs(targetB - fillB) < 5 && Math.abs(targetA - fillA) < 5) {
      return;
    }

    const match = (idx) => {
      return (
        Math.abs(data[idx] - targetR) +
        Math.abs(data[idx + 1] - targetG) +
        Math.abs(data[idx + 2] - targetB) +
        Math.abs(data[idx + 3] - targetA) < 36
      );
    };

    const queue = [startX, startY];
    const visited = new Uint8Array(this.canvasWidth * this.canvasHeight);
    visited[startY * this.canvasWidth + startX] = 1;

    while (queue.length > 0) {
      const cy = queue.pop();
      const cx = queue.pop();

      const pIdx = cy * this.canvasWidth + cx;
      const byteIdx = pIdx * 4;

      data[byteIdx] = fillR;
      data[byteIdx + 1] = fillG;
      data[byteIdx + 2] = fillB;
      data[byteIdx + 3] = fillA;

      // North
      if (cy > 0) {
        const nIdx = (cy - 1) * this.canvasWidth + cx;
        if (!visited[nIdx] && match(nIdx * 4)) {
          visited[nIdx] = 1;
          queue.push(cx, cy - 1);
        }
      }
      // South
      if (cy < this.canvasHeight - 1) {
        const sIdx = (cy + 1) * this.canvasWidth + cx;
        if (!visited[sIdx] && match(sIdx * 4)) {
          visited[sIdx] = 1;
          queue.push(cx, cy + 1);
        }
      }
      // West
      if (cx > 0) {
        const wIdx = cy * this.canvasWidth + (cx - 1);
        if (!visited[wIdx] && match(wIdx * 4)) {
          visited[wIdx] = 1;
          queue.push(cx - 1, cy);
        }
      }
      // East
      if (cx < this.canvasWidth - 1) {
        const eIdx = cy * this.canvasWidth + (cx + 1);
        if (!visited[eIdx] && match(eIdx * 4)) {
          visited[eIdx] = 1;
          queue.push(cx + 1, cy);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.saveHistory('Bucket Fill');
  }

  pickColor(x, y) {
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 1;
    cCanvas.height = 1;
    const cCtx = cCanvas.getContext('2d');

    this.layers.forEach(l => {
      if (l.visible) {
        cCtx.globalAlpha = l.opacity;
        cCtx.drawImage(l.canvas, x, y, 1, 1, 0, 0, 1, 1);
      }
    });

    const px = cCtx.getImageData(0, 0, 1, 1).data;
    const hex = '#' + ((1 << 24) + (px[0] << 16) + (px[1] << 8) + px[2]).toString(16).slice(1);
    this.setColor(hex);
    this.showToast(`Color: ${hex.toUpperCase()}`);
  }

  /* ==========================================================================
     History System (Undo / Redo)
     ========================================================================== */
  saveHistory(actionName = 'Edit') {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }

    const snapshot = {
      actionName,
      layers: this.layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        isBackground: l.isBackground,
        data: l.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight)
      })),
      activeLayerIndex: this.activeLayerIndex
    };

    this.historyStack.push(snapshot);
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    }
    this.historyIndex = this.historyStack.length - 1;
    this.updateUndoRedoUI();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreHistory(this.historyStack[this.historyIndex]);
      this.updateUndoRedoUI();
      if (this.stickman) this.stickman.triggerDisappointed();
    }
  }

  redo() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      this.restoreHistory(this.historyStack[this.historyIndex]);
      this.updateUndoRedoUI();
      if (this.stickman) this.stickman.triggerConfident();
    }
  }

  restoreHistory(snapshot) {
    if (!snapshot) return;

    this.layers.forEach(l => l.canvas.remove());
    this.layers = [];

    snapshot.layers.forEach(sl => {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      canvas.className = 'canvas-layer';
      canvas.id = `layer-${sl.id}`;
      canvas.style.display = sl.visible ? 'block' : 'none';
      canvas.style.opacity = sl.opacity;
      this.layersContainer.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      ctx.putImageData(sl.data, 0, 0);

      this.layers.push({
        id: sl.id,
        name: sl.name,
        canvas,
        ctx,
        visible: sl.visible,
        opacity: sl.opacity,
        isBackground: sl.isBackground
      });
    });

    this.activeLayerIndex = Math.min(snapshot.activeLayerIndex, this.layers.length - 1);
    this.renderLayersUI();
  }

  updateUndoRedoUI() {
    document.getElementById('btn-undo').disabled = this.historyIndex <= 0;
    document.getElementById('btn-redo').disabled = this.historyIndex >= this.historyStack.length - 1;
  }

  /* ==========================================================================
     Zoom & Viewport Scaling
     ========================================================================== */
  setZoom(val) {
    this.zoom = Math.min(2.5, Math.max(0.3, Math.round(val * 100) / 100));
    this.paperSheet.style.transform = `scale(${this.zoom})`;
    this.zoomValue.textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateEraserIndicator();
  }

  clearCanvas() {
    if (this.activeTextBox) this.cancelTextBox();
    this.layers.forEach((l, i) => {
      l.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      if (i === 0) {
        l.ctx.fillStyle = '#ffffff';
        l.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
    });
    this.saveHistory('Clear Canvas');
    if (this.stickman) {
      this.stickman.triggerDisappointed();
    } else {
      this.reactStickmanThinking(200);
    }
    this.showToast('Canvas Cleared');
  }

  exportPNG() {
    if (this.activeTextBox) this.commitTextBox();
    // Only exports the pure canvas artwork - NO UI, NO stickman, NO crosshair
    const master = document.createElement('canvas');
    master.width = this.canvasWidth;
    master.height = this.canvasHeight;
    const mCtx = master.getContext('2d');

    this.layers.forEach(l => {
      if (l.visible) {
        mCtx.globalAlpha = l.opacity;
        mCtx.drawImage(l.canvas, 0, 0);
      }
    });

    const link = document.createElement('a');
    link.download = `stickman_drawing_${Date.now()}.png`;
    link.href = master.toDataURL('image/png');
    link.click();

    if (this.stickman) {
      this.stickman.triggerVictory();
    } else {
      this.reactStickmanThinking(400);
    }
    this.showToast('Saved PNG');
  }

  /* ==========================================================================
     Audio Synthesizer (Optional & Subtle)
     ========================================================================== */
  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    } catch (e) {}
  }

  playPencilAudio() {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    if (this.isAudioDrawing) return;
    this.isAudioDrawing = true;

    const bufferSize = this.audioCtx.sampleRate * 0.1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 3.0;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.035, this.audioCtx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start();
    this.audioNoise = { noise, gain };
  }

  stopPencilAudio() {
    if (this.audioNoise) {
      try {
        this.audioNoise.gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
        this.audioNoise.noise.stop(this.audioCtx.currentTime + 0.05);
      } catch (e) {}
      this.audioNoise = null;
    }
    this.isAudioDrawing = false;
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.stickmanPaint = new StickmanPaintApp();
});
