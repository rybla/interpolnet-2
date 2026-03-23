const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;

const state = {
  points: [],
  draggingPoint: null,
  dragOffset: { x: 0, y: 0 },
  settings: {
    showBezierCurve: true,
    showBezierComb: false,
    showBSplineCurve: true,
    showBSplineComb: false,
    showCatmullCurve: true,
    showCatmullComb: false,
    showPolygon: true,
    combScale: 200,
  },
};

const pointRadius = 8;
const colors = {
  bezier: "#ff3366",
  bspline: "#33ccff",
  catmull: "#66ff33",
  polygon: "#666666",
  point: "#ffffff",
};

function resizeCanvas() {
  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;
  canvas.width = width;
  canvas.height = height;
  render();
}

window.addEventListener("resize", resizeCanvas);

function initPoints() {
  // Center points in screen
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const w = Math.min(window.innerWidth, 800);
  const h = Math.min(window.innerHeight, 600);

  state.points = [
    { x: cx - w * 0.4, y: cy + h * 0.3 },
    { x: cx - w * 0.2, y: cy - h * 0.3 },
    { x: cx + w * 0.2, y: cy + h * 0.3 },
    { x: cx + w * 0.4, y: cy - h * 0.3 },
  ];
}

// Math Utility
function Vec2(x, y) {
  return { x, y };
}

function add(v1, v2) {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

function sub(v1, v2) {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

function mult(v, s) {
  return { x: v.x * s, y: v.y * s };
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

function mag(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v) {
  const m = mag(v);
  if (m === 0) return { x: 0, y: 0 };
  return { x: v.x / m, y: v.y / m };
}

function curvature(d1, d2) {
  // k = |x'y'' - y'x''| / (x'^2 + y'^2)^(3/2)
  const num = Math.abs(d1.x * d2.y - d1.y * d2.x);
  const denom = Math.pow(d1.x * d1.x + d1.y * d1.y, 1.5);
  if (denom < 1e-6) return 0;
  return num / denom;
}

// Curve Evaluation Functions

// Cubic Bezier
// B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
function evalBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return add(
    mult(p0, mt * mt * mt),
    add(
      mult(p1, 3 * mt * mt * t),
      add(mult(p2, 3 * mt * t * t), mult(p3, t * t * t))
    )
  );
}

function evalBezierD1(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return add(
    mult(sub(p1, p0), 3 * mt * mt),
    add(mult(sub(p2, p1), 6 * mt * t), mult(sub(p3, p2), 3 * t * t))
  );
}

function evalBezierD2(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return add(mult(add(sub(p0, mult(p1, 2)), p2), 6 * mt), mult(add(sub(p1, mult(p2, 2)), p3), 6 * t));
}

// Uniform Cubic B-Spline
// S(t) = 1/6 * [t^3 t^2 t 1] * Matrix * [P0 P1 P2 P3]^T
function evalBSpline(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const b0 = (mt * mt * mt) / 6;
  const b1 = (3 * t * t * t - 6 * t * t + 4) / 6;
  const b2 = (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6;
  const b3 = (t * t * t) / 6;

  return add(mult(p0, b0), add(mult(p1, b1), add(mult(p2, b2), mult(p3, b3))));
}

function evalBSplineD1(p0, p1, p2, p3, t) {
  const b0 = -0.5 * (1 - t) * (1 - t);
  const b1 = 1.5 * t * t - 2 * t;
  const b2 = -1.5 * t * t + t + 0.5;
  const b3 = 0.5 * t * t;

  return add(mult(p0, b0), add(mult(p1, b1), add(mult(p2, b2), mult(p3, b3))));
}

function evalBSplineD2(p0, p1, p2, p3, t) {
  const b0 = 1 - t;
  const b1 = 3 * t - 2;
  const b2 = -3 * t + 1;
  const b3 = t;

  return add(mult(p0, b0), add(mult(p1, b1), add(mult(p2, b2), mult(p3, b3))));
}

// Catmull-Rom
// C(t) = 0.5 * [t^3 t^2 t 1] * Matrix * [P0 P1 P2 P3]^T
function evalCatmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  return add(mult(p0, f0), add(mult(p1, f1), add(mult(p2, f2), mult(p3, f3))));
}

function evalCatmullD1(p0, p1, p2, p3, t) {
  const t2 = t * t;

  const f0 = -1.5 * t2 + 2 * t - 0.5;
  const f1 = 4.5 * t2 - 5 * t;
  const f2 = -4.5 * t2 + 4 * t + 0.5;
  const f3 = 1.5 * t2 - t;

  return add(mult(p0, f0), add(mult(p1, f1), add(mult(p2, f2), mult(p3, f3))));
}

function evalCatmullD2(p0, p1, p2, p3, t) {
  const f0 = -3 * t + 2;
  const f1 = 9 * t - 5;
  const f2 = -9 * t + 4;
  const f3 = 3 * t - 1;

  return add(mult(p0, f0), add(mult(p1, f1), add(mult(p2, f2), mult(p3, f3))));
}

// Rendering

function render() {
  ctx.clearRect(0, 0, width, height);
  const pts = state.points;

  if (state.settings.showPolygon && pts.length > 0) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = colors.polygon;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (pts.length >= 4) {
    // We piece together segments of 4 points.
    // For n points:
    // Bezier: points must be 3k + 1. We just draw the segments we can.
    // B-Spline: draw from segment 0 to n-3.
    // Catmull-Rom: draw from segment 0 to n-3.

    if (state.settings.showBSplineCurve) {
      drawSpline(pts, evalBSpline, evalBSplineD1, evalBSplineD2, colors.bspline, state.settings.showBSplineComb);
    }

    if (state.settings.showCatmullCurve) {
      drawSpline(pts, evalCatmull, evalCatmullD1, evalCatmullD2, colors.catmull, state.settings.showCatmullComb);
    }

    if (state.settings.showBezierCurve) {
      drawBezierPieces(pts, colors.bezier, state.settings.showBezierComb);
    }
  }

  // Draw points
  for (let p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.point;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawSpline(pts, evalPos, evalD1, evalD2, color, drawComb) {
  const segments = pts.length - 3;
  const steps = 50;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    const start = evalPos(p0, p1, p2, p3, 0);
    ctx.moveTo(start.x, start.y);

    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const pos = evalPos(p0, p1, p2, p3, t);
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();

    if (drawComb) {
      drawCurvatureComb(p0, p1, p2, p3, evalPos, evalD1, evalD2, color);
    }
  }
}

function drawBezierPieces(pts, color, drawComb) {
  const steps = 50;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  // Piecemeal Bezier: Every 3 segments is a new bezier curve
  // Points needed: 0,1,2,3 then 3,4,5,6 etc
  for (let i = 0; i < pts.length - 3; i += 3) {
    ctx.beginPath();
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    const start = evalBezier(p0, p1, p2, p3, 0);
    ctx.moveTo(start.x, start.y);

    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const pos = evalBezier(p0, p1, p2, p3, t);
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();

    if (drawComb) {
      drawCurvatureComb(p0, p1, p2, p3, evalBezier, evalBezierD1, evalBezierD2, color);
    }
  }
}

function drawCurvatureComb(p0, p1, p2, p3, evalPos, evalD1, evalD2, color) {
  const steps = 40;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  let prevTip = null;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pos = evalPos(p0, p1, p2, p3, t);
    const d1 = evalD1(p0, p1, p2, p3, t);
    const d2 = evalD2(p0, p1, p2, p3, t);

    const k = curvature(d1, d2);
    // Determine sign of curvature by cross product sign: x'y'' - y'x''
    const cross = d1.x * d2.y - d1.y * d2.x;
    const sign = Math.sign(cross) || 1;

    // Normal vector is perpendicular to tangent (d1)
    const normal = normalize({ x: -d1.y, y: d1.x });

    // Length of comb tooth
    const scale = state.settings.combScale;
    // To prevent giant spikes near zero denominator, clamp k
    const clamedK = Math.min(k, 0.5);

    const toothLength = clamedK * scale * sign;
    const tip = add(pos, mult(normal, toothLength));

    // Draw tooth
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(tip.x, tip.y);

    if (prevTip) {
      ctx.moveTo(prevTip.x, prevTip.y);
      ctx.lineTo(tip.x, tip.y);
    }
    prevTip = tip;
  }
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

// Interaction

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function handlePointerDown(e) {
  const pos = getMousePos(e);
  for (let p of state.points) {
    if (mag(sub(pos, p)) < pointRadius * 2) {
      state.draggingPoint = p;
      state.dragOffset = sub(p, pos);
      break;
    }
  }
}

function handlePointerMove(e) {
  if (state.draggingPoint) {
    const pos = getMousePos(e);
    state.draggingPoint.x = pos.x + state.dragOffset.x;
    state.draggingPoint.y = pos.y + state.dragOffset.y;
    render();
  }
}

function handlePointerUp() {
  state.draggingPoint = null;
}

canvas.addEventListener("mousedown", handlePointerDown);
canvas.addEventListener("mousemove", handlePointerMove);
window.addEventListener("mouseup", handlePointerUp);

canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handlePointerDown(e); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); handlePointerMove(e); }, { passive: false });
window.addEventListener("touchend", handlePointerUp);

// UI Event Listeners
function setupControls() {
  const mapping = {
    "toggle-bezier-curve": "showBezierCurve",
    "toggle-bezier-comb": "showBezierComb",
    "toggle-bspline-curve": "showBSplineCurve",
    "toggle-bspline-comb": "showBSplineComb",
    "toggle-catmull-curve": "showCatmullCurve",
    "toggle-catmull-comb": "showCatmullComb",
    "toggle-polygon": "showPolygon",
  };

  for (const [id, key] of Object.entries(mapping)) {
    document.getElementById(id).addEventListener("change", (e) => {
      state.settings[key] = e.target.checked;
      render();
    });
  }

  document.getElementById("comb-scale").addEventListener("input", (e) => {
    state.settings.combScale = parseFloat(e.target.value);
    render();
  });

  document.getElementById("add-point").addEventListener("click", () => {
    const pts = state.points;
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      pts.push({ x: last.x + 50, y: last.y + (Math.random() - 0.5) * 100 });
    } else {
      pts.push({ x: width / 2, y: height / 2 });
    }
    render();
  });

  document.getElementById("remove-point").addEventListener("click", () => {
    if (state.points.length > 4) {
      state.points.pop();
      render();
    }
  });

  document.getElementById("reset-points").addEventListener("click", () => {
    initPoints();
    render();
  });
}

// Bootstrap
setupControls();
resizeCanvas();
initPoints();
render();
