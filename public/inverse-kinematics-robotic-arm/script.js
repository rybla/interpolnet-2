const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener("resize", resize);
resize();

class Segment {
  constructor(length, angle) {
    this.length = length;
    this.angle = angle;
    this.x = 0;
    this.y = 0;
  }
}

const numSegments = 5;
const segmentLength = 60;
const segments = [];

for (let i = 0; i < numSegments; i++) {
  segments.push(new Segment(segmentLength, 0));
}

let target = { x: width / 2 + numSegments * segmentLength, y: height / 2 };
let isDragging = false;

function drawSegment(segment, index) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(segment.length, 0);
  ctx.strokeStyle = "#38bdf8"; // Light blue
  ctx.lineWidth = 15 - index * 2;
  ctx.lineCap = "round";
  ctx.stroke();

  // Joint
  ctx.beginPath();
  ctx.arc(0, 0, 8 - index, 0, Math.PI * 2);
  ctx.fillStyle = "#e2e8f0"; // Slate 200
  ctx.fill();

  if (index === numSegments - 1) {
    // End effector
    ctx.beginPath();
    ctx.arc(segment.length, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f472b6"; // Pink 400
    ctx.fill();
  }
}

function updateForwardKinematics() {
  let x = width / 2;
  let y = height / 2;
  let currentAngle = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    segment.x = x;
    segment.y = y;
    currentAngle += segment.angle;
    x += Math.cos(currentAngle) * segment.length;
    y += Math.sin(currentAngle) * segment.length;
  }
}

function inverseKinematics(targetX, targetY) {
  const iterations = 10;

  for (let iter = 0; iter < iterations; iter++) {
    updateForwardKinematics();

    let currentAngle = 0;
    for (let i = 0; i < segments.length; i++) {
      currentAngle += segments[i].angle;
    }

    // CCD Algorithm
    for (let i = segments.length - 1; i >= 0; i--) {

        let endEffectorX = segments[0].x;
        let endEffectorY = segments[0].y;
        let tempAngle = 0;

        for (let j=0; j < segments.length; j++) {
            tempAngle += segments[j].angle;
            endEffectorX += Math.cos(tempAngle) * segments[j].length;
            endEffectorY += Math.sin(tempAngle) * segments[j].length;
        }

        const segment = segments[i];

        const dxEnd = endEffectorX - segment.x;
        const dyEnd = endEffectorY - segment.y;

        const dxTarget = targetX - segment.x;
        const dyTarget = targetY - segment.y;

        let angleEnd = Math.atan2(dyEnd, dxEnd);
        let angleTarget = Math.atan2(dyTarget, dxTarget);

        let angleDiff = angleTarget - angleEnd;

        // Normalize angle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        segment.angle += angleDiff;

        // Update kinematics after each segment change for next iteration in CCD
        updateForwardKinematics();
    }
  }
}


function draw() {
  ctx.clearRect(0, 0, width, height);

  inverseKinematics(target.x, target.y);
  updateForwardKinematics();

  // Draw target
  ctx.beginPath();
  ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#facc15"; // Yellow 400
  ctx.fill();

  // Pulse animation for target
  ctx.beginPath();
  ctx.arc(target.x, target.y, 20 + Math.sin(Date.now() * 0.005) * 5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(250, 204, 21, 0.5)"; // Yellow 400 with opacity
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw base
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#475569"; // Slate 600
  ctx.fill();

  ctx.save();
  ctx.translate(width / 2, height / 2);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    ctx.rotate(segment.angle);
    drawSegment(segment, i);
    ctx.translate(segment.length, 0);
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

function handlePointerDown(e) {
  isDragging = true;
  updateTarget(e);
}

function handlePointerMove(e) {
  if (isDragging) {
    updateTarget(e);
  }
}

function handlePointerUp() {
  isDragging = false;
}

function updateTarget(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  target.x = clientX - rect.left;
  target.y = clientY - rect.top;
}

canvas.addEventListener("mousedown", handlePointerDown);
canvas.addEventListener("mousemove", handlePointerMove);
window.addEventListener("mouseup", handlePointerUp);

canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
window.addEventListener("touchend", handlePointerUp);

requestAnimationFrame(draw);
