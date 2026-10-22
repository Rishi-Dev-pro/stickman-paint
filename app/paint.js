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

    // Stickman Living Cursor Physics
    this.stickmanPose = 'hover'; // 'hover', 'drawing', 'thinking', 'idle'
    this.stickmanScale = 0.65; // Balanced size to never obstruct drawing
    this.stickmanFlip = 1; // 1 = right, -1 = left
    this.stickmanVisible = false;

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

    // Layers Drawer
    this.layersDrawer = document.getElementById('layers-drawer');
    this.layersList = document.getElementById('layers-list');
    this.layerOpacitySlider = document.getElementById('layer-opacity-slider');
    this.layerOpacityVal = document.getElementById('layer-opacity-val');

    // Bottom Dock Swatches
    this.currentColorPreview = document.getElementById('current-color-preview');
    this.nativeColorPicker = document.getElementById('native-color-picker');
    this.zoomValue = document.getElementById('zoom-value');

    // Popovers
    this.brushPopover = document.getElementById('brush-popover-wrapper');
    this.shapesPopover = document.getElementById('shape-popover-wrapper');
    this.tricksPopover = document.getElementById('tricks-popover-wrapper');
    this.settingsPopover = document.getElementById('settings-popover-wrapper');

    // Toast
    this.toast = document.getElementById('toast');
    this.toastMsg = document.getElementById('toast-msg');
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

    // 2. Active Drawing Layer
    this.addLayer('Artwork', false);
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
    this.layersList.innerHTML = '';
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const item = document.createElement('div');
      item.className = `layer-item ${i === this.activeLayerIndex ? 'active' : ''}`;
      const eyeSvg = layer.visible
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      
      item.innerHTML = `
        <span class="layer-name">${layer.name}</span>
        <button class="layer-vis-btn" title="Toggle visibility" aria-label="Toggle visibility">${eyeSvg}</button>
      `;

      item.addEventListener('click', (e) => {
        const visBtn = e.target.closest('.layer-vis-btn');
        if (visBtn) {
          layer.visible = !layer.visible;
          layer.canvas.style.display = layer.visible ? 'block' : 'none';
          this.renderLayersUI();
          return;
        }
        this.activeLayerIndex = i;
        this.layerOpacitySlider.value = Math.round(layer.opacity * 100);
        this.layerOpacityVal.textContent = `${this.layerOpacitySlider.value}%`;
        this.renderLayersUI();
      });

      this.layersList.appendChild(item);
    }
  }

  deleteActiveLayer() {
    if (this.layers.length <= 1) return;
    const layer = this.layers[this.activeLayerIndex];
    layer.canvas.remove();
    this.layers.splice(this.activeLayerIndex, 1);
    this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
    this.renderLayersUI();
    this.saveHistory('Delete Layer');
  }

  /* ==========================================================================
     Living Stickman Cursor (Smooth 60 FPS Physics Loop)
     ========================================================================== */
  startStickmanLoop() {
    const updatePhysics = () => {
      if (this.stickmanVisible) {
        // Tuned LERP: tight tracking when drawing (0.86), fluid organic trailing when hovering (0.34)
        const lerpFactor = this.isDrawing ? 0.86 : 0.34;
        this.currentX += (this.targetX - this.currentX) * lerpFactor;
        this.currentY += (this.targetY - this.currentY) * lerpFactor;

        // Velocity & Forward Movement Tilt
        const dx = this.targetX - this.prevX;
        const dy = this.targetY - this.prevY;
        this.velocity = Math.sqrt(dx * dx + dy * dy);

        // Directional Flip: Face the drawing direction
        if (Math.abs(dx) > 3) {
          this.stickmanFlip = dx > 0 ? 1 : -1;
        }

        // Natural subtle forward tilt (restrained to ±10 degrees)
        const targetTilt = Math.max(-10, Math.min(10, dx * 0.35));
        this.tiltAngle += (targetTilt - this.tiltAngle) * 0.18;

        this.prevX = this.targetX;
        this.prevY = this.targetY;

        this.renderStickmanTransform();
      }

      requestAnimationFrame(updatePhysics);
    };

    requestAnimationFrame(updatePhysics);
  }

  setStickmanPose(pose) {
    if (this.stickmanPose === pose) return;
    this.stickmanPose = pose;

    let spriteUrl = '';
    if (typeof STICKMAN_SPRITES !== 'undefined') {
      if (pose === 'drawing') spriteUrl = STICKMAN_SPRITES.stickman_drawing;
      else if (pose === 'thinking') spriteUrl = STICKMAN_SPRITES.stickman_thinking;
      else if (pose === 'idle') spriteUrl = STICKMAN_SPRITES.stickman_idle;
      else spriteUrl = STICKMAN_SPRITES.stickman_hover;
    } else {
      spriteUrl = `assets/stickman_${pose}.png`;
    }

    this.stickmanSprite.src = spriteUrl;
  }

  renderStickmanTransform() {
    // Calibrated Pencil Tip Anchors:
    // Drawing: X: 0.7764 (tipX), Y: 0.9976 (tipY)
    // Hover: X: 0.4242, Y: 0.4908
    // Thinking / Idle: X: 0.5, Y: 0.95
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
    this.stickmanBody.style.transform = `scaleX(${this.stickmanFlip}) rotate(${this.stickmanFlip * this.tiltAngle}deg)`;

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
    });

    this.workspace.addEventListener('pointerleave', () => {
      this.stickmanVisible = false;
      this.stickmanActor.classList.remove('visible');
    });

    this.workspace.addEventListener('pointermove', (e) => {
      this.targetX = e.clientX;
      this.targetY = e.clientY;

      if (!this.isDrawing) return;
      const pt = this.getCanvasCoords(e);
      this.drawStroke(pt.x, pt.y);
    });

    this.paperSheet.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.isDrawing = true;
      this.paperSheet.setPointerCapture(e.pointerId);

      const pt = this.getCanvasCoords(e);
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
        this.setStickmanPose('hover');
        return;
      }

      if (this.currentTool === 'eyedropper') {
        this.pickColor(Math.round(pt.x), Math.round(pt.y));
        this.isDrawing = false;
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
      this.stopPencilAudio();
      this.setStickmanPose('hover');

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
    };
    this.stopDrawing = stopDrawing;

    this.paperSheet.addEventListener('pointerup', stopDrawing);
    this.paperSheet.addEventListener('pointercancel', stopDrawing);
    window.addEventListener('pointerup', stopDrawing);
    window.addEventListener('pointercancel', stopDrawing);

    // 2. Tool Navigation
    document.getElementById('tool-pencil').addEventListener('click', () => {
      this.setActiveTool('pencil');
    });

    document.getElementById('tool-eraser').addEventListener('click', () => {
      this.setActiveTool('eraser');
    });

    document.getElementById('tool-bucket').addEventListener('click', () => {
      this.setActiveTool('bucket');
    });

    document.getElementById('tool-eyedropper').addEventListener('click', () => {
      this.setActiveTool('eyedropper');
    });

    // 3. Brushes Popover
    document.getElementById('tool-brush').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover(this.brushPopover);
    });

    document.querySelectorAll('.brush-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brush-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentBrush = btn.dataset.brush;
        this.setActiveTool('brush');
        this.closePopovers();
        this.reactStickmanThinking(250);
      });
    });

    // 4. Shapes Popover
    document.getElementById('tool-shapes-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover(this.shapesPopover);
    });

    document.querySelectorAll('.shape-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shape-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentShape = btn.dataset.shape;
        this.setActiveTool('shape');
        this.closePopovers();
      });
    });

    document.getElementById('chk-shape-fill').addEventListener('change', (e) => {
      this.shapeFill = e.target.checked;
    });

    // 5. Stickman Playful Tricks
    document.getElementById('btn-stickman-tricks').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover(this.tricksPopover);
    });

    document.getElementById('trick-mountain').addEventListener('click', () => {
      this.closePopovers();
      this.executeTrickMountain();
    });

    document.getElementById('trick-sun').addEventListener('click', () => {
      this.closePopovers();
      this.executeTrickSun();
    });

    document.getElementById('trick-stairs').addEventListener('click', () => {
      this.closePopovers();
      this.executeTrickStairs();
    });

    document.getElementById('trick-flag').addEventListener('click', () => {
      this.closePopovers();
      this.executeTrickFlag();
    });

    // 6. Brush Size Pills
    document.querySelectorAll('.size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.strokeSize = parseInt(btn.dataset.size);
        this.updateEraserIndicator();
      });
    });

    // 7. Palette Swatches
    document.querySelectorAll('.swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setColor(btn.dataset.color);
      });
    });

    document.getElementById('btn-custom-color').addEventListener('click', () => {
      this.nativeColorPicker.click();
    });
    this.nativeColorPicker.addEventListener('input', (e) => {
      this.setColor(e.target.value);
    });

    // 8. Functional Controls
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.redo());

    document.getElementById('btn-zoom-in').addEventListener('click', () => this.setZoom(this.zoom + 0.15));
    document.getElementById('btn-zoom-out').addEventListener('click', () => this.setZoom(this.zoom - 0.15));

    document.getElementById('btn-layers-toggle').addEventListener('click', () => {
      this.layersDrawer.classList.toggle('open');
    });
    document.getElementById('btn-close-drawer').addEventListener('click', () => {
      this.layersDrawer.classList.remove('open');
    });
    document.getElementById('btn-add-layer').addEventListener('click', () => {
      this.addLayer();
      this.saveHistory('Add Layer');
    });
    document.getElementById('btn-delete-layer').addEventListener('click', () => {
      this.deleteActiveLayer();
    });

    this.layerOpacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) / 100;
      this.layerOpacityVal.textContent = `${e.target.value}%`;
      const layer = this.getActiveLayer();
      if (layer) {
        layer.opacity = val;
        layer.canvas.style.opacity = val;
      }
    });

    document.getElementById('btn-clear-canvas').addEventListener('click', () => this.clearCanvas());
    document.getElementById('btn-save-png').addEventListener('click', () => this.exportPNG());

    // Settings
    document.getElementById('btn-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover(this.settingsPopover);
    });

    document.getElementById('chk-dark-mode').addEventListener('change', (e) => {
      document.body.classList.toggle('theme-light', !e.target.checked);
      document.body.classList.toggle('theme-dark', e.target.checked);
    });

    document.getElementById('chk-sound-effects').addEventListener('change', (e) => {
      this.soundEnabled = e.target.checked;
    });

    document.getElementById('chk-stabilizer').addEventListener('change', (e) => {
      this.stabilizer = e.target.checked;
    });

    const eraseAllLayersChk = document.getElementById('chk-erase-all-layers');
    if (eraseAllLayersChk) {
      eraseAllLayersChk.addEventListener('change', (e) => {
        this.eraseAllLayers = e.target.checked;
      });
    }

    document.getElementById('slider-stickman-scale').addEventListener('input', (e) => {
      this.stickmanScale = parseFloat(e.target.value);
    });

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
      else if (key === 'b') this.setActiveTool('brush');
      else if (key === 'e') this.setActiveTool('eraser');
      else if (key === 'g') this.setActiveTool('bucket');
      else if (key === 'i') this.setActiveTool('eyedropper');
    });
  }

  fitCanvasToViewport() {
    const vpRect = this.workspace.getBoundingClientRect();
    const availableW = vpRect.width - 64;
    const availableH = vpRect.height - 124; // Generous margin so paper never collides with bottom dock
    const fitScale = Math.min(availableW / this.canvasWidth, availableH / this.canvasHeight, 1.0);
    this.setZoom(Math.max(0.3, Math.round(fitScale * 100) / 100));
  }

  setActiveTool(tool) {
    if (this.isDrawing && this.stopDrawing) {
      this.stopDrawing();
    }
    this.currentTool = tool;
    this.stickmanActor.classList.toggle('tool-eraser', tool === 'eraser');
    this.updateEraserIndicator();
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
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
    this.reactStickmanThinking(180);
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
    this.setStickmanPose('thinking');
    clearTimeout(this.reactTimer);
    this.reactTimer = setTimeout(() => {
      if (!this.isDrawing) this.setStickmanPose('hover');
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
    }
  }

  redo() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      this.restoreHistory(this.historyStack[this.historyIndex]);
      this.updateUndoRedoUI();
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
    this.layers.forEach((l, i) => {
      l.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      if (i === 0) {
        l.ctx.fillStyle = '#ffffff';
        l.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
    });
    this.saveHistory('Clear Canvas');
    this.reactStickmanThinking(200);
    this.showToast('Canvas Cleared');
  }

  exportPNG() {
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

    this.reactStickmanThinking(400);
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
