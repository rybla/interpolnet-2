const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const operationSelect = document.getElementById('operation');
const modulusSlider = document.getElementById('modulus-slider');
const factorSlider = document.getElementById('factor-slider');
const modulusValue = document.getElementById('modulus-value');
const factorValue = document.getElementById('factor-value');
const playPauseBtn = document.getElementById('play-pause-btn');
const resetBtn = document.getElementById('reset-btn');

let state = {
  operation: 'multiply',
  N: parseInt(modulusSlider.value, 10),
  A: parseFloat(factorSlider.value),
  isPlaying: false,
  animationSpeed: 0.005,
  width: 0,
  height: 0,
  radius: 0,
  centerX: 0,
  centerY: 0
};

let animationFrameId = null;

function resizeCanvas() {
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  state.width = canvas.width;
  state.height = canvas.height;
  state.centerX = canvas.width / 2;
  state.centerY = canvas.height / 2;

  // Padding for the circle
  const padding = 40;
  state.radius = Math.min(state.centerX, state.centerY) - padding;

  draw();
}

function updateValues() {
  state.operation = operationSelect.value;
  state.N = parseInt(modulusSlider.value, 10);
  state.A = parseFloat(factorSlider.value);

  modulusValue.textContent = state.N;
  factorValue.textContent = state.A.toFixed(2);

  if (!state.isPlaying) {
    draw();
  }
}

function getPointCoordinates(value, total) {
  // Start from the top (-PI/2) and go clockwise
  const angle = (value / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: state.centerX + Math.cos(angle) * state.radius,
    y: state.centerY + Math.sin(angle) * state.radius
  };
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);

  // Draw the outer circle
  ctx.beginPath();
  ctx.arc(state.centerX, state.centerY, state.radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Determine line style based on operation
  ctx.lineWidth = 1;
  const isMultiply = state.operation === 'multiply';

  // Draw the connecting lines
  for (let x = 0; x < state.N; x++) {
    let y;
    if (isMultiply) {
      y = (x * state.A) % state.N;
    } else {
      y = (x + state.A) % state.N;
    }

    // Smooth color gradient based on starting point
    const hue = (x / state.N) * 360;
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.6)`;

    const p1 = getPointCoordinates(x, state.N);
    const p2 = getPointCoordinates(y, state.N);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Draw points on the circle
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < state.N; i++) {
    const p = getPointCoordinates(i, state.N);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animate() {
  if (state.isPlaying) {
    state.A += state.animationSpeed;

    // Wrap factor around when it hits the max of the slider, or optionally just let it grow.
    // For visual continuity, we wrap it back or just let it keep going if we update the slider.
    if (state.A > parseFloat(factorSlider.max)) {
       state.A = 0;
    }

    factorSlider.value = state.A;
    factorValue.textContent = state.A.toFixed(2);

    draw();
  }
  animationFrameId = requestAnimationFrame(animate);
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    playPauseBtn.textContent = 'Pause';
    playPauseBtn.style.background = '#0ea5e9';
  } else {
    playPauseBtn.textContent = 'Play';
    playPauseBtn.style.background = '#0284c7';
  }
}

function reset() {
  state.isPlaying = false;
  playPauseBtn.textContent = 'Play';
  playPauseBtn.style.background = '#0284c7';

  operationSelect.value = 'multiply';
  modulusSlider.value = 200;
  factorSlider.value = 2;
  updateValues();
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
operationSelect.addEventListener('change', updateValues);
modulusSlider.addEventListener('input', updateValues);
factorSlider.addEventListener('input', updateValues);
playPauseBtn.addEventListener('click', togglePlay);
resetBtn.addEventListener('click', reset);

// Initial Setup
resizeCanvas();
animationFrameId = requestAnimationFrame(animate);
