// Lennard-Jones Gas Simulation

const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');

const volumeSlider = document.getElementById('volume-slider');
const readoutVolume = document.getElementById('readout-volume');
const readoutPressure = document.getElementById('readout-pressure');
const readoutTemperature = document.getElementById('readout-temperature');
const resetButton = document.getElementById('reset-button');

// Simulation Constants
const NUM_PARTICLES = 250;
const SIGMA = 10; // Particle "diameter" and zero-crossing of potential
const EPSILON = 2.0; // Depth of the potential well
const MASS = 1.0;
const TIMESTEP = 0.05;

// We use an interaction radius cutoff for performance
const R_CUTOFF = SIGMA * 3;
const R_CUTOFF_SQ = R_CUTOFF * R_CUTOFF;

// Canvas & Container
let canvasWidth, canvasHeight;
let maxContainerWidth;
let containerHeight;
let containerWidth;

// State
let particles = [];
let pressureAccumulator = 0;
let timeAccumulator = 0;

function resize() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  maxContainerWidth = Math.min(canvasWidth * 0.8, 800);
  containerHeight = Math.min(canvasHeight * 0.8, 600);

  updateContainerSize();
}

function updateContainerSize() {
  const volumeFraction = parseFloat(volumeSlider.value);
  const newWidth = maxContainerWidth * volumeFraction;

  // Squeeze particles if the container shrinks past them
  particles.forEach(p => {
    // Keep them bounded by new wall, add tiny random jitter to prevent perfect overlap
    const jitter = Math.random() * 2.0;
    const wallX = canvasWidth / 2 + newWidth / 2;
    if (p.x + SIGMA/2 > wallX) {
      p.x = wallX - SIGMA/2 - 1 - jitter;
      if (p.vx > 0) p.vx *= -1;
    }
    const leftWallX = canvasWidth / 2 - newWidth / 2;
    if (p.x - SIGMA/2 < leftWallX) {
      p.x = leftWallX + SIGMA/2 + 1 + jitter;
      if (p.vx < 0) p.vx *= -1;
    }
  });

  containerWidth = newWidth;
  readoutVolume.textContent = `${(volumeFraction * 100).toFixed(0)}%`;
}

function initParticles() {
  particles = [];
  const startWidth = maxContainerWidth * parseFloat(volumeSlider.value);
  const startX = canvasWidth / 2 - startWidth / 2;
  const startY = canvasHeight / 2 - containerHeight / 2;

  // Arrange in a grid to prevent explosive overlaps initially
  const cols = Math.ceil(Math.sqrt(NUM_PARTICLES));
  const rows = Math.ceil(NUM_PARTICLES / cols);

  const cellW = startWidth / cols;
  const cellH = containerHeight / rows;

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Add some random jitter
    const jitterX = (Math.random() - 0.5) * cellW * 0.5;
    const jitterY = (Math.random() - 0.5) * cellH * 0.5;

    // Random initial velocity to give temperature
    const vMag = 5;
    const angle = Math.random() * Math.PI * 2;

    particles.push({
      x: startX + col * cellW + cellW / 2 + jitterX,
      y: startY + row * cellH + cellH / 2 + jitterY,
      vx: Math.cos(angle) * vMag,
      vy: Math.sin(angle) * vMag,
      fx: 0,
      fy: 0
    });
  }
}

function calculateForces() {
  // Reset forces
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles[i].fx = 0;
    particles[i].fy = 0;
  }

  // Calculate pairwise Lennard-Jones forces
  for (let i = 0; i < NUM_PARTICLES; i++) {
    for (let j = i + 1; j < NUM_PARTICLES; j++) {
      const p1 = particles[i];
      const p2 = particles[j];

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const rSq = dx * dx + dy * dy;

      // Clamp rSq to prevent explosive forces if particles somehow perfectly overlap
      const clampedRSq = Math.max(rSq, SIGMA * SIGMA * 0.1);

      if (rSq < R_CUTOFF_SQ) {
        const r2inv = 1.0 / clampedRSq;
        const r6inv = r2inv * r2inv * r2inv;
        const sig6 = SIGMA * SIGMA * SIGMA * SIGMA * SIGMA * SIGMA;
        const term6 = sig6 * r6inv;
        const term12 = term6 * term6;

        // F = 24 * epsilon * (2 * (sigma/r)^12 - (sigma/r)^6) / r
        // Force magnitude divided by r (to multiply by dx, dy later for vector components)
        let forceMagnitudeOverR = 24 * EPSILON * (2 * term12 - term6) * r2inv;

        // Final sanity clamp on total force to prevent NaNs jumping out
        if (forceMagnitudeOverR > 500) forceMagnitudeOverR = 500;
        if (forceMagnitudeOverR < -500) forceMagnitudeOverR = -500;

        const fx = forceMagnitudeOverR * dx;
        const fy = forceMagnitudeOverR * dy;

        p1.fx += fx;
        p1.fy += fy;
        p2.fx -= fx;
        p2.fy -= fy;
      }
    }
  }
}

function updatePhysics() {
  const leftWall = canvasWidth / 2 - containerWidth / 2;
  const rightWall = canvasWidth / 2 + containerWidth / 2;
  const topWall = canvasHeight / 2 - containerHeight / 2;
  const bottomWall = canvasHeight / 2 + containerHeight / 2;

  let totalKineticEnergy = 0;
  let momentumTransfer = 0;

  // Simple Euler/Verlet style integration
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particles[i];

    // Update velocity
    p.vx += (p.fx / MASS) * TIMESTEP;
    p.vy += (p.fy / MASS) * TIMESTEP;

    // Apply a tiny bit of damping to prevent numeric explosions and simulate thermostat
    p.vx *= 0.999;
    p.vy *= 0.999;

    // Update position
    p.x += p.vx * TIMESTEP;
    p.y += p.vy * TIMESTEP;

    // Wall collisions
    const radius = SIGMA / 2;
    if (p.x - radius < leftWall) {
      p.x = leftWall + radius;
      p.vx *= -1;
      momentumTransfer += 2 * MASS * Math.abs(p.vx);
    } else if (p.x + radius > rightWall) {
      p.x = rightWall - radius;
      p.vx *= -1;
      momentumTransfer += 2 * MASS * Math.abs(p.vx);
    }

    if (p.y - radius < topWall) {
      p.y = topWall + radius;
      p.vy *= -1;
      momentumTransfer += 2 * MASS * Math.abs(p.vy);
    } else if (p.y + radius > bottomWall) {
      p.y = bottomWall - radius;
      p.vy *= -1;
      momentumTransfer += 2 * MASS * Math.abs(p.vy);
    }

    totalKineticEnergy += 0.5 * MASS * (p.vx * p.vx + p.vy * p.vy);
  }

  // Calculate Temperature (proportional to average kinetic energy)
  const temperature = totalKineticEnergy / NUM_PARTICLES;

  // Format very large/small numbers cleanly
  if (temperature > 9999 || temperature < 0.01 && temperature > 0) {
      readoutTemperature.textContent = temperature.toExponential(2);
  } else {
      readoutTemperature.textContent = temperature.toFixed(2);
  }

  // Accumulate pressure over time for a smoother readout
  // Pressure ~ Force/Area. Here it's momentum transfer per time per perimeter length.
  pressureAccumulator += momentumTransfer / TIMESTEP;
  timeAccumulator++;

  if (timeAccumulator > 10) {
    const perimeter = 2 * (containerWidth + containerHeight);
    const pressure = (pressureAccumulator / 10) / perimeter;
    if (pressure > 9999 || pressure < 0.01 && pressure > 0) {
        readoutPressure.textContent = pressure.toExponential(2);
    } else {
        readoutPressure.textContent = pressure.toFixed(2);
    }
    pressureAccumulator = 0;
    timeAccumulator = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw Container
  const leftWall = canvasWidth / 2 - containerWidth / 2;
  const topWall = canvasHeight / 2 - containerHeight / 2;

  ctx.strokeStyle = '#2a344a';
  ctx.lineWidth = 4;
  ctx.strokeRect(leftWall, topWall, containerWidth, containerHeight);

  // Draw Particles
  const radius = SIGMA / 2;
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = particles[i];

    // Color based on speed
    const speedSq = p.vx * p.vx + p.vy * p.vy;
    // Map speed to hue: slow=blue (240), fast=red (0)
    let hue = 240 - speedSq * 2;
    if (hue < 0) hue = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.fill();
  }
}

function loop() {
  // Run physics multiple substeps per frame for stability
  for(let i = 0; i < 4; i++){
      calculateForces();
      updatePhysics();
  }
  draw();
  requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('resize', resize);

volumeSlider.addEventListener('input', () => {
  updateContainerSize();
});

resetButton.addEventListener('click', () => {
  initParticles();
});

// Boot
resize();
initParticles();
requestAnimationFrame(loop);
