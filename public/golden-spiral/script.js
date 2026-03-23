const canvas = document.getElementById("spiral-canvas");
const ctx = canvas.getContext("2d");

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener("resize", resize);
resize();

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

let startTime = null;
const DURATION_PER_SQUARE = 1000; // 1 second per square

function draw(timestamp) {
  if (!startTime) startTime = timestamp;
  let elapsed = timestamp - startTime;

  const MAX_SQUARES = 16;
  const maxTime = MAX_SQUARES * DURATION_PER_SQUARE;
  if (elapsed > maxTime) {
      elapsed = maxTime;
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  ctx.save();

  // Base size of the first square
  let L = Math.min(width * 0.8 / phi, height * 0.8);

  // Center the initial golden rectangle (width: L * phi, height: L)
  ctx.translate(width / 2 - (L * phi) / 2, height / 2 - L / 2);

  const numSquares = Math.floor(elapsed / DURATION_PER_SQUARE);
  const currentSquareProgress = (elapsed % DURATION_PER_SQUARE) / DURATION_PER_SQUARE;

  let currentL = L;
  for (let i = 0; i <= numSquares && i < MAX_SQUARES; i++) {
    let progress = 1;
    if (i === numSquares) {
      progress = currentSquareProgress;
    }

    ctx.beginPath();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)"; // Dim golden for square
    ctx.lineWidth = 1;

    if (progress < 1) {
        // Draw partial square perimeter
        const p = progress * 4;
        ctx.moveTo(0, 0);
        if (p > 0) ctx.lineTo(Math.min(p, 1) * currentL, 0);
        if (p > 1) {
            ctx.lineTo(currentL, 0);
            ctx.lineTo(currentL, Math.min(p - 1, 1) * currentL);
        }
        if (p > 2) {
            ctx.lineTo(currentL, currentL); // Right side
            ctx.lineTo(currentL - Math.min(p - 2, 1) * currentL, currentL); // Bottom side
        }
        if (p > 3) {
            ctx.lineTo(0, currentL);
            ctx.lineTo(0, currentL - Math.min(p - 3, 1) * currentL); // Left side
        }
    } else {
        ctx.rect(0, 0, currentL, currentL);
    }
    ctx.stroke();

    // Draw spiral arc
    if (progress > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#d4af37"; // Bright golden for spiral
        ctx.lineWidth = 2;

        ctx.arc(currentL, currentL, currentL, Math.PI, Math.PI + (Math.PI / 2) * progress);
        ctx.stroke();
    }

    // Move to next square's origin and rotate
    // A standard golden spiral works by appending squares in a counter-clockwise or clockwise direction.
    // If the first square is at (0,0) and the rectangle is wide (L * phi, L), the remaining part is (currentL, 0) to (currentL * phi, currentL).
    // The next square is (currentL, 0) to (currentL + currentL/phi, currentL/phi).
    // To draw it using the same code, we translate the origin to (currentL + currentL/phi, 0) and rotate 90 degrees clockwise (Math.PI/2).
    // Wait, let's trace:
    // Old Origin: (0,0). Old Square: (0,0) to (L,L).
    // New Origin: (L + L/phi, 0).
    // New X-axis points DOWN (old +Y). New Y-axis points LEFT (old -X).
    // New Square: from New(0,0) to New(L/phi, L/phi).
    // In old coords: X = (L + L/phi) - (L/phi) = L. Y = 0 + (L/phi) = L/phi.
    // This perfectly covers the top part of the remaining rectangle!

    let nextL = currentL / phi;

    ctx.translate(currentL + nextL, 0);
    ctx.rotate(Math.PI / 2);

    currentL = nextL;
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);