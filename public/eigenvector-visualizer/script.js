const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');

const inputs = {
  a: document.getElementById('mat-a'),
  b: document.getElementById('mat-b'),
  c: document.getElementById('mat-c'),
  d: document.getElementById('mat-d'),
};

const btnAnimate = document.getElementById('btn-animate');
const btnReset = document.getElementById('btn-reset');
const eigenInfoContent = document.getElementById('eigen-info-content');

// Colors
const COLOR_GRID_MAIN = '#333';
const COLOR_GRID_SUB = '#222';
const COLOR_AXIS = '#555';
const COLOR_UNIT_I = '#00ffcc';
const COLOR_UNIT_J = '#00aaff';
const COLOR_EIGEN_1 = '#ff007f';
const COLOR_EIGEN_2 = '#ffcc00';

// Canvas setup
let width = 0;
let height = 0;
const scale = 40; // pixels per unit

function resizeCanvas() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) - 32; // padding

  // Set logical resolution
  canvas.width = size * window.devicePixelRatio;
  canvas.height = size * window.devicePixelRatio;

  // Set visual size
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  width = canvas.width;
  height = canvas.height;

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // We want the origin (0,0) at the center
  // And standard cartesian Y (up is positive).
  ctx.translate(size / 2, size / 2);
  ctx.scale(1, -1);

  draw();
}

// Animation state
let isAnimating = false;
let animationProgress = 0; // 0 to 1
let animationStartTarget = null;
let currentMatrix = { a: 1, b: 0, c: 0, d: 1 };
let targetMatrix = { a: 1, b: 0, c: 0, d: 1 };
let reqFrameId = null;

function getMatrixFromInputs() {
  return {
    a: parseFloat(inputs.a.value) || 0,
    b: parseFloat(inputs.b.value) || 0,
    c: parseFloat(inputs.c.value) || 0,
    d: parseFloat(inputs.d.value) || 0
  };
}

function computeEigenvectors(a, b, c, d) {
  // Characteristic equation: det(A - lambda * I) = 0
  // (a - L)(d - L) - bc = 0
  // L^2 - (a+d)L + (ad - bc) = 0

  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    return []; // Complex eigenvalues, no real eigenvectors
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const l1 = (trace + sqrtDisc) / 2;
  const l2 = (trace - sqrtDisc) / 2;

  const eigens = [];

  // Find eigenvector for L1
  // (a - L1)x + by = 0 => y = -(a - L1)/b * x  (if b != 0)
  // cx + (d - L1)y = 0 => x = -(d - L1)/c * y  (if c != 0)

  function getVec(lambda) {
    let x, y;
    if (Math.abs(b) > 1e-6) {
      x = 1;
      y = -(a - lambda) / b;
    } else if (Math.abs(c) > 1e-6) {
      y = 1;
      x = -(d - lambda) / c;
    } else {
      // diagonal matrix
      if (Math.abs(a - lambda) < 1e-6) {
        x = 1; y = 0;
      } else {
        x = 0; y = 1;
      }
    }
    // Normalize
    const len = Math.sqrt(x*x + y*y);
    return { x: x/len, y: y/len, lambda };
  }

  if (discriminant === 0) {
    // Repeated root
    const vec = getVec(l1);
    if (!isNaN(vec.x) && !isNaN(vec.y)) {
      eigens.push(vec);
    }
  } else {
    eigens.push(getVec(l1));
    eigens.push(getVec(l2));
  }

  return eigens;
}

function updateEigenInfo(matrix) {
  const eigens = computeEigenvectors(matrix.a, matrix.b, matrix.c, matrix.d);

  if (eigens.length === 0) {
    eigenInfoContent.innerHTML = `<p>No real eigenvectors for this transformation.</p>`;
    return;
  }

  let html = '';
  eigens.forEach((e, i) => {
    const cls = i === 0 ? 'eigen-1-text' : 'eigen-2-text';
    const lText = e.lambda.toFixed(2);
    const xText = e.x.toFixed(2);
    const yText = e.y.toFixed(2);
    html += `<div class="eigen-item">
      <span class="${cls}">λ${i+1} = ${lText}</span><br>
      <span style="color:var(--text-muted)">v${i+1} = [${xText}, ${yText}]</span>
    </div>`;
  });

  eigenInfoContent.innerHTML = html;
}

function drawGrid(a, b, c, d, colorMain, colorSub, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Transform context
  // NOTE: We are already in inverted Y space, so we pass the matrix directly.
  // The canvas coordinates are:
  // x' = ax + cy
  // y' = bx + dy
  // Canvas transform is (m11, m12, m21, m22, dx, dy)
  // This means m11=a, m12=b, m21=c, m22=d.
  // Wait, standard canvas transform is:
  // x' = m11*x + m21*y + dx
  // y' = m12*x + m22*y + dy
  // So:
  // m11 = a
  // m21 = b   <-- wait, usually it's column vectors
  // If [x'] = [a b] [x]
  //    [y']   [c d] [y]
  // Then x' = ax + by, y' = cx + dy.
  // Canvas does:
  // x' = m11*x + m21*y
  // y' = m12*x + m22*y
  // So m11=a, m21=b, m12=c, m22=d.
  ctx.transform(a, c, b, d, 0, 0);

  const viewSize = Math.max(width, height) / scale * 2;

  ctx.lineWidth = 1 / scale; // constant visual thickness

  // Draw sub grid
  ctx.strokeStyle = colorSub;
  ctx.beginPath();
  for (let i = -viewSize; i <= viewSize; i += 1) {
    if (i === 0) continue;
    // vertical
    ctx.moveTo(i, -viewSize);
    ctx.lineTo(i, viewSize);
    // horizontal
    ctx.moveTo(-viewSize, i);
    ctx.lineTo(viewSize, i);
  }
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = colorAxis;
  ctx.lineWidth = 2 / scale;
  ctx.beginPath();
  ctx.moveTo(0, -viewSize);
  ctx.lineTo(0, viewSize);
  ctx.moveTo(-viewSize, 0);
  ctx.lineTo(viewSize, 0);
  ctx.stroke();

  ctx.restore();
}

const colorAxis = COLOR_AXIS;

function drawVector(x, y, color, label, a=1, b=0, c=0, d=1) {
  ctx.save();

  // Transform vector
  const tx = a * x + b * y;
  const ty = c * x + d * y;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2 / scale;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Arrow head
  const headlen = 0.3;
  const angle = Math.atan2(ty, tx);
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headlen * Math.cos(angle - Math.PI / 6), ty - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tx - headlen * Math.cos(angle + Math.PI / 6), ty - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEigenLine(vec, color, a, b, c, d) {
  ctx.save();
  const viewSize = Math.max(width, height) / scale * 2;

  // The eigenvector direction line (span)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / scale;

  // Draw dashed line representing the span BEFORE transformation
  ctx.setLineDash([5/scale, 5/scale]);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(-vec.x * viewSize, -vec.y * viewSize);
  ctx.lineTo(vec.x * viewSize, vec.y * viewSize);
  ctx.stroke();

  // Draw solid vector AFTER transformation (which should lie on the same line)
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  const tx = a * vec.x + b * vec.y;
  const ty = c * vec.x + d * vec.y;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Arrow head
  const headlen = 0.4;
  const angle = Math.atan2(ty, tx);
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headlen * Math.cos(angle - Math.PI / 6), ty - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tx - headlen * Math.cos(angle + Math.PI / 6), ty - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function draw() {
  // Clear
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const size = Math.min(canvas.style.width ? parseInt(canvas.style.width) : width,
                        canvas.style.height ? parseInt(canvas.style.height) : height);

  ctx.save();
  ctx.scale(scale, scale); // Scale to math units

  // Interpolate matrix if animating
  let m = currentMatrix;
  if (isAnimating) {
    const t = easeInOutCubic(animationProgress);
    m = {
      a: lerp(animationStartTarget.a, targetMatrix.a, t),
      b: lerp(animationStartTarget.b, targetMatrix.b, t),
      c: lerp(animationStartTarget.c, targetMatrix.c, t),
      d: lerp(animationStartTarget.d, targetMatrix.d, t),
    };
  }

  // Draw base grid (Identity)
  drawGrid(1, 0, 0, 1, COLOR_GRID_MAIN, COLOR_GRID_SUB, 0.3);

  // Draw transformed grid
  drawGrid(m.a, m.b, m.c, m.d, '#666', '#444', 0.8);

  // Draw basis vectors
  drawVector(1, 0, COLOR_UNIT_I, 'i', m.a, m.b, m.c, m.d);
  drawVector(0, 1, COLOR_UNIT_J, 'j', m.a, m.b, m.c, m.d);

  // Draw eigenvectors
  const eigens = computeEigenvectors(targetMatrix.a, targetMatrix.b, targetMatrix.c, targetMatrix.d);

  eigens.forEach((e, i) => {
    drawEigenLine(e, i === 0 ? COLOR_EIGEN_1 : COLOR_EIGEN_2, m.a, m.b, m.c, m.d);
  });

  ctx.restore();

  if (!isAnimating) {
      updateEigenInfo(targetMatrix);
  }
}

// Math utils
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate() {
  if (!isAnimating) return;

  animationProgress += 0.015;
  if (animationProgress >= 1) {
    animationProgress = 1;
    isAnimating = false;
    currentMatrix = { ...targetMatrix };
  }

  draw();

  if (isAnimating) {
    reqFrameId = requestAnimationFrame(animate);
  }
}

function startAnimation() {
  if (reqFrameId) cancelAnimationFrame(reqFrameId);
  targetMatrix = getMatrixFromInputs();
  animationStartTarget = { a: 1, b: 0, c: 0, d: 1 };
  currentMatrix = { a: 1, b: 0, c: 0, d: 1 };
  animationProgress = 0;
  isAnimating = true;
  animate();
}

function reset() {
  inputs.a.value = 1;
  inputs.b.value = 0;
  inputs.c.value = 0;
  inputs.d.value = 1;

  if (reqFrameId) cancelAnimationFrame(reqFrameId);
  isAnimating = false;
  currentMatrix = { a: 1, b: 0, c: 0, d: 1 };
  targetMatrix = { a: 1, b: 0, c: 0, d: 1 };
  draw();
}

// Listeners
window.addEventListener('resize', resizeCanvas);

btnAnimate.addEventListener('click', startAnimation);
btnReset.addEventListener('click', reset);

[inputs.a, inputs.b, inputs.c, inputs.d].forEach(input => {
  input.addEventListener('input', () => {
    if (!isAnimating) {
      targetMatrix = getMatrixFromInputs();
      currentMatrix = { ...targetMatrix }; // Update instantly when typing
      draw();
    }
  });
});

// Init
resizeCanvas();
