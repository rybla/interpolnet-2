const canvas = document.getElementById("slope-canvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("canvas-container");

let width, height;
let drops = [];

// Differential equation: dy/dx = f(x, y)
function f(x, y) {
  return Math.sin(x) * Math.cos(y);
}

// Map screen coordinates to math coordinates
const scale = 50; // pixels per unit
let offsetX = 0;
let offsetY = 0;

function screenToMath(sx, sy) {
  return {
    x: (sx - offsetX) / scale,
    y: -(sy - offsetY) / scale,
  };
}

function mathToScreen(mx, my) {
  return {
    x: mx * scale + offsetX,
    y: -my * scale + offsetY,
  };
}

function resize() {
  width = container.clientWidth;
  height = container.clientHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  offsetX = width / 2;
  offsetY = height / 2;

  drawSlopeField();
}

function drawSlopeField() {
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--field-color').trim() || '#475569';
  ctx.lineWidth = 1.5;

  const segmentLength = 15;
  const spacing = 30;

  for (let sx = 0; sx < width; sx += spacing) {
    for (let sy = 0; sy < height; sy += spacing) {
      const { x, y } = screenToMath(sx, sy);
      const slope = f(x, y);

      const angle = Math.atan(slope);

      const dx = Math.cos(angle) * segmentLength / 2;
      const dy = -Math.sin(angle) * segmentLength / 2; // Invert y for canvas

      ctx.beginPath();
      ctx.moveTo(sx - dx, sy - dy);
      ctx.lineTo(sx + dx, sy + dy);
      ctx.stroke();
    }
  }
}

function drawDrops() {
  for (const drop of drops) {
    if (drop.path.length < 2) continue;

    ctx.strokeStyle = drop.color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const startPt = mathToScreen(drop.path[0].x, drop.path[0].y);
    ctx.moveTo(startPt.x, startPt.y);

    for (let i = 1; i < drop.path.length; i++) {
      const pt = mathToScreen(drop.path[i].x, drop.path[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Draw the "drop" head
    const lastPt = mathToScreen(drop.path[drop.path.length - 1].x, drop.path[drop.path.length - 1].y);
    ctx.fillStyle = drop.color;
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateDrops() {
  const dt = 0.05; // Time step
  const maxPathLength = 200;

  for (const drop of drops) {
    if (!drop.active) continue;

    const lastPt = drop.path[drop.path.length - 1];
    let { x, y } = lastPt;

    // Runge-Kutta 4th Order (RK4) integration for better accuracy
    const k1y = f(x, y);
    const k2y = f(x + dt / 2, y + k1y * dt / 2);
    const k3y = f(x + dt / 2, y + k2y * dt / 2);
    const k4y = f(x + dt, y + k3y * dt);

    const slope = (k1y + 2 * k2y + 2 * k3y + k4y) / 6;

    // Determine direction based on x increment. We want the drop to flow along the curve.
    // If we just use slope, we might get stuck if dy/dx is steep.
    // Instead, let's normalize the vector (1, slope) and scale by a fixed speed.
    const speed = 2.0;

    // A little tricky: dy/dx is the slope. The angle is atan(slope).
    // We can just move along the angle.
    const angle = Math.atan(slope);

    // However, f(x, y) might mean we should move right, or left? Standard slope fields
    // don't have a specific "direction" of time, they are just lines.
    // We'll just trace to the right (positive x).
    const nx = x + speed * dt * Math.cos(angle);
    const ny = y + speed * dt * Math.sin(angle);

    drop.path.push({ x: nx, y: ny });

    if (drop.path.length > maxPathLength) {
      drop.active = false; // Stop tracing to avoid infinite memory
    }

    // Stop if it goes out of bounds
    const screenPt = mathToScreen(nx, ny);
    if (screenPt.x < 0 || screenPt.x > width || screenPt.y < 0 || screenPt.y > height) {
      drop.active = false;
    }
  }
}

function animate() {
  drawSlopeField();
  updateDrops();
  drawDrops();
  requestAnimationFrame(animate);
}

function addDrop(sx, sy) {
  const { x, y } = screenToMath(sx, sy);
  const colors = ["#38bdf8", "#fbbf24", "#f87171", "#a78bfa", "#34d399"];
  const color = colors[drops.length % colors.length];

  drops.push({
    path: [{ x, y }],
    color: color,
    active: true,
  });
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  addDrop(x, y);
});

window.addEventListener("resize", resize);
resize();
animate();
