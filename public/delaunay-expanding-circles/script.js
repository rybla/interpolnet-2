const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];
let triangles = [];
let edges = [];

const CIRCLE_EXPANSION_RATE = 50; // pixels per second

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Helper to calculate distance
function dist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Circumcircle of a triangle given 3 points
function circumcircle(p1, p2, p3) {
  const m1 = (p1.x * p1.x + p1.y * p1.y);
  const m2 = (p2.x * p2.x + p2.y * p2.y);
  const m3 = (p3.x * p3.x + p3.y * p3.y);

  const cx = 0.5 * ((m1 * (p2.y - p3.y) + m2 * (p3.y - p1.y) + m3 * (p1.y - p2.y)) / (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)));
  const cy = 0.5 * ((m1 * (p3.x - p2.x) + m2 * (p1.x - p3.x) + m3 * (p2.x - p1.x)) / (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)));

  const center = { x: cx, y: cy };
  const radius = dist(center, p1);

  return { center, radius };
}

// Check if a point is inside a circumcircle
function inCircumcircle(p, p1, p2, p3) {
  const cc = circumcircle(p1, p2, p3);
  return dist(p, cc.center) <= cc.radius + 1e-6; // add epsilon to avoid precision issues
}

// Check if two edges are the same (undirected)
function edgesEqual(e1, e2) {
  return (e1.p1 === e2.p1 && e1.p2 === e2.p2) || (e1.p1 === e2.p2 && e1.p2 === e2.p1);
}

// Compute Delaunay triangulation using Bowyer-Watson algorithm
function delaunay(pts) {
  if (pts.length < 3) return [];

  // Create super triangle bounding all points
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  const deltaMax = Math.max(dx, dy);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const st1 = { x: midX - 20 * deltaMax, y: midY - deltaMax, isSuper: true };
  const st2 = { x: midX, y: midY + 20 * deltaMax, isSuper: true };
  const st3 = { x: midX + 20 * deltaMax, y: midY - deltaMax, isSuper: true };

  let triangulation = [
    { p1: st1, p2: st2, p3: st3 }
  ];

  for (const p of pts) {
    let badTriangles = [];
    for (const tri of triangulation) {
      if (inCircumcircle(p, tri.p1, tri.p2, tri.p3)) {
        badTriangles.push(tri);
      }
    }

    let polygon = [];
    for (const tri of badTriangles) {
      const triEdges = [
        { p1: tri.p1, p2: tri.p2 },
        { p1: tri.p2, p2: tri.p3 },
        { p1: tri.p3, p2: tri.p1 }
      ];
      for (const edge of triEdges) {
        let isShared = false;
        for (const otherTri of badTriangles) {
          if (tri === otherTri) continue;
          const otherEdges = [
            { p1: otherTri.p1, p2: otherTri.p2 },
            { p1: otherTri.p2, p2: otherTri.p3 },
            { p1: otherTri.p3, p2: otherTri.p1 }
          ];
          for (const otherEdge of otherEdges) {
            if (edgesEqual(edge, otherEdge)) {
              isShared = true;
              break;
            }
          }
          if (isShared) break;
        }
        if (!isShared) {
          polygon.push(edge);
        }
      }
    }

    // Remove bad triangles
    triangulation = triangulation.filter(t => !badTriangles.includes(t));

    // Add new triangles from point to polygon edges
    for (const edge of polygon) {
      triangulation.push({ p1: edge.p1, p2: edge.p2, p3: p });
    }
  }

  // Remove triangles sharing vertices with super triangle
  triangulation = triangulation.filter(t => !t.p1.isSuper && !t.p2.isSuper && !t.p3.isSuper);

  return triangulation;
}

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hue = Math.floor(Math.random() * 360);
  points.push({
    x, y,
    createdAt: performance.now(),
    color: `hsl(${hue}, 80%, 60%)`,
    glow: `hsl(${hue}, 100%, 70%)`
  });

  triangles = delaunay(points);
  edges = [];
  for (const tri of triangles) {
    edges.push({ p1: tri.p1, p2: tri.p2 });
    edges.push({ p1: tri.p2, p2: tri.p3 });
    edges.push({ p1: tri.p3, p2: tri.p1 });
  }

  // Deduplicate edges for rendering
  const uniqueEdges = [];
  for (const edge of edges) {
    let exists = false;
    for (const uEdge of uniqueEdges) {
      if (edgesEqual(edge, uEdge)) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      uniqueEdges.push(edge);
    }
  }
  edges = uniqueEdges;
});

function draw(now) {
  ctx.clearRect(0, 0, width, height);

  // Draw expanding circles
  ctx.globalCompositeOperation = 'screen';
  for (const p of points) {
    const elapsed = (now - p.createdAt) / 1000;
    const r = Math.max(0, elapsed * CIRCLE_EXPANSION_RATE);

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.glow;
    ctx.stroke();
  }
  ctx.shadowBlur = 0; // Reset
  ctx.globalCompositeOperation = 'source-over';

  // Draw mesh edges based on circles intersecting
  // We only draw an edge if the sum of their circle radii is greater than their distance
  ctx.lineWidth = 2;
  for (const edge of edges) {
    const d = dist(edge.p1, edge.p2);
    const r1 = ((now - edge.p1.createdAt) / 1000) * CIRCLE_EXPANSION_RATE;
    const r2 = ((now - edge.p2.createdAt) / 1000) * CIRCLE_EXPANSION_RATE;

    if (r1 + r2 >= d) {
      // Create a gradient for the line
      const grad = ctx.createLinearGradient(edge.p1.x, edge.p1.y, edge.p2.x, edge.p2.y);
      grad.addColorStop(0, edge.p1.color);
      grad.addColorStop(1, edge.p2.color);

      ctx.beginPath();
      ctx.moveTo(edge.p1.x, edge.p1.y);
      ctx.lineTo(edge.p2.x, edge.p2.y);
      ctx.strokeStyle = grad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Draw points
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.glow;
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
