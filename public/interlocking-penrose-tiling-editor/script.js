/**
 * Interlocking Penrose Tiling Editor
 */

const PHI = (1 + Math.sqrt(5)) / 2;

// Vector Math Helpers
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  mult(scalar) { return new Vec2(this.x * scalar, this.y * scalar); }
  div(scalar) { return new Vec2(this.x / scalar, this.y / scalar); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { return this.div(this.mag()); }
  dist(v) { return this.sub(v).mag(); }

  // Rotate around origin by angle (radians)
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}

function polar(r, theta) {
  return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
}

// Data Structure for Robinson Triangles
class Triangle {
  /**
   * @param {number} color - 0 for Acute (Half-Kite), 1 for Obtuse (Half-Dart)
   * @param {Vec2} a - Apex vertex
   * @param {Vec2} b - Base vertex 1
   * @param {Vec2} c - Base vertex 2
   */
  constructor(color, a, b, c) {
    this.color = color;
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

// Penrose P2 Deflation Algorithm
function deflateTriangles(triangles) {
  const next = [];
  for (const tri of triangles) {
    const A = tri.a;
    const B = tri.b;
    const C = tri.c;

    if (tri.color === 0) {
      // Deflate half-kite
      const P = A.add(B.sub(A).div(PHI));
      next.push(new Triangle(0, C, P, B));
      next.push(new Triangle(1, P, C, A));
    } else {
      // Deflate half-dart
      const P = B.add(C.sub(B).div(PHI));
      next.push(new Triangle(0, P, C, A));
      next.push(new Triangle(1, P, B, A));
    }
  }
  return next;
}

function generateInitialSun() {
  const triangles = [];
  for (let i = 0; i < 10; i++) {
    const B = polar(200, (2 * i - 1) * Math.PI / 10);
    const C = polar(200, (2 * i + 1) * Math.PI / 10);
    const A = new Vec2(0, 0); // Apex at center

    if (i % 2 === 0) {
      triangles.push(new Triangle(0, A, B, C));
    } else {
      triangles.push(new Triangle(0, A, C, B));
    }
  }
  return triangles;
}

// Global Edge Deformation State
const longCurve = { c1: new Vec2(1/3, 0), c2: new Vec2(2/3, 0) };
const shortCurve = { c1: new Vec2(1/3, 0), c2: new Vec2(2/3, 0) };

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let width, height;
let pan = new Vec2(0, 0);
let zoom = 1;

let activeTriangles = [];
let handleBaseTri = null;

let isDragging = false;
let draggedControl = null;
let isPanning = false;
let lastMouse = new Vec2(0, 0);

function init() {
  window.addEventListener('resize', resize);
  resize();

  resetPattern();
  requestAnimationFrame(render);
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function resetPattern() {
  activeTriangles = generateInitialSun();
  for (let i = 0; i < 5; i++) {
    activeTriangles = deflateTriangles(activeTriangles);
  }

  longCurve.c1 = new Vec2(1/3, 0);
  longCurve.c2 = new Vec2(2/3, 0);
  shortCurve.c1 = new Vec2(1/3, 0);
  shortCurve.c2 = new Vec2(2/3, 0);

  pan = new Vec2(width / 2, height / 2);
  zoom = 1;
}

function drawEdge(v1, v2, edgeType, reverseOrientation = false) {
  const d = v2.sub(v1);
  const len = d.mag();
  const angle = Math.atan2(d.y, d.x);

  const curve = edgeType === 0 ? longCurve : shortCurve;

  let c1n = new Vec2(curve.c1.x, curve.c1.y);
  let c2n = new Vec2(curve.c2.x, curve.c2.y);

  if (reverseOrientation) {
    c1n.y *= -1;
    c2n.y *= -1;
  }

  const c1g = v1.add(c1n.rotate(angle).mult(len));
  const c2g = v1.add(c2n.rotate(angle).mult(len));

  ctx.bezierCurveTo(c1g.x, c1g.y, c2g.x, c2g.y, v2.x, v2.y);
}

function renderControlHandles() {
  if (activeTriangles.length === 0) return;
  handleBaseTri = activeTriangles[0];
  const A = handleBaseTri.a;
  const B = handleBaseTri.b;
  const C = handleBaseTri.c;

  drawHandle(A, B, longCurve, '#00ffcc');
  drawHandle(B, C, shortCurve, '#ff00ff');
}

function drawHandle(v1, v2, curve, color) {
  const d = v2.sub(v1);
  const len = d.mag();
  const angle = Math.atan2(d.y, d.x);

  const c1g = v1.add(curve.c1.rotate(angle).mult(len));
  const c2g = v1.add(curve.c2.rotate(angle).mult(len));

  ctx.lineWidth = 2 / zoom;
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(v1.x, v1.y);
  ctx.lineTo(c1g.x, c1g.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(v2.x, v2.y);
  ctx.lineTo(c2g.x, c2g.y);
  ctx.stroke();

  const radius = 6 / zoom;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(c1g.x, c1g.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(c2g.x, c2g.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  const styles = getComputedStyle(document.documentElement);
  const bgColor = styles.getPropertyValue('--bg-color').trim();
  const kiteColor = styles.getPropertyValue('--kite-color').trim();
  const dartColor = styles.getPropertyValue('--dart-color').trim();
  const kiteStroke = styles.getPropertyValue('--kite-stroke').trim();
  const dartStroke = styles.getPropertyValue('--dart-stroke').trim();

  ctx.fillStyle = bgColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  ctx.lineWidth = 1 / zoom;
  ctx.lineJoin = 'round';

  for (const tri of activeTriangles) {
    ctx.beginPath();
    ctx.moveTo(tri.a.x, tri.a.y);

    if (tri.color === 0) {
      ctx.fillStyle = kiteColor || 'rgba(0, 150, 255, 0.4)';
      ctx.strokeStyle = kiteStroke || 'rgba(0, 200, 255, 0.8)';
      drawEdge(tri.a, tri.b, 0, false);
      drawEdge(tri.b, tri.c, 1, false);
      drawEdge(tri.c, tri.a, 0, true);
    } else {
      ctx.fillStyle = dartColor || 'rgba(255, 100, 0, 0.4)';
      ctx.strokeStyle = dartStroke || 'rgba(255, 150, 0, 0.8)';
      drawEdge(tri.a, tri.b, 1, false);
      drawEdge(tri.b, tri.c, 0, false);
      drawEdge(tri.c, tri.a, 1, true);
    }

    ctx.fill();
    ctx.stroke();
  }

  renderControlHandles();

  ctx.restore();
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseScreen = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
  const mouseWorld = new Vec2(
    (mouseScreen.x - pan.x) / zoom,
    (mouseScreen.y - pan.y) / zoom
  );

  lastMouse = mouseScreen;

  const hit = hitTestControlPoints(mouseWorld);
  if (hit) {
    isDragging = true;
    draggedControl = hit;
  } else {
    isPanning = true;
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseScreen = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

  if (isDragging && draggedControl && handleBaseTri) {
    const mouseWorld = new Vec2(
      (mouseScreen.x - pan.x) / zoom,
      (mouseScreen.y - pan.y) / zoom
    );

    const A = handleBaseTri.a;
    const B = handleBaseTri.b;
    const C = handleBaseTri.c;

    let v1, v2;
    if (draggedControl.type === 'long') {
      v1 = A; v2 = B;
    } else {
      v1 = B; v2 = C;
    }

    const d = v2.sub(v1);
    const len = d.mag();
    const angle = Math.atan2(d.y, d.x);

    let local = mouseWorld.sub(v1);
    local = local.rotate(-angle);
    local = local.div(len);

    const curve = draggedControl.type === 'long' ? longCurve : shortCurve;
    if (draggedControl.index === 1) {
      curve.c1 = local;
    } else {
      curve.c2 = local;
    }

    requestAnimationFrame(render);
  } else if (isPanning) {
    const delta = mouseScreen.sub(lastMouse);
    pan = pan.add(delta);
    requestAnimationFrame(render);
  }

  lastMouse = mouseScreen;
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  isPanning = false;
  draggedControl = null;
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  isPanning = false;
  draggedControl = null;
});

function hitTestControlPoints(mouseWorld) {
  if (!handleBaseTri) return null;
  const A = handleBaseTri.a;
  const B = handleBaseTri.b;
  const C = handleBaseTri.c;

  const radius = 10 / zoom;

  const dLong = B.sub(A);
  const lenLong = dLong.mag();
  const angLong = Math.atan2(dLong.y, dLong.x);

  const lC1 = A.add(longCurve.c1.rotate(angLong).mult(lenLong));
  const lC2 = A.add(longCurve.c2.rotate(angLong).mult(lenLong));

  if (mouseWorld.dist(lC1) < radius) return { type: 'long', index: 1 };
  if (mouseWorld.dist(lC2) < radius) return { type: 'long', index: 2 };

  const dShort = C.sub(B);
  const lenShort = dShort.mag();
  const angShort = Math.atan2(dShort.y, dShort.x);

  const sC1 = B.add(shortCurve.c1.rotate(angShort).mult(lenShort));
  const sC2 = B.add(shortCurve.c2.rotate(angShort).mult(lenShort));

  if (mouseWorld.dist(sC1) < radius) return { type: 'short', index: 1 };
  if (mouseWorld.dist(sC2) < radius) return { type: 'short', index: 2 };

  return null;
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const mouseScreen = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

  const mouseWorldBefore = new Vec2(
    (mouseScreen.x - pan.x) / zoom,
    (mouseScreen.y - pan.y) / zoom
  );

  zoom *= zoomFactor;

  pan.x = mouseScreen.x - mouseWorldBefore.x * zoom;
  pan.y = mouseScreen.y - mouseWorldBefore.y * zoom;

  requestAnimationFrame(render);
}, { passive: false });

init();