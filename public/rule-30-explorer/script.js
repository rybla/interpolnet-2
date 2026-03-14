const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const playPauseBtn = document.getElementById('play-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');

let isPlaying = true;
let speed = parseInt(speedSlider.value);
let cellSize = 4;

let rows = [];
let maxRowsToKeep = 1000;

let panX = 0;
let panY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

let lastTime = 0;
let timeAccumulator = 0;

function init() {
  resizeCanvas();
  resetAutomaton();
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Initialize pan to center top
  panX = canvas.width / 2;
  panY = 20;
  renderAll();
}

function resetAutomaton() {
  rows = [];
  // Initialize first row with a single active cell in the middle
  const initialWidth = Math.ceil(canvas.width / cellSize) * 2; // Compute wide enough initial row
  const firstRow = new Array(initialWidth).fill(0);
  firstRow[Math.floor(initialWidth / 2)] = 1;
  rows.push(firstRow);

  panX = canvas.width / 2;
  panY = 20;

  if (!isPlaying) {
    togglePlay();
  }
  renderAll();
}

// Rule 30 logic
function getNextRow(currentRow) {
  const nextRow = new Array(currentRow.length).fill(0);
  for (let i = 0; i < currentRow.length; i++) {
    const left = i === 0 ? currentRow[currentRow.length - 1] : currentRow[i - 1];
    const center = currentRow[i];
    const right = i === currentRow.length - 1 ? currentRow[0] : currentRow[i + 1];

    // Convert binary to integer
    const state = (left << 2) | (center << 1) | right;

    // Rule 30 is binary 00011110 -> 30
    if (state === 4 || state === 3 || state === 2 || state === 1) {
      nextRow[i] = 1;
    } else {
      nextRow[i] = 0;
    }
  }

  // Extend row dynamically if edges are reached
  if (nextRow[0] === 1 || nextRow[nextRow.length - 1] === 1) {
      // we need to grow the row
      nextRow.unshift(0, 0);
      nextRow.push(0, 0);
      // adjust previous rows to keep alignment
      for(let r=0; r<rows.length; r++) {
          rows[r].unshift(0, 0);
          rows[r].push(0, 0);
      }
  }

  return nextRow;
}

function step() {
  const lastRow = rows[rows.length - 1];
  const nextRow = getNextRow(lastRow);
  rows.push(nextRow);

  if (rows.length > maxRowsToKeep) {
    rows.shift();
    panY += cellSize; // Adjust pan to keep relative position
  }
}

function renderAll() {
  // Clear canvas
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ffcc';

  ctx.save();
  ctx.translate(panX, panY);

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    const rowWidth = row.length * cellSize;
    const startX = -rowWidth / 2;

    // Only draw if visible
    const screenY = panY + y * cellSize;
    if (screenY + cellSize < 0 || screenY > canvas.height) continue;

    for (let x = 0; x < row.length; x++) {
      if (row[x] === 1) {
        ctx.fillRect(startX + x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.restore();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (isPlaying) {
    timeAccumulator += dt;
    const timePerStep = 1000 / speed;

    let stepped = false;
    while (timeAccumulator >= timePerStep) {
      step();
      timeAccumulator -= timePerStep;
      stepped = true;
    }

    if (stepped || isDragging) {
      renderAll();
    }
  } else if (isDragging) {
    renderAll();
  }

  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);

playPauseBtn.addEventListener('click', togglePlay);

function togglePlay() {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
  if (isPlaying) {
    lastTime = performance.now();
    timeAccumulator = 0;
  }
}

resetBtn.addEventListener('click', resetAutomaton);

speedSlider.addEventListener('input', (e) => {
  speed = parseInt(e.target.value);
});

// Panning
canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  startDragX = e.clientX - panX;
  startDragY = e.clientY - panY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (isDragging) {
    panX = e.clientX - startDragX;
    panY = e.clientY - startDragY;
    if (!isPlaying) renderAll();
  }
});

canvas.addEventListener('pointerup', (e) => {
  isDragging = false;
  canvas.releasePointerCapture(e.pointerId);
});

// Zooming
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const direction = e.deltaY > 0 ? -1 : 1;

  let newCellSize = cellSize * (direction > 0 ? zoomFactor : 1 / zoomFactor);
  newCellSize = Math.max(1, Math.min(newCellSize, 50));

  if (newCellSize !== cellSize) {
    // Zoom around mouse
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const scale = newCellSize / cellSize;

    panX = mouseX - (mouseX - panX) * scale;
    panY = mouseY - (mouseY - panY) * scale;

    cellSize = newCellSize;
    renderAll();
  }
}, { passive: false });

init();
