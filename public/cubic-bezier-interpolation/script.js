
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timeSlider = document.getElementById('time-slider');
const timeValue = document.getElementById('time-value');
const playPauseBtn = document.getElementById('play-pause-btn');

let width, height;
let points = [];
let draggingPoint = null;
let isPlaying = true;
let t = 0;
let animationDir = 1;

// Colors matching the legend
const colorInitial = 'rgba(255, 255, 255, 0.3)';
const colorL1 = '#00ffff';
const colorL2 = '#ff00ff';
const colorCurve = '#ffff00';
const colorPoint = '#ffffff';

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Initialize points if not yet initialized
  if (points.length === 0) {
    const minDim = Math.min(width, height);
    const padding = 100;

    // Default nice-looking bezier curve shape
    points = [
      { x: padding, y: height - padding },
      { x: padding, y: padding },
      { x: width - padding, y: padding },
      { x: width - padding, y: height - padding }
    ];
  }
}

window.addEventListener('resize', resize);
resize();

// Interaction handlers
function getPointerPos(e) {
  if (e.touches) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e) {
  const pos = getPointerPos(e);
  // Find if we clicked on a point
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dx = p.x - pos.x;
    const dy = p.y - pos.y;
    if (dx*dx + dy*dy < 400) { // 20px radius hit area
      draggingPoint = p;
      e.preventDefault();
      return;
    }
  }
}

function onPointerMove(e) {
  if (draggingPoint) {
    const pos = getPointerPos(e);
    draggingPoint.x = pos.x;
    draggingPoint.y = pos.y;
    e.preventDefault();
  }
}

function onPointerUp(e) {
  draggingPoint = null;
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

canvas.addEventListener('touchstart', onPointerDown, {passive: false});
canvas.addEventListener('touchmove', onPointerMove, {passive: false});
window.addEventListener('touchend', onPointerUp);

// UI Logic
playPauseBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
});

timeSlider.addEventListener('input', (e) => {
  t = parseFloat(e.target.value);
  timeValue.textContent = t.toFixed(2);
  isPlaying = false;
  playPauseBtn.textContent = 'Play';
  draw();
});

// Helper: Linear Interpolation
function lerp(p0, p1, t) {
  return {
    x: p0.x + (p1.x - p0.x) * t,
    y: p0.y + (p1.y - p0.y) * t
  };
}

// Drawing Logic
function draw() {
  ctx.clearRect(0, 0, width, height);

  // Update time if playing
  if (isPlaying) {
    t += 0.005 * animationDir;
    if (t >= 1) {
      t = 1;
      animationDir = -1;
    } else if (t <= 0) {
      t = 0;
      animationDir = 1;
    }
    timeSlider.value = t;
    timeValue.textContent = t.toFixed(2);
  }

  // 1. Draw full control polygon
  ctx.strokeStyle = colorInitial;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Draw the 4 control points
  ctx.fillStyle = colorPoint;
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText(`P${i}`, points[i].x + 10, points[i].y - 10);
  }

  // 2. Compute Level 1 Scaffolding
  const l1_0 = lerp(points[0], points[1], t);
  const l1_1 = lerp(points[1], points[2], t);
  const l1_2 = lerp(points[2], points[3], t);

  ctx.strokeStyle = colorL1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(l1_0.x, l1_0.y);
  ctx.lineTo(l1_1.x, l1_1.y);
  ctx.lineTo(l1_2.x, l1_2.y);
  ctx.stroke();

  const drawPoint = (p, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
    ctx.fill();
  };

  drawPoint(l1_0, colorL1);
  drawPoint(l1_1, colorL1);
  drawPoint(l1_2, colorL1);

  // 3. Compute Level 2 Scaffolding
  const l2_0 = lerp(l1_0, l1_1, t);
  const l2_1 = lerp(l1_1, l1_2, t);

  ctx.strokeStyle = colorL2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(l2_0.x, l2_0.y);
  ctx.lineTo(l2_1.x, l2_1.y);
  ctx.stroke();

  drawPoint(l2_0, colorL2);
  drawPoint(l2_1, colorL2);

  // 4. Compute Final Curve Point (Level 3)
  const final_p = lerp(l2_0, l2_1, t);

  // Draw full curve faintly in background
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
  ctx.stroke();

  // Draw curve up to current t
  ctx.strokeStyle = colorCurve;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // Need to compute points along curve up to t
  for (let s = 0; s <= t; s += 0.01) {
    const p01 = lerp(points[0], points[1], s);
    const p12 = lerp(points[1], points[2], s);
    const p23 = lerp(points[2], points[3], s);
    const p012 = lerp(p01, p12, s);
    const p123 = lerp(p12, p23, s);
    const pf = lerp(p012, p123, s);
    ctx.lineTo(pf.x, pf.y);
  }
  ctx.lineTo(final_p.x, final_p.y); // ensure it connects exactly to final_p
  ctx.stroke();

  // Draw the tracing point
  ctx.fillStyle = colorCurve;
  ctx.beginPath();
  ctx.arc(final_p.x, final_p.y, 8, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  requestAnimationFrame(draw);
}

// Initial start
playPauseBtn.textContent = 'Pause';
draw();
