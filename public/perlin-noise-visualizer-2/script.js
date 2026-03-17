const canvas = document.getElementById("perlin-canvas");
const ctx = canvas.getContext("2d");
const instructionText = document.getElementById("instruction-text");

let width, height;
const gridSize = 100; // pixels per grid cell
let cols, rows;
let gradients = [];

// Math utility functions
function lerp(a, b, t) {
  return a + t * (b - a);
}

function smoothstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function dotProduct(gx, gy, dx, dy) {
  return gx * dx + gy * dy;
}

// Random unit vector generator
function randomGradientVector() {
  const theta = Math.random() * 2 * Math.PI;
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

// Initialize the grid of gradients
function initGrid() {
  cols = Math.ceil(width / gridSize) + 1;
  rows = Math.ceil(height / gridSize) + 1;
  gradients = [];

  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push(randomGradientVector());
    }
    gradients.push(row);
  }
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  initGrid();
  render();
}

window.addEventListener("resize", resize);

// Animation state machine
let animationState = 0; // 0: Grid, 1: Grid + Vectors, 2: Noise Map

canvas.addEventListener("click", () => {
  animationState = (animationState + 1) % 3;
  if (animationState === 0) {
    initGrid();
    instructionText.textContent = "Click anywhere to view gradient vectors.";
  } else if (animationState === 1) {
    instructionText.textContent = "Click anywhere to view bilinear interpolation.";
  } else {
    instructionText.textContent = "Click anywhere to regenerate random noise.";
  }
  render();
});

// Render the underlying grid
function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-color');
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

// Render the gradient vectors at intersections
function drawVectors() {
  const vectorColor = getComputedStyle(document.body).getPropertyValue('--vector-color');
  ctx.strokeStyle = vectorColor;
  ctx.fillStyle = vectorColor;
  ctx.lineWidth = 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * gridSize;
      const py = y * gridSize;
      const gradient = gradients[y][x];

      const ex = px + gradient.x * (gridSize * 0.4);
      const ey = py + gradient.y * (gridSize * 0.4);

      // Draw point
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw vector line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }
}

// Compute the Perlin noise value for a specific point
function getNoise(x, y) {
  const gridX = Math.floor(x / gridSize);
  const gridY = Math.floor(y / gridSize);

  // Local coordinates inside the grid cell [0.0 - 1.0]
  const localX = (x / gridSize) - gridX;
  const localY = (y / gridSize) - gridY;

  // Fade curves for smooth interpolation
  const u = smoothstep(localX);
  const v = smoothstep(localY);

  // Gradients for the 4 corners
  const tl = gradients[gridY][gridX];
  const tr = gradients[gridY][gridX + 1] || tl;
  const bl = gradients[gridY + 1] ? gradients[gridY + 1][gridX] : tl;
  const br = gradients[gridY + 1] ? (gradients[gridY + 1][gridX + 1] || bl) : tr;

  // Distance vectors and dot products
  const dotTl = dotProduct(tl.x, tl.y, localX, localY);
  const dotTr = dotProduct(tr.x, tr.y, localX - 1, localY);
  const dotBl = dotProduct(bl.x, bl.y, localX, localY - 1);
  const dotBr = dotProduct(br.x, br.y, localX - 1, localY - 1);

  // Bilinear interpolation
  const lerpTop = lerp(dotTl, dotTr, u);
  const lerpBottom = lerp(dotBl, dotBr, u);
  const finalVal = lerp(lerpTop, lerpBottom, v);

  // Map roughly from [-1, 1] to [0, 1]
  return (finalVal + 1) / 2;
}

// Render the interpolated noise map
function drawNoise() {
  const resolution = 4; // Pixel resolution for performance

  for (let y = 0; y < height; y += resolution) {
    for (let x = 0; x < width; x += resolution) {
      let noiseVal = getNoise(x, y);

      // Ensure bounds
      noiseVal = Math.max(0, Math.min(1, noiseVal));

      const colorVal = Math.floor(noiseVal * 255);
      ctx.fillStyle = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
      ctx.fillRect(x, y, resolution, resolution);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, width, height);

  if (animationState === 0) {
    drawGrid();
  } else if (animationState === 1) {
    drawGrid();
    drawVectors();
  } else if (animationState === 2) {
    drawNoise();
    // Re-draw vectors semi-transparently on top of noise
    ctx.globalAlpha = 0.3;
    drawGrid();
    drawVectors();
    ctx.globalAlpha = 1.0;
  }
}

// Initialize
resize();
