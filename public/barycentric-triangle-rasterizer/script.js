const canvas = document.getElementById('rasterizerCanvas');
const ctx = canvas.getContext('2d');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const currentPixelSpan = document.getElementById('currentPixel');

let width, height;

let vertices = [
  { x: 100, y: 100, color: [255, 0, 0], drag: false },     // Red
  { x: 500, y: 150, color: [0, 255, 0], drag: false },     // Green
  { x: 300, y: 500, color: [0, 0, 255], drag: false }      // Blue
];

let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
let currentX = 0;
let currentY = 0;
let isPlaying = false;
let animationId;
let draggedVertex = null;

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  width = container.clientWidth - 32; // padding
  height = container.clientHeight - 32;
  canvas.width = width;
  canvas.height = height;

  // reposition vertices if they are outside
  vertices.forEach(v => {
    v.x = Math.min(Math.max(v.x, 20), width - 20);
    v.y = Math.min(Math.max(v.y, 20), height - 20);
  });

  if (!isPlaying) {
    resetRasterization();
    drawScene();
  }
}

function calculateBounds() {
  bounds.minX = Math.floor(Math.min(vertices[0].x, vertices[1].x, vertices[2].x));
  bounds.maxX = Math.ceil(Math.max(vertices[0].x, vertices[1].x, vertices[2].x));
  bounds.minY = Math.floor(Math.min(vertices[0].y, vertices[1].y, vertices[2].y));
  bounds.maxY = Math.ceil(Math.max(vertices[0].y, vertices[1].y, vertices[2].y));

  bounds.minX = Math.max(0, bounds.minX);
  bounds.maxX = Math.min(width, bounds.maxX);
  bounds.minY = Math.max(0, bounds.minY);
  bounds.maxY = Math.min(height, bounds.maxY);
}

function resetRasterization() {
  calculateBounds();
  currentX = bounds.minX;
  currentY = bounds.minY;
  ctx.clearRect(0, 0, width, height);
  drawGrid();
  drawVertices();
  currentPixelSpan.textContent = "-";
}

function edgeFunction(a, b, c) {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function getBarycentricCoordinates(p, a, b, c) {
  const area = edgeFunction(a, b, c);
  if (Math.abs(area) < 0.0001) return null; // Degenerate triangle

  const w0 = edgeFunction(b, c, p);
  const w1 = edgeFunction(c, a, p);
  const w2 = edgeFunction(a, b, p);

  return {
    alpha: w0 / area,
    beta: w1 / area,
    gamma: w2 / area
  };
}

function interpolateColor(alpha, beta, gamma) {
  const c0 = vertices[0].color;
  const c1 = vertices[1].color;
  const c2 = vertices[2].color;

  const r = Math.round(alpha * c0[0] + beta * c1[0] + gamma * c2[0]);
  const g = Math.round(alpha * c0[1] + beta * c1[1] + gamma * c2[1]);
  const b = Math.round(alpha * c0[2] + beta * c1[2] + gamma * c2[2]);

  return `rgb(${r}, ${g}, ${b})`;
}

function drawGrid() {
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawVertices() {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  ctx.lineTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(vertices[2].x, vertices[2].y);
  ctx.closePath();
  ctx.stroke();

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#888';
  ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  ctx.setLineDash([]);

  vertices.forEach(v => {
    ctx.beginPath();
    ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${v.color[0]}, ${v.color[1]}, ${v.color[2]})`;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawScene() {
  drawVertices();
}

function renderLoop() {
  if (!isPlaying) return;

  const stepsPerFrame = parseInt(speedSlider.value, 10);

  for (let step = 0; step < stepsPerFrame; step++) {
    if (currentY > bounds.maxY) {
      isPlaying = false;
      playPauseBtn.textContent = 'Play';
      return;
    }

    const p = { x: currentX, y: currentY };
    const coords = getBarycentricCoordinates(p, vertices[0], vertices[1], vertices[2]);

    if (coords && coords.alpha >= 0 && coords.beta >= 0 && coords.gamma >= 0) {
      ctx.fillStyle = interpolateColor(coords.alpha, coords.beta, coords.gamma);
      ctx.fillRect(currentX, currentY, 1, 1);
    }

    currentX++;
    if (currentX > bounds.maxX) {
      currentX = bounds.minX;
      currentY++;
    }
  }

  drawVertices();

  if (currentY <= bounds.maxY) {
    currentPixelSpan.textContent = `(${currentX}, ${currentY})`;
  }

  animationId = requestAnimationFrame(renderLoop);
}

function togglePlay() {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
  if (isPlaying) {
    if (currentY > bounds.maxY) {
      resetRasterization();
    }
    animationId = requestAnimationFrame(renderLoop);
  } else {
    cancelAnimationFrame(animationId);
  }
}

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function onPointerDown(e) {
  const pos = getMousePos(e.touches ? e.touches[0] : e);
  draggedVertex = null;
  for (let i = vertices.length - 1; i >= 0; i--) {
    const v = vertices[i];
    const dist = Math.sqrt((pos.x - v.x) ** 2 + (pos.y - v.y) ** 2);
    if (dist < 15) {
      draggedVertex = v;
      v.drag = true;
      break;
    }
  }
}

function onPointerMove(e) {
  if (draggedVertex) {
    const pos = getMousePos(e.touches ? e.touches[0] : e);
    draggedVertex.x = Math.max(0, Math.min(width, pos.x));
    draggedVertex.y = Math.max(0, Math.min(height, pos.y));

    if (isPlaying) togglePlay();
    resetRasterization();
  } else {
    const pos = getMousePos(e.touches ? e.touches[0] : e);
    let hovering = false;
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      if (Math.sqrt((pos.x - v.x) ** 2 + (pos.y - v.y) ** 2) < 15) {
        hovering = true;
        break;
      }
    }
    canvas.style.cursor = hovering ? 'pointer' : 'crosshair';
  }
}

function onPointerUp(e) {
  if (draggedVertex) {
    draggedVertex.drag = false;
    draggedVertex = null;
  }
}

playPauseBtn.addEventListener('click', togglePlay);
resetBtn.addEventListener('click', () => {
  if (isPlaying) togglePlay();
  resetRasterization();
});

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('mouseleave', onPointerUp);

canvas.addEventListener('touchstart', onPointerDown, { passive: true });
canvas.addEventListener('touchmove', onPointerMove, { passive: true });
canvas.addEventListener('touchend', onPointerUp);

window.addEventListener('resize', resizeCanvas);

// Init
resizeCanvas();
resetRasterization();
