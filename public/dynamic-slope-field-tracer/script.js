const canvas = document.getElementById('slope-field-canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear-btn');

let width, height;
let time = 0;
let inkDrops = [];

// Configuration
const GRID_SIZE = 40; // Spacing between slope vectors
const VECTOR_LENGTH = 15;
const INK_LIFESPAN = 300; // Frames an ink drop stays active
const TIME_STEP = 0.5; // Step size for numerical integration

// Palette from CSS variables
const colorCyan = '#00f0ff';
const colorMagenta = '#ff003c';
const colorVector = 'rgba(139, 155, 180, 0.4)';

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

// Differential equation: dy/dx = f(x, y, t)
// We add a subtle time dependence to make the field "dynamic"
function f(x, y, t) {
  // Scale down the coordinates so the function variations are visible
  const scaledX = (x - width / 2) * 0.01;
  const scaledY = (y - height / 2) * 0.01;

  // dy/dx = sin(x) + cos(y) + a subtle time oscillation
  return Math.sin(scaledX + t * 0.5) + Math.cos(scaledY);
}

// Convert slope (dy/dx) to an angle in radians
function slopeToAngle(slope) {
  return Math.atan(slope);
}

class InkDrop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.path = [{ x, y }];
    this.age = 0;
    this.active = true;

    // Pick a color based on initial position
    this.color = Math.random() > 0.5 ? colorCyan : colorMagenta;
  }

  update(t) {
    if (!this.active) return;

    // Numerical integration (Euler method)
    const slope = f(this.x, this.y, t);
    const angle = slopeToAngle(slope);

    // Move along the vector
    this.x += Math.cos(angle) * TIME_STEP;
    this.y += Math.sin(angle) * TIME_STEP; // Negative because canvas Y goes down

    this.path.unshift({ x: this.x, y: this.y });

    // Keep path length manageable (shift-register approach)
    if (this.path.length > INK_LIFESPAN) {
      this.path.pop();
    }

    this.age++;
    if (this.age > INK_LIFESPAN * 2) { // Eventually stop tracing
      this.active = false;
    }
  }

  draw(ctx) {
    if (this.path.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      ctx.lineTo(this.path[i].x, this.path[i].y);
    }

    // Fade out older parts of the trail by using globalAlpha or a gradient
    // For simplicity and performance, we draw the whole path and let it fade as it ages
    let alpha = 1.0;
    if (this.age > INK_LIFESPAN) {
       alpha = 1.0 - (this.age - INK_LIFESPAN) / INK_LIFESPAN;
    }

    ctx.strokeStyle = this.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Reset
  }
}

function drawSlopeField(t) {
  ctx.strokeStyle = colorVector;
  ctx.lineWidth = 1;

  for (let x = GRID_SIZE / 2; x < width; x += GRID_SIZE) {
    for (let y = GRID_SIZE / 2; y < height; y += GRID_SIZE) {
      const slope = f(x, y, t);
      const angle = slopeToAngle(slope);

      const dx = Math.cos(angle) * (VECTOR_LENGTH / 2);
      const dy = Math.sin(angle) * (VECTOR_LENGTH / 2);

      ctx.beginPath();
      // Draw a line segment centered at (x, y)
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();

      // Optional: add a tiny arrowhead or just keep it as undirected slope lines
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Time progresses slowly to subtly animate the vector field
  time += 0.02;

  drawSlopeField(time);

  // Update and draw ink drops
  for (let i = inkDrops.length - 1; i >= 0; i--) {
    const drop = inkDrops[i];
    drop.update(time);
    drop.draw(ctx);

    // Remove completely faded drops
    if (!drop.active && drop.age > INK_LIFESPAN * 2) {
      inkDrops.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

// Interactions
function addInkDrop(x, y) {
  inkDrops.push(new InkDrop(x, y));
}

canvas.addEventListener('mousedown', (e) => {
  addInkDrop(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
  for (let i = 0; i < e.touches.length; i++) {
    addInkDrop(e.touches[i].clientX, e.touches[i].clientY);
  }
}, { passive: true });

// Allow dragging to paint drops
canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1) { // Left mouse button pressed
    // Throttle drop creation slightly to avoid too many drops
    if (Math.random() > 0.5) addInkDrop(e.clientX, e.clientY);
  }
});

canvas.addEventListener('touchmove', (e) => {
  for (let i = 0; i < e.touches.length; i++) {
    if (Math.random() > 0.5) addInkDrop(e.touches[i].clientX, e.touches[i].clientY);
  }
}, { passive: true });

clearBtn.addEventListener('click', () => {
  inkDrops = [];
});

// Start animation
animate();
