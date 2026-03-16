const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let triangles = []; // Stores the current set of Robinson triangles
let scale = 1;
let offset = { x: 0, y: 0 };
let isDragging = false;
let draggedPoint = null;

// Constants for triangle types
const ACUTE = 0; // Half-kite
const OBTUSE = 1; // Half-dart

class RobinsonTriangle {
  constructor(type, a, b, c) {
    this.type = type;
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

// Global control points for Bezier curve deformations
// Each edge of the fundamental triangles can be deformed.
// To ensure symmetrical propagation, we define "offsets" from the straight line
// interpolation at specific parameters (e.g., 1/3 and 2/3 along the edge).
// For Robinson triangles:
// ACUTE (half-kite): edges are (a,b), (b,c), (c,a)
// OBTUSE (half-dart): edges are (a,b), (b,c), (c,a)

const controlPoints = [
  // Deformations for the 'long' edges
  { id: 'long_1', u: 0.33, v: -0.1, x: 0, y: 0, radius: 10 },
  { id: 'long_2', u: 0.66, v: 0.1, x: 0, y: 0, radius: 10 },
  // Deformations for the 'short' edges
  { id: 'short_1', u: 0.33, v: 0.1, x: 0, y: 0, radius: 10 },
  { id: 'short_2', u: 0.66, v: -0.1, x: 0, y: 0, radius: 10 },
];

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Utility functions
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpPoint(p1, p2, t) {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t)
  };
}

// Calculate a normal vector for an edge to offset control points
function edgeNormal(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: -dy / len, y: dx / len };
}

// Calculate the final actual coordinate of a control point on a specific edge
// given the u (parameter along edge) and v (perpendicular offset proportion)
function getEdgeControlPoint(p1, p2, cpDef, edgeLength) {
  const basePoint = lerpPoint(p1, p2, cpDef.u);
  const normal = edgeNormal(p1, p2);
  // v is relative to the edge length so deformations scale properly
  return {
    x: basePoint.x + normal.x * cpDef.v * edgeLength,
    y: basePoint.y + normal.y * cpDef.v * edgeLength
  };
}

// Subdivide the current set of triangles based on the deflation algorithm
function subdivide() {
  const nextTriangles = [];
  for (const tri of triangles) {
    if (tri.type === ACUTE) {
      // Acute (half-kite) subdivides into 1 acute and 1 obtuse
      // Triangles: A, B, C. A is the apex.
      // Split edge (A, C) by GOLDEN_RATIO
      const p = lerpPoint(tri.a, tri.b, 1 / GOLDEN_RATIO);
      nextTriangles.push(new RobinsonTriangle(ACUTE, tri.c, tri.a, p));
      nextTriangles.push(new RobinsonTriangle(OBTUSE, tri.c, p, tri.b));
    } else {
      // Obtuse (half-dart) subdivides into 2 acute and 1 obtuse
      // Triangles: A, B, C. B is the obtuse angle.
      // Split edge (C, A) and (C, B)
      const q = lerpPoint(tri.b, tri.a, 1 / GOLDEN_RATIO);
      const r = lerpPoint(tri.b, tri.c, 1 / GOLDEN_RATIO);

      nextTriangles.push(new RobinsonTriangle(OBTUSE, tri.a, r, q));
      nextTriangles.push(new RobinsonTriangle(ACUTE, tri.c, tri.a, r));
      nextTriangles.push(new RobinsonTriangle(ACUTE, q, tri.b, r));
    }
  }
  triangles = nextTriangles;
}

// Note: To match standard Robinson deflation:
// ACUTE (half-kite): vertices A(apex), B, C. Lengths: AB=AC=Phi, BC=1
// OBTUSE (half-dart): vertices A, B(obtuse), C. Lengths: AB=BC=1, AC=Phi
// Let's adjust the deflation rules for standard Robinson triangles:
function subdivideStandard() {
  const nextTriangles = [];
  for (const tri of triangles) {
    if (tri.type === ACUTE) {
      // Half-kite A, B, C where A is the 36deg apex, B is the 72deg corner.
      // P divides edge AC.
      const p = lerpPoint(tri.a, tri.c, 1 / GOLDEN_RATIO);
      nextTriangles.push(new RobinsonTriangle(ACUTE, tri.b, tri.c, p));
      nextTriangles.push(new RobinsonTriangle(OBTUSE, p, tri.a, tri.b));
    } else {
      // Half-dart A, B, C where B is the 108deg apex.
      // P divides edge AB.
      const p = lerpPoint(tri.c, tri.a, 1 / GOLDEN_RATIO);
      nextTriangles.push(new RobinsonTriangle(ACUTE, p, tri.b, tri.c));
      nextTriangles.push(new RobinsonTriangle(OBTUSE, tri.b, p, tri.a));
    }
  }
  triangles = nextTriangles;
}


// Initialize the tiling with a "sun" pattern (10 acute triangles around the origin)
function initTiling() {
  triangles = [];
  const R = 400; // Radius of initial decagon
  for (let i = 0; i < 10; i++) {
    const angle1 = (i * Math.PI) / 5;
    const angle2 = ((i + 1) * Math.PI) / 5;

    const center = { x: 0, y: 0 };
    const p1 = { x: R * Math.cos(angle1), y: R * Math.sin(angle1) };
    const p2 = { x: R * Math.cos(angle2), y: R * Math.sin(angle2) };

    // For a sun pattern, alternate winding so edges line up correctly
    if (i % 2 === 0) {
      triangles.push(new RobinsonTriangle(ACUTE, center, p2, p1));
    } else {
      triangles.push(new RobinsonTriangle(ACUTE, center, p1, p2));
    }
  }

  // Deflate a few times to generate the pattern
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    subdivideStandard();
  }
}

// Fetch colors from CSS
const styles = getComputedStyle(document.documentElement);
const colors = {
  bg: styles.getPropertyValue('--bg-color').trim(),
  kite: styles.getPropertyValue('--kite-color').trim(),
  dart: styles.getPropertyValue('--dart-color').trim(),
  line: styles.getPropertyValue('--line-color').trim(),
  control: styles.getPropertyValue('--control-color').trim(),
  controlBorder: styles.getPropertyValue('--control-border').trim()
};

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Set initial scale/offset to center the pattern
  scale = Math.min(width, height) / 1000;
  offset.x = width / 2;
  offset.y = height / 2;
}

// Evaluate cubic Bezier for drawing
function bezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
  };
}

// Draw an edge deformed by Bezier control points
// For Penrose matching rules to hold symmetrically, edges must deform based on their length type (long or short)
function drawEdge(ctx, start, end, isLongEdge, flip) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  const cp1Def = isLongEdge ? controlPoints[0] : controlPoints[2];
  const cp2Def = isLongEdge ? controlPoints[1] : controlPoints[3];

  // To ensure the jigsaw puzzle fits, we might need to flip the 'v' offset based on the edge winding
  // The sign of 'flip' (+1 or -1) handles alternating symmetry for adjacent tiles.
  const cp1 = getEdgeControlPoint(start, end, { u: cp1Def.u, v: cp1Def.v * flip }, len);
  const cp2 = getEdgeControlPoint(start, end, { u: cp2Def.u, v: cp2Def.v * flip }, len);

  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
}

function drawTriangle(tri) {
  ctx.beginPath();
  ctx.moveTo(tri.a.x, tri.a.y);

  // Note: the deflation algorithm we chose (subdivideStandard) relies on:
  // ACUTE: a->b is long, b->c is short, c->a is long. flip sequence matters.
  // OBTUSE: a->b is long, b->c is long, c->a is short.

  // Simple heuristic for edge lengths (since numerical drift might occur, compare visually)
  const lenAB = Math.hypot(tri.b.x - tri.a.x, tri.b.y - tri.a.y);
  const lenBC = Math.hypot(tri.c.x - tri.b.x, tri.c.y - tri.b.y);
  const lenCA = Math.hypot(tri.a.x - tri.c.x, tri.a.y - tri.c.y);

  // Sort lengths to classify edges
  const maxLen = Math.max(lenAB, lenBC, lenCA);
  const threshold = maxLen * 0.8; // Ratio is ~1.618, so >80% of max is a long edge

  const isABLong = lenAB > threshold;
  const isBCLong = lenBC > threshold;
  const isCALong = lenCA > threshold;

  // The winding direction of the triangle (cross product) determines the 'flip' sign
  // to ensure adjacent edges bend in complementary directions (like a jigsaw puzzle).
  const cp = (tri.b.x - tri.a.x) * (tri.c.y - tri.a.y) - (tri.b.y - tri.a.y) * (tri.c.x - tri.a.x);
  const flip = cp > 0 ? 1 : -1;

  drawEdge(ctx, tri.a, tri.b, isABLong, flip);
  drawEdge(ctx, tri.b, tri.c, isBCLong, flip);
  drawEdge(ctx, tri.c, tri.a, isCALong, flip);

  ctx.fillStyle = tri.type === ACUTE ? colors.kite : colors.dart;
  ctx.fill();
  ctx.stroke();
}

function renderBaseControls() {
  // To allow users to manipulate the offsets visually,
  // we render a representation of the 'long' and 'short' edges centrally.
  // For simplicity, we just use a fixed reference segment for each.

  const R = 300;
  // Long edge reference
  const longStart = { x: -R, y: -200 };
  const longEnd = { x: R, y: -200 };
  const longLen = R * 2;

  // Short edge reference
  const shortStart = { x: -R/GOLDEN_RATIO, y: 200 };
  const shortEnd = { x: R/GOLDEN_RATIO, y: 200 };
  const shortLen = (R/GOLDEN_RATIO) * 2;

  // Calculate screen coordinates for the control points to render them
  controlPoints[0].x = getEdgeControlPoint(longStart, longEnd, controlPoints[0], longLen).x;
  controlPoints[0].y = getEdgeControlPoint(longStart, longEnd, controlPoints[0], longLen).y;

  controlPoints[1].x = getEdgeControlPoint(longStart, longEnd, controlPoints[1], longLen).x;
  controlPoints[1].y = getEdgeControlPoint(longStart, longEnd, controlPoints[1], longLen).y;

  controlPoints[2].x = getEdgeControlPoint(shortStart, shortEnd, controlPoints[2], shortLen).x;
  controlPoints[2].y = getEdgeControlPoint(shortStart, shortEnd, controlPoints[2], shortLen).y;

  controlPoints[3].x = getEdgeControlPoint(shortStart, shortEnd, controlPoints[3], shortLen).x;
  controlPoints[3].y = getEdgeControlPoint(shortStart, shortEnd, controlPoints[3], shortLen).y;

  // Draw reference edges
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(longStart.x, longStart.y); ctx.lineTo(longEnd.x, longEnd.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(shortStart.x, shortStart.y); ctx.lineTo(shortEnd.x, shortEnd.y); ctx.stroke();

  // Draw curved reference edges
  ctx.setLineDash([]);
  ctx.strokeStyle = colors.control;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(longStart.x, longStart.y);
  ctx.bezierCurveTo(controlPoints[0].x, controlPoints[0].y, controlPoints[1].x, controlPoints[1].y, longEnd.x, longEnd.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(shortStart.x, shortStart.y);
  ctx.bezierCurveTo(controlPoints[2].x, controlPoints[2].y, controlPoints[3].x, controlPoints[3].y, shortEnd.x, shortEnd.y);
  ctx.stroke();

  // Draw handles
  ctx.fillStyle = colors.control;
  ctx.strokeStyle = colors.controlBorder;
  ctx.lineWidth = 3;
  for (const cp of controlPoints) {
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Labels
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Long Edge Deformations', 0, -250);
  ctx.fillText('Short Edge Deformations', 0, 150);

  ctx.restore();
}

function draw() {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1 / scale;
  ctx.lineJoin = 'round';

  for (const tri of triangles) {
    drawTriangle(tri);
  }

  // To avoid drawing the controls underneath all the tiles (or obscured by them),
  // we draw the interactive base controls on top in a fixed logical coordinate space.
  // Wait, let's just render them as an overlay in the center of the screen
  // resetting transform scale (but keeping translate to center).
  ctx.restore();

  ctx.save();
  ctx.translate(width / 2, height / 2);
  renderBaseControls();
  ctx.restore();

  requestAnimationFrame(draw);
}

// Interactivity
function getEventPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function handlePointerDown(e) {
  const pos = getEventPos(e);

  // Transform pointer to the local coordinate system of the base controls overlay
  // The overlay is translated to (width / 2, height / 2) with no scaling
  const localX = pos.x - (width / 2);
  const localY = pos.y - (height / 2);

  // Check if we clicked on a control point
  for (const cp of controlPoints) {
    const dx = localX - cp.x;
    const dy = localY - cp.y;
    if (Math.sqrt(dx * dx + dy * dy) <= cp.radius * 2) {
      isDragging = true;
      draggedPoint = cp;
      document.body.style.cursor = 'grabbing';
      return; // Stop checking
    }
  }
}

function handlePointerMove(e) {
  if (!isDragging || !draggedPoint) return;
  e.preventDefault(); // Prevent scrolling while dragging

  const pos = getEventPos(e);
  const localX = pos.x - (width / 2);
  const localY = pos.y - (height / 2);

  // Determine which reference edge we are updating based on the control point id
  const isLongEdge = draggedPoint.id.startsWith('long');
  const R = 300;

  let start, end, len;
  if (isLongEdge) {
    start = { x: -R, y: -200 };
    end = { x: R, y: -200 };
    len = R * 2;
  } else {
    start = { x: -R/GOLDEN_RATIO, y: 200 };
    end = { x: R/GOLDEN_RATIO, y: 200 };
    len = (R/GOLDEN_RATIO) * 2;
  }

  // We need to inverse the coordinate calculation to find the new 'u' and 'v'
  // 1. Vector from start to the local mouse pos
  const vx = localX - start.x;
  const vy = localY - start.y;

  // 2. Edge vector
  const ex = end.x - start.x;
  const ey = end.y - start.y;

  // 3. Project mouse vector onto edge vector to find 'u'
  const dot = (vx * ex + vy * ey);
  draggedPoint.u = dot / (len * len);

  // Clamp 'u' to keep the handle somewhat reasonable
  draggedPoint.u = Math.max(0.1, Math.min(0.9, draggedPoint.u));

  // 4. Perpendicular distance to find 'v'
  const normal = edgeNormal(start, end);
  const vDist = (vx * normal.x + vy * normal.y);

  // v is stored relative to the length of the edge
  draggedPoint.v = vDist / len;

  // Clamp v to avoid completely breaking the visualizer
  draggedPoint.v = Math.max(-0.5, Math.min(0.5, draggedPoint.v));
}

function handlePointerUp() {
  isDragging = false;
  draggedPoint = null;
  document.body.style.cursor = 'default';
}

// Setup event listeners
canvas.addEventListener('mousedown', handlePointerDown);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);

canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
window.addEventListener('touchmove', handlePointerMove, { passive: false });
window.addEventListener('touchend', handlePointerUp);

window.addEventListener('resize', resize);

// Initialization
resize();
initTiling();
requestAnimationFrame(draw);
