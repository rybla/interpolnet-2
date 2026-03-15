const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let width, height;

// Simulation state
let time = 0;
const drops = [];
const maxDrops = 1000;
const fieldResolution = 40; // Pixels per vector cell
let cols, rows;

// Differential equation dy/dx = f(x, y, t)
function getSlope(x, y, t) {
  // Scale down coordinates to make the field interesting
  const sx = x / 100;
  const sy = y / 100;

  // A dynamic field: dy/dx = sin(x) * cos(y + t) + sin(t*0.5)
  const dx = Math.sin(sy + t * 0.5) - Math.cos(sx);
  const dy = Math.cos(sx - t * 0.3) + Math.sin(sy);

  return { dx, dy };
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  cols = Math.ceil(width / fieldResolution) + 1;
  rows = Math.ceil(height / fieldResolution) + 1;
}

window.addEventListener('resize', resize);
resize();

function addDrop(x, y) {
  const hue = (Math.random() * 60 + 200) % 360; // Blueish/cyan hues
  drops.push({
    x,
    y,
    age: 0,
    maxAge: Math.random() * 200 + 100,
    color: `hsl(${hue}, 80%, 60%)`,
    path: [{ x, y }]
  });

  if (drops.length > maxDrops) {
    drops.shift();
  }
}

// Handle interaction
let isPointerDown = false;
let lastPointerX, lastPointerY;

function handlePointerDown(e) {
  isPointerDown = true;
  lastPointerX = e.clientX ?? e.touches[0].clientX;
  lastPointerY = e.clientY ?? e.touches[0].clientY;
  addDrop(lastPointerX, lastPointerY);
}

function handlePointerMove(e) {
  if (!isPointerDown) return;
  const x = e.clientX ?? e.touches[0].clientX;
  const y = e.clientY ?? e.touches[0].clientY;

  // Interpolate to add multiple drops if moving fast
  const dist = Math.hypot(x - lastPointerX, y - lastPointerY);
  const steps = Math.min(Math.ceil(dist / 5), 20); // Limit drops per event

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const ix = lastPointerX + (x - lastPointerX) * t;
    const iy = lastPointerY + (y - lastPointerY) * t;
    addDrop(ix, iy);
  }

  lastPointerX = x;
  lastPointerY = y;
}

function handlePointerUp() {
  isPointerDown = false;
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);

canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
window.addEventListener('touchend', handlePointerUp);

// Add some initial drops
for (let i = 0; i < 20; i++) {
  addDrop(Math.random() * width, Math.random() * height);
}

function drawField() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * fieldResolution - (fieldResolution / 2);
      const cy = r * fieldResolution - (fieldResolution / 2);

      const { dx, dy } = getSlope(cx - width / 2, cy - height / 2, time);

      const len = Math.hypot(dx, dy);
      if (len === 0) continue;

      // Normalize and scale vector
      const vectorLength = fieldResolution * 0.4;
      const nx = (dx / len) * vectorLength;
      const ny = (dy / len) * vectorLength;

      ctx.beginPath();
      ctx.moveTo(cx - nx / 2, cy - ny / 2);
      ctx.lineTo(cx + nx / 2, cy + ny / 2);
      ctx.stroke();

      // Arrow head
      const arrowSize = 3;
      const angle = Math.atan2(ny, nx);
      ctx.beginPath();
      ctx.moveTo(cx + nx / 2, cy + ny / 2);
      ctx.lineTo(
        cx + nx / 2 - arrowSize * Math.cos(angle - Math.PI / 6),
        cy + ny / 2 - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + nx / 2, cy + ny / 2);
      ctx.lineTo(
        cx + nx / 2 - arrowSize * Math.cos(angle + Math.PI / 6),
        cy + ny / 2 - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  }
}

function updateDrops() {
  const dt = 0.5; // Timestep

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];
    drop.age++;

    if (drop.age > drop.maxAge) {
      drops.splice(i, 1);
      continue;
    }

    const { dx, dy } = getSlope(drop.x - width / 2, drop.y - height / 2, time);

    // Euler integration
    drop.x += dx * dt * 10;
    drop.y += dy * dt * 10;

    // Add to path
    drop.path.push({ x: drop.x, y: drop.y });

    // Keep path length reasonable
    if (drop.path.length > 50) {
      drop.path.shift();
    }

    // Remove if out of bounds (with a margin)
    if (drop.x < -100 || drop.x > width + 100 || drop.y < -100 || drop.y > height + 100) {
      drops.splice(i, 1);
    }
  }
}

function drawDrops() {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const drop of drops) {
    if (drop.path.length < 2) continue;

    ctx.strokeStyle = drop.color;

    // Fade out as it ages
    const opacity = 1 - (drop.age / drop.maxAge);
    ctx.globalAlpha = opacity;

    // Draw path
    ctx.beginPath();
    ctx.moveTo(drop.path[0].x, drop.path[0].y);
    for (let i = 1; i < drop.path.length; i++) {
      ctx.lineTo(drop.path[i].x, drop.path[i].y);
    }

    // Thinner path
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw head
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = drop.color;
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}

function loop() {
  // Clear background
  ctx.fillStyle = '#12121e';
  ctx.fillRect(0, 0, width, height);

  time += 0.01;

  drawField();
  updateDrops();
  drawDrops();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
