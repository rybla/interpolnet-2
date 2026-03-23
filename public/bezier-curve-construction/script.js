const canvas = document.getElementById('bezier-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let controlPoints = [];
let grabbedPoint = null;

let globalT = 0;
let direction = 1;
let speed = 0.005;

// Colors
const COLOR_BG = '#1e1e1e';
const COLOR_CP = '#ffffff';
const COLOR_L0 = '#555555'; // Control polygon
const COLOR_L1 = '#4facf7'; // First interpolation
const COLOR_L2 = '#ff00ff'; // Second interpolation
const COLOR_CURVE = '#00ffcc'; // Final curve

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // Initialize control points if empty
  if (controlPoints.length === 0) {
    controlPoints = [
      { x: width * 0.1, y: height * 0.8 },
      { x: width * 0.3, y: height * 0.2 },
      { x: width * 0.7, y: height * 0.2 },
      { x: width * 0.9, y: height * 0.8 },
    ];
  }
}

window.addEventListener('resize', resize);
resize();

function lerp(p0, p1, t) {
  return {
    x: p0.x + (p1.x - p0.x) * t,
    y: p0.y + (p1.y - p0.y) * t,
  };
}

function drawLine(p0, p1, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawPoint(p, color, radius = 6) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawBezierCurveStatic() {
  ctx.beginPath();
  ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
  ctx.bezierCurveTo(
    controlPoints[1].x, controlPoints[1].y,
    controlPoints[2].x, controlPoints[2].y,
    controlPoints[3].x, controlPoints[3].y
  );
  ctx.strokeStyle = COLOR_CURVE;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, width, height);

  // Draw full static curve in background
  drawBezierCurveStatic();

  // Draw control polygon (Level 0)
  for (let i = 0; i < 3; i++) {
    drawLine(controlPoints[i], controlPoints[i+1], COLOR_L0, 2);
  }

  // Draw control points
  controlPoints.forEach(p => drawPoint(p, COLOR_CP, 8));

  // Compute Level 1 interpolations
  const l1_points = [];
  for (let i = 0; i < 3; i++) {
    l1_points.push(lerp(controlPoints[i], controlPoints[i+1], globalT));
  }
  for (let i = 0; i < 2; i++) {
    drawLine(l1_points[i], l1_points[i+1], COLOR_L1, 2);
  }
  l1_points.forEach(p => drawPoint(p, COLOR_L1, 5));

  // Compute Level 2 interpolations
  const l2_points = [];
  for (let i = 0; i < 2; i++) {
    l2_points.push(lerp(l1_points[i], l1_points[i+1], globalT));
  }
  drawLine(l2_points[0], l2_points[1], COLOR_L2, 2);
  l2_points.forEach(p => drawPoint(p, COLOR_L2, 5));

  // Compute Final Point
  const finalPoint = lerp(l2_points[0], l2_points[1], globalT);
  drawPoint(finalPoint, COLOR_CURVE, 10);

  // Highlight the path drawn so far by final point
  ctx.beginPath();
  ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
  for (let t = 0; t <= globalT; t += 0.02) {
      const p1 = lerp(controlPoints[0], controlPoints[1], t);
      const p2 = lerp(controlPoints[1], controlPoints[2], t);
      const p3 = lerp(controlPoints[2], controlPoints[3], t);
      const d1 = lerp(p1, p2, t);
      const d2 = lerp(p2, p3, t);
      const f = lerp(d1, d2, t);
      ctx.lineTo(f.x, f.y);
  }
  ctx.lineTo(finalPoint.x, finalPoint.y);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Update T
  globalT += speed * direction;
  if (globalT > 1) {
    globalT = 1;
    direction = -1;
  } else if (globalT < 0) {
    globalT = 0;
    direction = 1;
  }

  requestAnimationFrame(render);
}

// Interactions
function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left),
    y: (evt.clientY - rect.top)
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const pos = getMousePos(e);
  for (let i = 0; i < controlPoints.length; i++) {
    const p = controlPoints[i];
    const dx = pos.x - p.x;
    const dy = pos.y - p.y;
    if (Math.sqrt(dx*dx + dy*dy) < 20) {
      grabbedPoint = p;
      canvas.setPointerCapture(e.pointerId);
      break;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (grabbedPoint) {
    const pos = getMousePos(e);
    grabbedPoint.x = pos.x;
    grabbedPoint.y = pos.y;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (grabbedPoint) {
    canvas.releasePointerCapture(e.pointerId);
    grabbedPoint = null;
  }
});

// Start loop
requestAnimationFrame(render);
