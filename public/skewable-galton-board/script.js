const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('probability-slider');
const sliderValueDisplay = document.getElementById('probability-value');

// Simulation parameters
let probabilityRight = 0.5;
let gravity = 0.15;
let bounceDamping = 0.6;
let ballRadius = 4;
let pegRadius = 3;
let rowCount = 14;
let padding = 50;

// Data structures
let pegs = [];
let bins = [];
let balls = [];
let settledBalls = [];

// Screen scaling
let scale = 1;
let offsetX = 0;
let offsetY = 0;

let lastSpawnTime = 0;
let spawnRate = 200; // ms

function initStructures() {
  pegs = [];
  bins = [];
  balls = [];
  settledBalls = [];

  // Create Pegs
  const startY = 100;
  const rowHeight = 35;
  const colWidth = 35;

  for (let i = 0; i < rowCount; i++) {
    const y = startY + i * rowHeight;
    const pegsInRow = i + 1;
    const startX = -((pegsInRow - 1) * colWidth) / 2;

    for (let j = 0; j < pegsInRow; j++) {
      pegs.push({
        x: startX + j * colWidth,
        y: y,
        r: pegRadius
      });
    }
  }

  // Create Bins
  const lastRowY = startY + (rowCount - 1) * rowHeight;
  const binStartY = lastRowY + rowHeight;
  const binCount = rowCount + 1;
  const startX = -((binCount - 1) * colWidth) / 2;

  for (let i = 0; i < binCount; i++) {
    bins.push({
      x: startX + i * colWidth,
      y: binStartY,
      width: colWidth,
      height: 200, // extend downwards
      count: 0
    });
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Center logic
  offsetX = canvas.width / 2;
  offsetY = 50; // top padding
}

window.addEventListener('resize', resize);

slider.addEventListener('input', (e) => {
  probabilityRight = parseFloat(e.target.value);
  sliderValueDisplay.textContent = probabilityRight.toFixed(2);
  // Optionally reset on change to see new distribution immediately
  // initStructures();
});

function spawnBall() {
  balls.push({
    x: (Math.random() - 0.5) * 4, // slight variation
    y: 0,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
    r: ballRadius
  });
}

function updatePhysics() {
  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];

    // Gravity
    b.vy += gravity;

    // Move
    b.x += b.vx;
    b.y += b.vy;

    // Peg collision
    for (let p of pegs) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < b.r + p.r) {
        // Resolve overlap
        const angle = Math.atan2(dy, dx);
        const overlap = (b.r + p.r) - dist;
        b.x += Math.cos(angle) * overlap;
        b.y += Math.sin(angle) * overlap;

        // Bounce
        // For Galton, we want a more controlled split based on probability
        // If it's hitting roughly from above
        if (dy < 0 && Math.abs(dx) < p.r) {
          const rand = Math.random();
          const force = 1.2;
          if (rand < probabilityRight) {
            b.vx = force + (Math.random()*0.2); // bounce right
          } else {
            b.vx = -force - (Math.random()*0.2); // bounce left
          }
          b.vy *= -bounceDamping;
        } else {
          // Standard bounce for side hits
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = b.vx * nx + b.vy * ny;

          b.vx = (b.vx - 2 * dot * nx) * bounceDamping;
          b.vy = (b.vy - 2 * dot * ny) * bounceDamping;
        }
      }
    }

    // Bin logic
    if (bins.length > 0) {
      const firstBin = bins[0];
      const binTopY = firstBin.y;

      if (b.y > binTopY) {
        // Find which bin
        let foundBin = false;
        for (let j = 0; j < bins.length; j++) {
          let bin = bins[j];
          let leftX = bin.x - bin.width/2;
          let rightX = bin.x + bin.width/2;

          if (b.x > leftX && b.x <= rightX) {
            // Check stacking height
            const stackHeight = bin.count * (b.r * 2);
            if (b.y >= binTopY + bin.height - stackHeight) {
              // Settle
              b.y = binTopY + bin.height - stackHeight - b.r;
              b.vx = 0;
              b.vy = 0;
              bin.count++;
              settledBalls.push(b);
              balls.splice(i, 1);
              foundBin = true;
              break;
            }
          }
        }

        // If it falls out of bounds somehow, remove it
        if (!foundBin && b.y > binTopY + 200) {
           balls.splice(i, 1);
        }
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw pegs
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--peg-color').trim() || '#30363d';
  for (let p of pegs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw bins
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bin-color').trim() || '#21262d';
  ctx.lineWidth = 2;
  for (let b of bins) {
    ctx.beginPath();
    ctx.moveTo(b.x - b.width/2, b.y);
    ctx.lineTo(b.x - b.width/2, b.y + b.height);
    ctx.stroke();
  }
  // Draw last right wall
  if (bins.length > 0) {
    let lastBin = bins[bins.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastBin.x + lastBin.width/2, lastBin.y);
    ctx.lineTo(lastBin.x + lastBin.width/2, lastBin.y + lastBin.height);
    ctx.stroke();
  }

  // Draw balls
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ball-color').trim() || '#ff7b72';
  for (let b of settledBalls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function loop(timestamp) {
  if (timestamp - lastSpawnTime > spawnRate) {
    spawnBall();
    lastSpawnTime = timestamp;
  }

  updatePhysics();
  draw();

  requestAnimationFrame(loop);
}

function init() {
  resize();
  initStructures();
  requestAnimationFrame(loop);
}

// Start simulation once loaded
window.onload = init;
