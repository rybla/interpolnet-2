const canvas = document.getElementById('ik-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let segments = [];
let target = { x: 0, y: 0 };
let isDragging = false;

// CSS Variables for styling
let colors = {};

function init() {
  resize();
  window.addEventListener('resize', resize);

  // Set up interaction
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);

  // Initialize arm segments
  // 4 segments of length 80
  const numSegments = 4;
  const segLength = 80;

  for (let i = 0; i < numSegments; i++) {
    segments.push({
      angle: 0,
      length: segLength,
      x: 0,
      y: 0
    });
  }

  // Initial target position
  target.x = width / 2 + 150;
  target.y = height / 2;

  getColors();

  requestAnimationFrame(animate);
}

function getColors() {
  const style = getComputedStyle(document.documentElement);
  colors.bg = style.getPropertyValue('--bg-color').trim() || '#121212';
  colors.arm = style.getPropertyValue('--arm-color').trim() || '#ff3366';
  colors.joint = style.getPropertyValue('--joint-color').trim() || '#00e5ff';
  colors.target = style.getPropertyValue('--target-color').trim() || '#00ff66';
  colors.base = style.getPropertyValue('--base-color').trim() || '#888888';
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  getColors();
}

function getPointerPos(e) {
  let x, y;
  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }
  const rect = canvas.getBoundingClientRect();
  return {
    x: x - rect.left,
    y: y - rect.top
  };
}

function onPointerDown(e) {
  e.preventDefault();
  isDragging = true;
  const pos = getPointerPos(e);
  target.x = pos.x;
  target.y = pos.y;
}

function onPointerMove(e) {
  e.preventDefault();
  if (!isDragging) return;
  const pos = getPointerPos(e);
  target.x = pos.x;
  target.y = pos.y;
}

function onPointerUp(e) {
  e.preventDefault();
  isDragging = false;
}

// Reach function for a single segment towards a target point
function reach(segment, tx, ty) {
  const dx = tx - segment.x;
  const dy = ty - segment.y;
  segment.angle = Math.atan2(dy, dx);

  // Calculate new position based on angle and length, backwards from target
  segment.x = tx - Math.cos(segment.angle) * segment.length;
  segment.y = ty - Math.sin(segment.angle) * segment.length;
}

// Position segment relative to its parent
function position(segment, parent) {
  segment.x = parent.x + Math.cos(parent.angle) * parent.length;
  segment.y = parent.y + Math.sin(parent.angle) * parent.length;
}

function solveIK() {
  const n = segments.length;
  if (n === 0) return;

  // 1. Backward Reaching (from end effector to base)
  let tx = target.x;
  let ty = target.y;

  for (let i = n - 1; i >= 0; i--) {
    reach(segments[i], tx, ty);
    tx = segments[i].x;
    ty = segments[i].y;
  }

  // 2. Forward Reaching (from base to end effector)
  // Pin the first segment to the base
  segments[0].x = width / 2;
  segments[0].y = height / 2;

  for (let i = 1; i < n; i++) {
    position(segments[i], segments[i-1]);
  }
}

function drawSegment(segment, isLast) {
  const endX = segment.x + Math.cos(segment.angle) * segment.length;
  const endY = segment.y + Math.sin(segment.angle) * segment.length;

  // Draw arm line
  ctx.beginPath();
  ctx.moveTo(segment.x, segment.y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = colors.arm;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw joint
  ctx.beginPath();
  ctx.arc(segment.x, segment.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = colors.joint;
  ctx.fill();

  if (isLast) {
    // Draw end effector joint
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = colors.joint;
    ctx.fill();
  }
}

function animate() {
  // Clear canvas
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // Solve IK
  solveIK();

  // Draw Base
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2);
  ctx.fillStyle = colors.base;
  ctx.fill();

  // Draw Target
  ctx.beginPath();
  ctx.arc(target.x, target.y, 15, 0, Math.PI * 2);
  ctx.strokeStyle = colors.target;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw inner target dot
  ctx.beginPath();
  ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = colors.target;
  ctx.fill();

  // Draw segments
  for (let i = 0; i < segments.length; i++) {
    drawSegment(segments[i], i === segments.length - 1);
  }

  requestAnimationFrame(animate);
}

// Start
init();