// State variables
const state = {
  gridSize: 100,
  interpolation: 'smoothstep', // 'linear', 'smoothstep', 'smootherstep'
  showGrid: true,
  animateZ: true,
  zOffset: 0,
  zSpeed: 0.005,
  hoverX: -1,
  hoverY: -1,
  width: 0,
  height: 0,
  permutation: [],
  gradients: []
};

// Canvas context references
let noiseCtx, overlayCtx;
let noiseCanvas, overlayCanvas;

// DOM Elements
const els = {
  resSlider: document.getElementById('resolution-slider'),
  resVal: document.getElementById('resolution-value'),
  interpRadios: document.getElementsByName('interpolation'),
  showGridCheckbox: document.getElementById('show-grid'),
  animateZCheckbox: document.getElementById('animate-z'),
  probePanel: document.getElementById('probe-panel'),
  pPos: document.getElementById('probe-pos'),
  pLocal: document.getElementById('probe-local'),
  pWeight: document.getElementById('probe-weight'),
  pFinal: document.getElementById('probe-final'),
  vTL: { grad: document.getElementById('grad-tl'), dist: document.getElementById('dist-tl'), dot: document.getElementById('dot-tl') },
  vTR: { grad: document.getElementById('grad-tr'), dist: document.getElementById('dist-tr'), dot: document.getElementById('dot-tr') },
  vBL: { grad: document.getElementById('grad-bl'), dist: document.getElementById('dist-bl'), dot: document.getElementById('dot-bl') },
  vBR: { grad: document.getElementById('grad-br'), dist: document.getElementById('dist-br'), dot: document.getElementById('dot-br') },
};

// Initialize Perlin Noise tables
function initPerlin() {
  state.permutation = new Array(256);
  for (let i = 0; i < 256; i++) {
    state.permutation[i] = i;
  }

  // Shuffle permutation table
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.permutation[i], state.permutation[j]] = [state.permutation[j], state.permutation[i]];
  }

  // Duplicate the table to avoid index wrapping calculations
  state.permutation = state.permutation.concat(state.permutation);

  // Pre-calculate random normalized gradients for 3D
  state.gradients = new Array(512);
  for (let i = 0; i < 512; i++) {
    let theta = Math.random() * 2 * Math.PI;
    let phi = Math.acos(2 * Math.random() - 1);
    state.gradients[i] = {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.sin(phi) * Math.sin(theta),
      z: Math.cos(phi)
    };
  }
}

function getGradient(xi, yi, zi) {
  let hash = state.permutation[(state.permutation[(state.permutation[xi & 255] + yi) & 255] + zi) & 255];
  return state.gradients[hash];
}

function fade(t, method) {
  switch (method) {
    case 'linear': return t;
    case 'smoothstep': return t * t * (3 - 2 * t);
    case 'smootherstep': return t * t * t * (t * (t * 6 - 15) + 10);
    default: return t;
  }
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

// Calculate dot product of distance and gradient vectors
function gradDot(xi, yi, zi, x, y, z) {
  let g = getGradient(xi, yi, zi);
  return (x * g.x) + (y * g.y) + (z * g.z);
}

// Main Perlin Noise function
function perlin(x, y, z) {
  let xi = Math.floor(x) & 255;
  let yi = Math.floor(y) & 255;
  let zi = Math.floor(z) & 255;

  let xf = x - Math.floor(x);
  let yf = y - Math.floor(y);
  let zf = z - Math.floor(z);

  let u = fade(xf, state.interpolation);
  let v = fade(yf, state.interpolation);
  let w = fade(zf, state.interpolation);

  // Calculate dot products at 8 corners of the cube
  let p000 = gradDot(xi, yi, zi, xf, yf, zf);
  let p100 = gradDot(xi + 1, yi, zi, xf - 1, yf, zf);
  let p010 = gradDot(xi, yi + 1, zi, xf, yf - 1, zf);
  let p110 = gradDot(xi + 1, yi + 1, zi, xf - 1, yf - 1, zf);
  let p001 = gradDot(xi, yi, zi + 1, xf, yf, zf - 1);
  let p101 = gradDot(xi + 1, yi, zi + 1, xf - 1, yf, zf - 1);
  let p011 = gradDot(xi, yi + 1, zi + 1, xf, yf - 1, zf - 1);
  let p111 = gradDot(xi + 1, yi + 1, zi + 1, xf - 1, yf - 1, zf - 1);

  // Interpolate along x
  let x00 = lerp(p000, p100, u);
  let x10 = lerp(p010, p110, u);
  let x01 = lerp(p001, p101, u);
  let x11 = lerp(p011, p111, u);

  // Interpolate along y
  let y0 = lerp(x00, x10, v);
  let y1 = lerp(x01, x11, v);

  // Interpolate along z
  let res = lerp(y0, y1, w);

  // Scale output from [-1, 1] to [0, 1] approximately
  return (res + 1) / 2;
}

// Resize canvases to match window
function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;

  noiseCanvas.width = state.width;
  noiseCanvas.height = state.height;
  overlayCanvas.width = state.width;
  overlayCanvas.height = state.height;

  drawNoise();
}

// Draw the underlying noise field (heatmap)
function drawNoise() {
  if (!noiseCtx) return;
  const imgData = noiseCtx.createImageData(state.width, state.height);
  const data = imgData.data;

  // Render noise for every pixel
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      let px = x / state.gridSize;
      let py = y / state.gridSize;

      // Get noise value [0, 1]
      let n = perlin(px, py, state.zOffset);

      // Map to a color (dark blue to bright cyan/white)
      let r = Math.floor(n * n * 200);
      let g = Math.floor(n * 255);
      let b = Math.floor(n * 255 + (1-n) * 100);

      let index = (y * state.width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
  noiseCtx.putImageData(imgData, 0, 0);
}

function formatVec(x, y) {
  return `[${x.toFixed(2)}, ${y.toFixed(2)}]`;
}

// Draw the grid, vectors, and hover overlays
function drawOverlay() {
  if (!overlayCtx) return;

  overlayCtx.clearRect(0, 0, state.width, state.height);

  if (state.showGrid) {
    overlayCtx.lineWidth = 1;
    overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';

    // Draw grid lines
    overlayCtx.beginPath();
    for (let x = 0; x <= state.width; x += state.gridSize) {
      overlayCtx.moveTo(x, 0);
      overlayCtx.lineTo(x, state.height);
    }
    for (let y = 0; y <= state.height; y += state.gridSize) {
      overlayCtx.moveTo(0, y);
      overlayCtx.lineTo(state.width, y);
    }
    overlayCtx.stroke();

    // Draw gradient vectors at grid intersections
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeStyle = 'rgba(0, 255, 204, 0.6)'; // Accent Cyan
    const arrowLen = state.gridSize * 0.4;

    for (let y = 0; y <= state.height; y += state.gridSize) {
      for (let x = 0; x <= state.width; x += state.gridSize) {
        let gridX = Math.floor(x / state.gridSize);
        let gridY = Math.floor(y / state.gridSize);
        let gridZ = Math.floor(state.zOffset);

        let g = getGradient(gridX, gridY, gridZ);
        // Project 3D gradient vector onto 2D plane for visualization
        let mag = Math.sqrt(g.x * g.x + g.y * g.y);
        if (mag > 0.001) {
          let nx = g.x / mag;
          let ny = g.y / mag;

          overlayCtx.beginPath();
          overlayCtx.moveTo(x, y);
          overlayCtx.lineTo(x + nx * arrowLen, y + ny * arrowLen);
          overlayCtx.stroke();

          // Draw dot
          overlayCtx.beginPath();
          overlayCtx.arc(x, y, 3, 0, Math.PI * 2);
          overlayCtx.fillStyle = 'rgba(0, 255, 204, 0.8)';
          overlayCtx.fill();
        }
      }
    }
  }

  // Draw hover probe
  if (state.hoverX >= 0 && state.hoverY >= 0) {
    let px = state.hoverX / state.gridSize;
    let py = state.hoverY / state.gridSize;
    let pz = state.zOffset;

    let xi = Math.floor(px);
    let yi = Math.floor(py);
    let zi = Math.floor(pz);

    let xf = px - xi;
    let yf = py - yi;
    let zf = pz - zi;

    // Draw highlighted grid cell box
    let cellX = xi * state.gridSize;
    let cellY = yi * state.gridSize;

    overlayCtx.strokeStyle = 'rgba(255, 0, 255, 0.8)'; // Magenta
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeRect(cellX, cellY, state.gridSize, state.gridSize);

    // Draw cursor point
    overlayCtx.beginPath();
    overlayCtx.arc(state.hoverX, state.hoverY, 5, 0, Math.PI * 2);
    overlayCtx.fillStyle = 'rgba(255, 0, 255, 1)';
    overlayCtx.fill();

    // Draw distance vectors from corners to point
    overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    overlayCtx.setLineDash([4, 4]);
    overlayCtx.beginPath();
    overlayCtx.moveTo(cellX, cellY); overlayCtx.lineTo(state.hoverX, state.hoverY); // TL
    overlayCtx.moveTo(cellX + state.gridSize, cellY); overlayCtx.lineTo(state.hoverX, state.hoverY); // TR
    overlayCtx.moveTo(cellX, cellY + state.gridSize); overlayCtx.lineTo(state.hoverX, state.hoverY); // BL
    overlayCtx.moveTo(cellX + state.gridSize, cellY + state.gridSize); overlayCtx.lineTo(state.hoverX, state.hoverY); // BR
    overlayCtx.stroke();
    overlayCtx.setLineDash([]);

    // Update Panel Data
    els.probePanel.classList.remove('hidden');

    let u = fade(xf, state.interpolation);
    let v = fade(yf, state.interpolation);

    els.pPos.innerText = `[${xi}, ${yi}]`;
    els.pLocal.innerText = `[${xf.toFixed(2)}, ${yf.toFixed(2)}]`;
    els.pWeight.innerText = `[${u.toFixed(2)}, ${v.toFixed(2)}]`;

    // TL
    let gTL = getGradient(xi, yi, zi);
    let dotTL = gradDot(xi, yi, zi, xf, yf, zf);
    els.vTL.grad.innerText = formatVec(gTL.x, gTL.y);
    els.vTL.dist.innerText = formatVec(xf, yf);
    els.vTL.dot.innerText = dotTL.toFixed(3);

    // TR
    let gTR = getGradient(xi + 1, yi, zi);
    let dotTR = gradDot(xi + 1, yi, zi, xf - 1, yf, zf);
    els.vTR.grad.innerText = formatVec(gTR.x, gTR.y);
    els.vTR.dist.innerText = formatVec(xf - 1, yf);
    els.vTR.dot.innerText = dotTR.toFixed(3);

    // BL
    let gBL = getGradient(xi, yi + 1, zi);
    let dotBL = gradDot(xi, yi + 1, zi, xf, yf - 1, zf);
    els.vBL.grad.innerText = formatVec(gBL.x, gBL.y);
    els.vBL.dist.innerText = formatVec(xf, yf - 1);
    els.vBL.dot.innerText = dotBL.toFixed(3);

    // BR
    let gBR = getGradient(xi + 1, yi + 1, zi);
    let dotBR = gradDot(xi + 1, yi + 1, zi, xf - 1, yf - 1, zf);
    els.vBR.grad.innerText = formatVec(gBR.x, gBR.y);
    els.vBR.dist.innerText = formatVec(xf - 1, yf - 1);
    els.vBR.dot.innerText = dotBR.toFixed(3);

    // Final
    let finalVal = perlin(px, py, pz);
    els.pFinal.innerText = finalVal.toFixed(4);
  } else {
    els.probePanel.classList.add('hidden');
  }
}

let lastTime = 0;

// Animation loop
function animate(time) {
  let dt = time - lastTime;
  lastTime = time;

  if (state.animateZ) {
    state.zOffset += state.zSpeed * (dt / 16);
    drawNoise(); // Only redraw heavy background noise if Z changes
  }

  drawOverlay(); // Always draw overlay (for hover updates)
  requestAnimationFrame(animate);
}

// Setup Event Listeners
function setupEvents() {
  window.addEventListener('resize', resize);

  overlayCanvas.addEventListener('mousemove', (e) => {
    let rect = overlayCanvas.getBoundingClientRect();
    state.hoverX = e.clientX - rect.left;
    state.hoverY = e.clientY - rect.top;

    // Update immediately if paused
    if (!state.animateZ) {
      drawOverlay();
    }
  });

  overlayCanvas.addEventListener('mouseleave', () => {
    state.hoverX = -1;
    state.hoverY = -1;
    if (!state.animateZ) {
      drawOverlay();
    }
  });

  els.resSlider.addEventListener('input', (e) => {
    state.gridSize = parseInt(e.target.value);
    els.resVal.innerText = state.gridSize;
    drawNoise();
    if (!state.animateZ) drawOverlay();
  });

  els.interpRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.interpolation = e.target.value;
      drawNoise();
      if (!state.animateZ) drawOverlay();
    });
  });

  els.showGridCheckbox.addEventListener('change', (e) => {
    state.showGrid = e.target.checked;
    if (!state.animateZ) drawOverlay();
  });

  els.animateZCheckbox.addEventListener('change', (e) => {
    state.animateZ = e.target.checked;
    if (!state.animateZ) {
      // Force a redraw just in case
      drawNoise();
      drawOverlay();
    }
  });
}

// Initialization
function init() {
  noiseCanvas = document.getElementById('noise-canvas');
  overlayCanvas = document.getElementById('overlay-canvas');
  noiseCtx = noiseCanvas.getContext('2d', { alpha: false });
  overlayCtx = overlayCanvas.getContext('2d');

  initPerlin();
  setupEvents();
  resize();

  requestAnimationFrame(animate);
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
