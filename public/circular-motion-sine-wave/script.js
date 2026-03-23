const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;

let angle = 0;
let angularVelocity = 0.05;
let radius = 100;
let showTrace = true;

const amplitudeInput = document.getElementById('amplitude');
const frequencyInput = document.getElementById('frequency');
const traceToggle = document.getElementById('traceToggle');

// Initialize state from UI
radius = parseFloat(amplitudeInput.value);
angularVelocity = parseFloat(frequencyInput.value);
showTrace = traceToggle.checked;

amplitudeInput.addEventListener('input', (e) => {
  radius = parseFloat(e.target.value);
});

frequencyInput.addEventListener('input', (e) => {
  angularVelocity = parseFloat(e.target.value);
});

traceToggle.addEventListener('change', (e) => {
  showTrace = e.target.checked;
});

let circleCenterX = width / 4;
let circleCenterY = height / 2;

let waveStartX = width / 2;
let wavePoints = [];
const waveSpeed = 2; // Pixels per frame
const maxWavePoints = Math.ceil(width / waveSpeed);

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // On resize, we want to clamp the radius to fit the screen,
  // but let the user override it with the slider up to max.
  // We'll update the slider max to prevent it from going offscreen.
  const maxRadius = Math.min(width / 4, height / 3);
  amplitudeInput.max = maxRadius;
  if (radius > maxRadius) {
    radius = maxRadius;
    amplitudeInput.value = radius;
  }

  circleCenterX = width / 4;
  circleCenterY = height / 2;
  waveStartX = width / 2;
}

window.addEventListener('resize', resize);
resize(); // Initial sizing

function getThemeColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function drawGrid() {
  ctx.strokeStyle = getThemeColor('--grid-color');
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Draw axes for circle
  ctx.moveTo(0, circleCenterY);
  ctx.lineTo(width, circleCenterY);
  ctx.moveTo(circleCenterX, 0);
  ctx.lineTo(circleCenterX, height);

  // Draw axes for wave
  ctx.moveTo(waveStartX, 0);
  ctx.lineTo(waveStartX, height);

  ctx.stroke();
}

function drawWheel(x, y) {
  const circleColor = getThemeColor('--circle-color');

  // Draw main circle
  ctx.strokeStyle = circleColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(circleCenterX, circleCenterY, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (showTrace) {
    // Draw angle trace line inside circle
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(circleCenterX, circleCenterY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Draw point on circle
  ctx.fillStyle = circleColor;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawWave() {
  const waveColor = getThemeColor('--wave-color');

  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < wavePoints.length; i++) {
    const px = waveStartX + (wavePoints.length - 1 - i) * waveSpeed;
    const py = wavePoints[i];

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();

  // Draw leading edge point
  if (wavePoints.length > 0) {
    ctx.fillStyle = waveColor;
    ctx.beginPath();
    ctx.arc(waveStartX, wavePoints[wavePoints.length - 1], 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawConnectingLine(x, y) {
  const lineColor = getThemeColor('--line-color');

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(waveStartX, y);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash
}

function update() {
  angle -= angularVelocity; // Subtract to rotate clockwise like a standard unit circle visualization mapping to time

  const currentX = circleCenterX + radius * Math.cos(angle);
  const currentY = circleCenterY + radius * Math.sin(angle);

  wavePoints.push(currentY);
  if (wavePoints.length > maxWavePoints) {
    wavePoints.shift(); // Remove oldest point
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  drawGrid();
  drawWheel(currentX, currentY);
  drawWave();
  drawConnectingLine(currentX, currentY);

  requestAnimationFrame(update);
}

// Start loop
update();
