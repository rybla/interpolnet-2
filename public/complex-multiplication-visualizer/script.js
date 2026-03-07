const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const z1Val = document.getElementById("z1-val");
const z1Polar = document.getElementById("z1-polar");
const z2Val = document.getElementById("z2-val");
const z2Polar = document.getElementById("z2-polar");
const z3Val = document.getElementById("z3-val");
const z3Polar = document.getElementById("z3-polar");

let width = window.innerWidth;
let height = window.innerHeight;

// Viewport configuration
let scale = 100; // Pixels per unit
const getCenterX = () => width / 2;
const getCenterY = () => height / 2;

const z1Color = "#00ffcc";
const z2Color = "#ff00ff";
const z3Color = "#ffd700";
const axisColor = "#4b5563";
const gridColor = "#1f2937";
const pointRadius = 12;

let z1 = { re: 2, im: 1 };
let z2 = { re: 1, im: 1.5 };

let dragging = null;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  if (width < 600) {
    scale = 60; // Zoom out for mobile
  } else {
    scale = 100;
  }

  draw();
}
window.addEventListener("resize", resize);

// Math utilities
const getMag = (z) => Math.sqrt(z.re * z.re + z.im * z.im);
const getAngle = (z) => Math.atan2(z.im, z.re);
const mult = (a, b) => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});

// Coordinate transformations
const toScreenX = (re) => getCenterX() + re * scale;
const toScreenY = (im) => getCenterY() - im * scale; // Inverted Y

const toMathRe = (x) => (x - getCenterX()) / scale;
const toMathIm = (y) => (getCenterY() - y) / scale; // Inverted Y

function drawGrid() {
  ctx.lineWidth = 1;
  const centerX = getCenterX();
  const centerY = getCenterY();

  // Draw grid lines
  ctx.strokeStyle = gridColor;
  ctx.beginPath();
  for (let x = centerX % scale; x < width; x += scale) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = centerY % scale; y < height; y += scale) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();

  // Ticks
  ctx.fillStyle = axisColor;
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = centerX % scale; x < width; x += scale) {
    let re = Math.round((x - centerX) / scale);
    if (re !== 0) ctx.fillText(re, x, centerY + 8);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let y = centerY % scale; y < height; y += scale) {
    let im = Math.round((centerY - y) / scale);
    if (im !== 0) ctx.fillText(im + "i", centerX - 8, y);
  }
}

function drawVector(z, color, label) {
  const sx = toScreenX(z.re);
  const sy = toScreenY(z.im);
  const cx = getCenterX();
  const cy = getCenterY();

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(sx, sy);
  ctx.stroke();

  // Draw head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, pointRadius, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, sx + pointRadius + 4, sy - pointRadius - 4);
}

function drawArcsAndMagnitudes(z1, z2, z3) {
  const cx = getCenterX();
  const cy = getCenterY();

  const r1 = getMag(z1) * scale;
  const r2 = getMag(z2) * scale;
  const r3 = getMag(z3) * scale;

  const a1 = getAngle(z1);
  const a2 = getAngle(z2);
  const a3 = getAngle(z3);

  // Magnitude circles
  ctx.setLineDash([5, 10]);
  ctx.lineWidth = 1;

  ctx.strokeStyle = z1Color;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = z2Color;
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = z3Color;
  ctx.beginPath();
  ctx.arc(cx, cy, r3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // Angle Arcs
  ctx.lineWidth = 2;

  // Angle for z1
  let arcR = 30;
  ctx.strokeStyle = z1Color;
  ctx.fillStyle = z1Color + "33"; // with alpha
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, arcR, 0, -a1, a1 > 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angle for z2 (added onto z1 visually)
  arcR = 40;
  ctx.strokeStyle = z2Color;
  ctx.fillStyle = z2Color + "33"; // with alpha
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, arcR, -a1, -(a1 + a2), a2 > 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angle for z3
  arcR = 50;
  ctx.strokeStyle = z3Color;
  ctx.beginPath();
  ctx.arc(cx, cy, arcR, 0, -a3, a3 > 0);
  ctx.stroke();
}

const formatCartesian = (z) => {
  const re = z.re.toFixed(2);
  const im = Math.abs(z.im).toFixed(2);
  const sign = z.im >= 0 ? "+" : "-";
  return `${re} ${sign} ${im}i`;
};

const formatPolar = (z) => {
  const r = getMag(z).toFixed(2);
  let theta = getAngle(z);
  // Convert to degrees for easier reading
  let deg = (theta * 180 / Math.PI).toFixed(1);
  return `${r} ⋅ e^(i ${deg}°)`;
};

function updateUI(z3) {
  z1Val.innerText = formatCartesian(z1);
  z1Polar.innerText = formatPolar(z1);

  z2Val.innerText = formatCartesian(z2);
  z2Polar.innerText = formatPolar(z2);

  z3Val.innerText = formatCartesian(z3);
  z3Polar.innerText = formatPolar(z3);
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  drawGrid();

  const z3 = mult(z1, z2);

  drawArcsAndMagnitudes(z1, z2, z3);

  drawVector(z1, z1Color, "z₁");
  drawVector(z2, z2Color, "z₂");
  drawVector(z3, z3Color, "z₃");

  updateUI(z3);
}

function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function pointerDown(e) {
  const { x, y } = getPointerPos(e);

  const d1 = Math.hypot(x - toScreenX(z1.re), y - toScreenY(z1.im));
  const d2 = Math.hypot(x - toScreenX(z2.re), y - toScreenY(z2.im));

  // hit area slightly larger than pointRadius
  if (d1 < pointRadius * 2) {
    dragging = "z1";
  } else if (d2 < pointRadius * 2) {
    dragging = "z2";
  }
}

function pointerMove(e) {
  if (!dragging) return;
  e.preventDefault();

  const { x, y } = getPointerPos(e);
  const re = toMathRe(x);
  const im = toMathIm(y);

  if (dragging === "z1") {
    z1 = { re, im };
  } else if (dragging === "z2") {
    z2 = { re, im };
  }

  requestAnimationFrame(draw);
}

function pointerUp() {
  dragging = null;
}

canvas.addEventListener("mousedown", pointerDown);
window.addEventListener("mousemove", pointerMove);
window.addEventListener("mouseup", pointerUp);

canvas.addEventListener("touchstart", pointerDown, { passive: false });
window.addEventListener("touchmove", pointerMove, { passive: false });
window.addEventListener("touchend", pointerUp);

resize();
