const canvas = document.getElementById('pondCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// State Machine Definition
const states = [
  { id: 0, label: 'A', x: 0.3, y: 0.3, color: '#34d399', radius: 60 },
  { id: 1, label: 'B', x: 0.7, y: 0.3, color: '#6ee7b7', radius: 60 },
  { id: 2, label: 'C', x: 0.5, y: 0.7, color: '#10b981', radius: 60 }
];

const transitions = [
  { from: 0, to: 1, prob: 0.6 },
  { from: 0, to: 2, prob: 0.4 },
  { from: 1, to: 0, prob: 0.3 },
  { from: 1, to: 2, prob: 0.5 },
  { from: 1, to: 1, prob: 0.2 },
  { from: 2, to: 0, prob: 0.8 },
  { from: 2, to: 2, prob: 0.2 }
];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

function drawArrow(fromX, fromY, toX, toY, prob, isActive, isSelfLoop) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const len = Math.sqrt(dx * dx + dy * dy);

  ctx.save();
  ctx.strokeStyle = isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)';
  ctx.fillStyle = isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = isActive ? 4 : 2;

  if (isSelfLoop) {
    const loopRadius = 40;
    const loopCenterX = fromX + 40;
    const loopCenterY = fromY - 60;

    ctx.beginPath();
    ctx.arc(loopCenterX, loopCenterY, loopRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw arrowhead for self loop
    ctx.beginPath();
    ctx.moveTo(fromX + 40, fromY - 20);
    ctx.lineTo(fromX + 30, fromY - 30);
    ctx.lineTo(fromX + 50, fromY - 30);
    ctx.fill();

    // Draw probability text
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(prob.toFixed(1), loopCenterX, loopCenterY - loopRadius - 10);
  } else {
    // Offset start and end points by state radius so arrows don't go to center
    const radius = states[0].radius + 10;
    const startX = fromX + Math.cos(angle) * radius;
    const startY = fromY + Math.sin(angle) * radius;
    const endX = toX - Math.cos(angle) * radius;
    const endY = toY - Math.sin(angle) * radius;

    // Calculate control point for curved line to separate bidirectional arrows
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = 40;
    const cpX = midX - Math.sin(angle) * offset;
    const cpY = midY + Math.cos(angle) * offset;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();

    // Calculate angle at the end point for arrowhead
    const endAngle = Math.atan2(endY - cpY, endX - cpX);

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 15 * Math.cos(endAngle - Math.PI / 6), endY - 15 * Math.sin(endAngle - Math.PI / 6));
    ctx.lineTo(endX - 15 * Math.cos(endAngle + Math.PI / 6), endY - 15 * Math.sin(endAngle + Math.PI / 6));
    ctx.fill();

    // Draw probability text
    const textX = cpX - Math.sin(angle) * 15;
    const textY = cpY + Math.cos(angle) * 15;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(prob.toFixed(1), textX, textY);
  }
  ctx.restore();
}

function drawLilypads() {
  states.forEach(state => {
    const sx = state.x * width;
    const sy = state.y * height;

    // Draw shadow
    ctx.save();
    ctx.translate(sx, sy);
    ctx.beginPath();
    ctx.ellipse(0, 10, state.radius, state.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Draw lilypad
    ctx.beginPath();
    // A slightly notched circle for a lilypad look
    ctx.arc(0, 0, state.radius, 0.1, Math.PI * 2 - 0.1);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = state.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#064e3b';
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.label, 0, 0);
    ctx.restore();
  });
}


// Animation State
let isPlaying = false;
let animationSpeed = 1;
let frogState = 0; // Current state ID
let targetState = null;
let transitionProgress = 0; // 0 to 1
let activeTransition = null;

const playPauseBtn = document.getElementById('playPauseBtn');
const speedSlider = document.getElementById('speedSlider');

playPauseBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
  playPauseBtn.style.backgroundColor = isPlaying ? '#fbbf24' : '#22c55e';
});

speedSlider.addEventListener('input', (e) => {
  animationSpeed = parseFloat(e.target.value);
});

function getNextState(currentState) {
  const possibleTransitions = transitions.filter(t => t.from === currentState);
  const rand = Math.random();
  let cumulativeProb = 0;

  for (let t of possibleTransitions) {
    cumulativeProb += t.prob;
    if (rand <= cumulativeProb) {
      return t;
    }
  }
  // Fallback
  return possibleTransitions[0];
}

function drawFrog(x, y, scale = 1, opacity = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  // Frog Body
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-10, -10, 6, 0, Math.PI * 2);
  ctx.arc(10, -10, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-10, -10, 2, 0, Math.PI * 2);
  ctx.arc(10, -10, 2, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-15, 5);
  ctx.lineTo(-25, 15);
  ctx.lineTo(-30, 25);
  ctx.moveTo(15, 5);
  ctx.lineTo(25, 15);
  ctx.lineTo(30, 25);
  ctx.stroke();

  ctx.restore();
}

let lastTime = performance.now();

function render(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, width, height);

  drawLilypads();

  // Draw Transitions
  transitions.forEach(t => {
    const s1 = states.find(s => s.id === t.from);
    const s2 = states.find(s => s.id === t.to);
    const isActive = activeTransition && t.from === activeTransition.from && t.to === activeTransition.to;
    drawArrow(s1.x * width, s1.y * height, s2.x * width, s2.y * height, t.prob, isActive, t.from === t.to);
  });

  // Calculate Frog Position
  const sFrom = states.find(s => s.id === frogState);
  let frogX = sFrom.x * width;
  let frogY = sFrom.y * height;
  let frogScale = 1;

  if (isPlaying) {
    if (activeTransition === null) {
      // Start a jump
      activeTransition = getNextState(frogState);
      targetState = activeTransition.to;
      transitionProgress = 0;
    } else {
      // Animate jump
      transitionProgress += (dt / 1000) * animationSpeed;

      if (transitionProgress >= 1) {
        // Jump complete
        frogState = targetState;
        activeTransition = null;
        targetState = null;
        transitionProgress = 0;
      }
    }
  }

  if (activeTransition !== null) {
    const sTo = states.find(s => s.id === activeTransition.to);
    const toX = sTo.x * width;
    const toY = sTo.y * height;

    // Smooth interpolation (ease in-out)
    const t = Math.min(1, transitionProgress);
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    if (activeTransition.from === activeTransition.to) {
      // Self loop animation (jump up and down)
      frogY -= Math.sin(t * Math.PI) * 100;
    } else {
      // Jump between pads
      // Calculate quadratic bezier along the curved path
      const midX = (sFrom.x * width + toX) / 2;
      const midY = (sFrom.y * height + toY) / 2;
      const dx = toX - sFrom.x * width;
      const dy = toY - sFrom.y * height;
      const angle = Math.atan2(dy, dx);
      const offset = 40;
      const cpX = midX - Math.sin(angle) * offset;
      const cpY = midY + Math.cos(angle) * offset;

      const startX = sFrom.x * width;
      const startY = sFrom.y * height;

      frogX = (1 - easedT) * (1 - easedT) * startX + 2 * (1 - easedT) * easedT * cpX + easedT * easedT * toX;
      frogY = (1 - easedT) * (1 - easedT) * startY + 2 * (1 - easedT) * easedT * cpY + easedT * easedT * toY;

      // Arc the jump upwards as well
      frogY -= Math.sin(t * Math.PI) * 60;
    }

    // Scale up during jump
    frogScale = 1 + Math.sin(t * Math.PI) * 0.5;
  }

  drawFrog(frogX, frogY, frogScale);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
