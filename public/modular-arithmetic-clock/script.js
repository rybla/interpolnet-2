const canvas = document.getElementById('clock-canvas');
const ctx = canvas.getContext('2d');

const UI = {
  modulus: document.getElementById('modulus'),
  modulusVal: document.getElementById('modulus-val'),
  opA: document.getElementById('operand-a'),
  opAVal: document.getElementById('operand-a-val'),
  opB: document.getElementById('operand-b'),
  opBVal: document.getElementById('operand-b-val'),
  btnAdd: document.getElementById('btn-add'),
  btnMultiply: document.getElementById('btn-multiply'),
  eqA: document.getElementById('eq-a'),
  eqOp: document.getElementById('eq-op'),
  eqB: document.getElementById('eq-b'),
  eqRes: document.getElementById('eq-res'),
  eqN: document.getElementById('eq-n'),
};

const State = {
  n: 12,
  a: 3,
  b: 5,
  operation: 'add',
  animationProgress: 0,
  animationSpeed: 0.005,
  isAnimating: false,
};

const Theme = {
  bg: '#0b0f19',
  cyan: '#00ffcc',
  magenta: '#ff00ff',
  yellow: '#ffff00',
  grid: 'rgba(0, 255, 204, 0.1)',
  border: 'rgba(0, 255, 204, 0.3)',
  text: '#e0e0e0'
};

function resize() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  draw();
}

window.addEventListener('resize', resize);

function init() {
  attachListeners();
  resize();
  updateReadout();
  startAnimation();
}

function attachListeners() {
  UI.modulus.addEventListener('input', (e) => {
    State.n = parseInt(e.target.value);
    UI.modulusVal.textContent = State.n;

    // Adjust bounds of operands based on new modulus
    UI.opA.max = State.n - 1;
    UI.opB.max = State.n - 1;
    if (State.a >= State.n) { State.a = State.n - 1; UI.opA.value = State.a; }
    if (State.b >= State.n) { State.b = State.n - 1; UI.opB.value = State.b; }

    UI.opAVal.textContent = State.a;
    UI.opBVal.textContent = State.b;

    updateReadout();
    startAnimation();
  });

  UI.opA.addEventListener('input', (e) => {
    State.a = parseInt(e.target.value);
    UI.opAVal.textContent = State.a;
    updateReadout();
    startAnimation();
  });

  UI.opB.addEventListener('input', (e) => {
    State.b = parseInt(e.target.value);
    UI.opBVal.textContent = State.b;
    updateReadout();
    startAnimation();
  });

  UI.btnAdd.addEventListener('click', () => {
    State.operation = 'add';
    UI.btnAdd.classList.add('active');
    UI.btnMultiply.classList.remove('active');
    updateReadout();
    startAnimation();
  });

  UI.btnMultiply.addEventListener('click', () => {
    State.operation = 'multiply';
    UI.btnMultiply.classList.add('active');
    UI.btnAdd.classList.remove('active');
    updateReadout();
    startAnimation();
  });
}

function updateReadout() {
  UI.eqA.textContent = State.a;
  UI.eqB.textContent = State.b;
  UI.eqN.textContent = State.n;

  if (State.operation === 'add') {
    UI.eqOp.textContent = '+';
    UI.eqRes.textContent = (State.a + State.b) % State.n;
  } else {
    UI.eqOp.textContent = '×';
    UI.eqRes.textContent = (State.a * State.b) % State.n;
  }
}

function startAnimation() {
  State.animationProgress = 0;
  State.isAnimating = true;
  draw();
}

// Ease out cubic
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Map a number [0, N) to an angle around the clock, starting at top (12 o'clock)
function getAngleForNumber(num, n) {
  return (num / n) * 2 * Math.PI - Math.PI / 2;
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const minDim = Math.min(canvas.width, canvas.height);
  const R = minDim * 0.35; // Clock radius
  const R_nums = R * 1.15; // Numbers radius

  ctx.translate(cx, cy);

  // Draw clock dial
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 2 * Math.PI);
  ctx.strokeStyle = Theme.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw ticks and numbers
  ctx.font = `${Math.max(12, minDim * 0.03)}px Courier New`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < State.n; i++) {
    const angle = getAngleForNumber(i, State.n);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Tick mark
    ctx.beginPath();
    ctx.moveTo(cosA * (R - 10), sinA * (R - 10));
    ctx.lineTo(cosA * R, sinA * R);
    ctx.strokeStyle = Theme.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Number
    const nx = cosA * R_nums;
    const ny = sinA * R_nums;

    // Highlight numbers involved in current operation
    ctx.fillStyle = Theme.text;
    ctx.shadowBlur = 0;

    if (i === 0) {
      ctx.fillStyle = 'white';
    }

    let isResult = false;
    if (State.operation === 'add') {
      if (i === State.a) ctx.fillStyle = Theme.magenta;
      if (i === (State.a + State.b) % State.n) {
        ctx.fillStyle = Theme.cyan;
        isResult = true;
      }
    } else {
      if (i === (State.a * State.b) % State.n) {
        ctx.fillStyle = Theme.cyan;
        isResult = true;
      }
    }

    if (isResult) {
      ctx.shadowColor = Theme.cyan;
      ctx.shadowBlur = 10;
      ctx.font = `bold ${Math.max(14, minDim * 0.04)}px Courier New`;
    } else {
      ctx.font = `${Math.max(12, minDim * 0.03)}px Courier New`;
    }

    ctx.fillText(i.toString(), nx, ny);
  }

  // Animation logic
  ctx.shadowBlur = 0;

  if (State.operation === 'add') {
    drawAddAnimation(R);
  } else {
    drawMultiplyAnimation(R);
  }

  // Handle animation loop
  if (State.isAnimating) {
    State.animationProgress += State.animationSpeed;
    if (State.animationProgress >= 1) {
      State.animationProgress = 1;
      State.isAnimating = false;
    }
    requestAnimationFrame(draw);
  }
}

function drawAddAnimation(R) {
  const p = easeOutCubic(State.animationProgress);
  const totalUnits = State.a + State.b;
  const currentUnits = p * totalUnits;

  const startAngle = getAngleForNumber(0, State.n);

  // Draw first arc (A)
  if (currentUnits > 0) {
    const aUnits = Math.min(currentUnits, State.a);
    const aAngle = getAngleForNumber(aUnits, State.n);

    ctx.beginPath();
    ctx.arc(0, 0, R * 0.9, startAngle, aAngle, false);
    ctx.strokeStyle = Theme.magenta;
    ctx.lineWidth = 6;
    ctx.shadowColor = Theme.magenta;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Draw dot at end of A arc
    if (aUnits === State.a) {
      ctx.beginPath();
      ctx.arc(Math.cos(aAngle) * R * 0.9, Math.sin(aAngle) * R * 0.9, 6, 0, 2 * Math.PI);
      ctx.fillStyle = Theme.magenta;
      ctx.fill();
    }
  }

  // Draw second arc (B)
  if (currentUnits > State.a) {
    const bUnits = currentUnits - State.a;
    const bStartAngle = getAngleForNumber(State.a, State.n);
    const bEndAngle = getAngleForNumber(State.a + bUnits, State.n);

    ctx.beginPath();
    // Use slightly different radius to avoid overlap
    ctx.arc(0, 0, R * 0.82, bStartAngle, bEndAngle, false);
    ctx.strokeStyle = Theme.yellow;
    ctx.lineWidth = 6;
    ctx.shadowColor = Theme.yellow;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Draw dot at end of B arc (Result)
    if (currentUnits === totalUnits) {
      ctx.beginPath();
      ctx.arc(Math.cos(bEndAngle) * R * 0.82, Math.sin(bEndAngle) * R * 0.82, 8, 0, 2 * Math.PI);
      ctx.fillStyle = Theme.cyan;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawMultiplyAnimation(R) {
  const p = easeOutCubic(State.animationProgress);
  const totalSteps = State.b;
  const currentStepProgress = p * totalSteps;

  // Need to draw completed arcs and the currently animating arc
  let baseRadius = R * 0.9;
  const radiusStep = R * 0.05; // Decrease radius slightly for inner spirals

  for (let i = 0; i < totalSteps; i++) {
    if (currentStepProgress > i) {
      const stepP = Math.min(1, currentStepProgress - i);
      const stepUnits = stepP * State.a;
      const stepStart = i * State.a;

      const startAngle = getAngleForNumber(stepStart, State.n);
      const endAngle = getAngleForNumber(stepStart + stepUnits, State.n);

      const rad = baseRadius - (i * radiusStep);

      ctx.beginPath();
      ctx.arc(0, 0, rad, startAngle, endAngle, false);

      // Color alternating slightly or based on step
      const hue = (300 + (i * 20)) % 360; // Magenta-ish to red
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      if (i === totalSteps - 1 && stepP === 1) {
          ctx.strokeStyle = Theme.cyan;
          ctx.shadowColor = Theme.cyan;
      } else {
          ctx.shadowColor = ctx.strokeStyle;
      }
      ctx.lineWidth = 4;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Draw point
      if (stepP === 1) {
          ctx.beginPath();
          ctx.arc(Math.cos(endAngle) * rad, Math.sin(endAngle) * rad, i === totalSteps - 1 ? 8 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = i === totalSteps - 1 ? Theme.cyan : ctx.strokeStyle;
          ctx.fill();
      }
    }
  }
}

// Initial draw
init();
