const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const inputs = {
  m00: document.getElementById('m00'),
  m01: document.getElementById('m01'),
  m10: document.getElementById('m10'),
  m11: document.getElementById('m11')
};
const presetButtons = document.querySelectorAll('.preset-buttons button');

// Constants for rendering
const GRID_SIZE = 50; // Pixels per unit
const VECTOR_HEAD_SIZE = 12;
const HIT_RADIUS = 20;

// Current matrix state (initialized to Identity)
let matrix = {
  a: 1, b: 0, // i-hat x, j-hat x
  c: 0, d: 1  // i-hat y, j-hat y
};

// Target matrix for animation
let targetMatrix = { ...matrix };
let animating = false;
let animationProgress = 1;

// Dragging state
let draggingVector = null; // 'i' or 'j'
let mousePos = { x: 0, y: 0 };

// Resize canvas properly considering device pixel ratio
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  draw();
}

window.addEventListener('resize', resizeCanvas);

// Update inputs from matrix state
function updateInputs() {
  inputs.m00.value = matrix.a.toFixed(2);
  inputs.m01.value = matrix.b.toFixed(2);
  inputs.m10.value = (-matrix.c).toFixed(2); // Y is flipped in Canvas
  inputs.m11.value = (-matrix.d).toFixed(2); // Y is flipped in Canvas
}

// Update matrix state from inputs
function updateMatrixFromInputs() {
  matrix.a = parseFloat(inputs.m00.value) || 0;
  matrix.b = parseFloat(inputs.m01.value) || 0;
  matrix.c = -parseFloat(inputs.m10.value) || 0; // Flip Y for Canvas
  matrix.d = -parseFloat(inputs.m11.value) || 0; // Flip Y for Canvas
  targetMatrix = { ...matrix }; // Sync target
  draw();
}

// Attach input listeners
Object.values(inputs).forEach(input => {
  input.addEventListener('input', updateMatrixFromInputs);
});

// Preset button handlers
// Negate c and d to compensate for canvas Y axis flip
const presets = {
  'identity': { a: 1, b: 0, c: -0, d: -1 },
  'shear-x': { a: 1, b: 1, c: -0, d: -1 },
  'shear-y': { a: 1, b: 0, c: -1, d: -1 },
  'rotate-90': { a: 0, b: -1, c: -1, d: -0 },
  'reflect-x': { a: 1, b: 0, c: -0, d: 1 },
  'reflect-y': { a: -1, b: 0, c: -0, d: -1 },
  'scale-2': { a: 2, b: 0, c: -0, d: -2 }
};

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const presetName = btn.getAttribute('data-preset');
    if (presets[presetName]) {
      animateToMatrix(presets[presetName]);
    }
  });
});

function animateToMatrix(target) {
  targetMatrix = { ...target };
  animationProgress = 0;
  if (!animating) {
    animating = true;
    requestAnimationFrame(animationLoop);
  }
}

function animationLoop() {
  animationProgress += 0.05; // Adjust speed
  if (animationProgress >= 1) {
    animationProgress = 1;
    animating = false;
  }

  // Linear interpolation
  matrix.a += (targetMatrix.a - matrix.a) * 0.2;
  matrix.b += (targetMatrix.b - matrix.b) * 0.2;
  matrix.c += (targetMatrix.c - matrix.c) * 0.2;
  matrix.d += (targetMatrix.d - matrix.d) * 0.2;

  updateInputs();
  draw();

  if (animating) {
    requestAnimationFrame(animationLoop);
  } else {
    // Snap to exact values at end
    matrix = { ...targetMatrix };
    updateInputs();
    draw();
  }
}

// Coordinate transformations
function toScreen(x, y) {
  const rect = canvas.getBoundingClientRect();
  const originX = rect.width / 2;
  const originY = rect.height / 2;
  return {
    x: originX + x * GRID_SIZE,
    y: originY + y * GRID_SIZE
  };
}

function toMath(screenX, screenY) {
  const rect = canvas.getBoundingClientRect();
  const originX = rect.width / 2;
  const originY = rect.height / 2;
  return {
    x: (screenX - originX) / GRID_SIZE,
    y: (screenY - originY) / GRID_SIZE
  };
}

// Drawing Functions
function drawGrid(ctx, rect, transformMatrix, color, lineWidth, isOriginal) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  const originX = rect.width / 2;
  const originY = rect.height / 2;

  // Calculate grid bounds
  const maxUnitsX = Math.ceil(rect.width / GRID_SIZE / 2) + 10; // Extra padding
  const maxUnitsY = Math.ceil(rect.height / GRID_SIZE / 2) + 10;

  ctx.beginPath();

  // Vertical lines
  for (let i = -maxUnitsX; i <= maxUnitsX; i++) {
    const start = { x: i, y: -maxUnitsY };
    const end = { x: i, y: maxUnitsY };

    const transformedStart = applyTransform(start, transformMatrix);
    const transformedEnd = applyTransform(end, transformMatrix);

    ctx.moveTo(originX + transformedStart.x * GRID_SIZE, originY + transformedStart.y * GRID_SIZE);
    ctx.lineTo(originX + transformedEnd.x * GRID_SIZE, originY + transformedEnd.y * GRID_SIZE);
  }

  // Horizontal lines
  for (let j = -maxUnitsY; j <= maxUnitsY; j++) {
    const start = { x: -maxUnitsX, y: j };
    const end = { x: maxUnitsX, y: j };

    const transformedStart = applyTransform(start, transformMatrix);
    const transformedEnd = applyTransform(end, transformMatrix);

    ctx.moveTo(originX + transformedStart.x * GRID_SIZE, originY + transformedStart.y * GRID_SIZE);
    ctx.lineTo(originX + transformedEnd.x * GRID_SIZE, originY + transformedEnd.y * GRID_SIZE);
  }

  ctx.stroke();

  // Draw Axes
  ctx.lineWidth = lineWidth * 2;
  ctx.beginPath();
  // Y Axis
  const yStart = applyTransform({ x: 0, y: -maxUnitsY }, transformMatrix);
  const yEnd = applyTransform({ x: 0, y: maxUnitsY }, transformMatrix);
  ctx.moveTo(originX + yStart.x * GRID_SIZE, originY + yStart.y * GRID_SIZE);
  ctx.lineTo(originX + yEnd.x * GRID_SIZE, originY + yEnd.y * GRID_SIZE);

  // X Axis
  const xStart = applyTransform({ x: -maxUnitsX, y: 0 }, transformMatrix);
  const xEnd = applyTransform({ x: maxUnitsX, y: 0 }, transformMatrix);
  ctx.moveTo(originX + xStart.x * GRID_SIZE, originY + xStart.y * GRID_SIZE);
  ctx.lineTo(originX + xEnd.x * GRID_SIZE, originY + xEnd.y * GRID_SIZE);
  ctx.stroke();

  ctx.restore();
}

function applyTransform(point, mat) {
  return {
    x: point.x * mat.a + point.y * mat.b,
    y: point.x * mat.c + point.y * mat.d
  };
}

function drawVector(ctx, from, to, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - VECTOR_HEAD_SIZE * Math.cos(angle - Math.PI / 6), to.y - VECTOR_HEAD_SIZE * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - VECTOR_HEAD_SIZE * Math.cos(angle + Math.PI / 6), to.y - VECTOR_HEAD_SIZE * Math.sin(angle + Math.PI / 6));
  ctx.fill();

  // Label
  if (label) {
    ctx.font = 'bold 16px Courier New';
    ctx.fillText(label, to.x + 10, to.y - 10);
  }

  // Draggable hit area indicator (optional visual feedback)
  ctx.beginPath();
  ctx.arc(to.x, to.y, HIT_RADIUS/2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();

  ctx.restore();
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Colors from CSS root variables
  const style = getComputedStyle(document.body);
  const colorGridOriginal = style.getPropertyValue('--grid-original').trim() || 'rgba(197, 198, 199, 0.15)';
  const colorGridTransformed = style.getPropertyValue('--grid-transformed').trim() || 'rgba(102, 252, 241, 0.4)';
  const colorVectorI = style.getPropertyValue('--vector-i').trim() || '#ff4b4b';
  const colorVectorJ = style.getPropertyValue('--vector-j').trim() || '#4b88ff';

  const identityMatrix = { a: 1, b: 0, c: 0, d: 1 };

  // Draw Background original grid
  drawGrid(ctx, rect, identityMatrix, colorGridOriginal, 1, true);

  // Draw Transformed grid
  drawGrid(ctx, rect, matrix, colorGridTransformed, 1.5, false);

  // Calculate vector endpoints
  const originScreen = toScreen(0, 0);

  // i-hat (1,0) transformed by matrix
  const iPoint = applyTransform({x: 1, y: 0}, matrix);
  const iScreen = toScreen(iPoint.x, iPoint.y);

  // j-hat (0,1) transformed by matrix
  const jPoint = applyTransform({x: 0, y: 1}, matrix);
  const jScreen = toScreen(jPoint.x, jPoint.y);

  // Draw Basis Vectors
  drawVector(ctx, originScreen, iScreen, colorVectorI, 'î');
  drawVector(ctx, originScreen, jScreen, colorVectorJ, 'ĵ');
}

// Interactivity Handling
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;

  // Handle touch events
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function handleStart(e) {
  e.preventDefault();
  mousePos = getMousePos(e);

  const iPoint = applyTransform({x: 1, y: 0}, matrix);
  const iScreen = toScreen(iPoint.x, iPoint.y);

  const jPoint = applyTransform({x: 0, y: 1}, matrix);
  const jScreen = toScreen(jPoint.x, jPoint.y);

  const distI = Math.hypot(mousePos.x - iScreen.x, mousePos.y - iScreen.y);
  const distJ = Math.hypot(mousePos.x - jScreen.x, mousePos.y - jScreen.y);

  if (distI < HIT_RADIUS) {
    draggingVector = 'i';
  } else if (distJ < HIT_RADIUS) {
    draggingVector = 'j';
  }
}

function handleMove(e) {
  if (!draggingVector) return;
  e.preventDefault();
  mousePos = getMousePos(e);

  const mathPos = toMath(mousePos.x, mousePos.y);

  // Snap to grid if close (optional user experience enhancement)
  const snapThreshold = 0.1;
  if (Math.abs(mathPos.x - Math.round(mathPos.x)) < snapThreshold) mathPos.x = Math.round(mathPos.x);
  if (Math.abs(mathPos.y - Math.round(mathPos.y)) < snapThreshold) mathPos.y = Math.round(mathPos.y);

  if (draggingVector === 'i') {
    matrix.a = mathPos.x;
    matrix.c = mathPos.y;
  } else if (draggingVector === 'j') {
    matrix.b = mathPos.x;
    matrix.d = mathPos.y;
  }

  targetMatrix = { ...matrix };
  updateInputs();
  draw();
}

function handleEnd(e) {
  if (draggingVector) {
    e.preventDefault();
    draggingVector = null;
  }
}

// Mouse Events
canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

// Touch Events
canvas.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });

// Init
// Flip initial canvas Y logic on inputs to match standard math view
matrix.c = -0;
matrix.d = -1; // so visual y points down (math points up)
setTimeout(resizeCanvas, 0); // Allow fonts/CSS to load
updateInputs();
