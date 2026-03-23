const canvas = document.getElementById('chart-canvas');
const ctx = canvas.getContext('2d');
const octavesSlider = document.getElementById('octaves-slider');
const octavesValue = document.getElementById('octaves-value');

let width, height;

// Resize canvas to fit container
function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  width = container.clientWidth;
  height = container.clientHeight;
  // Increase resolution for high DPI displays
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener('resize', resizeCanvas);

// --- 1D Noise Implementation ---
// Simple 1D value noise
class ValueNoise1D {
  constructor(seed = 1) {
    this.seed = seed;
    this.MAX_VERTICES = 256;
    this.r = [];
    for (let i = 0; i < this.MAX_VERTICES; i++) {
      this.r.push(Math.random());
    }
  }

  // Smooth interpolation
  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // Generate noise value at x
  get(x) {
    const xMin = Math.floor(x);
    const xMax = xMin + 1;
    const t = x - xMin;
    const tSmooth = this.smoothstep(t);

    const vMin = this.r[xMin & (this.MAX_VERTICES - 1)];
    const vMax = this.r[xMax & (this.MAX_VERTICES - 1)];

    return vMin * (1 - tSmooth) + vMax * tSmooth;
  }
}

const noiseGen = new ValueNoise1D();

// --- Fractional Brownian Motion ---
function fbm(x, octaves) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0; // Used for normalizing result to 0.0 - 1.0

  const lacunarity = 2.0;
  const gain = 0.5;

  for (let i = 0; i < octaves; i++) {
    total += noiseGen.get(x * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

// --- Simulation State ---
let time = 0;
const timeStep = 0.01;
const history = [];

// Update settings
let currentOctaves = parseInt(octavesSlider.value, 10);

octavesSlider.addEventListener('input', (e) => {
  currentOctaves = parseInt(e.target.value, 10);
  octavesValue.textContent = currentOctaves;
});

function update() {
  const noiseValue = fbm(time, currentOctaves);
  // Scale noise value to somewhat represent a price
  const price = (noiseValue * 2 - 1) * (height * 0.4) + height / 2;

  history.push({ time, price });

  // Keep history bounded to screen width
  const maxHistoryLength = Math.ceil(width / 2); // 2 pixels per point
  if (history.length > maxHistoryLength) {
    history.shift();
  }

  time += timeStep;
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  if (history.length < 2) return;

  // Determine trend color based on start and end of visible history
  const startPrice = history[0].price;
  const currentPrice = history[history.length - 1].price;
  const isUp = currentPrice <= startPrice; // Canvas Y goes down

  ctx.beginPath();
  ctx.moveTo(0, history[0].price);

  for (let i = 1; i < history.length; i++) {
    const x = (i / history.length) * width;
    ctx.lineTo(x, history[i].price);
  }

  ctx.strokeStyle = isUp ? '#00ffcc' : '#ff0055';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw current price indicator
  const lastPoint = history[history.length - 1];
  ctx.beginPath();
  ctx.arc(width, lastPoint.price, 4, 0, Math.PI * 2);
  ctx.fillStyle = isUp ? '#00ffcc' : '#ff0055';
  ctx.fill();

  // Draw gradient fill below the line
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, isUp ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 0, 85, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw grid lines
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const y = (i / gridSteps) * height;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Initial setup
resizeCanvas();
// Pre-fill history to start with a full screen
for (let i = 0; i < width / 2; i++) {
  update();
}
loop();
