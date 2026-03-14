const canvas = document.getElementById("automatonCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const ruleInput = document.getElementById("ruleInput");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

let cellSize = 4;
let cols = 0;
let rows = 0;
let ruleNumber = 30;
let currentGeneration = [];
let nextGeneration = [];
let currentRow = 0;

let isPlaying = false;
let animationId = null;

let lastFrameTime = 0;
const targetFps = 60;
const frameDelay = 1000 / targetFps;

// Initialize Canvas
function initCanvas() {
  const container = document.querySelector(".canvas-container");
  const rect = container.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  cols = Math.floor(canvas.width / cellSize);
  rows = Math.floor(canvas.height / cellSize);

  // ensure we draw precisely centered if we have extra space
  ctx.translate((canvas.width - cols * cellSize) / 2, (canvas.height - rows * cellSize) / 2);

  resetAutomaton();
}

function resetAutomaton() {
  if (isPlaying) {
    pause();
  }

  // Clear canvas
  ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);

  // Parse rule number
  let val = parseInt(ruleInput.value, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 255) val = 255;
  ruleInput.value = val;
  ruleNumber = val;

  // Initialize first generation
  currentGeneration = new Array(cols).fill(0);
  nextGeneration = new Array(cols).fill(0);

  // Center cell is 1
  currentGeneration[Math.floor(cols / 2)] = 1;
  currentRow = 0;

  drawRow();
}

function getRuleSet(rule) {
  // Convert decimal to 8-bit binary string reversed (so index 0 is 000)
  return rule.toString(2).padStart(8, '0');
}

function calculateNextGeneration() {
  const ruleSet = getRuleSet(ruleNumber);

  for (let i = 0; i < cols; i++) {
    const left = i > 0 ? currentGeneration[i - 1] : 0;
    const center = currentGeneration[i];
    const right = i < cols - 1 ? currentGeneration[i + 1] : 0;

    // Convert binary pattern to decimal index (0-7)
    // 111 -> 7, 000 -> 0
    // Because string index 0 is MSB (111), we read the rule string left-to-right based on pattern 7-value
    const pattern = (left << 2) | (center << 1) | right;

    // We want index 0 of ruleSet string to represent pattern 111 (7), and index 7 to represent 000 (0)
    // So we subtract from 7
    nextGeneration[i] = parseInt(ruleSet[7 - pattern], 10);
  }

  // Swap buffers
  for (let i = 0; i < cols; i++) {
    currentGeneration[i] = nextGeneration[i];
  }
}

function drawRow() {
  if (currentRow >= rows) {
    // Scroll up
    const imageData = ctx.getImageData(0, cellSize, canvas.width, canvas.height - cellSize);
    ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);
    ctx.putImageData(imageData, 0, 0);
    currentRow = rows - 1;
  }

  // Draw current row
  for (let i = 0; i < cols; i++) {
    if (currentGeneration[i] === 1) {
      ctx.fillStyle = "#ff00ff"; // active color
      ctx.fillRect(i * cellSize, currentRow * cellSize, cellSize, cellSize);
    } else {
      ctx.fillStyle = "#000000"; // background
      ctx.fillRect(i * cellSize, currentRow * cellSize, cellSize, cellSize);
    }
  }

  currentRow++;
}

function step() {
  calculateNextGeneration();
  drawRow();
}

function loop(timestamp) {
  if (!isPlaying) return;

  if (timestamp - lastFrameTime >= frameDelay) {
    step();
    lastFrameTime = timestamp;
  }

  animationId = requestAnimationFrame(loop);
}

function play() {
  if (isPlaying) return;
  isPlaying = true;
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stepBtn.disabled = true;
  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(loop);
}

function pause() {
  if (!isPlaying) return;
  isPlaying = false;
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stepBtn.disabled = false;
  cancelAnimationFrame(animationId);
}

// Event Listeners
playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
stepBtn.addEventListener("click", step);
resetBtn.addEventListener("click", resetAutomaton);

ruleInput.addEventListener("change", () => {
  resetAutomaton();
});

window.addEventListener("resize", () => {
  initCanvas();
});

// Start
initCanvas();
