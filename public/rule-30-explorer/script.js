const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const container = document.querySelector('.canvas-container');

const btnPlayPause = document.getElementById('btn-play-pause');
const btnStep = document.getElementById('btn-step');
const btnReset = document.getElementById('btn-reset');
const speedSlider = document.getElementById('speed-slider');

// Configuration
let CELL_SIZE = 4;
let cols = 0;
let rows = 0;
let currentRow = 0;
let grid = []; // 1D array representing the current row

let isPlaying = true;
let animationId = null;
let lastDrawTime = 0;

// Colors
const COLOR_ACTIVE = '#00ffcc';
const COLOR_INACTIVE = '#0b0f19'; // Match bg-color

function initCanvas() {
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  // Ensure canvas height is a perfect multiple of CELL_SIZE to avoid row clipping
  canvas.height = Math.floor(rect.height / CELL_SIZE) * CELL_SIZE;

  cols = Math.ceil(canvas.width / CELL_SIZE);
  // Ensure odd number of columns so there is a true center
  if (cols % 2 === 0) cols++;

  rows = Math.ceil(canvas.height / CELL_SIZE);

  // Re-center drawing context to center of screen for the width
  const actualWidth = cols * CELL_SIZE;
  const offsetX = (canvas.width - actualWidth) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.translate(offsetX, 0);

  resetAutomaton();
}

function resetAutomaton() {
  ctx.fillStyle = COLOR_INACTIVE;
  ctx.fillRect(0, 0, cols * CELL_SIZE, canvas.height);

  grid = new Array(cols).fill(0);
  const centerIndex = Math.floor(cols / 2);
  grid[centerIndex] = 1;

  currentRow = 0;
  drawRow(grid, currentRow);

  if (isPlaying && !animationId) {
    lastDrawTime = performance.now();
    animationLoop(lastDrawTime);
  }
}

// Rule 30: next_state = (left ^ (center | right))
function getNextState(left, center, right) {
  return left ^ (center | right);
}

function calculateNextRow() {
  const nextGrid = new Array(cols).fill(0);
  for (let i = 0; i < cols; i++) {
    const left = i === 0 ? 0 : grid[i - 1];
    const center = grid[i];
    const right = i === cols - 1 ? 0 : grid[i + 1];
    nextGrid[i] = getNextState(left, center, right);
  }
  grid = nextGrid;
  currentRow++;
}

function drawRow(rowData, yIndex) {
  const y = yIndex * CELL_SIZE;

  // Optimization: only draw active cells over the dark background
  ctx.fillStyle = COLOR_ACTIVE;
  for (let i = 0; i < cols; i++) {
    if (rowData[i] === 1) {
      ctx.fillRect(i * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
    }
  }
}

function scrollCanvasUp() {
  // We need to operate on the un-translated bounds for getImageData/putImageData
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Get image data from row 1 to bottom
  const imageData = ctx.getImageData(0, CELL_SIZE, canvas.width, canvas.height - CELL_SIZE);
  // Put it back starting at row 0
  ctx.putImageData(imageData, 0, 0);

  // Clear the bottom row entirely across the physical canvas width
  ctx.fillStyle = COLOR_INACTIVE;
  ctx.fillRect(0, canvas.height - CELL_SIZE, canvas.width, CELL_SIZE);

  // Restore the translation for drawing the next row correctly
  const actualWidth = cols * CELL_SIZE;
  const offsetX = (canvas.width - actualWidth) / 2;
  ctx.translate(offsetX, 0);
}

function step() {
  calculateNextRow();

  if (currentRow >= rows) {
    scrollCanvasUp();
    drawRow(grid, rows - 1);
  } else {
    drawRow(grid, currentRow);
  }
}

function animationLoop(timestamp) {
  if (!isPlaying) {
    animationId = null;
    return;
  }

  // 60fps max down to ~1fps depending on slider (1-60)
  // Higher slider value = less delay
  const maxSpeed = parseInt(speedSlider.max, 10);
  const currentSpeed = parseInt(speedSlider.value, 10);
  const delayMs = currentSpeed === maxSpeed ? 0 : (maxSpeed - currentSpeed) * 16.67; // roughly maps 1-60 to frame delays

  if (timestamp - lastDrawTime >= delayMs) {
    step();
    lastDrawTime = timestamp;
  }

  animationId = requestAnimationFrame(animationLoop);
}

function togglePlayPause() {
  isPlaying = !isPlaying;
  btnPlayPause.textContent = isPlaying ? 'Pause' : 'Play';
  btnPlayPause.classList.toggle('active', !isPlaying);

  if (isPlaying && !animationId) {
    lastDrawTime = performance.now();
    animationLoop(lastDrawTime);
  }
}

// Event Listeners
btnPlayPause.addEventListener('click', togglePlayPause);
btnStep.addEventListener('click', () => {
  if (isPlaying) togglePlayPause();
  step();
});
btnReset.addEventListener('click', resetAutomaton);

window.addEventListener('resize', () => {
  // debounce resize
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    initCanvas();
  }, 250);
});

// Start
initCanvas();
