const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let points = [];
let circles = [];
let triangles = [];

const EXPANSION_RATE = 1;

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  draw();
}

window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const newPoint = { x, y };
  points.push(newPoint);
  circles.push({ x, y, radius: 0, active: true });
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const circleColor = getComputedStyle(document.body).getPropertyValue("--circle-color").trim();
  const triangleColor = getComputedStyle(document.body).getPropertyValue("--triangle-color").trim();
  const pointColor = getComputedStyle(document.body).getPropertyValue("--point-color").trim();

  // Draw expanding circles
  ctx.strokeStyle = circleColor;
  ctx.lineWidth = 1;
  circles.forEach((circle) => {
    if (circle.active) {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Draw triangles
  ctx.strokeStyle = triangleColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  triangles.forEach((triangle) => {
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.closePath();
    ctx.stroke();
  });

  // Draw points
  ctx.fillStyle = pointColor;
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getCircumcircle(p1, p2, p3) {
  const A = p2.x - p1.x;
  const B = p2.y - p1.y;
  const C = p3.x - p1.x;
  const D = p3.y - p1.y;

  const E = A * (p1.x + p2.x) + B * (p1.y + p2.y);
  const F = C * (p1.x + p3.x) + D * (p1.y + p3.y);

  const G = 2 * (A * (p3.y - p2.y) - B * (p3.x - p2.x));

  if (Math.abs(G) < 0.000001) {
    return null; // Collinear points
  }

  const cx = (D * E - B * F) / G;
  const cy = (A * F - C * E) / G;

  const dx = cx - p1.x;
  const dy = cy - p1.y;
  const radius = Math.sqrt(dx * dx + dy * dy);

  return { x: cx, y: cy, radius };
}

function isPointInCircle(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return Math.sqrt(dx * dx + dy * dy) < circle.radius - 0.001;
}

function update() {
  circles.forEach((circle) => {
    if (circle.active) {
      circle.radius += EXPANSION_RATE;
    }
  });

  triangles = [];
  const n = points.length;

  // Find all valid Delaunay triangles
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const circumcircle = getCircumcircle(points[i], points[j], points[k]);
        if (circumcircle) {
          let isDelaunay = true;
          for (let m = 0; m < n; m++) {
            if (m !== i && m !== j && m !== k && isPointInCircle(points[m], circumcircle)) {
              isDelaunay = false;
              break;
            }
          }

          if (isDelaunay) {
             // check if the expanded circles of the three points intersect the circumcircle center
            const c1 = circles[i];
            const c2 = circles[j];
            const c3 = circles[k];

            // Allow the triangle to appear once the expanding circles roughly reach the circumcenter
            const dist1 = Math.sqrt((c1.x - circumcircle.x)**2 + (c1.y - circumcircle.y)**2);

            if (c1.radius >= dist1) {
              triangles.push([points[i], points[j], points[k]]);
              // Stop expansion of circles that have formed a valid triangle
              // (Actually, they could still form other triangles, so we shouldn't stop them completely here,
              // but to make a "locking" effect, we can let them grow until they cover the whole screen or
              // just stop growing when they can't possibly form new ones.)
            }
          }
        }
      }
    }
  }

  // Stop growing circles that are larger than the max canvas dimension to save some rendering
  const maxDim = Math.max(canvas.width, canvas.height);
  circles.forEach(c => {
      if (c.radius > maxDim * 1.5) {
          c.active = false;
      }
  })

  draw();
  requestAnimationFrame(update);
}

resizeCanvas();
requestAnimationFrame(update);
