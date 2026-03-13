const simCanvas = document.getElementById("simCanvas");
const simCtx = simCanvas.getContext("2d");
const graphCanvas = document.getElementById("graphCanvas");
const graphCtx = graphCanvas.getContext("2d");

const massInput = document.getElementById("massInput");
const springInput = document.getElementById("springInput");
const dampingInput = document.getElementById("dampingInput");

const massVal = document.getElementById("massVal");
const springVal = document.getElementById("springVal");
const dampingVal = document.getElementById("dampingVal");

// Physics state
let mass = parseFloat(massInput.value);
let k = parseFloat(springInput.value);
let damping = parseFloat(dampingInput.value);

let springLength = 150;
let position = 0; // Displacement from equilibrium
let velocity = 0;
let isDragging = false;

// Graph state
const graphHistory = [];
const maxHistoryLength = 300; // number of points to keep
let maxEnergy = 0; // Dynamically scaling Y-axis

function resizeCanvas() {
  const simRect = simCanvas.parentElement.getBoundingClientRect();
  simCanvas.width = simRect.width;
  simCanvas.height = simRect.height;

  const graphRect = graphCanvas.parentElement.getBoundingClientRect();
  graphCanvas.width = graphRect.width;
  graphCanvas.height = graphRect.height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let lastTime = 0;

function updatePhysics(dt) {
  // Simple numerical integration (Euler or Verlet, here Euler)
  // dt is in milliseconds, scale it so variables are intuitive
  const dtS = Math.min(dt / 100, 0.5); // capped dt

  if (!isDragging) {
    // Hooke's Law: F = -kx - cv
    const force = -k * position - damping * velocity;
    const acceleration = force / mass;

    velocity += acceleration * dtS;
    position += velocity * dtS;
  }
}

function calculateEnergy() {
  const kinetic = 0.5 * mass * velocity * velocity;
  const potential = 0.5 * k * position * position;
  const total = kinetic + potential;

  if (total > maxEnergy) {
    // Gradually scale up
    maxEnergy = total;
  } else {
    // Gradually scale down if energy is dropping
    maxEnergy = maxEnergy * 0.999 + total * 0.001;
  }

  // Ensure minimum maxEnergy to prevent zooming into tiny noise
  if (maxEnergy < 10) maxEnergy = 10;

  return { kinetic, potential, total };
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  updatePhysics(dt);

  const energies = calculateEnergy();

  // Record history
  graphHistory.push(energies);
  if (graphHistory.length > maxHistoryLength) {
    graphHistory.shift();
  }

  // Render
  renderSim();
  renderGraph();

  requestAnimationFrame(loop);
}

function renderSim() {
  simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

  const originX = simCanvas.width / 2;
  const originY = 50; // top attachment point
  const currentLength = springLength + position;
  const numCoils = 15;
  const coilWidth = 40;

  // Draw attachment
  simCtx.fillStyle = '#555';
  simCtx.fillRect(originX - 50, originY - 10, 100, 10);

  // Draw spring
  simCtx.beginPath();
  simCtx.strokeStyle = '#aaa';
  simCtx.lineWidth = 3;
  simCtx.moveTo(originX, originY);

  const stepY = currentLength / (numCoils + 1);
  for (let i = 1; i <= numCoils; i++) {
    const x = originX + (i % 2 === 0 ? coilWidth : -coilWidth);
    const y = originY + i * stepY;
    simCtx.lineTo(x, y);
  }
  simCtx.lineTo(originX, originY + currentLength);
  simCtx.stroke();

  // Draw mass
  const massSize = Math.max(30, Math.min(mass * 2, 80)); // Visual size based on mass
  simCtx.fillStyle = isDragging ? '#fff' : '#00aaff';
  simCtx.fillRect(originX - massSize / 2, originY + currentLength, massSize, massSize);

  // Draw equilibrium line
  simCtx.beginPath();
  simCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  simCtx.setLineDash([5, 5]);
  simCtx.moveTo(0, originY + springLength);
  simCtx.lineTo(simCanvas.width, originY + springLength);
  simCtx.stroke();
  simCtx.setLineDash([]);
}

function renderGraph() {
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

  // Draw grid/background
  graphCtx.strokeStyle = '#222';
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  for (let y = 0; y < graphCanvas.height; y += 40) {
    graphCtx.moveTo(0, y);
    graphCtx.lineTo(graphCanvas.width, y);
  }
  graphCtx.stroke();

  if (graphHistory.length < 2) return;

  const dx = graphCanvas.width / (maxHistoryLength - 1);

  // Helper to draw a line
  const drawLine = (key, color) => {
    graphCtx.beginPath();
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 2;
    for (let i = 0; i < graphHistory.length; i++) {
      const x = i * dx;
      const energy = graphHistory[i][key];
      // Map energy to y, ensuring maxEnergy corresponds to top of graph with some margin
      const y = graphCanvas.height - (energy / maxEnergy) * (graphCanvas.height - 20) - 10;
      if (i === 0) graphCtx.moveTo(x, y);
      else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();
  };

  drawLine('kinetic', '#00ffcc');
  drawLine('potential', '#ff00ff');
  drawLine('total', '#ffff00');
}

// Interaction: Sliders
massInput.addEventListener('input', (e) => {
  mass = parseFloat(e.target.value);
  massVal.textContent = mass;
});

springInput.addEventListener('input', (e) => {
  k = parseFloat(e.target.value);
  springVal.textContent = k;
});

dampingInput.addEventListener('input', (e) => {
  damping = parseFloat(e.target.value);
  dampingVal.textContent = damping;
});

// Interaction: Dragging mass
function handlePointerDown(e) {
  const rect = simCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const originX = simCanvas.width / 2;
  const originY = 50;
  const currentLength = springLength + position;
  const massSize = Math.max(30, Math.min(mass * 2, 80));

  // Check if click is inside the mass
  if (
    mouseX >= originX - massSize / 2 &&
    mouseX <= originX + massSize / 2 &&
    mouseY >= originY + currentLength &&
    mouseY <= originY + currentLength + massSize
  ) {
    isDragging = true;
    velocity = 0; // stop moving
  }
}

function handlePointerMove(e) {
  if (!isDragging) return;

  const rect = simCanvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;

  const originY = 50;

  // Set position based on mouse y. Mass is drawn at originY + springLength + position
  // We want the mouse to hold the center (or top) of the mass. Let's hold it by the top attachment.
  position = mouseY - originY - springLength;
  velocity = 0;
}

function handlePointerUp() {
  isDragging = false;
}

simCanvas.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);

requestAnimationFrame(loop);
