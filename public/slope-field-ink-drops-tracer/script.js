const canvas = document.getElementById("slope-field-canvas");
const ctx = canvas.getContext("2d");

let width, height;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// Simulation parameters
const gridSpacing = 30; // pixels between vector segments
const timeStep = 0.5; // Controls the speed of tracing
const maxTrailLength = 100;

// Colors
const bgColor = "#111";
const fieldColor = "#333";
const inkColors = ["#0ff", "#f0f", "#ff0", "#0f0", "#f00"];

class InkDrop {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.trail = [];
  }

  update(t) {
    // Record current position
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > maxTrailLength) {
      this.trail.shift();
    }

    // Mathematical space mapping (origin at center)
    const scale = 50; // pixels per unit
    const mathX = (this.x - width / 2) / scale;
    const mathY = -(this.y - height / 2) / scale; // Invert y for standard math axes

    // Evaluate differential equation: dy/dx = f(x, y, t)
    // Example: dy/dx = sin(x) * cos(y + t)
    const slope = Math.sin(mathX) * Math.cos(mathY + t * 0.5);

    // Vector components (normalized)
    const magnitude = Math.sqrt(1 + slope * slope);
    const dx = 1 / magnitude;
    const dy = slope / magnitude;

    // Move drop
    // Step size in math units, converted back to pixels
    const step = timeStep / scale;

    // We update math coordinates, then convert back
    const newMathX = mathX + dx * step;
    const newMathY = mathY + dy * step;

    this.x = newMathX * scale + width / 2;
    this.y = -newMathY * scale + height / 2;
  }

  draw(ctx) {
    if (this.trail.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y);
    for (let i = 1; i < this.trail.length; i++) {
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
    }

    // Fade out trail
    const alpha = this.trail.length / maxTrailLength;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the "head" (the drop itself)
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

let drops = [];
let time = 0;

function evaluateSlope(mathX, mathY, t) {
  // Same equation as in InkDrop.update
  return Math.sin(mathX) * Math.cos(mathY + t * 0.5);
}

function drawSlopeField() {
  const scale = 50;
  const segmentLength = 10;

  ctx.strokeStyle = fieldColor;
  ctx.lineWidth = 1.5;

  for (let x = 0; x < width; x += gridSpacing) {
    for (let y = 0; y < height; y += gridSpacing) {
      const mathX = (x - width / 2) / scale;
      const mathY = -(y - height / 2) / scale;

      const slope = evaluateSlope(mathX, mathY, time);

      const magnitude = Math.sqrt(1 + slope * slope);
      const dx = (1 / magnitude) * segmentLength;
      // Invert dy for canvas rendering (y goes down)
      const dy = -(slope / magnitude) * segmentLength;

      ctx.beginPath();
      ctx.moveTo(x - dx / 2, y - dy / 2);
      ctx.lineTo(x + dx / 2, y + dy / 2);
      ctx.stroke();
    }
  }
}

function animate() {
  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  drawSlopeField();

  // Update and draw drops
  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];
    drop.update(time);
    drop.draw(ctx);

    // Remove drops that go way off screen
    if (
      drop.x < -100 ||
      drop.x > width + 100 ||
      drop.y < -100 ||
      drop.y > height + 100
    ) {
      drops.splice(i, 1);
    }
  }

  time += 0.02; // Increment time for animated flow
  requestAnimationFrame(animate);
}

// Interaction
let isDragging = false;

function spawnDrop(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);

  if (clientX !== undefined && clientY !== undefined && !isNaN(clientX) && !isNaN(clientY)) {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const color = inkColors[Math.floor(Math.random() * inkColors.length)];
      drops.push(new InkDrop(x, y, color));
  }
}

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  spawnDrop(e);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    // Throttle spawning to avoid too many drops
    if (Math.random() < 0.2) {
      spawnDrop(e);
    }
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

// Touch support
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDragging = true;
    spawnDrop(e);
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (isDragging && Math.random() < 0.2) {
        spawnDrop(e);
    }
});

window.addEventListener("touchend", () => {
    isDragging = false;
});


animate();
