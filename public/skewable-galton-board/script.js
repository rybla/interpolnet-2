// Skewable Galton Board Implementation

// Configuration and State
const config = {
  rows: 14,
  pegRadius: 4,
  ballRadius: 3,
  gravity: 0.15,
  bounciness: 0.4,
  friction: 0.98,
  spawnRate: 4, // frames between spawns
  binWidthMultiplier: 2.2,
};

const state = {
  width: 0,
  height: 0,
  skewProbability: 0.5,
  frameCount: 0,
  balls: [],
  pegs: [],
  bins: [],
  maxBallsInBin: 0,
  totalSettled: 0,

  // Theme colors parsed from CSS
  colors: {
    ball: '#ff7b72',
    peg: '#8b949e',
    bin: '#21262d',
    binFill: '#3fb950',
    curve: '#d2a8ff'
  }
};

// DOM Elements
let canvas;
let ctx;
let slider;
let skewValueDisplay;

// Initialization
function init() {
  canvas = document.getElementById('simulation-canvas');
  ctx = canvas.getContext('2d');

  slider = document.getElementById('skew-slider');
  skewValueDisplay = document.getElementById('skew-value');

  // Parse colors if CSS variables are available
  const computedStyle = getComputedStyle(document.body);
  const ballColor = computedStyle.getPropertyValue('--color-ball').trim();
  if (ballColor) {
    state.colors.ball = ballColor;
    state.colors.peg = computedStyle.getPropertyValue('--color-peg').trim();
    state.colors.bin = computedStyle.getPropertyValue('--color-bin').trim();
    state.colors.binFill = computedStyle.getPropertyValue('--color-bin-fill').trim();
    state.colors.curve = computedStyle.getPropertyValue('--color-curve').trim();
  }

  // Setup Event Listeners
  window.addEventListener('resize', handleResize);

  slider.addEventListener('input', (e) => {
    state.skewProbability = parseFloat(e.target.value);
    skewValueDisplay.textContent = state.skewProbability.toFixed(2);
    // Optional: reset bins on skew change to see new distribution immediately
    // resetBins();
  });

  handleResize();
  requestAnimationFrame(loop);
}

function handleResize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width;
  canvas.height = state.height;

  generateBoard();
}

function resetBins() {
  for (let b of state.bins) {
    b.count = 0;
  }
  state.maxBallsInBin = 0;
  state.totalSettled = 0;
  // Clear balls that haven't settled yet
  state.balls = [];
}

function generateBoard() {
  state.pegs = [];
  state.bins = [];

  const verticalSpacing = Math.min((state.height * 0.6) / config.rows, 40);
  const horizontalSpacing = verticalSpacing * Math.sqrt(3) / 2; // Equilateral triangle

  const startY = state.height * 0.15;
  const centerX = state.width / 2;

  // Generate Pegs
  for (let row = 0; row < config.rows; row++) {
    const numPegsInRow = row + 1;
    const rowWidth = (numPegsInRow - 1) * horizontalSpacing;
    const startX = centerX - rowWidth / 2;

    for (let col = 0; col < numPegsInRow; col++) {
      state.pegs.push({
        x: startX + col * horizontalSpacing,
        y: startY + row * verticalSpacing
      });
    }
  }

  // Generate Bins
  const numBins = config.rows + 1;
  const binWidth = horizontalSpacing;
  const binsRowWidth = numBins * binWidth;
  const binsStartX = centerX - binsRowWidth / 2;
  const binTopY = startY + config.rows * verticalSpacing;
  const binBottomY = state.height - 20;

  for (let i = 0; i < numBins; i++) {
    state.bins.push({
      x: binsStartX + i * binWidth,
      y: binTopY,
      width: binWidth,
      height: binBottomY - binTopY,
      count: 0
    });
  }
}

function spawnBall() {
  const centerX = state.width / 2;
  const startY = state.height * 0.15 - 40;

  // Small random offset to prevent exact stacking
  const offsetX = (Math.random() - 0.5) * config.pegRadius;

  state.balls.push({
    x: centerX + offsetX,
    y: startY,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
    settled: false
  });
}

// Math Utility: Calculate binomial coefficient C(n, k)
function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = c * (n - i) / (i + 1);
  }
  return c;
}

// Main Update Loop
function update() {
  state.frameCount++;

  if (state.frameCount % config.spawnRate === 0) {
    spawnBall();
  }

  // Maximum balls to keep in memory to prevent lag
  if (state.balls.length > 500) {
    state.balls.shift();
  }

  const activeBalls = [];

  for (let i = 0; i < state.balls.length; i++) {
    let ball = state.balls[i];

    if (ball.settled) continue;

    // Gravity
    ball.vy += config.gravity;

    // Friction
    ball.vx *= config.friction;
    ball.vy *= config.friction;

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Peg Collisions
    for (let j = 0; j < state.pegs.length; j++) {
      let peg = state.pegs[j];

      let dx = ball.x - peg.x;
      let dy = ball.y - peg.y;
      let distSq = dx * dx + dy * dy;
      let minDist = config.ballRadius + config.pegRadius;

      if (distSq < minDist * minDist) {
        let dist = Math.sqrt(distSq);

        // Resolve penetration
        let overlap = minDist - dist;
        let nx = dx / dist;
        let ny = dy / dist;

        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // Calculate bounce vector
        let dotProduct = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dotProduct * nx * config.bounciness;
        ball.vy -= 2 * dotProduct * ny * config.bounciness;

        // --- SKEW LOGIC ---
        // If hitting near the top of a peg, bias the horizontal velocity
        // based on the slider probability.
        if (ny < -0.5) {
            // Add a horizontal kick based on probability
            if (Math.random() < state.skewProbability) {
               // Push right
               ball.vx += 0.5 + Math.random() * 0.5;
            } else {
               // Push left
               ball.vx -= 0.5 + Math.random() * 0.5;
            }
        }
      }
    }

    // Check if entered a bin
    let inBin = false;
    if (ball.y > state.bins[0].y) {
       for(let b=0; b < state.bins.length; b++) {
           let bin = state.bins[b];
           if (ball.x >= bin.x && ball.x < bin.x + bin.width) {
               bin.count++;
               state.totalSettled++;
               if (bin.count > state.maxBallsInBin) {
                   state.maxBallsInBin = bin.count;
               }
               ball.settled = true;
               inBin = true;
               break;
           }
       }
       // Catch balls that fall off edges
       if (!inBin) {
          ball.settled = true;
       }
    }

    if (!ball.settled) {
        activeBalls.push(ball);
    }
  }

  state.balls = activeBalls;
}

// Rendering
function draw() {
  ctx.clearRect(0, 0, state.width, state.height);

  // Draw Pegs
  ctx.fillStyle = state.colors.peg;
  for (let i = 0; i < state.pegs.length; i++) {
    ctx.beginPath();
    ctx.arc(state.pegs[i].x, state.pegs[i].y, config.pegRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Bins
  ctx.strokeStyle = state.colors.bin;
  ctx.lineWidth = 2;
  for (let i = 0; i < state.bins.length; i++) {
    let bin = state.bins[i];

    // Draw bin dividers
    ctx.beginPath();
    ctx.moveTo(bin.x, bin.y);
    ctx.lineTo(bin.x, bin.y + bin.height);
    ctx.stroke();

    // Last right wall
    if (i === state.bins.length - 1) {
        ctx.beginPath();
        ctx.moveTo(bin.x + bin.width, bin.y);
        ctx.lineTo(bin.x + bin.width, bin.y + bin.height);
        ctx.stroke();
    }

    // Draw accumulated balls representation
    if (bin.count > 0) {
        ctx.fillStyle = state.colors.binFill;
        // Scale fill height based on max balls, but cap at bin height
        let fillHeight = (bin.count / Math.max(state.maxBallsInBin, 1)) * (bin.height * 0.8);
        ctx.fillRect(bin.x + 1, bin.y + bin.height - fillHeight, bin.width - 2, fillHeight);
    }
  }

  // Draw active Balls
  ctx.fillStyle = state.colors.ball;
  for (let i = 0; i < state.balls.length; i++) {
    ctx.beginPath();
    ctx.arc(state.balls[i].x, state.balls[i].y, config.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Theoretical Distribution Curve
  if (state.totalSettled > 10) {
      drawTheoreticalCurve();
  }
}

function drawTheoreticalCurve() {
    const n = config.rows;
    const p = state.skewProbability;

    ctx.strokeStyle = state.colors.curve;
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let k = 0; k <= n; k++) {
        // Binomial probability formula: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
        const prob = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);

        // Expected number of balls in this bin
        const expectedCount = prob * state.totalSettled;

        const bin = state.bins[k];
        if (!bin) continue;

        const x = bin.x + bin.width / 2;
        // Map expected count to vertical scale relative to actual max balls
        const scaledHeight = (expectedCount / Math.max(state.maxBallsInBin, 1)) * (bin.height * 0.8);
        const y = bin.y + bin.height - scaledHeight;

        if (k === 0) {
            ctx.moveTo(x, y);
        } else {
            // Bezier curve for smoother look
            const prevBin = state.bins[k-1];
            const prevProb = combinations(n, k-1) * Math.pow(p, k-1) * Math.pow(1 - p, n - (k-1));
            const prevExpected = prevProb * state.totalSettled;
            const prevScaledHeight = (prevExpected / Math.max(state.maxBallsInBin, 1)) * (prevBin.height * 0.8);

            const prevX = prevBin.x + prevBin.width / 2;
            const prevY = prevBin.y + prevBin.height - prevScaledHeight;

            const cpX = (prevX + x) / 2;

            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
    }
    ctx.stroke();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start simulation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
