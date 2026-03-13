const simCanvas = document.getElementById('simCanvas');
const simCtx = simCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

const massSlider = document.getElementById('massSlider');
const kSlider = document.getElementById('kSlider');
const cSlider = document.getElementById('cSlider');
const resetBtn = document.getElementById('resetBtn');

const massValDisplay = document.getElementById('massVal');
const kValDisplay = document.getElementById('kVal');
const cValDisplay = document.getElementById('cVal');

// Physics State
let mass = parseFloat(massSlider.value);
let k = parseFloat(kSlider.value);
let damping = parseFloat(cSlider.value);

const equilibriumY = simCanvas.height / 2;
let position = 100; // Offset from equilibrium
let velocity = 0;
let isDragging = false;

let energyHistory = [];
const maxHistory = graphCanvas.width;

// Time and integration
let lastTime = 0;

function drawSpring(ctx, startX, startY, endX, endY, coils, width) {
  ctx.beginPath();
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth = 3;
  ctx.moveTo(startX, startY);

  const length = endY - startY;
  const coilLength = length / coils;

  for (let i = 0; i < coils; i++) {
    const y1 = startY + i * coilLength + coilLength * 0.25;
    const y2 = startY + i * coilLength + coilLength * 0.75;
    const y3 = startY + (i + 1) * coilLength;

    ctx.lineTo(startX - width / 2, y1);
    ctx.lineTo(startX + width / 2, y2);
    ctx.lineTo(startX, y3);
  }

  ctx.stroke();
}

function renderSimulation() {
  simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

  // Draw equilibrium line
  simCtx.beginPath();
  simCtx.setLineDash([5, 5]);
  simCtx.moveTo(0, equilibriumY);
  simCtx.lineTo(simCanvas.width, equilibriumY);
  simCtx.strokeStyle = '#444';
  simCtx.stroke();
  simCtx.setLineDash([]);

  const massX = simCanvas.width / 2;
  const massY = equilibriumY + position;
  const boxSize = 40 + mass * 0.5; // Scale visual size slightly with mass

  // Draw Spring
  drawSpring(simCtx, massX, 0, massX, massY - boxSize / 2, 10, 30);

  // Draw Mass
  simCtx.fillStyle = isDragging ? '#33ffdd' : '#00ffcc';
  simCtx.fillRect(massX - boxSize / 2, massY - boxSize / 2, boxSize, boxSize);
  simCtx.strokeStyle = '#111';
  simCtx.lineWidth = 2;
  simCtx.strokeRect(massX - boxSize / 2, massY - boxSize / 2, boxSize, boxSize);
}

function renderGraph() {
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

  // Draw axes
  graphCtx.beginPath();
  graphCtx.strokeStyle = '#444';
  graphCtx.lineWidth = 1;
  graphCtx.moveTo(0, graphCanvas.height - 20);
  graphCtx.lineTo(graphCanvas.width, graphCanvas.height - 20);
  graphCtx.stroke();

  if (energyHistory.length === 0) return;

  // Find max energy to scale graph
  let maxE = 0;
  for (let e of energyHistory) {
    if (e.te > maxE) maxE = e.te;
  }

  // Provide a minimum scale
  maxE = Math.max(maxE, 100);

  const drawLine = (key, color) => {
    graphCtx.beginPath();
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 2;
    for (let i = 0; i < energyHistory.length; i++) {
      const x = i;
      // Scale and invert Y
      const y = graphCanvas.height - 20 - (energyHistory[i][key] / maxE) * (graphCanvas.height - 40);
      if (i === 0) graphCtx.moveTo(x, y);
      else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();
  };

  drawLine('ke', 'cyan');
  drawLine('pe', 'magenta');
  drawLine('te', 'yellow');
}

function updatePhysics(dt) {
  if (isDragging) return;

  // Max dt to prevent instability
  if (dt > 0.05) dt = 0.05;

  // Hooke's Law: F = -kx
  const springForce = -k * position;

  // Damping Force: F = -cv
  const dampingForce = -damping * velocity;

  const totalForce = springForce + dampingForce;
  const acceleration = totalForce / mass;

  // Euler Integration
  velocity += acceleration * (dt * 60); // Scale dt slightly for visual speed
  position += velocity * (dt * 60);
}

function resetSimulation() {
  position = 100;
  velocity = 0;
  energyHistory = [];
}

// Event Listeners for Sliders
massSlider.addEventListener('input', (e) => {
  mass = parseFloat(e.target.value);
  massValDisplay.textContent = mass;
});

kSlider.addEventListener('input', (e) => {
  k = parseFloat(e.target.value);
  kValDisplay.textContent = k;
});

cSlider.addEventListener('input', (e) => {
  damping = parseFloat(e.target.value);
  cValDisplay.textContent = damping;
});

resetBtn.addEventListener('click', resetSimulation);

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  updatePhysics(dt);

  // Calculate Energies
  const ke = 0.5 * mass * velocity * velocity;
  const pe = 0.5 * k * position * position;
  const te = ke + pe;

  energyHistory.push({ ke, pe, te });
  if (energyHistory.length > maxHistory) {
    energyHistory.shift();
  }

  renderSimulation();
  renderGraph();

  requestAnimationFrame(loop);
}

// Interaction handling
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

simCanvas.addEventListener('pointerdown', (e) => {
  const pos = getMousePos(simCanvas, e);
  const massX = simCanvas.width / 2;
  const massY = equilibriumY + position;
  const boxSize = 40 + mass * 0.5;

  if (
    pos.x >= massX - boxSize / 2 && pos.x <= massX + boxSize / 2 &&
    pos.y >= massY - boxSize / 2 && pos.y <= massY + boxSize / 2
  ) {
    isDragging = true;
    velocity = 0; // Stop motion when grabbed
  }
});

simCanvas.addEventListener('pointermove', (e) => {
  if (isDragging) {
    const pos = getMousePos(simCanvas, e);
    position = pos.y - equilibriumY;
  }
});

simCanvas.addEventListener('pointerup', () => {
  isDragging = false;
});

simCanvas.addEventListener('pointerleave', () => {
  isDragging = false;
});

requestAnimationFrame(loop);
