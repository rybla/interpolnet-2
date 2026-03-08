const canvas = document.getElementById('galton-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

// UI Elements
const spawnRateInput = document.getElementById('spawn-rate');
const spawnRateVal = document.getElementById('spawn-rate-val');
const restitutionInput = document.getElementById('restitution');
const restitutionVal = document.getElementById('restitution-val');
const showDistributionInput = document.getElementById('show-distribution');
const showTrailsInput = document.getElementById('show-trails');
const totalDroppedEl = document.getElementById('total-dropped');
const ballsInMotionEl = document.getElementById('balls-in-motion');

const btnDropOne = document.getElementById('btn-drop-one');
const btnDropMany = document.getElementById('btn-drop-many');
const btnClear = document.getElementById('btn-clear');

// Physics Configuration
const gravity = 0.15;
const terminalVelocity = 15;
let restitution = 0.5;
const friction = 0.98;
const ballRadius = 6;
const pegRadius = 4;
const cols = 21; // Odd number so there's a center column
const rows = cols - 1;
const padding = 40;

// Dynamic sizing
let width, height;
let spacingX, spacingY;
let startX, startY;
let binHeight = 200;

// Simulation State
let balls = [];
let pegs = [];
let bins = new Array(cols).fill(0);
let binRects = [];
let totalDropped = 0;
let trails = [];
let dropTimer = 0;
let spawnRate = 20; // Lower is faster (frames between spawns)

// Colors
const COLOR_BG = '#0b0f19';
const COLOR_PEG = '#ff00ff';
const COLOR_BALL = '#00ffcc';
const COLOR_BIN = '#3b4b75';
const COLOR_TEXT = '#e0e6ed';
const COLOR_DIST = 'rgba(255, 204, 0, 0.6)';
const COLOR_TRAIL = 'rgba(0, 255, 204, 0.15)';

// Math Utility: Calculate Binomial Coefficients (Pascal's Triangle row)
function getBinomialRow(n) {
  let row = [1];
  for (let k = 1; k <= n; k++) {
    row.push((row[k - 1] * (n - k + 1)) / k);
  }
  return row;
}

const binomialRow = getBinomialRow(rows);
const maxExpected = Math.max(...binomialRow);

function resize() {
  const wrapper = canvas.parentElement;
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  width = canvas.width;
  height = canvas.height;

  binHeight = height * 0.25;
  spacingY = (height - padding * 2 - binHeight) / rows;
  spacingX = (width - padding * 2) / cols;

  // Keep aspect ratio roughly square-ish for the peg grid
  if (spacingY > spacingX * 1.5) spacingY = spacingX * 1.5;

  startX = width / 2;
  startY = padding;

  initBoard();
}

function initBoard() {
  pegs = [];
  binRects = [];

  // Create Pegs
  for (let row = 0; row < rows; row++) {
    const pegsInRow = row + 1;
    const rowWidth = pegsInRow * spacingX;
    const rowStartX = startX - rowWidth / 2 + spacingX / 2;
    const y = startY + row * spacingY;

    for (let col = 0; col < pegsInRow; col++) {
      const x = rowStartX + col * spacingX;
      pegs.push({ x, y, r: pegRadius });
    }
  }

  // Create Bins
  const bottomY = startY + rows * spacingY;
  const binWidth = spacingX;
  const binsWidth = cols * spacingX;
  const binsStartX = startX - binsWidth / 2;

  for (let i = 0; i < cols; i++) {
    binRects.push({
      x: binsStartX + i * spacingX,
      y: bottomY,
      w: binWidth,
      h: height - bottomY
    });
  }
}

class Ball {
  constructor(x, y) {
    // Add slight random offset to prevent perfect stacking/balancing
    this.x = x + (Math.random() - 0.5);
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = 0;
    this.r = ballRadius;
    this.active = true;
    this.color = COLOR_BALL;
    this.history = [];
    this.binIndex = -1;

    totalDropped++;
    updateStats();
  }

  update() {
    if (!this.active) return;

    if (showTrailsInput.checked && this.history.length % 3 === 0) {
      this.history.push({x: this.x, y: this.y});
    }

    this.vy += gravity;
    if (this.vy > terminalVelocity) this.vy = terminalVelocity;

    this.x += this.vx;
    this.y += this.vy;

    // Apply friction to X movement slightly
    this.vx *= friction;

    this.checkCollisions();
    this.checkBounds();
  }

  checkCollisions() {
    // Peg collisions
    for (let peg of pegs) {
      const dx = this.x - peg.x;
      const dy = this.y - peg.y;
      const distSq = dx * dx + dy * dy;
      const minDist = this.r + peg.r;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Resolve overlap
        const overlap = minDist - dist;
        this.x += nx * overlap;
        this.y += ny * overlap;

        // Reflect velocity with restitution
        const dot = this.vx * nx + this.vy * ny;
        this.vx = (this.vx - 2 * dot * nx) * restitution;
        this.vy = (this.vy - 2 * dot * ny) * restitution;

        // Add random jitter to ensure they fall left/right randomly
        this.vx += (Math.random() - 0.5) * 0.5;
      }
    }

    // Bin wall collisions
    const bottomY = startY + rows * spacingY;
    if (this.y > bottomY - this.r * 2) {
      for (let i = 0; i < binRects.length; i++) {
        const rect = binRects[i];

        // Check vertical walls
        if (this.y > rect.y) {
          if (this.x + this.r > rect.x && this.x - this.r < rect.x) {
            this.x = rect.x - this.r;
            this.vx *= -restitution;
          } else if (this.x - this.r < rect.x + rect.w && this.x + this.r > rect.x + rect.w) {
            this.x = rect.x + rect.w + this.r;
            this.vx *= -restitution;
          }
        }
      }
    }
  }

  checkBounds() {
    // Settled in bin
    if (this.y + this.r > height) {
      this.y = height - this.r;
      this.active = false;
      this.vy = 0;
      this.vx = 0;

      // Determine which bin it fell into
      for (let i = 0; i < binRects.length; i++) {
        const rect = binRects[i];
        if (this.x >= rect.x && this.x < rect.x + rect.w) {
          bins[i]++;
          this.binIndex = i;

          if (showTrailsInput.checked && this.history.length > 0) {
            trails.push([...this.history]);
            if (trails.length > 50) trails.shift(); // Limit stored trails
          }
          break;
        }
      }

      // If it missed all bins (fell off edge), just deactivate
      updateStats();
    }

    // Bounce off side walls
    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx *= -restitution;
    } else if (this.x + this.r > width) {
      this.x = width - this.r;
      this.vx *= -restitution;
    }
  }

  draw() {
    if (!this.active && !showDistributionInput.checked) return; // Optimize drawing when settled

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

function spawnBall() {
  balls.push(new Ball(startX, startY - 20));
}

function spawnMultiple(count) {
  let spawned = 0;
  const interval = setInterval(() => {
    spawnBall();
    spawned++;
    if (spawned >= count) clearInterval(interval);
  }, 20);
}

function updateStats() {
  totalDroppedEl.textContent = totalDropped;
  const activeBalls = balls.filter(b => b.active).length;
  ballsInMotionEl.textContent = activeBalls;
}

function clearBoard() {
  balls = [];
  trails = [];
  bins = new Array(cols).fill(0);
  totalDropped = 0;
  updateStats();
}

function drawBoard() {
  // Clear Background
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, width, height);

  // Draw Trails
  if (showTrailsInput.checked) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLOR_TRAIL;
    for (let t of trails) {
      if (t.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(t[0].x, t[0].y);
      for (let i = 1; i < t.length; i++) {
        ctx.lineTo(t[i].x, t[i].y);
      }
      ctx.stroke();
    }
  }

  // Draw Pegs
  ctx.fillStyle = COLOR_PEG;
  for (let peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // Draw Bin Separators
  ctx.strokeStyle = COLOR_BIN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let rect of binRects) {
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.h);
  }
  // Draw the last right wall
  const lastRect = binRects[binRects.length - 1];
  if(lastRect) {
    ctx.moveTo(lastRect.x + lastRect.w, lastRect.y);
    ctx.lineTo(lastRect.x + lastRect.w, lastRect.y + lastRect.h);
  }
  ctx.stroke();

  // Draw Settled Bin Levels
  const maxBinCount = Math.max(...bins, 1);
  const scaleY = (height - binRects[0].y - 20) / maxBinCount;

  ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
  for (let i = 0; i < cols; i++) {
    if (bins[i] > 0) {
      const rect = binRects[i];
      const h = bins[i] * scaleY;
      ctx.fillRect(rect.x + 2, height - h, rect.w - 4, h);

      // Draw actual count
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bins[i], rect.x + rect.w / 2, height - h - 5);
      ctx.fillStyle = 'rgba(0, 255, 204, 0.5)'; // reset
    }
  }

  // Draw Active Balls
  for (let ball of balls) {
    ball.draw();
  }

  // Draw Theoretical Distribution Overlay
  if (showDistributionInput.checked && totalDropped > 0) {
    ctx.strokeStyle = COLOR_DIST;
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Scale theoretical curve to match the area of dropped balls
    const maxTheoreticalHeight = (maxExpected / Math.pow(2, rows)) * totalDropped * scaleY;
    const peakY = height - maxTheoreticalHeight;

    for (let i = 0; i < cols; i++) {
      const expectedP = binomialRow[i] / Math.pow(2, rows);
      const expectedHeight = expectedP * totalDropped * scaleY;

      const px = binRects[i].x + binRects[i].w / 2;
      const py = height - expectedHeight;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw coefficients
    ctx.fillStyle = COLOR_DIST;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for(let i = 0; i < cols; i++) {
      const px = binRects[i].x + binRects[i].w / 2;
      ctx.save();
      ctx.translate(px, binRects[0].y - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'left';
      ctx.fillText(binomialRow[i], 0, 0);
      ctx.restore();
    }
  }
}

function loop() {
  dropTimer++;
  if (dropTimer >= spawnRate) {
    dropTimer = 0;
    // Keep a reasonable max active ball count to save performance
    if (balls.filter(b => b.active).length < 200) {
      spawnBall();
    }
  }

  // Update physics
  for (let i = 0; i < balls.length; i++) {
    balls[i].update();
  }

  // Cull invisible/settled balls to save memory
  if (balls.length > 1000) {
     balls = balls.filter(b => b.active || Math.random() < 0.1);
  }

  drawBoard();
  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('resize', resize);

spawnRateInput.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  spawnRate = 61 - val; // Invert: higher slider = lower frame delay

  if (val < 20) spawnRateVal.textContent = "Slow";
  else if (val < 40) spawnRateVal.textContent = "Medium";
  else if (val < 55) spawnRateVal.textContent = "Fast";
  else spawnRateVal.textContent = "Max";
});

restitutionInput.addEventListener('input', (e) => {
  restitution = parseFloat(e.target.value);
  restitutionVal.textContent = restitution.toFixed(1);
});

btnDropOne.addEventListener('click', () => spawnBall());
btnDropMany.addEventListener('click', () => spawnMultiple(100));
btnClear.addEventListener('click', clearBoard);

// Init
resize();
loop();
