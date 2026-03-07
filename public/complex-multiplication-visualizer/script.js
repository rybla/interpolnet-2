class Complex {
  constructor(re, im) {
    this.re = re;
    this.im = im;
  }

  get magnitude() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  get angle() {
    return Math.atan2(this.im, this.re);
  }

  multiply(other) {
    const re = this.re * other.re - this.im * other.im;
    const im = this.re * other.im + this.im * other.re;
    return new Complex(re, im);
  }

  polarString() {
    const m = this.magnitude.toFixed(2);
    let a = (this.angle * 180 / Math.PI).toFixed(1);
    if (a < 0) a = (parseFloat(a) + 360).toFixed(1);
    return `${m}e^(i${a}°)`;
  }

  rectString() {
    const r = this.re.toFixed(2);
    const i = Math.abs(this.im).toFixed(2);
    const sign = this.im >= 0 ? "+" : "-";
    return `${r} ${sign} ${i}i`;
  }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height, centerX, centerY, scale;
let z1 = new Complex(1.5, 1.0);
let z2 = new Complex(-1.0, 1.5);
let z3 = z1.multiply(z2);

const colors = {
  bg: "#0b132b",
  grid: "#1c2541",
  axis: "#3a506b",
  z1: "#00ffcc",
  z2: "#ff00ff",
  z3: "#ffff00",
  text: "#e0e1dd"
};

const z1ReInput = document.getElementById("z1-real");
const z1ImInput = document.getElementById("z1-imag");
const z2ReInput = document.getElementById("z2-real");
const z2ImInput = document.getElementById("z2-imag");
const z1Polar = document.getElementById("z1-polar");
const z2Polar = document.getElementById("z2-polar");
const z3Rect = document.getElementById("z3-rect");
const z3Polar = document.getElementById("z3-polar");

let dragging = null;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  centerX = width / 2;
  centerY = height / 2;
  // Calculate scale based on screen size to ensure a few units fit on screen
  scale = Math.min(width, height) / 10;
  draw();
}

function updateInputs() {
  z1ReInput.value = z1.re.toFixed(1);
  z1ImInput.value = z1.im.toFixed(1);
  z2ReInput.value = z2.re.toFixed(1);
  z2ImInput.value = z2.im.toFixed(1);
  updateReadouts();
}

function updateReadouts() {
  z3 = z1.multiply(z2);
  z1Polar.innerHTML = z1.polarString();
  z2Polar.innerHTML = z2.polarString();
  z3Rect.innerHTML = z3.rectString();
  z3Polar.innerHTML = z3.polarString();
}

function toScreen(c) {
  return {
    x: centerX + c.re * scale,
    y: centerY - c.im * scale
  };
}

function fromScreen(x, y) {
  return new Complex(
    (x - centerX) / scale,
    (centerY - y) / scale
  );
}

function drawGrid() {
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
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
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // Draw unit circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(58, 80, 107, 0.5)";
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawArrow(p1, p2, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headlen = 10;
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(p2.x, p2.y);
  ctx.fill();
}

function drawArc(angle1, angle2, radius, color, isDashed=false) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -angle1, -angle2, angle2 > angle1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (isDashed) {
        ctx.setLineDash([4, 4]);
    } else {
        ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawVector(c, color, name) {
  const p = toScreen(c);
  drawArrow({x: centerX, y: centerY}, p, color);

  // Draw endpoint
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw label
  ctx.fillStyle = colors.text;
  ctx.font = "14px Courier New";
  ctx.fillText(name, p.x + 10, p.y - 10);
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawGrid();

  const a1 = z1.angle;
  const a2 = z2.angle;
  let a1Normalized = a1 < 0 ? a1 + 2*Math.PI : a1;
  let a2Normalized = a2 < 0 ? a2 + 2*Math.PI : a2;

  // Draw arcs for angles
  drawArc(0, a1, 30, colors.z1);
  drawArc(0, a2, 40, colors.z2);

  // Draw addition of angles arc
  let a3 = z3.angle;
  let a3Normalized = a3 < 0 ? a3 + 2*Math.PI : a3;

  // Visualize angle addition z1 + z2 by drawing z2's angle starting from z1
  // We draw a dashed arc from z1's angle to z1's angle + z2's angle
  drawArc(a1, a1 + a2, 50, colors.z3, true);

  // Draw vectors
  drawVector(z1, colors.z1, "z₁");
  drawVector(z2, colors.z2, "z₂");
  drawVector(z3, colors.z3, "z₃");

  // Connect z1 to z3 to show scaling roughly, or draw an arc indicating the scaling
  // A subtle dashed line from the end of z1 extended by |z2|
  const z1Norm = new Complex(z1.re / z1.magnitude, z1.im / z1.magnitude);
  const z3scaled = new Complex(z1Norm.re * z3.magnitude, z1Norm.im * z3.magnitude);

  // Just show vector addition/multiplication visual feedback
}

function handlePointerDown(e) {
  const p = fromScreen(e.clientX, e.clientY);
  const d1 = new Complex(z1.re - p.re, z1.im - p.im).magnitude * scale;
  const d2 = new Complex(z2.re - p.re, z2.im - p.im).magnitude * scale;

  if (d1 < 15) {
    dragging = "z1";
  } else if (d2 < 15) {
    dragging = "z2";
  }
}

function handlePointerMove(e) {
  if (!dragging) return;
  const p = fromScreen(e.clientX, e.clientY);

  // Snap to grid if roughly close to integers
  const snapDist = 0.15;
  if (Math.abs(p.re - Math.round(p.re)) < snapDist) p.re = Math.round(p.re);
  if (Math.abs(p.im - Math.round(p.im)) < snapDist) p.im = Math.round(p.im);

  if (dragging === "z1") {
    z1 = p;
  } else if (dragging === "z2") {
    z2 = p;
  }

  updateInputs();
  draw();
}

function handlePointerUp() {
  dragging = null;
}

// Input listeners
function addInputListener(input, updateFunc) {
  input.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateFunc(val);
      updateReadouts();
      draw();
    }
  });
}

addInputListener(z1ReInput, (v) => z1.re = v);
addInputListener(z1ImInput, (v) => z1.im = v);
addInputListener(z2ReInput, (v) => z2.re = v);
addInputListener(z2ImInput, (v) => z2.im = v);

window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerup", handlePointerUp);

// Init
resize();
updateInputs();
updateReadouts();
