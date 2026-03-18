const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

// Data structures
let points = [];
let triangles = [];
let animatingCircles = [];

const EPSILON = 1e-4;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // If points are empty, add a super-triangle that covers the screen
  if (points.length === 0) {
    reset();
  } else {
    // We should ideally recalculate the super triangle and re-triangulate,
    // but for simplicity, we'll just clear and reset on resize.
    reset();
  }
}

window.addEventListener('resize', resize);

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

class Triangle {
  constructor(p1, p2, p3) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    // Sort vertices counter-clockwise to normalize
    const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    if (cross < 0) {
      this.p1 = p1;
      this.p2 = p3;
      this.p3 = p2;
    }

    this.edges = [
      new Edge(this.p1, this.p2),
      new Edge(this.p2, this.p3),
      new Edge(this.p3, this.p1)
    ];

    this.calculateCircumcircle();
  }

  calculateCircumcircle() {
    const ax = this.p1.x, ay = this.p1.y;
    const bx = this.p2.x, by = this.p2.y;
    const cx = this.p3.x, cy = this.p3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

    // Handle collinear points
    if (Math.abs(d) < EPSILON) {
      this.circumcenter = new Point((ax + bx + cx) / 3, (ay + by + cy) / 3);
      this.circumradius = Infinity;
      return;
    }

    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

    this.circumcenter = new Point(ux, uy);
    this.circumradius = this.p1.distanceTo(this.circumcenter);
  }

  containsPointInCircumcircle(p) {
    if (this.circumradius === Infinity) return false;
    const dist = this.circumcenter.distanceTo(p);
    return dist <= this.circumradius + EPSILON;
  }

  sharesVertex(p) {
    return this.p1 === p || this.p2 === p || this.p3 === p;
  }

  hasVertexFromSuperTriangle(superTri) {
    return this.sharesVertex(superTri.p1) || this.sharesVertex(superTri.p2) || this.sharesVertex(superTri.p3);
  }
}

class Edge {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  equals(other) {
    return (this.p1 === other.p1 && this.p2 === other.p2) ||
           (this.p1 === other.p2 && this.p2 === other.p1);
  }
}

class AnimatingCircle {
  constructor(x, y, targetRadius) {
    this.x = x;
    this.y = y;
    this.targetRadius = targetRadius;
    this.currentRadius = 0;
    this.speed = Math.max(2, targetRadius / 30); // Dynamic speed based on size
    this.done = false;
  }

  update() {
    if (!this.done) {
      this.currentRadius += this.speed;
      if (this.currentRadius >= this.targetRadius) {
        this.currentRadius = this.targetRadius;
        this.done = true;
      }
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);

    const style = getComputedStyle(document.body);
    const circleColor = style.getPropertyValue('--circle-color').trim();
    const accentColor = style.getPropertyValue('--accent-color').trim();

    ctx.fillStyle = circleColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

let superTriangle;

function reset() {
  points = [];
  triangles = [];
  animatingCircles = [];

  // Create super triangle that encompasses the entire screen
  // Arbitrarily large to make sure it covers everything
  const d = Math.max(width, height) * 10;
  const p1 = new Point(width / 2, -d);
  const p2 = new Point(-d, height + d);
  const p3 = new Point(width + d, height + d);

  superTriangle = new Triangle(p1, p2, p3);
  triangles.push(superTriangle);
}

function addPoint(x, y) {
  const newPoint = new Point(x, y);
  points.push(newPoint);

  // Bowyer-Watson Algorithm
  const badTriangles = [];
  for (const tri of triangles) {
    if (tri.containsPointInCircumcircle(newPoint)) {
      badTriangles.push(tri);
    }
  }

  const polygon = [];
  for (const badTri of badTriangles) {
    for (const edge of badTri.edges) {
      let shared = false;
      for (const otherBadTri of badTriangles) {
        if (badTri === otherBadTri) continue;
        for (const otherEdge of otherBadTri.edges) {
          if (edge.equals(otherEdge)) {
            shared = true;
            break;
          }
        }
        if (shared) break;
      }
      if (!shared) {
        polygon.push(edge);
      }
    }
  }

  // Remove bad triangles
  triangles = triangles.filter(tri => !badTriangles.includes(tri));

  // Create new triangles
  const newTriangles = [];
  for (const edge of polygon) {
    const newTri = new Triangle(edge.p1, edge.p2, newPoint);
    triangles.push(newTri);
    newTriangles.push(newTri);
  }

  // Trigger animations for new triangles, but only if they don't share a vertex with the super triangle
  // so we don't draw massive circles off-screen
  for (const tri of newTriangles) {
    if (!tri.hasVertexFromSuperTriangle(superTriangle) && isFinite(tri.circumradius)) {
       animatingCircles.push(new AnimatingCircle(tri.circumcenter.x, tri.circumcenter.y, tri.circumradius));
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  addPoint(e.clientX, e.clientY);
});

function draw() {
  ctx.clearRect(0, 0, width, height);

  const style = getComputedStyle(document.body);
  const triangleStroke = style.getPropertyValue('--triangle-stroke').trim();
  const pointColor = style.getPropertyValue('--point-color').trim();

  // Draw animating circles (which represent circumcircles)
  for (const circle of animatingCircles) {
    circle.update();
    circle.draw(ctx);
  }

  // Filter out triangles that share a vertex with the super triangle for display
  const displayTriangles = triangles.filter(tri => !tri.hasVertexFromSuperTriangle(superTriangle));

  // Draw triangles
  ctx.strokeStyle = triangleStroke;
  ctx.lineWidth = 1.5;

  for (const tri of displayTriangles) {
    ctx.beginPath();
    ctx.moveTo(tri.p1.x, tri.p1.y);
    ctx.lineTo(tri.p2.x, tri.p2.y);
    ctx.lineTo(tri.p3.x, tri.p3.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Draw points
  ctx.fillStyle = pointColor;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

// Initial setup
resize();
requestAnimationFrame(draw);
