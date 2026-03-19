const canvas = document.getElementById("fib-canvas");
const ctx = canvas.getContext("2d");

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener("resize", resize);
resize();

function* fibonacciGenerator() {
  let a = 1, b = 1;
  while (true) {
    yield a;
    const temp = a;
    a = b;
    b = temp + b;
  }
}

let fibGen = fibonacciGenerator();
let fibSequence = [];
let maxSteps = 1;

function nextStep() {
  maxSteps++;
  fibSequence = [];
  fibGen = fibonacciGenerator();
  for (let i = 0; i < maxSteps; i++) {
    fibSequence.push(fibGen.next().value);
  }
}

nextStep(); // start with 2 steps

let baseSize = 50;

const COLORS = [
  "#fcd34d", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#f43f5e"
];

let targetScale = 1;
let currentScale = 1;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Smoothly interpolate scale and translation
  currentScale += (targetScale - currentScale) * 0.1;
  currentX += (targetX - currentX) * 0.1;
  currentY += (targetY - currentY) * 0.1;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(currentScale, currentScale);
  ctx.translate(-currentX, -currentY);

  let minX = 0;
  let maxX = baseSize;
  let minY = -baseSize;
  let maxY = 0;

  let direction = 0; // 0: right, 1: down, 2: left, 3: up

  // Draw squares
  ctx.lineWidth = 2 / currentScale;

  for (let i = 0; i < fibSequence.length; i++) {
    const size = fibSequence[i] * baseSize;

    ctx.strokeStyle = COLORS[i % COLORS.length];

    let drawX, drawY;

    if (i === 0) {
      drawX = 0;
      drawY = -size;
    } else {
      if (direction === 0) { // Right
        drawX = maxX;
        drawY = minY;
        maxX += size;
      } else if (direction === 1) { // Down
        drawX = maxX - size;
        drawY = maxY;
        maxY += size;
      } else if (direction === 2) { // Left
        drawX = minX - size;
        drawY = maxY - size;
        minX -= size;
      } else if (direction === 3) { // Up
        drawX = minX;
        drawY = minY - size;
        minY -= size;
      }
    }

    ctx.strokeRect(drawX, drawY, size, size);

    // Draw arc
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // White spiral

    let centerX, centerY, startAngle, endAngle;

    if (direction === 0) { // Right
      centerX = drawX;
      centerY = drawY + size;
      startAngle = -Math.PI / 2;
      endAngle = 0;
    } else if (direction === 1) { // Down
      centerX = drawX;
      centerY = drawY;
      startAngle = 0;
      endAngle = Math.PI / 2;
    } else if (direction === 2) { // Left
      centerX = drawX + size;
      centerY = drawY;
      startAngle = Math.PI / 2;
      endAngle = Math.PI;
    } else if (direction === 3) { // Up
      centerX = drawX + size;
      centerY = drawY + size;
      startAngle = Math.PI;
      endAngle = Math.PI * 1.5;
    }

    ctx.arc(centerX, centerY, size, startAngle, endAngle);
    ctx.stroke();

    direction = (direction + 1) % 4;

    // Set target center for zooming to latest generated box/arc
    if (i === fibSequence.length - 1) {
      targetX = (minX + maxX) / 2;
      targetY = (minY + maxY) / 2;

      const screenMinDimension = Math.min(width, height);
      // scale so that the total width/height covers the screen, with padding
      let currentTotalWidth = maxX - minX;
      let currentTotalHeight = maxY - minY;
      let maxDimension = Math.max(currentTotalWidth, currentTotalHeight);

      targetScale = (screenMinDimension * 0.8) / maxDimension;
    }
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

document.addEventListener("click", () => {
  nextStep();
});
document.addEventListener("touchstart", (e) => {
  e.preventDefault();
  nextStep();
}, {passive: false});

draw();
