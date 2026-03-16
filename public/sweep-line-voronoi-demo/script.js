const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");

let width = window.innerWidth * 0.9;
let height = window.innerHeight * 0.9;

if (width > 800) width = 800;
if (height > 800) height = 800;

canvas.width = width;
canvas.height = height;
offCanvas.width = width;
offCanvas.height = height;

let seeds = [];
let sweepY = 0;
let previousBreakpoints = [];
let isAnimating = true;

// Utility functions
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getParabolaY(x, seed, directrixY) {
  const dp = Math.abs(seed.y - directrixY);
  if (dp === 0) return 0; // Focus is on directrix
  return (Math.pow(x - seed.x, 2) / (2 * dp)) + (seed.y + directrixY) / 2;
}

// Evaluate the boundary curve (minimum of all parabolas)
function evaluateBoundaryCurve(directrixY) {
  const points = [];
  const activeSeeds = seeds.filter(s => s.y < directrixY);

  if (activeSeeds.length === 0) return points;

  for (let x = 0; x < width; x++) {
    let minY = Infinity;
    let closestSeed = null;

    for (const seed of activeSeeds) {
      const y = getParabolaY(x, seed, directrixY);
      if (y < minY) {
        minY = y;
        closestSeed = seed;
      }
    }

    if (closestSeed) {
      points.push({ x, y: minY, seed: closestSeed });
    }
  }
  return points;
}

// Find breakpoints (intersections of parabolas)
function findBreakpoints(boundaryPoints) {
  const breakpoints = [];
  if (boundaryPoints.length < 2) return breakpoints;

  let currentSeed = boundaryPoints[0].seed;
  for (let i = 1; i < boundaryPoints.length; i++) {
    if (boundaryPoints[i].seed !== currentSeed) {
      breakpoints.push({ x: boundaryPoints[i].x, y: boundaryPoints[i].y });
      currentSeed = boundaryPoints[i].seed;
    }
  }
  return breakpoints;
}

// Draw the boundary curve
function drawBoundaryCurve(points) {
  if (points.length === 0) return;

  const style = getComputedStyle(document.body);
  ctx.strokeStyle = style.getPropertyValue('--boundary-curve');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

// Draw accumulated edges to off-screen canvas
function drawVoronoiEdges(currentBreakpoints) {
  if (previousBreakpoints.length === 0 || currentBreakpoints.length === 0) return;

  const style = getComputedStyle(document.body);
  offCtx.strokeStyle = style.getPropertyValue('--voronoi-edge');
  offCtx.lineWidth = 1;

  for (const pBP of previousBreakpoints) {
    let closestCurr = null;
    let minDiff = Infinity;

    // Match previous breakpoint with closest current breakpoint to draw edge segment
    for (const cBP of currentBreakpoints) {
      const diff = Math.abs(pBP.x - cBP.x);
      if (diff < minDiff && diff < 10) { // threshold for continuity
        minDiff = diff;
        closestCurr = cBP;
      }
    }

    if (closestCurr) {
      offCtx.beginPath();
      offCtx.moveTo(pBP.x, pBP.y);
      offCtx.lineTo(closestCurr.x, closestCurr.y);
      offCtx.stroke();
    }
  }
}

// Draw seeds
function drawSeeds() {
  const style = getComputedStyle(document.body);
  ctx.fillStyle = style.getPropertyValue('--seed-color');

  for (const seed of seeds) {
    ctx.beginPath();
    ctx.arc(seed.x, seed.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw sweep line
function drawSweepLine(y) {
  const style = getComputedStyle(document.body);
  ctx.strokeStyle = style.getPropertyValue('--sweep-line');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
}

function render() {
  if (!isAnimating) return;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw accumulated edges from off-screen canvas
  ctx.drawImage(offCanvas, 0, 0);

  // 2. Calculate and draw boundary curve & update edges
  if (sweepY < height + 100) {
    const boundaryPoints = evaluateBoundaryCurve(sweepY);
    drawBoundaryCurve(boundaryPoints);

    const currentBreakpoints = findBreakpoints(boundaryPoints);
    drawVoronoiEdges(currentBreakpoints);
    previousBreakpoints = currentBreakpoints;

    sweepY += 2; // sweep line speed
  }

  // 3. Draw seeds and sweep line
  drawSeeds();
  drawSweepLine(sweepY);

  requestAnimationFrame(render);
}

// Interactions
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  seeds.push({ x, y });

  // Reset simulation and redraw
  sweepY = 0;
  previousBreakpoints = [];
  offCtx.clearRect(0, 0, width, height);
});

// Resize handler
window.addEventListener('resize', () => {
  let newWidth = window.innerWidth * 0.9;
  let newHeight = window.innerHeight * 0.9;
  if (newWidth > 800) newWidth = 800;
  if (newHeight > 800) newHeight = 800;

  width = newWidth;
  height = newHeight;

  canvas.width = width;
  canvas.height = height;
  offCanvas.width = width;
  offCanvas.height = height;

  // Restart
  sweepY = 0;
  previousBreakpoints = [];
  offCtx.clearRect(0, 0, width, height);
});

// Initial seeds
seeds.push({ x: width * 0.3, y: height * 0.3 });
seeds.push({ x: width * 0.7, y: height * 0.4 });
seeds.push({ x: width * 0.5, y: height * 0.7 });

// Start animation loop
requestAnimationFrame(render);
