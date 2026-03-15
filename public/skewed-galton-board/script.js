const canvas = document.getElementById('galton-canvas');
const ctx = canvas.getContext('2d');
const probSlider = document.getElementById('skew-slider');
const probValue = document.getElementById('prob-value');
const resetButton = document.getElementById('reset-button');

let width, height;
let rightProb = parseFloat(probSlider.value);

// Constants
const ROWS = 15;
const PEG_RADIUS = 4;
const BALL_RADIUS = 3;
const BALL_COLOR = '#eab308';
const PEG_COLOR = '#94a3b8';
const BIN_BG = '#334155';
const BIN_FILL = '#3b82f6';
const GRAVITY = 0.5;

let pegs = [];
let bins = [];
let balls = [];
let nextSpawnTime = 0;
const SPAWN_INTERVAL = 3; // frames between ball spawns
let animationId;

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 0;
    this.settled = false;
    this.binIndex = -1;
  }

  update(pegs, binY, binWidth, paddingX) {
    if (this.settled) return;

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Add some damping
    this.vx *= 0.98;
    this.vy *= 0.98;

    // Boundary check
    if (this.x < paddingX + BALL_RADIUS) {
      this.x = paddingX + BALL_RADIUS;
      this.vx *= -0.8;
    } else if (this.x > width - paddingX - BALL_RADIUS) {
      this.x = width - paddingX - BALL_RADIUS;
      this.vx *= -0.8;
    }

    // Check collision with pegs
    for (let peg of pegs) {
      let dx = this.x - peg.x;
      let dy = this.y - peg.y;
      let distSq = dx * dx + dy * dy;
      let minDist = BALL_RADIUS + PEG_RADIUS;

      if (distSq < minDist * minDist) {
        let dist = Math.sqrt(distSq);
        // Ensure distance is not zero
        if (dist === 0) dist = 0.1;

        let nx = dx / dist;
        let ny = dy / dist;

        // Resolve penetration
        let overlap = minDist - dist;
        this.x += nx * overlap;
        this.y += ny * overlap;

        // Reflect velocity with some energy loss
        let dot = this.vx * nx + this.vy * ny;
        this.vx -= 2 * dot * nx;
        this.vy -= 2 * dot * ny;
        this.vx *= 0.6;
        this.vy *= 0.6;

        // Apply skewed probability nudge when near top center of a peg
        if (ny < -0.5) { // Hit top half of peg
            let isMovingRight = Math.random() < rightProb;
            // Nudge horizontally based on probability
            this.vx += isMovingRight ? 2.5 : -2.5;
        }
      }
    }

    // Check if entered bin area
    if (this.y > binY) {
      this.settled = true;
      let binIdx = Math.floor((this.x - paddingX) / binWidth);
      binIdx = Math.max(0, Math.min(ROWS, binIdx)); // ROWS + 1 bins total
      this.binIndex = binIdx;
      bins[binIdx]++;
    }
  }

  draw(ctx) {
    if (this.settled) return; // Don't draw falling balls once in bin
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
    ctx.closePath();
  }
}

function init() {
  const container = canvas.parentElement;
  width = container.clientWidth;
  height = container.clientHeight;

  canvas.width = width;
  canvas.height = height;

  // Setup Geometry
  const topPadding = 40;
  const bottomPadding = 40;
  const sidePadding = 30;
  const boardHeight = height - topPadding - bottomPadding - 100; // 100px for bins

  const pegSpacingY = boardHeight / ROWS;
  const maxRowWidth = width - 2 * sidePadding;
  const pegSpacingX = Math.min(pegSpacingY * 1.5, maxRowWidth / (ROWS + 1));

  pegs = [];
  for (let row = 0; row < ROWS; row++) {
    const numPegs = row + 1;
    const y = topPadding + row * pegSpacingY;
    const rowWidth = numPegs * pegSpacingX;
    const startX = width / 2 - rowWidth / 2 + pegSpacingX / 2;

    for (let col = 0; col < numPegs; col++) {
      pegs.push({
        x: startX + col * pegSpacingX,
        y: y
      });
    }
  }

  // Setup Bins
  bins = new Array(ROWS + 1).fill(0);
  balls = [];
}

function update() {
  nextSpawnTime--;
  if (nextSpawnTime <= 0) {
    balls.push(new Ball(width / 2 + (Math.random() - 0.5) * 5, 10));
    nextSpawnTime = SPAWN_INTERVAL;
  }

  // Limit max balls to prevent memory leak
  if (balls.length > 2500) {
    balls = balls.filter(b => !b.settled); // Keep falling balls
    // If still too many (rare), just drop oldest
    if (balls.length > 1500) {
        balls.splice(0, balls.length - 1500);
    }
  }

  const binY = height - 100;
  const sidePadding = 30;
  const boardWidth = width - 2 * sidePadding;
  const binWidth = boardWidth / (ROWS + 1);

  for (let i = balls.length - 1; i >= 0; i--) {
      balls[i].update(pegs, binY, binWidth, sidePadding);
      if (balls[i].settled) {
          // Remove from active balls array to save performance
          balls.splice(i, 1);
      }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Draw Pegs
  ctx.fillStyle = PEG_COLOR;
  for (let peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // Draw Balls
  for (let ball of balls) {
    ball.draw(ctx);
  }

  // Draw Bins
  const binHeight = 100;
  const binY = height - binHeight;
  const sidePadding = 30;
  const boardWidth = width - 2 * sidePadding;
  const binWidth = boardWidth / (ROWS + 1);

  let maxCount = Math.max(...bins, 10); // scale height based on max count

  for (let i = 0; i < bins.length; i++) {
    const x = sidePadding + i * binWidth;

    // Draw bin background/separator
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, binY, binWidth, binHeight);

    // Draw bin fill
    const count = bins[i];
    if (count > 0) {
        const fillHeight = (count / maxCount) * (binHeight - 5);
        ctx.fillStyle = BIN_FILL;
        ctx.fillRect(x + 1, height - fillHeight, binWidth - 2, fillHeight);
    }
  }
}

function loop() {
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

// Event Listeners
probSlider.addEventListener('input', (e) => {
  rightProb = parseFloat(e.target.value);
  probValue.textContent = rightProb.toFixed(2);
});

resetButton.addEventListener('click', () => {
  bins.fill(0);
  balls = [];
});

window.addEventListener('resize', () => {
  init();
});

// Start
init();
loop();
