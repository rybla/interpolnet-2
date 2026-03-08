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
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const btnStep = document.getElementById("btn-step");
const probabilitiesContainer = document.getElementById("probabilities");

const NUM_STATES = 3;
const STATE_NAMES = ["A", "B", "C"];

// Transition matrix [from][to]
let transitionMatrix = [
  [0.5, 0.3, 0.2], // From A
  [0.2, 0.6, 0.2], // From B
  [0.1, 0.1, 0.8], // From C
];

let width, height;
let statePositions = [];
let currentState = 0;

let isPlaying = false;
let isJumping = false;
let jumpProgress = 0; // 0.0 to 1.0
let jumpFrom = 0;
let jumpTo = 0;
let lastTime = 0;

// Config
const LILYPAD_RADIUS = 50;
const FROG_RADIUS = 15;
const JUMP_DURATION = 1000; // ms
const WAIT_DURATION = 500; // ms
let waitTimer = 0;

// Style Config
const style = getComputedStyle(document.body);
const colors = {
  lilypad: style.getPropertyValue("--lilypad").trim() || "#2eb85c",
  lilypadHighlight: style.getPropertyValue("--lilypad-highlight").trim() || "#4ceb84",
  frog: style.getPropertyValue("--frog").trim() || "#ff9800",
  frogHighlight: style.getPropertyValue("--frog-highlight").trim() || "#ffc107",
  arrow: style.getPropertyValue("--arrow").trim() || "rgba(255, 255, 255, 0.4)",
  arrowHighlight: style.getPropertyValue("--arrow-highlight").trim() || "rgba(255, 235, 59, 0.9)",
  textMain: style.getPropertyValue("--text-main").trim() || "#e0f2f1",
  textMuted: style.getPropertyValue("--text-muted").trim() || "#80cbc4",
};

function init() {
  resize();
  window.addEventListener("resize", resize);

  createUI();

  btnPlay.addEventListener("click", startPlay);
  btnPause.addEventListener("click", pausePlay);
  btnStep.addEventListener("click", doStep);

  requestAnimationFrame(loop);
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Calculate lilypad positions (equilateral triangle)
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.25;

  // Shift slightly to left to accommodate UI on desktop
  const xOffset = window.innerWidth > 768 ? -100 : 0;

  statePositions = [
    { x: cx + xOffset, y: cy - radius }, // Top (A)
    { x: cx + xOffset + radius * Math.cos(Math.PI / 6), y: cy + radius * Math.sin(Math.PI / 6) }, // Bottom Right (B)
    { x: cx + xOffset - radius * Math.cos(Math.PI / 6), y: cy + radius * Math.sin(Math.PI / 6) }  // Bottom Left (C)
  ];
}

function createUI() {
  probabilitiesContainer.innerHTML = "";

  for (let from = 0; from < NUM_STATES; from++) {
    const group = document.createElement("div");
    group.className = "probability-group";

    const title = document.createElement("div");
    title.className = "probability-title";
    title.textContent = `From ${STATE_NAMES[from]}`;
    group.appendChild(title);

    for (let to = 0; to < NUM_STATES; to++) {
      const row = document.createElement("div");
      row.className = "slider-row";

      const label = document.createElement("div");
      label.className = "slider-label";
      label.textContent = `To ${STATE_NAMES[to]}`;

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "1";
      slider.step = "0.01";
      slider.value = transitionMatrix[from][to];
      slider.id = `slider-${from}-${to}`;

      const valDisplay = document.createElement("div");
      valDisplay.className = "slider-value";
      valDisplay.id = `val-${from}-${to}`;
      valDisplay.textContent = transitionMatrix[from][to].toFixed(2);

      slider.addEventListener("input", (e) => handleSliderChange(from, to, parseFloat(e.target.value)));

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(valDisplay);
      group.appendChild(row);
    }

    probabilitiesContainer.appendChild(group);
  }
}

function handleSliderChange(from, changedTo, newValue) {
  const oldVal = transitionMatrix[from][changedTo];
  const diff = newValue - oldVal;

  transitionMatrix[from][changedTo] = newValue;

  // Adjust other probabilities to maintain sum = 1
  let sumOthers = 0;
  for (let to = 0; to < NUM_STATES; to++) {
    if (to !== changedTo) {
      sumOthers += transitionMatrix[from][to];
    }
  }

  if (sumOthers > 0) {
    // Proportional adjustment
    const ratio = (sumOthers - diff) / sumOthers;
    for (let to = 0; to < NUM_STATES; to++) {
      if (to !== changedTo) {
        let adjusted = transitionMatrix[from][to] * ratio;
        adjusted = Math.max(0, Math.min(1, adjusted)); // Clamp between 0 and 1
        transitionMatrix[from][to] = adjusted;
      }
    }
  } else if (diff < 0) {
    // If others are 0 and we are decreasing, distribute evenly
    const increase = -diff / (NUM_STATES - 1);
    for (let to = 0; to < NUM_STATES; to++) {
      if (to !== changedTo) {
        transitionMatrix[from][to] = increase;
      }
    }
  } else {
    // If sum is exceeding 1 and others are 0, this shouldn't happen via slider, but just in case
    transitionMatrix[from][changedTo] = 1;
  }

  // Final normalization step to fix floating point errors
  let total = 0;
  for (let to = 0; to < NUM_STATES; to++) {
    total += transitionMatrix[from][to];
  }

  if (total > 0) {
    for (let to = 0; to < NUM_STATES; to++) {
      transitionMatrix[from][to] /= total;
    }
  } else {
      transitionMatrix[from][changedTo] = 1; // Fallback
  }

  updateUI();
}

function updateUI() {
  for (let from = 0; from < NUM_STATES; from++) {
    for (let to = 0; to < NUM_STATES; to++) {
      const slider = document.getElementById(`slider-${from}-${to}`);
      const valDisplay = document.getElementById(`val-${from}-${to}`);
      if (slider && valDisplay) {
        const val = transitionMatrix[from][to];
        slider.value = val;
        valDisplay.textContent = val.toFixed(2);
      }
    }
  }
}

function startPlay() {
  isPlaying = true;
  btnPlay.disabled = true;
  btnPause.disabled = false;
  btnStep.disabled = true;
  if (!isJumping) {
    waitTimer = 0; // Trigger next jump immediately
  }
}

function pausePlay() {
  isPlaying = false;
  btnPlay.disabled = false;
  btnPause.disabled = true;
  btnStep.disabled = false;
}

function doStep() {
  if (!isJumping) {
    startJump();
  }
}

function startJump() {
  jumpFrom = currentState;

  // Determine next state based on probabilities
  const rand = Math.random();
  let cumulative = 0;
  jumpTo = jumpFrom; // Default fallback

  for (let to = 0; to < NUM_STATES; to++) {
    cumulative += transitionMatrix[jumpFrom][to];
    if (rand <= cumulative) {
      jumpTo = to;
      break;
    }
  }

  isJumping = true;
  jumpProgress = 0;
}

function drawArrow(x1, y1, x2, y2, isSelfLoop, weight, isHighlighted) {
  if (weight < 0.01 && !isHighlighted) return; // Don't draw near-zero probabilities unless highlighted

  ctx.save();
  ctx.strokeStyle = isHighlighted ? colors.arrowHighlight : colors.arrow;
  ctx.lineWidth = Math.max(1, weight * 10);
  if (isHighlighted) {
      ctx.lineWidth += 2;
      ctx.shadowColor = colors.arrowHighlight;
      ctx.shadowBlur = 10;
  }

  ctx.beginPath();

  const headlen = 10 + weight * 10; // length of head in pixels

  if (isSelfLoop) {
    // Draw a loop
    const loopRadius = 40;
    const angleOffset = Math.PI / 4;

    // Calculate direction away from center of screen to put loop on outside
    const cx = width / 2;
    const cy = height / 2;
    const dxCenter = x1 - cx;
    const dyCenter = y1 - cy;
    let baseAngle = Math.atan2(dyCenter, dxCenter);

    const cp1x = x1 + Math.cos(baseAngle - angleOffset) * loopRadius * 2;
    const cp1y = y1 + Math.sin(baseAngle - angleOffset) * loopRadius * 2;
    const cp2x = x1 + Math.cos(baseAngle + angleOffset) * loopRadius * 2;
    const cp2y = y1 + Math.sin(baseAngle + angleOffset) * loopRadius * 2;

    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x1, y1);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y1 - cp2y, x1 - cp2x);
    // Draw arrow slightly away from center so it's visible outside lilypad
    const edgeX = x1 - Math.cos(angle) * (LILYPAD_RADIUS + 5);
    const edgeY = y1 - Math.sin(angle) * (LILYPAD_RADIUS + 5);

    ctx.beginPath();
    ctx.moveTo(edgeX, edgeY);
    ctx.lineTo(edgeX - headlen * Math.cos(angle - Math.PI / 6), edgeY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(edgeX - headlen * Math.cos(angle + Math.PI / 6), edgeY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();

  } else {
    // Draw a curved line between two different states
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Offset endpoints so line starts/ends at edge of lilypad
    const angle = Math.atan2(dy, dx);
    const startX = x1 + Math.cos(angle) * LILYPAD_RADIUS;
    const startY = y1 + Math.sin(angle) * LILYPAD_RADIUS;
    const endX = x2 - Math.cos(angle) * LILYPAD_RADIUS;
    const endY = y2 - Math.sin(angle) * LILYPAD_RADIUS;

    // Curve slightly to right to separate bidirectional arrows
    const curveOffset = dist * 0.2;
    const normalX = -dy / dist;
    const normalY = dx / dist;

    const cpX = (startX + endX) / 2 + normalX * curveOffset;
    const cpY = (startY + endY) / 2 + normalY * curveOffset;

    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();

    // Arrow head
    // Calculate tangent angle at end point for arrow head
    // Derivative of quadratic bezier curve B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2 at t=1 is 2(P2 - P1)
    const tx = endX - cpX;
    const ty = endY - cpY;
    const tangentAngle = Math.atan2(ty, tx);

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(tangentAngle - Math.PI / 6), endY - headlen * Math.sin(tangentAngle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(tangentAngle + Math.PI / 6), endY - headlen * Math.sin(tangentAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
  ctx.restore();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt, timestamp);
  draw(timestamp);

  requestAnimationFrame(loop);
}

function update(dt, timestamp) {
  if (isJumping) {
    jumpProgress += dt / JUMP_DURATION;
    if (jumpProgress >= 1) {
      isJumping = false;
      jumpProgress = 0;
      currentState = jumpTo;
      waitTimer = 0;
    }
  } else if (isPlaying) {
    waitTimer += dt;
    if (waitTimer >= WAIT_DURATION) {
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
function draw(timestamp) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Bobbing offset
  const bobbing = Math.sin(timestamp / 500) * 5;

  // Draw Transitions (Arrows)
  for (let from = 0; from < NUM_STATES; from++) {
    for (let to = 0; to < NUM_STATES; to++) {
      const weight = transitionMatrix[from][to];
      const isHighlighted = isJumping && jumpFrom === from && jumpTo === to;

      const p1 = statePositions[from];
      const p2 = statePositions[to];

      const y1 = p1.y + (from === currentState && !isJumping ? bobbing : 0);
      const y2 = p2.y + (to === currentState && !isJumping ? bobbing : 0);

      drawArrow(p1.x, y1, p2.x, y2, from === to, weight, isHighlighted);
    }
  }

  // Draw Lilypads
  for (let i = 0; i < NUM_STATES; i++) {
    const pos = statePositions[i];
    const isCurrent = (i === currentState && !isJumping) || (isJumping && i === jumpTo && jumpProgress > 0.8);

    const currentBobbing = isCurrent ? bobbing : 0;
    const y = pos.y + currentBobbing;

    ctx.save();
    ctx.translate(pos.x, y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 10, LILYPAD_RADIUS, LILYPAD_RADIUS * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Lilypad
    ctx.beginPath();
    // A circle with a slice taken out
    ctx.arc(0, 0, LILYPAD_RADIUS, 0, Math.PI * 1.8);
    ctx.lineTo(0,0);
    ctx.closePath();

    ctx.fillStyle = isCurrent ? colors.lilypadHighlight : colors.lilypad;
    if (isCurrent) {
      ctx.shadowColor = colors.lilypadHighlight;
      ctx.shadowBlur = 15;
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.fillText(STATE_NAMES[i], -5, -5); // Offset slightly because of the slice

    ctx.restore();
  }

  // Draw Frog
  let frogX, frogY;

  if (isJumping) {
    const p1 = statePositions[jumpFrom];
    const p2 = statePositions[jumpTo];

    if (jumpFrom === jumpTo) {
      // Self loop jump animation
      const loopRadius = 40;
      const angleOffset = Math.PI / 4;
      const cx = width / 2;
      const cy = height / 2;
      const dxCenter = p1.x - cx;
      const dyCenter = p1.y - cy;
      let baseAngle = Math.atan2(dyCenter, dxCenter);

      // Interpolate along bezier curve roughly
      // For simplicity in animation, just do an arc outward and back
      const jumpHeight = 30 * Math.sin(jumpProgress * Math.PI);
      const outDistance = 60 * Math.sin(jumpProgress * Math.PI);

      frogX = p1.x + Math.cos(baseAngle) * outDistance;
      frogY = p1.y + Math.sin(baseAngle) * outDistance - jumpHeight;

    } else {
      // Jump between states
      // Calculate curve control point same as arrow
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curveOffset = dist * 0.2;
      const normalX = -dy / dist;
      const normalY = dx / dist;

      const cpX = (p1.x + p2.x) / 2 + normalX * curveOffset;
      const cpY = (p1.y + p2.y) / 2 + normalY * curveOffset;

      // Add vertical parabolic jump height
      const jumpHeight = 50 * Math.sin(jumpProgress * Math.PI);

      // Bezier interpolation
      const t = jumpProgress;
      const omt = 1 - t;
      frogX = omt * omt * p1.x + 2 * omt * t * cpX + t * t * p2.x;
      frogY = omt * omt * p1.y + 2 * omt * t * cpY + t * t * p2.y - jumpHeight;
    }

  } else {
    // Resting on current lilypad
    const pos = statePositions[currentState];
    frogX = pos.x;
    frogY = pos.y + bobbing - 5; // Sitting slightly above center
  }

  // Draw actual frog
  ctx.save();
  ctx.translate(frogX, frogY);

  // Shadow if jumping
  if (isJumping) {
      ctx.beginPath();
      const shadowScale = 1 - Math.sin(jumpProgress * Math.PI) * 0.5;
      ctx.ellipse(0, 30, FROG_RADIUS * shadowScale, FROG_RADIUS * 0.4 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fill();
  }

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, FROG_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = isJumping ? colors.frogHighlight : colors.frog;
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-7, -8, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -8, 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(-7, -8, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -8, 2, 0, Math.PI * 2); ctx.fill();

  // Legs (simplified)
  ctx.strokeStyle = isJumping ? colors.frogHighlight : colors.frog;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  if (isJumping) {
      // Stretched legs
      ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-20, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(20, 15); ctx.stroke();
  } else {
      // Folded legs
      ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-15, 0); ctx.lineTo(-15, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(15, 0); ctx.lineTo(15, 10); ctx.stroke();
  }

  ctx.restore();
}

// Initialization
init();