const canvas = document.getElementById('disk');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

let width, height, radius;
let isDrawing = false;
let startPoint = null;
let currentPoint = null;
let geodesics = [];

// Colors for neon glow effect
const colors = [
  '#00ffcc', // cyan
  '#ff00ff', // magenta
  '#00ccff', // electric blue
  '#ffcc00', // yellow
];

function resizeCanvas() {
  const rect = container.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = width;
  canvas.height = height;
  radius = width / 2;
  render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial setup

// Utility to map pixel coordinates to [-1, 1] normalized hyperbolic coordinates
function pixelToNorm(x, y) {
  const rect = canvas.getBoundingClientRect();
  const px = x - rect.left;
  const py = y - rect.top;

  const normX = (px - radius) / radius;
  // Invert Y axis to match Cartesian plane for math
  const normY = -(py - radius) / radius;

  return { x: normX, y: normY };
}

// Map normalized coordinates back to canvas pixels
function normToPixel(x, y) {
  const px = x * radius + radius;
  const py = -y * radius + radius;
  return { x: px, y: py };
}

// Calculate the center and radius of the orthogonal circle given two points in the unit disk
function calculateGeodesic(p1, p2) {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;

  const d1 = x1 * x1 + y1 * y1 + 1;
  const d2 = x2 * x2 + y2 * y2 + 1;

  // System of equations:
  // 2 * cx * x1 + 2 * cy * y1 = d1
  // 2 * cx * x2 + 2 * cy * y2 = d2

  // Using Cramer's rule to solve for cx and cy
  const denominator = 2 * (x1 * y2 - x2 * y1);

  if (Math.abs(denominator) < 1e-6) {
    // Points are collinear with origin, drawing a straight Euclidean line
    return { isLine: true, p1: p1, p2: p2 };
  }

  const cx = (d1 * y2 - d2 * y1) / denominator;
  const cy = (x1 * d2 - x2 * d1) / denominator;

  const R = Math.sqrt(cx * cx + cy * cy - 1);

  return { isLine: false, cx: cx, cy: cy, r: R };
}

function drawLine(ctx, line, color) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  // Set glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  if (line.isLine) {
    const px1 = normToPixel(line.p1.x, line.p1.y);
    const px2 = normToPixel(line.p2.x, line.p2.y);

    // Extend the line to the boundary of the unit circle if it's a straight line through origin
    const angle = Math.atan2(line.p2.y - line.p1.y, line.p2.x - line.p1.x);
    const startX = -Math.cos(angle);
    const startY = -Math.sin(angle);
    const endX = Math.cos(angle);
    const endY = Math.sin(angle);

    const pStart = normToPixel(startX, startY);
    const pEnd = normToPixel(endX, endY);

    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();
  } else {
    // We have a circle center (cx, cy) and radius R.
    const centerPx = normToPixel(line.cx, line.cy);
    const radiusPx = line.r * radius;

    // Draw the full orthogonal circle but use clipping to restrict it to the unit disk
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.beginPath();
    // Remember to invert Y since Canvas Y is down but our math Y is up
    ctx.arc(centerPx.x, centerPx.y, radiusPx, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, width, height);

  // Draw all saved geodesics
  geodesics.forEach((g) => {
    drawLine(ctx, g.calc, g.color);
  });

  // Draw current preview geodesic
  if (isDrawing && startPoint && currentPoint) {
    // Only calculate if points are distinct enough
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    if (dx*dx + dy*dy > 1e-4) {
       const calc = calculateGeodesic(startPoint, currentPoint);
       // Select a color based on current number of geodesics
       const color = colors[geodesics.length % colors.length];
       drawLine(ctx, calc, color);
    }
  }
}

// Interaction Handlers
function handleStart(e) {
  e.preventDefault();
  let clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const pt = pixelToNorm(clientX, clientY);

  // Only start drawing if inside the unit disk
  if (pt.x*pt.x + pt.y*pt.y < 1) {
    isDrawing = true;
    startPoint = pt;
    currentPoint = pt;
  }
}

function handleMove(e) {
  e.preventDefault();
  if (!isDrawing) return;

  let clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let clientY = e.touches ? e.touches[0].clientY : e.clientY;

  let pt = pixelToNorm(clientX, clientY);

  // Clamp to inside unit disk if they drag outside
  const distSq = pt.x*pt.x + pt.y*pt.y;
  if (distSq >= 1) {
      const dist = Math.sqrt(distSq);
      // Slightly inside to avoid precision issues
      pt.x = (pt.x / dist) * 0.999;
      pt.y = (pt.y / dist) * 0.999;
  }

  currentPoint = pt;
  render();
}

function handleEnd(e) {
  e.preventDefault();
  if (!isDrawing) return;

  isDrawing = false;

  if (startPoint && currentPoint) {
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;

      // Save line if drag was long enough
      if (dx*dx + dy*dy > 1e-4) {
          const calc = calculateGeodesic(startPoint, currentPoint);
          const color = colors[geodesics.length % colors.length];
          geodesics.push({
             calc: calc,
             color: color
          });
      }
  }

  startPoint = null;
  currentPoint = null;
  render();
}

canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove); // Window to handle quick dragging out of canvas
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd, { passive: false });

render();