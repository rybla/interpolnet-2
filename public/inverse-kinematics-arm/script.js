const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let origin = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let isDragging = false;

// Segment class
class Segment {
  constructor(length) {
    this.length = length;
    this.angle = 0;
    this.a = { x: 0, y: 0 };
    this.b = { x: 0, y: 0 };
  }

  calculateB() {
    this.b.x = this.a.x + Math.cos(this.angle) * this.length;
    this.b.y = this.a.y + Math.sin(this.angle) * this.length;
  }
}

const segments = [];
const numSegments = 5;
const segmentLength = 80;
let totalArmLength = numSegments * segmentLength;

// Initialize segments
for (let i = 0; i < numSegments; i++) {
  segments.push(new Segment(segmentLength));
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  origin.x = width / 2;
  origin.y = height / 2;

  if (!isDragging) {
    target.x = origin.x + totalArmLength * 0.5;
    target.y = origin.y;
  }
}

window.addEventListener('resize', resize);
resize();

// Interaction
canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  updateTarget(e);
});

window.addEventListener('pointermove', (e) => {
  if (isDragging) {
    updateTarget(e);
  }
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

function updateTarget(e) {
  const rect = canvas.getBoundingClientRect();
  target.x = e.clientX - rect.left;
  target.y = e.clientY - rect.top;
}

// Distance helper
function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// FABRIK algorithm
function solveIK() {
  const n = segments.length;

  // Calculate distances
  let currentDistance = distance(origin, target);

  // If target is unreachable
  if (currentDistance >= totalArmLength) {
    for (let i = 0; i < n; i++) {
      const seg = segments[i];
      if (i === 0) {
        seg.a = { ...origin };
        seg.angle = Math.atan2(target.y - origin.y, target.x - origin.x);
      } else {
        const prev = segments[i - 1];
        seg.a = { ...prev.b };
        seg.angle = prev.angle;
      }
      seg.calculateB();
    }
    return;
  }

  // Backward reaching
  segments[n - 1].b = { ...target };
  for (let i = n - 1; i >= 0; i--) {
    const seg = segments[i];
    if (i === n - 1) {
      seg.angle = Math.atan2(seg.a.y - seg.b.y, seg.a.x - seg.b.x);
    } else {
      const next = segments[i + 1];
      seg.b = { ...next.a };
      seg.angle = Math.atan2(seg.a.y - seg.b.y, seg.a.x - seg.b.x);
    }
    seg.a.x = seg.b.x + Math.cos(seg.angle) * seg.length;
    seg.a.y = seg.b.y + Math.sin(seg.angle) * seg.length;
  }

  // Forward reaching
  segments[0].a = { ...origin };
  for (let i = 0; i < n; i++) {
    const seg = segments[i];
    if (i === 0) {
      seg.angle = Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x);
    } else {
      const prev = segments[i - 1];
      seg.a = { ...prev.b };
      seg.angle = Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x);
    }
    seg.calculateB();
  }
}

function draw() {
  const rootStyle = getComputedStyle(document.documentElement);
  const bgColor = rootStyle.getPropertyValue('--bg-color').trim();
  const armBaseColor = rootStyle.getPropertyValue('--arm-base').trim();
  const armSegmentColor = rootStyle.getPropertyValue('--arm-segment').trim();
  const armJointColor = rootStyle.getPropertyValue('--arm-joint').trim();
  const targetColor = rootStyle.getPropertyValue('--target').trim();

  // Clear canvas
  ctx.fillStyle = bgColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // IK solver
  for(let i=0; i<5; i++) {
    solveIK();
  }

  // Draw base
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 25, 0, Math.PI * 2);
  ctx.fillStyle = armBaseColor || '#1abc9c';
  ctx.fill();

  // Draw segments
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.strokeStyle = armSegmentColor || '#3498db';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    ctx.beginPath();
    ctx.moveTo(seg.a.x, seg.a.y);
    ctx.lineTo(seg.b.x, seg.b.y);
    ctx.stroke();
  }

  // Draw joints
  ctx.fillStyle = armJointColor || '#2c3e50';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    ctx.beginPath();
    ctx.arc(seg.b.x, seg.b.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw target
  ctx.beginPath();
  let r = isDragging ? 20 : 15;
  ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
  ctx.fillStyle = targetColor || '#e74c3c';
  ctx.fill();

  // Target ring animation (passive)
  if (!isDragging) {
    const time = Date.now() * 0.002;
    const ringRadius = r + 5 + Math.sin(time) * 5;
    ctx.beginPath();
    ctx.arc(target.x, target.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = targetColor || '#e74c3c';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + Math.sin(time) * 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  requestAnimationFrame(draw);
}

// Start loop
requestAnimationFrame(draw);
