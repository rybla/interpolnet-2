// FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm implementation
// for a 2D multi-jointed robotic arm on an HTML5 canvas.

const canvas = document.getElementById('arm-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let origin = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let joints = [];
let segmentLengths = [];
let isDragging = false;

// Config
const NUM_SEGMENTS = 5;
const SEGMENT_LENGTH = 80;
const TOTAL_LENGTH = NUM_SEGMENTS * SEGMENT_LENGTH;
const TOLERANCE = 0.01;
const MAX_ITERATIONS = 10;

function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;

  origin = { x: width / 2, y: height };

  // Set target somewhere visible initially
  if (target.x === 0 && target.y === 0) {
    target = { x: width / 2 + 150, y: height - 200 };
  }
}

function initArm() {
  joints = [];
  segmentLengths = [];

  for (let i = 0; i <= NUM_SEGMENTS; i++) {
    joints.push({
      x: origin.x,
      y: origin.y - i * SEGMENT_LENGTH,
    });
    if (i < NUM_SEGMENTS) {
      segmentLengths.push(SEGMENT_LENGTH);
    }
  }
}

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function solveFABRIK() {
  let distToTarget = distance(joints[0], target);

  // 1. Unreachable case
  if (distToTarget > TOTAL_LENGTH) {
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      let r = distance(target, joints[i]);
      let lambda = segmentLengths[i] / r;

      joints[i + 1].x = (1 - lambda) * joints[i].x + lambda * target.x;
      joints[i + 1].y = (1 - lambda) * joints[i].y + lambda * target.y;
    }
  } else {
    // 2. Reachable case
    let b = { x: joints[0].x, y: joints[0].y };
    let dif = distance(joints[joints.length - 1], target);
    let iterations = 0;

    while (dif > TOLERANCE && iterations < MAX_ITERATIONS) {
      // Forward Reaching
      joints[joints.length - 1].x = target.x;
      joints[joints.length - 1].y = target.y;

      for (let i = joints.length - 2; i >= 0; i--) {
        let r = distance(joints[i + 1], joints[i]);
        let lambda = segmentLengths[i] / r;

        joints[i].x = (1 - lambda) * joints[i + 1].x + lambda * joints[i].x;
        joints[i].y = (1 - lambda) * joints[i + 1].y + lambda * joints[i].y;
      }

      // Backward Reaching
      joints[0].x = b.x;
      joints[0].y = b.y;

      for (let i = 0; i < joints.length - 1; i++) {
        let r = distance(joints[i + 1], joints[i]);
        let lambda = segmentLengths[i] / r;

        joints[i + 1].x = (1 - lambda) * joints[i].x + lambda * joints[i + 1].x;
        joints[i + 1].y = (1 - lambda) * joints[i].y + lambda * joints[i + 1].y;
      }

      dif = distance(joints[joints.length - 1], target);
      iterations++;
    }
  }
}

function update() {
  // Update origin just in case canvas was resized
  origin.x = width / 2;
  origin.y = height;
  joints[0].x = origin.x;
  joints[0].y = origin.y;

  solveFABRIK();
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw floor
  ctx.fillStyle = '#333';
  ctx.fillRect(0, height - 10, width, 10);

  // Draw base
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 25, Math.PI, 0);
  ctx.fillStyle = '#444';
  ctx.fill();

  // Draw segments
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#00d2d3'; // Cyan for segments

  ctx.beginPath();
  ctx.moveTo(joints[0].x, joints[0].y);
  for (let i = 1; i < joints.length; i++) {
    ctx.lineTo(joints[i].x, joints[i].y);
  }
  ctx.stroke();

  // Draw joints
  for (let i = 0; i < joints.length; i++) {
    ctx.beginPath();
    ctx.arc(joints[i].x, joints[i].y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff'; // Magenta for joints
    ctx.fill();

    // Draw joint highlights
    ctx.beginPath();
    ctx.arc(joints[i].x, joints[i].y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Draw target
  ctx.beginPath();
  ctx.arc(target.x, target.y, isDragging ? 20 : 15, 0, Math.PI * 2);
  ctx.fillStyle = isDragging ? '#ffcc00' : '#ffaa00';
  ctx.fill();

  // Target ring
  ctx.beginPath();
  ctx.arc(target.x, target.y, 25, 0, Math.PI * 2);
  ctx.strokeStyle = isDragging ? '#ffcc00' : '#ffaa00';
  ctx.lineWidth = 2;
  ctx.stroke();

  // End effector connection
  let lastJoint = joints[joints.length - 1];
  ctx.beginPath();
  ctx.moveTo(lastJoint.x, lastJoint.y);
  ctx.lineTo(target.x, target.y);
  ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Event Listeners
function handlePointerDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if click is near target
  if (distance({x, y}, target) < 40) {
    isDragging = true;
    target.x = x;
    target.y = y;
    canvas.style.cursor = 'grabbing';
  } else {
    // Or just move target there immediately
    target.x = x;
    target.y = y;
    isDragging = true;
    canvas.style.cursor = 'grabbing';
  }
}

function handlePointerMove(e) {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  target.x = e.clientX - rect.left;
  target.y = e.clientY - rect.top;
}

function handlePointerUp() {
  isDragging = false;
  canvas.style.cursor = 'grab';
}

canvas.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('resize', resize);

// Initialization
canvas.style.cursor = 'grab';
resize();
initArm();
loop();
