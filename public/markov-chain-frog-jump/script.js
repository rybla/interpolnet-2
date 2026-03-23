// Markov Chain Frog Jump - Main Script

const canvas = document.getElementById("simulation-canvas");
const ctx = canvas.getContext("2d");
const speedSlider = document.getElementById("speed-slider");

let width, height;

// Simulation settings
let settings = {
  speed: 50, // 1 to 100
  timeSinceLastJump: 0,
  jumpDuration: 1000, // ms, will be affected by speed
  isJumping: false
};

// State Data Structure
class Lilypad {
  constructor(id, label, xPercent, yPercent, radius) {
    this.id = id;
    this.label = label;
    // Store position as percentages of screen dimensions for responsiveness
    this.xPercent = xPercent;
    this.yPercent = yPercent;
    this.x = 0;
    this.y = 0;
    this.radius = radius;
  }

  updatePosition(w, h) {
    this.x = w * this.xPercent;
    this.y = h * this.yPercent;
  }
}

// Transition Data Structure
class Transition {
  constructor(sourceId, targetId, probability) {
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.probability = probability; // 0.0 to 1.0
  }
}

// Frog Entity
class Frog {
  constructor(startLilypad) {
    this.currentLilypad = startLilypad;
    this.targetLilypad = null;
    this.x = startLilypad.x;
    this.y = startLilypad.y;
    this.jumpProgress = 0; // 0.0 to 1.0
    this.directionAngle = 0;
  }
}

// Global data
const lilypads = [];
const transitions = [];
let frog = null;

// Initialize the Markov Chain network
function initNetwork() {
  const isMobile = window.innerWidth < 768;
  const radius = isMobile ? 35 : 50;

  // 4 States
  lilypads.push(new Lilypad("A", "State A", 0.2, 0.3, radius));
  lilypads.push(new Lilypad("B", "State B", 0.8, 0.3, radius));
  lilypads.push(new Lilypad("C", "State C", 0.8, 0.7, radius));
  lilypads.push(new Lilypad("D", "State D", 0.2, 0.7, radius));

  // Transitions
  transitions.push(new Transition("A", "A", 0.1));
  transitions.push(new Transition("A", "B", 0.6));
  transitions.push(new Transition("A", "D", 0.3));

  transitions.push(new Transition("B", "C", 1.0));

  transitions.push(new Transition("C", "A", 0.4));
  transitions.push(new Transition("C", "D", 0.6));

  transitions.push(new Transition("D", "C", 0.5));
  transitions.push(new Transition("D", "B", 0.5));

  // Update positions for first draw
  resizeCanvas();

  // Initialize frog on State A
  frog = new Frog(lilypads[0]);
}

function drawArrow(ctx, fromX, fromY, toX, toY, radius, weight, isSelfLoop) {
  const headlen = 10;

  if (isSelfLoop) {
    // Draw a loop arc
    ctx.beginPath();
    ctx.arc(fromX - radius * 0.7, fromY - radius * 0.7, radius * 0.8, Math.PI * 0.1, Math.PI * 1.5);
    ctx.lineWidth = Math.max(1, weight * 8);
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--arrow-color');
    ctx.stroke();

    // Arrowhead for self loop
    const arrowX = fromX;
    const arrowY = fromY - radius;
    const angle = Math.PI * 0.2;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - headlen * Math.cos(angle - Math.PI / 6), arrowY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - headlen * Math.cos(angle + Math.PI / 6), arrowY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--arrow-color');
    ctx.fill();
    return;
  }

  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Shorten line so it touches the radius edge instead of center
  const startX = fromX + radius * Math.cos(angle);
  const startY = fromY + radius * Math.sin(angle);
  const endX = toX - radius * Math.cos(angle);
  const endY = toY - radius * Math.sin(angle);

  // Draw Line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = Math.max(1, weight * 8); // Thickness based on probability
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--arrow-color');
  ctx.stroke();

  // Draw Arrowhead
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--arrow-color');
  ctx.fill();

  // Draw Probability Label
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(weight.toFixed(2), midX, midY - 5);
}

function drawLilypad(ctx, lilypad) {
  // Lilypad base
  ctx.beginPath();
  ctx.arc(lilypad.x, lilypad.y, lilypad.radius, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--lilypad-color');
  ctx.fill();

  // Lilypad cut
  ctx.beginPath();
  ctx.moveTo(lilypad.x, lilypad.y);
  ctx.lineTo(lilypad.x + lilypad.radius * Math.cos(Math.PI * 0.2), lilypad.y + lilypad.radius * Math.sin(Math.PI * 0.2));
  ctx.arc(lilypad.x, lilypad.y, lilypad.radius, Math.PI * 0.2, Math.PI * 0.35);
  ctx.lineTo(lilypad.x, lilypad.y);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background-color');
  ctx.fill();

  // Label
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lilypad.label, lilypad.x, lilypad.y);
}

function drawFrog(ctx, frog) {
  // Frog position
  let fx = frog.x;
  let fy = frog.y;
  let scale = 1.0;

  // Jump arc and scaling
  if (frog.jumpProgress > 0 && frog.jumpProgress < 1) {
    const jumpHeight = 100 * Math.sin(frog.jumpProgress * Math.PI); // Parabolic jump height
    scale = 1.0 + Math.sin(frog.jumpProgress * Math.PI) * 0.5; // Scale up at peak of jump
    fy -= jumpHeight;
  }

  // Draw body
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(frog.directionAngle);
  ctx.scale(scale, scale);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--frog-color');
  ctx.fill();

  // Eyes
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--frog-eye');
  ctx.beginPath(); ctx.arc(-10, -15, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -15, 5, 0, Math.PI * 2); ctx.fill();

  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-10, -16, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -16, 2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  // Account for High DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  lilypads.forEach(lp => lp.updatePosition(width, height));
}

let lastTime = 0;
function render(time) {
  const dt = time - lastTime;
  lastTime = time;

  // Clear Canvas
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background-color');
  ctx.fillRect(0, 0, width, height);

  // Draw Transitions (Arrows)
  transitions.forEach(t => {
    const source = lilypads.find(lp => lp.id === t.sourceId);
    const target = lilypads.find(lp => lp.id === t.targetId);
    if (source && target) {
      drawArrow(ctx, source.x, source.y, target.x, target.y, source.radius, t.probability, source.id === target.id);
    }
  });

  // Draw Lilypads
  lilypads.forEach(lp => drawLilypad(ctx, lp));

  // Draw Frog
  if (frog) {
    updateFrog(dt);
    drawFrog(ctx, frog);
  }

  requestAnimationFrame(render);
}

function updateFrog(dt) {
  if (!frog) return;

  if (settings.isJumping) {
    // Progress jump
    settings.timeSinceLastJump += dt;
    frog.jumpProgress = settings.timeSinceLastJump / settings.jumpDuration;

    if (frog.jumpProgress >= 1.0) {
      // Landed
      frog.currentLilypad = frog.targetLilypad;
      frog.targetLilypad = null;
      frog.x = frog.currentLilypad.x;
      frog.y = frog.currentLilypad.y;
      frog.jumpProgress = 0;
      settings.isJumping = false;
      settings.timeSinceLastJump = 0;
    } else {
      // Interpolate position
      const t = frog.jumpProgress;
      frog.x = frog.currentLilypad.x + (frog.targetLilypad.x - frog.currentLilypad.x) * t;
      frog.y = frog.currentLilypad.y + (frog.targetLilypad.y - frog.currentLilypad.y) * t;

      // Face target
      frog.directionAngle = Math.atan2(frog.targetLilypad.y - frog.currentLilypad.y, frog.targetLilypad.x - frog.currentLilypad.x) + Math.PI / 2;
    }
  } else {
    // Wait before next jump based on speed
    settings.timeSinceLastJump += dt;
    // Speed slider: 1 (slow, wait 3s) to 100 (fast, wait 0.1s)
    const waitTime = 3000 - (settings.speed - 1) * (2900 / 99);

    if (settings.timeSinceLastJump >= waitTime) {
      startJump();
    }
  }
}

function startJump() {
  const possibleTransitions = transitions.filter(t => t.sourceId === frog.currentLilypad.id);

  if (possibleTransitions.length === 0) return; // Nowhere to go

  // Weighted random choice
  const rand = Math.random();
  let cumulative = 0;
  let selectedTransition = possibleTransitions[possibleTransitions.length - 1]; // Fallback

  for (let t of possibleTransitions) {
    cumulative += t.probability;
    if (rand <= cumulative) {
      selectedTransition = t;
      break;
    }
  }

  frog.targetLilypad = lilypads.find(lp => lp.id === selectedTransition.targetId);
  settings.isJumping = true;
  settings.timeSinceLastJump = 0;
  // Jump duration scales with speed: 1 (slow, 1.5s jump) to 100 (fast, 0.3s jump)
  settings.jumpDuration = 1500 - (settings.speed - 1) * (1200 / 99);
}

speedSlider.addEventListener('input', (e) => {
  settings.speed = parseInt(e.target.value);
});

window.addEventListener('resize', resizeCanvas);

initNetwork();
requestAnimationFrame(render);
