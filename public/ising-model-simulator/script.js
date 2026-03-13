const canvas = document.getElementById("simulation-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

// UI Elements
const tempSlider = document.getElementById("temperature-slider");
const tempValue = document.getElementById("temperature-value");

// Simulation parameters
const GRID_SIZE = 200; // Size of the grid (200x200)
const STEPS_PER_FRAME = 20000; // Number of Metropolis steps per animation frame
let temperature = parseFloat(tempSlider.value);
let grid = new Int8Array(GRID_SIZE * GRID_SIZE);
let imageData;

// Colors
const COLOR_UP = [0, 255, 204]; // Neon cyan (+1)
const COLOR_DOWN = [255, 85, 0]; // Neon orange (-1)

function initGrid() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < 0.5 ? 1 : -1;
  }
}

function resizeCanvas() {
  // Use device pixel ratio for sharper rendering if needed,
  // but for pixel art style, keeping it 1:1 with CSS size and scaling via CSS is better.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create an ImageData object that matches the grid size
  // We will draw this to an offscreen canvas and scale it up to the main canvas
  imageData = new ImageData(GRID_SIZE, GRID_SIZE);
}

function getEnergyDelta(x, y, currentSpin) {
  // Periodic boundary conditions
  const up = y === 0 ? GRID_SIZE - 1 : y - 1;
  const down = y === GRID_SIZE - 1 ? 0 : y + 1;
  const left = x === 0 ? GRID_SIZE - 1 : x - 1;
  const right = x === GRID_SIZE - 1 ? 0 : x + 1;

  const neighborSum =
    grid[up * GRID_SIZE + x] +
    grid[down * GRID_SIZE + x] +
    grid[y * GRID_SIZE + left] +
    grid[y * GRID_SIZE + right];

  // Energy = -J * sum(s_i * s_j).
  // Delta E for flipping s_i is E_new - E_old = -J(-s_i * sum) - (-J(s_i * sum)) = 2 * J * s_i * sum
  // We assume J = 1.
  return 2 * currentSpin * neighborSum;
}

function metropolisStep() {
  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    // Pick a random spin
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const index = y * GRID_SIZE + x;
    const spin = grid[index];

    const dE = getEnergyDelta(x, y, spin);

    // If energy decreases or remains same, flip.
    // If energy increases, flip with probability exp(-dE / T)
    if (dE <= 0 || Math.random() < Math.exp(-dE / temperature)) {
      grid[index] = -spin;
    }
  }
}

// Pre-calculate exp(-dE / T) for possible dE values (4, 8) to optimize?
// Since T can change, we'd need to recalculate. Given modern JS engines, Math.exp might be fast enough.

const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = GRID_SIZE;
offscreenCanvas.height = GRID_SIZE;
const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false });

function drawGrid() {
  const data = imageData.data;
  let dataIndex = 0;

  for (let i = 0; i < grid.length; i++) {
    const spin = grid[i];
    if (spin === 1) {
      data[dataIndex++] = COLOR_UP[0];
      data[dataIndex++] = COLOR_UP[1];
      data[dataIndex++] = COLOR_UP[2];
      data[dataIndex++] = 255;
    } else {
      data[dataIndex++] = COLOR_DOWN[0];
      data[dataIndex++] = COLOR_DOWN[1];
      data[dataIndex++] = COLOR_DOWN[2];
      data[dataIndex++] = 255;
    }
  }

  // Put image data to offscreen canvas
  offscreenCtx.putImageData(imageData, 0, 0);

  // Disable smoothing for pixelated look
  ctx.imageSmoothingEnabled = false;

  // Draw offscreen canvas to main canvas, scaling to fill
  // Calculate to preserve aspect ratio or just stretch?
  // Stretching is fine, or we can center it. Let's center and scale to fit.
  const scale = Math.max(canvas.width / GRID_SIZE, canvas.height / GRID_SIZE);
  const drawWidth = GRID_SIZE * scale;
  const drawHeight = GRID_SIZE * scale;
  const drawX = (canvas.width - drawWidth) / 2;
  const drawY = (canvas.height - drawHeight) / 2;

  ctx.drawImage(offscreenCanvas, drawX, drawY, drawWidth, drawHeight);
}

function loop() {
  metropolisStep();
  drawGrid();
  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener("resize", () => {
  resizeCanvas();
  drawGrid();
});

tempSlider.addEventListener("input", (e) => {
  temperature = parseFloat(e.target.value);
  tempValue.textContent = temperature.toFixed(2);
});

// Start
initGrid();
resizeCanvas();
loop();
