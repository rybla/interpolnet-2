const canvas = document.getElementById('pond-canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const states = [
  { id: 0, x: 0.2, y: 0.3, color: '#4ade80', label: 'A' },
  { id: 1, x: 0.8, y: 0.3, color: '#f87171', label: 'B' },
  { id: 2, x: 0.5, y: 0.8, color: '#60a5fa', label: 'C' }
];

const transitions = [
  { from: 0, to: 0, prob: 0.1 },
  { from: 0, to: 1, prob: 0.6 },
  { from: 0, to: 2, prob: 0.3 },
  { from: 1, to: 0, prob: 0.4 },
  { from: 1, to: 1, prob: 0.2 },
  { from: 1, to: 2, prob: 0.4 },
  { from: 2, to: 0, prob: 0.5 },
  { from: 2, to: 1, prob: 0.5 },
  { from: 2, to: 2, prob: 0.0 }
];

const LILYPAD_RADIUS = 50;

function drawArrow(x1, y1, x2, y2, prob, isSelf) {
  if (prob === 0) return;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (isSelf) {
    const cx = x1;
    const cy = y1 - LILYPAD_RADIUS * 1.5;
    const r = LILYPAD_RADIUS * 0.8;

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, Math.PI * 1.5);
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(prob.toFixed(2), cx, cy - r - 15);
    return;
  }

  const offset = LILYPAD_RADIUS + 5;
  const nx = dx / dist;
  const ny = dy / dist;

  // Curving the arrows slightly so bi-directional arrows don't overlap
  const midX = (x1 + x2) / 2 - ny * 40;
  const midY = (y1 + y2) / 2 + nx * 40;

  const startX = x1 + nx * offset;
  const startY = y1 + ny * offset;

  const endX = x2 - nx * offset;
  const endY = y2 - ny * offset;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(endY - midY, endX - midX);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - 15 * Math.cos(angle - Math.PI / 6), endY - 15 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - 15 * Math.cos(angle + Math.PI / 6), endY - 15 * Math.sin(angle + Math.PI / 6));
  ctx.fill();

  // Draw probability text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(prob.toFixed(2), midX, midY - 10);
}

function drawLilypad(state) {
  const x = state.x * width;
  const y = state.y * height;

  ctx.beginPath();
  ctx.arc(x, y, LILYPAD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = state.color;
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw a notch in the lilypad
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + LILYPAD_RADIUS * Math.cos(Math.PI/4), y + LILYPAD_RADIUS * Math.sin(Math.PI/4));
  ctx.lineTo(x + LILYPAD_RADIUS * Math.cos(Math.PI/4 + 0.3), y + LILYPAD_RADIUS * Math.sin(Math.PI/4 + 0.3));
  ctx.fillStyle = '#0b1a2a'; // Match background
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.label, x, y);
}

function drawScene() {
  ctx.clearRect(0, 0, width, height);

  // Draw transitions
  transitions.forEach(t => {
    const fromState = states[t.from];
    const toState = states[t.to];
    drawArrow(
      fromState.x * width, fromState.y * height,
      toState.x * width, toState.y * height,
      t.prob,
      t.from === t.to
    );
  });

  // Draw lilypads
  states.forEach(drawLilypad);
}

const FROG_RADIUS = 20;
let currentState = 0;
let nextState = 0;
let jumpProgress = 0; // 0 to 1
let isJumping = false;
let waitTimer = 0;

function getNextState(currentState) {
  const outgoing = transitions.filter(t => t.from === currentState);
  const rand = Math.random();
  let cumulative = 0;
  for (const t of outgoing) {
    cumulative += t.prob;
    if (rand <= cumulative) {
      return t.to;
    }
  }
  return currentState; // Fallback
}

function drawFrog(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Frog body
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(0, 0, FROG_RADIUS, FROG_RADIUS * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-10, -12, 6, 0, Math.PI * 2);
  ctx.arc(10, -12, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-10, -12, 2, 0, Math.PI * 2);
  ctx.arc(10, -12, 2, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#166534';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-15, 5);
  ctx.lineTo(-25, 15);
  ctx.lineTo(-15, 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(15, 5);
  ctx.lineTo(25, 15);
  ctx.lineTo(15, 20);
  ctx.stroke();

  ctx.restore();
}

let lastTime = 0;

function loop(time) {
  const dt = time - lastTime;
  lastTime = time;

  drawScene();

  if (isJumping) {
    jumpProgress += dt * 0.0015; // Speed of jump
    if (jumpProgress >= 1) {
      isJumping = false;
      currentState = nextState;
      jumpProgress = 0;
      waitTimer = 0;
    }
  } else {
    waitTimer += dt;
    if (waitTimer > 1000) { // Wait 1 second before next jump
      nextState = getNextState(currentState);
      if (nextState !== currentState) {
        isJumping = true;
      } else {
        // Self-loop, just show a little hop
        isJumping = true;
      }
    }
  }

  const startState = states[currentState];
  const endState = states[nextState];

  const startX = startState.x * width;
  const startY = startState.y * height;
  const endX = endState.x * width;
  const endY = endState.y * height;

  let frogX, frogY, scale = 1;

  if (isJumping) {
    if (startState.id === endState.id) {
      // Self loop hop
      frogX = startX;
      // Parabola for hop height
      frogY = startY - Math.sin(jumpProgress * Math.PI) * 40;
      scale = 1 + Math.sin(jumpProgress * Math.PI) * 0.2;
    } else {
      // Smooth interpolation for jump
      const ease = jumpProgress < 0.5 ? 2 * jumpProgress * jumpProgress : -1 + (4 - 2 * jumpProgress) * jumpProgress;
      frogX = startX + (endX - startX) * ease;
      frogY = startY + (endY - startY) * ease - Math.sin(jumpProgress * Math.PI) * 60; // Arc
      scale = 1 + Math.sin(jumpProgress * Math.PI) * 0.4;
    }
  } else {
    frogX = startX;
    frogY = startY;
  }

  drawFrog(frogX, frogY, scale);

  requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
  lastTime = time;
  loop(time);
});
