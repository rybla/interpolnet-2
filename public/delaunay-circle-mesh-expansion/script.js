const canvas = document.getElementById('mesh-canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('reset-btn');

let width, height;
let points = [];
let triangles = []; // Contains "locked" triangles

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Reset the simulation
function reset() {
  points = [];
  triangles = [];
}

resetBtn.addEventListener('click', reset);

// Helper function: Distance between two points
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the circumcenter and circumradius of three points
function calculateCircumcircle(p1, p2, p3) {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));

  if (Math.abs(d) < 1e-10) return null; // Collinear points

  const ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) +
              (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) +
              (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d;

  const uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) +
              (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) +
              (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d;

  const center = { x: ux, y: uy };
  const radius = distance(center, p1);

  return { center, radius, p1, p2, p3 };
}

// Check if a point is inside a given circle
function isPointInCircle(point, circle) {
  return distance(point, circle.center) < circle.radius - 1e-5; // Add tiny epsilon for float precision
}

// Check if any other point is inside the circumcircle of the 3 points
function isDelaunay(circle, p1, p2, p3) {
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p !== p1 && p !== p2 && p !== p3 && isPointInCircle(p, circle)) {
      return false;
    }
  }
  return true;
}

// Generate Delaunay triangles dynamically
function checkTriangulation() {
  triangles = [];

  if (points.length < 3) return;

  // We find all triplets and see if their circumcircle is empty
  for (let i = 0; i < points.length - 2; i++) {
    for (let j = i + 1; j < points.length - 1; j++) {
      for (let k = j + 1; k < points.length; k++) {
        const p1 = points[i];
        const p2 = points[j];
        const p3 = points[k];

        const circle = calculateCircumcircle(p1, p2, p3);
        if (circle && isDelaunay(circle, p1, p2, p3)) {
          // It's a valid Delaunay triangle!
          triangles.push(circle);
        }
      }
    }
  }
}

// Global expansion speed
const EXPANSION_SPEED = 50; // pixels per second

let lastTime = 0;

function animate(time) {
  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // Clear canvas
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim() || '#0b0c10';
  const accent1 = getComputedStyle(document.documentElement).getPropertyValue('--accent-1').trim() || '#66fcf1';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Update circle radii
  points.forEach(p => {
    p.radius += EXPANSION_SPEED * dt;
  });

  // Calculate triangulation each frame (could be optimized, but ok for demo)
  checkTriangulation();

  // Draw expanding circles
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(69, 162, 158, 0.3)'; // --accent-2 with low opacity
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw the point itself
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = accent1;
    ctx.fill();
  });

  // Draw triangles where global circles are large enough to cover circumradius
  // Actually, we want to animate them "locking" when the circles touch.
  // The circles intersect at the circumcenter when their radii reach the circumradius.
  ctx.strokeStyle = accent1;
  ctx.lineWidth = 2;

  triangles.forEach(t => {
    // Check if the circles originating from p1, p2, p3 have grown large enough
    // to reach the circumcenter (i.e., radius >= circumradius)
    // Since all points grow at the same speed and we only add points where they start with radius=0,
    // this check is a simple proxy for "have the circles met?"

    // We assume circles are "locked" if the smallest radius of the three is >= circumradius
    const minRadius = Math.min(t.p1.radius, t.p2.radius, t.p3.radius);

    if (minRadius >= t.radius) {
      // Locked triangle
      ctx.beginPath();
      ctx.moveTo(t.p1.x, t.p1.y);
      ctx.lineTo(t.p2.x, t.p2.y);
      ctx.lineTo(t.p3.x, t.p3.y);
      ctx.closePath();

      ctx.fillStyle = 'rgba(102, 252, 241, 0.1)'; // soft fill
      ctx.fill();
      ctx.stroke();
    }
  });

  requestAnimationFrame(animate);
}

// Add event listener to place points on canvas
canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  points.push({ x, y, radius: 0 });
});

requestAnimationFrame(animate);
