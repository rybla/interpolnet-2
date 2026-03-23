const canvas = document.getElementById("simulation-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const skewSlider = document.getElementById("skew-slider");
const skewValueDisplay = document.getElementById("skew-value");

// Physical simulation constants
let currentSkewP = 0.5;
const GRAVITY = 0.2;
const BALL_RADIUS = 3;
const PEG_RADIUS = 4;
const RESTITUTION = 0.5; // Bounce energy loss
const BOUNCE_FORCE_X = 2.5; // Horizontal force applied when hitting a peg

// Board Layout Params
let rows = 15;
let spacingX = 24;
let spacingY = 30;
let startY = 60;
let boardWidth = 0;
let boardStartX = 0;

let width = 0;
let height = 0;

// State arrays
let pegs = [];
let balls = [];
let bins = [];
let binWidth = 0;
const BIN_HEIGHT_SCALAR = 4;

// Simulation tuning
const MAX_BALLS = 300;
let frameCount = 0;
let spawnRate = 4; // Spawn a ball every X frames

class Peg {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PEG_RADIUS;
    this.glow = 0; // Visual flash
  }

  draw(ctx) {
    if (this.glow > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + this.glow, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${this.glow / 5})`;
      ctx.fill();
      this.glow *= 0.8;
      if (this.glow < 0.1) this.glow = 0;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5; // Initial tiny horizontal jitter
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.settled = false;
    this.color = `hsl(${210 + Math.random() * 20}, 100%, 65%)`;
  }

  update() {
    if (this.settled) return;

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Boundary constraints (walls)
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -RESTITUTION;
    } else if (this.x > width - this.radius) {
      this.x = width - this.radius;
      this.vx *= -RESTITUTION;
    }

    // Peg Collisions
    for (let i = 0; i < pegs.length; i++) {
      let peg = pegs[i];
      let dx = this.x - peg.x;
      let dy = this.y - peg.y;
      let distSq = dx * dx + dy * dy;
      let minDistSq = (this.radius + peg.radius) * (this.radius + peg.radius);

      if (distSq < minDistSq) {
        let dist = Math.sqrt(distSq);
        // Correct position
        let overlap = (this.radius + peg.radius) - dist;
        this.x += (dx / dist) * overlap;
        this.y += (dy / dist) * overlap;

        // Visual flash on peg
        peg.glow = 4;

        // Apply probabilistic horizontal force, skewed by P
        // If random < p, bounce right, else bounce left
        let direction = Math.random() < currentSkewP ? 1 : -1;

        // Add a bit of natural physics bounce + directed force
        this.vy *= -RESTITUTION;
        this.vx = direction * BOUNCE_FORCE_X + (Math.random() - 0.5) * 0.5;
        break; // Only collide with one peg per frame to prevent sticking
      }
    }

    // Bin collection logic
    if (this.y > height - 100) {
      // Find which bin we are above
      let binIndex = Math.floor((this.x - boardStartX + (spacingX/2)) / spacingX);
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex].count++;
        bins[binIndex].flash = 1;
        this.settled = true;
      } else {
        // Falloff the edge
        if(this.y > height + 50) {
           this.settled = true; // Remove offscreen
        }
      }
    }
  }

  draw(ctx) {
    if (this.settled) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    // Glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function initLayout() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  pegs = [];
  bins = [];

  // Determine board scaling dynamically based on height
  // Leave 100px for bins at bottom, 60px start
  let availableHeight = height - 160;

  // Adjust spacing based on width for mobile
  spacingX = Math.min(24, width / 25);
  spacingY = Math.min(30, availableHeight / rows);

  boardWidth = (rows - 1) * spacingX;
  boardStartX = (width - boardWidth) / 2;

  // Generate Pegs
  for (let row = 0; row < rows; row++) {
    let numPegs = row + 1;
    let rowWidth = (numPegs - 1) * spacingX;
    let rowStartX = (width - rowWidth) / 2;
    let y = startY + row * spacingY;

    for (let col = 0; col < numPegs; col++) {
      pegs.push(new Peg(rowStartX + col * spacingX, y));
    }
  }

  // Generate Bins (+1 more than rows)
  let numBins = rows + 1;
  binWidth = spacingX;
  for (let i = 0; i < numBins; i++) {
    bins.push({ count: 0, flash: 0 });
  }

  // Clear balls on resize
  balls = [];
}

function spawnBall() {
  if (balls.length < MAX_BALLS) {
    balls.push(new Ball(width / 2, startY - spacingY));
  } else {
    // Replace oldest settled or find an active one
    let replaced = false;
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].settled) {
        balls[i] = new Ball(width / 2, startY - spacingY);
        replaced = true;
        break;
      }
    }
    if(!replaced) {
        balls.shift();
        balls.push(new Ball(width / 2, startY - spacingY));
    }
  }
}

function animate() {
  ctx.fillStyle = "#0b0f19";
  ctx.fillRect(0, 0, width, height);

  frameCount++;
  if (frameCount % spawnRate === 0) {
    spawnBall();
  }

  pegs.forEach(peg => peg.draw(ctx));

  balls.forEach(ball => {
    ball.update();
    ball.draw(ctx);
  });

  // Draw Bins
  let numBins = bins.length;
  let binsWidth = (numBins - 1) * spacingX;
  let binsStartX = (width - binsWidth) / 2;

  // Find max count to normalize bin heights if they get too tall
  let maxCount = Math.max(...bins.map(b => b.count), 10);
  let maxHeightPixels = 100;

  for (let i = 0; i < bins.length; i++) {
    let bin = bins[i];
    let binX = binsStartX + i * spacingX - (spacingX / 2);

    // Draw dividers
    ctx.beginPath();
    ctx.moveTo(binX, height - 120);
    ctx.lineTo(binX, height);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Histogram Bar
    let barHeight = (bin.count / maxCount) * maxHeightPixels;
    if (barHeight > 0) {
      ctx.fillStyle = `rgba(59, 130, 246, ${0.4 + (bin.flash * 0.4)})`;
      ctx.fillRect(binX + 2, height - barHeight, spacingX - 4, barHeight);

      // Flash decay
      bin.flash *= 0.9;
      if (bin.flash < 0.01) bin.flash = 0;
    }
  }

  // Final divider
  let finalBinX = binsStartX + bins.length * spacingX - (spacingX / 2);
  ctx.beginPath();
  ctx.moveTo(finalBinX, height - 120);
  ctx.lineTo(finalBinX, height);
  ctx.stroke();

  requestAnimationFrame(animate);
}

// Event Listeners
window.addEventListener("resize", () => {
  initLayout();
});

skewSlider.addEventListener("input", (e) => {
  currentSkewP = parseFloat(e.target.value);
  skewValueDisplay.textContent = currentSkewP.toFixed(2);
});

// Initialization
initLayout();
requestAnimationFrame(animate);
