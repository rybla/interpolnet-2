const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');

const btnToggle = document.getElementById('btn-toggle');
const btnReset = document.getElementById('btn-reset');
const dropRateInput = document.getElementById('drop-rate');
const statDropped = document.getElementById('stat-dropped');

let width, height;
let isPlaying = true;
let dropRate = 5;
let frameCount = 0;
let totalDropped = 0;

// Physics constants
const GRAVITY = 0.2;
const RESTITUTION = 0.4;
const PEG_RADIUS = 4;
const BALL_RADIUS = 3.5;
const BALL_MASS = 1;
const MINIMUM_LIMIT = 0.01;

// Board setup
const ROWS = 16;
const PEG_SPACING_X = 24;
const PEG_SPACING_Y = 24;
const BIN_HEIGHT = 200;

let pegs = [];
let balls = [];
let bins = [];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  initBoard();
}

function initBoard() {
  pegs = [];
  balls = [];
  bins = [];
  totalDropped = 0;
  statDropped.textContent = '0';

  const startY = 100;

  // Create pegs
  for (let row = 0; row < ROWS; row++) {
    const numCols = row + 1;
    const startX = width / 2 - ((numCols - 1) * PEG_SPACING_X) / 2;
    for (let col = 0; col < numCols; col++) {
      pegs.push({
        x: startX + col * PEG_SPACING_X,
        y: startY + row * PEG_SPACING_Y,
        r: PEG_RADIUS
      });
    }
  }

  // Create bins
  const lastRow = ROWS;
  const numBins = ROWS + 1;
  const startX = width / 2 - ((ROWS) * PEG_SPACING_X) / 2;
  const binY = startY + ROWS * PEG_SPACING_Y;

  for (let i = 0; i < numBins; i++) {
    bins.push({
      x: startX + i * PEG_SPACING_X,
      y: binY,
      width: PEG_SPACING_X,
      height: Math.max(BIN_HEIGHT, height - binY),
      count: 0
    });
  }
}

function spawnBall() {
  balls.push({
    x: width / 2 + (Math.random() - 0.5) * 2, // Slight jitter to prevent perfect balance
    y: 20,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
    r: BALL_RADIUS,
    mass: BALL_MASS,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    settled: false
  });
  totalDropped++;
  statDropped.textContent = totalDropped;
}

function updatePhysics() {
  const dt = 1;

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    if (ball.settled) continue;

    // Gravity
    ball.vy += GRAVITY;

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Peg Collisions
    for (const peg of pegs) {
      const dx = ball.x - peg.x;
      const dy = ball.y - peg.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball.r + peg.r;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Resolve penetration
        const p = minDist - dist;
        ball.x += nx * p;
        ball.y += ny * p;

        // Reflect velocity
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= (1 + RESTITUTION) * dot * nx;
        ball.vy -= (1 + RESTITUTION) * dot * ny;
      }
    }

    // Bin Floor Collision
    const lowestY = bins.length > 0 ? bins[0].y + bins[0].height : height;
    if (ball.y + ball.r > lowestY) {
      ball.y = lowestY - ball.r;
      ball.vy *= -RESTITUTION;
      ball.vx *= 0.5; // Friction
      if (Math.abs(ball.vy) < 0.5 && Math.abs(ball.vx) < 0.5) {
        ball.settled = true;
        // Count in bin
        for (const bin of bins) {
          if (ball.x >= bin.x - bin.width/2 && ball.x < bin.x + bin.width/2) {
            bin.count++;
            break;
          }
        }
      }
    }

    // Bin Wall Collisions
    for (const bin of bins) {
      const wallX = bin.x - bin.width/2;
      if (ball.y > bin.y) {
        if (Math.abs(ball.x - wallX) < ball.r) {
          ball.x = ball.x < wallX ? wallX - ball.r : wallX + ball.r;
          ball.vx *= -RESTITUTION;
        }
      }
    }
    // Also check last wall
    if (bins.length > 0) {
      const lastBin = bins[bins.length - 1];
      const wallX = lastBin.x + lastBin.width/2;
      if (ball.y > lastBin.y) {
         if (Math.abs(ball.x - wallX) < ball.r) {
           ball.x = ball.x < wallX ? wallX - ball.r : wallX + ball.r;
           ball.vx *= -RESTITUTION;
         }
      }
    }

    // Ball-Ball Collisions
    for (let j = i + 1; j < balls.length; j++) {
      const b2 = balls[j];
      const dx = b2.x - ball.x;
      const dy = b2.y - ball.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball.r + b2.r;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(Math.max(distSq, MINIMUM_LIMIT));
        const nx = dx / dist;
        const ny = dy / dist;

        // Resolve penetration
        const p = (minDist - dist) * 0.5;
        ball.x -= nx * p;
        ball.y -= ny * p;
        b2.x += nx * p;
        b2.y += ny * p;

        // Momentum exchange
        const dvx = b2.vx - ball.vx;
        const dvy = b2.vy - ball.vy;
        const dot = dvx * nx + dvy * ny;
        if (dot < 0) {
          const impulse = -(1 + RESTITUTION) * dot * 0.5;
          ball.vx -= nx * impulse;
          ball.vy -= ny * impulse;
          b2.vx += nx * impulse;
          b2.vy += ny * impulse;
        }

        // Wake up settled balls if hit
        if (ball.settled && Math.abs(b2.vy) > 1) ball.settled = false;
        if (b2.settled && Math.abs(ball.vy) > 1) b2.settled = false;
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw pegs
  ctx.fillStyle = '#9ca3af';
  for (const peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw bins
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const bin of bins) {
    const wallX = bin.x - bin.width/2;
    ctx.moveTo(wallX, bin.y);
    ctx.lineTo(wallX, bin.y + bin.height);
  }
  // Last wall
  if (bins.length > 0) {
    const lastBin = bins[bins.length - 1];
    ctx.moveTo(lastBin.x + lastBin.width/2, lastBin.y);
    ctx.lineTo(lastBin.x + lastBin.width/2, lastBin.y + lastBin.height);
  }
  ctx.stroke();

  // Draw balls
  for (const ball of balls) {
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw bin counts
  ctx.fillStyle = '#60a5fa';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  for (const bin of bins) {
    if (bin.count > 0) {
      ctx.fillText(bin.count, bin.x, bin.y + bin.height - 10);
    }
  }
}

function loop() {
  if (isPlaying) {
    frameCount++;
    const framesPerSpawn = Math.max(1, 15 - dropRate);
    if (frameCount % framesPerSpawn === 0) {
      spawnBall();
    }

    // Multiple sub-steps for stability
    const subSteps = 3;
    for(let i=0; i<subSteps; i++) {
        updatePhysics();
    }
  }

  draw();
  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('resize', resize);

btnToggle.addEventListener('click', () => {
  isPlaying = !isPlaying;
  btnToggle.textContent = isPlaying ? 'Pause' : 'Resume';
});

btnReset.addEventListener('click', () => {
  initBoard();
});

dropRateInput.addEventListener('input', (e) => {
  dropRate = parseInt(e.target.value, 10);
});

// Initialization
resize();
requestAnimationFrame(loop);
