const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const probDisplay = document.getElementById("prob-display");

let width, height;

let probabilityRight = 0.5; // 0.0 to 1.0

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  initBoard();
}

window.addEventListener("resize", resize);

// User interaction: Skew probability
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;

  // Calculate skew based on x position relative to canvas width
  probabilityRight = x / width;

  // Clamp to 0.1 - 0.9 to avoid balls getting completely stuck on edges
  probabilityRight = Math.max(0.1, Math.min(0.9, probabilityRight));

  probDisplay.textContent = Math.round(probabilityRight * 100) + "%";
});


let pegs = [];
let bins = [];
let binWalls = [];
let balls = [];
const numRows = 15;
const pegRadius = 4;
const ballRadius = 3;

function initBoard() {
  pegs = [];
  bins = [];
  binWalls = [];
  balls = []; // Reset balls on resize

  const startY = height * 0.15;
  const rowHeight = (height * 0.5) / numRows;

  // Create Pegs
  for (let i = 0; i < numRows; i++) {
    const numPegsInRow = i + 1;
    const y = startY + i * rowHeight;
    const spacing = width / (numRows + 1);

    // Center the row
    const rowWidth = (numPegsInRow - 1) * spacing;
    const startX = (width - rowWidth) / 2;

    for (let j = 0; j < numPegsInRow; j++) {
      pegs.push({
        x: startX + j * spacing,
        y: y,
        r: pegRadius
      });
    }
  }

  // Create Bins
  const numBins = numRows + 1;
  const binWidth = width / numBins;
  const binStartY = startY + (numRows) * rowHeight;
  const binHeight = height - binStartY;

  // Init bins
  for (let i = 0; i < numBins; i++) {
    bins.push({
      x: i * binWidth,
      y: binStartY,
      w: binWidth,
      h: binHeight,
      count: 0
    });

    // Bin walls
    if (i > 0) {
        binWalls.push({
            x: i * binWidth,
            y: binStartY,
            w: 2,
            h: binHeight
        });
    }
  }
}

const gravity = 0.15;
const dampening = 0.6; // Bounciness
const timeStep = 1.0;
let lastSpawn = 0;
const spawnRate = 5; // Frames between spawns

function spawnBall() {
  const variation = (Math.random() - 0.5) * 5;
  balls.push({
    x: width / 2 + variation,
    y: 0,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
    r: ballRadius,
    settled: false,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`
  });
}

function updatePhysics() {
  lastSpawn++;
  if (lastSpawn > spawnRate && balls.length < 500) {
    spawnBall();
    lastSpawn = 0;
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];

    if (b.settled) continue;

    b.vy += gravity * timeStep;
    b.x += b.vx * timeStep;
    b.y += b.vy * timeStep;

    // Boundary constraints (Walls)
    if (b.x - b.r < 0) { b.x = b.r; b.vx *= -dampening; }
    if (b.x + b.r > width) { b.x = width - b.r; b.vx *= -dampening; }

    // Peg collisions
    for (let p of pegs) {
      let dx = b.x - p.x;
      let dy = b.y - p.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < b.r + p.r) {
        // Resolve collision
        let nx = dx / dist;
        let ny = dy / dist;

        // Force a left/right bounce based on probability skew
        // If coming directly from above, override pure elastic bounce
        if (Math.abs(nx) < 0.2) {
             const bounceDir = Math.random() < probabilityRight ? 1 : -1;
             nx = bounceDir * 0.8;
             ny = -0.6;
             // Normalize again
             let mag = Math.sqrt(nx*nx + ny*ny);
             nx /= mag;
             ny /= mag;
        }

        let p_val = 2 * (b.vx * nx + b.vy * ny);

        b.vx -= p_val * nx;
        b.vy -= p_val * ny;

        b.vx *= dampening;
        b.vy *= dampening;

        // Push out of peg
        let overlap = b.r + p.r - dist;
        b.x += nx * overlap;
        b.y += ny * overlap;
      }
    }

    // Bin wall collisions
    for (let w of binWalls) {
        // Simple AABB vs Circle
        let testX = b.x;
        let testY = b.y;

        if (b.x < w.x) testX = w.x; else if (b.x > w.x + w.w) testX = w.x + w.w;
        if (b.y < w.y) testY = w.y; else if (b.y > w.y + w.h) testY = w.y + w.h;

        let distX = b.x - testX;
        let distY = b.y - testY;
        let distance = Math.sqrt((distX*distX) + (distY*distY));

        if (distance <= b.r) {
             b.vx *= -dampening;
             if(b.x < w.x) {
                b.x = w.x - b.r;
             } else {
                b.x = w.x + w.w + b.r;
             }
        }
    }

    // Settle in Bins / Floor
    if (b.y + b.r > height) {
       b.y = height - b.r;
       b.vy *= -dampening;

       // If moving very slowly, consider it settled
       if (Math.abs(b.vy) < 0.5 && Math.abs(b.vx) < 0.5) {
           b.settled = true;
           b.vy = 0;
           b.vx = 0;

           // Count into bin
           for(let bin of bins) {
               if(b.x >= bin.x && b.x <= bin.x + bin.w) {
                   bin.count++;

                   // Remove actual physics ball and just let the bin render it to save performance
                   balls.splice(i, 1);
                   break;
               }
           }
       }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw Pegs
  ctx.fillStyle = "#4b5563"; // gray-600
  for (let p of pegs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Bin Walls
  ctx.fillStyle = "#374151"; // gray-700
  for (let w of binWalls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }

  // Draw Settled Balls in Bins (as stacks)
  for (let bin of bins) {
      if(bin.count === 0) continue;

      const ballsPerRow = Math.floor(bin.w / (ballRadius * 2));

      // We will draw standard green balls for settled state to form the distribution curve cleanly
      ctx.fillStyle = "#10b981"; // emerald-500

      for(let j=0; j < bin.count; j++) {
          const row = Math.floor(j / ballsPerRow);
          const col = j % ballsPerRow;

          const bx = bin.x + ballRadius + col * (ballRadius * 2);
          const by = height - ballRadius - row * (ballRadius * 2);

          ctx.beginPath();
          ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
          ctx.fill();
      }
  }

  // Draw Falling Balls
  for (let b of balls) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  updatePhysics();
  draw();
  requestAnimationFrame(loop);
}

resize();
loop();
