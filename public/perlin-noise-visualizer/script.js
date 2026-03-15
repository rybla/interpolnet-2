const canvas = document.getElementById('noise-canvas');
const ctx = canvas.getContext('2d');

let gridSize = 6;
let gradients = [];

// Get controls
const gridSizeInput = document.getElementById('grid-size');
const gridSizeVal = document.getElementById('grid-size-val');
const regenerateBtn = document.getElementById('regenerate-btn');
const showNoiseToggle = document.getElementById('show-noise');
const showGradientsToggle = document.getElementById('show-gradients');
const showGridToggle = document.getElementById('show-grid');

// Math utils for Perlin noise
function smoothstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function dotProductGrid(x, y, vx, vy) {
  const dx = x - vx;
  const dy = y - vy;

  const g = gradients[vy][vx];
  return dx * g.x + dy * g.y;
}

// Generate random unit vector
function randomGradient() {
  const theta = Math.random() * 2 * Math.PI;
  return {
    x: Math.cos(theta),
    y: Math.sin(theta)
  };
}

// Generate the grid of random gradients
function generateGradients() {
  gradients = [];
  for (let y = 0; y <= gridSize; y++) {
    const row = [];
    for (let x = 0; x <= gridSize; x++) {
      row.push(randomGradient());
    }
    gradients.push(row);
  }
}

// Calculate perlin noise value at given coordinate
function perlin(x, y) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;

  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  let n0, n1, ix0, ix1, value;

  n0 = dotProductGrid(x, y, x0, y0);
  n1 = dotProductGrid(x, y, x1, y0);
  ix0 = lerp(n0, n1, sx);

  n0 = dotProductGrid(x, y, x0, y1);
  n1 = dotProductGrid(x, y, x1, y1);
  ix1 = lerp(n0, n1, sx);

  value = lerp(ix0, ix1, sy);

  // Return mapped from [-1, 1] to [0, 1] for easy coloring
  return (value + 1) / 2;
}

generateGradients();

// Render Functions
function drawGrid(cellWidth, cellHeight) {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-color');
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridSize; i++) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    const y = i * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawGradients(cellWidth, cellHeight) {
  const vectorColor = getComputedStyle(document.body).getPropertyValue('--vector-color');
  ctx.strokeStyle = vectorColor;
  ctx.lineWidth = 2;
  const arrowLen = Math.min(cellWidth, cellHeight) * 0.4;

  for (let y = 0; y <= gridSize; y++) {
    for (let x = 0; x <= gridSize; x++) {
      const px = x * cellWidth;
      const py = y * cellHeight;
      const vx = gradients[y][x].x * arrowLen;
      const vy = gradients[y][x].y * arrowLen;

      // Draw Vector Line
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + vx, py + vy);
      ctx.stroke();

      // Draw Vector Head (simple circle for origin)
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = vectorColor;
      ctx.fill();
    }
  }
}

function drawNoise(cellWidth, cellHeight) {
  const pixelSize = 4; // optimization to not draw every single pixel

  for (let y = 0; y < canvas.height; y += pixelSize) {
    for (let x = 0; x < canvas.width; x += pixelSize) {
      const nx = x / cellWidth;
      const ny = y / cellHeight;
      const value = perlin(nx, ny);

      // Map to a gradient (e.g. pink to dark)
      const colorVal = Math.floor(value * 255);

      // Use an alpha value based on the noise over the dark bg
      // value ranges from 0 to 1
      ctx.fillStyle = `rgba(255, 71, 126, ${value})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

function resize() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  render();
}

window.addEventListener('resize', resize);

// Event Listeners for UI
gridSizeInput.addEventListener('input', (e) => {
  gridSize = parseInt(e.target.value, 10);
  gridSizeVal.textContent = gridSize;
  generateGradients();
  render();
});

regenerateBtn.addEventListener('click', () => {
  generateGradients();
  render();
});

showNoiseToggle.addEventListener('change', render);
showGradientsToggle.addEventListener('change', render);
showGridToggle.addEventListener('change', render);

// Initial call
resize();

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cellWidth = canvas.width / gridSize;
  const cellHeight = canvas.height / gridSize;

  if (showNoiseToggle.checked) {
    drawNoise(cellWidth, cellHeight);
  }

  if (showGridToggle.checked) {
    drawGrid(cellWidth, cellHeight);
  }

  if (showGradientsToggle.checked) {
    drawGradients(cellWidth, cellHeight);
  }
}
