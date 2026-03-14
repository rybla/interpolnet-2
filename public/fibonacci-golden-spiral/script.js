const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// UI Elements
const speedSlider = document.getElementById("speedSlider");
const playPauseBtn = document.getElementById("playPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const stepBackBtn = document.getElementById("stepBackBtn");
const stepForwardBtn = document.getElementById("stepForwardBtn");
const currentFibSpan = document.getElementById("currentFib");
const iterationCountSpan = document.getElementById("iterationCount");

// State
let width, height;
let isPlaying = true;
let speed = parseFloat(speedSlider.value);
let lastTime = 0;
let progress = 0; // Animation progress for the current segment (0 to 1)
let maxSteps = 16; // Maximum number of Fibonacci squares to draw

// Fibonacci Sequence and Sequence State
let sequence = [1, 1];
let currentStep = 0; // Index in the sequence

// Helper to pre-calculate the sequence
function calculateSequence(n) {
  let seq = [1, 1];
  for (let i = 2; i <= n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}
sequence = calculateSequence(maxSteps);

// Colors
const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
const spiralColor = "#ffffff";
const strokeColor = "#333333";

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  draw();
}

window.addEventListener("resize", resizeCanvas);

// Controls Event Listeners
speedSlider.addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

playPauseBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? "Pause" : "Play";
  if (isPlaying) {
    lastTime = performance.now();
    requestAnimationFrame(renderLoop);
  }
});

resetBtn.addEventListener("click", () => {
  currentStep = 0;
  progress = 0;
  isPlaying = false;
  playPauseBtn.textContent = "Play";
  draw();
  updateStats();
});

stepBackBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    progress = 1;
  } else {
    progress = 0;
  }
  draw();
  updateStats();
});

stepForwardBtn.addEventListener("click", () => {
  if (currentStep < maxSteps - 1) {
    currentStep++;
    progress = 1;
  }
  draw();
  updateStats();
});

function updateStats() {
  currentFibSpan.textContent = sequence[currentStep];
  iterationCountSpan.textContent = currentStep + 1;
}



function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // Padding to prevent squares from touching the edge of the screen
  const padding = 60;

  // Calculate positions and sizes of all rectangles up to the current step
  let rects = [];

  // Direction meanings (how to attach the next square to the existing bounding box):
  // 0: attach Right
  // 1: attach Up
  // 2: attach Left
  // 3: attach Down

  let minX = 0, maxX = sequence[0];
  let minY = 0, maxY = sequence[0];

  for (let i = 0; i <= currentStep; i++) {
    const fib = sequence[i];
    const dir = i % 4;

    let x = 0, y = 0;

    if (i === 0) {
        x = 0;
        y = 0;
        minX = 0; maxX = fib;
        minY = 0; maxY = fib;
    } else {
        // Find position based on the bounding box of previous rects
        if (dir === 0) { // Right
            x = maxX;
            y = minY;
            maxX += fib;
            maxY = Math.max(maxY, y + fib);
        } else if (dir === 1) { // Up
            x = minX;
            y = minY - fib;
            minY -= fib;
            maxX = Math.max(maxX, x + fib);
        } else if (dir === 2) { // Left
            x = minX - fib;
            y = maxY - fib;
            minX -= fib;
            minY = Math.min(minY, y);
        } else if (dir === 3) { // Down
            x = maxX - fib;
            y = maxY;
            maxY += fib;
            minX = Math.min(minX, x);
        }
    }

    rects.push({x: x, y: y, size: fib, dir: dir});
  }

  // Determine current bounds for scaling
  let maxW = maxX - minX;
  let maxH = maxY - minY;
  let targetScale = Math.min((width - padding) / maxW, (height - padding) / maxH);

  // Determine previous bounds for smooth scaling
  let prevScale = targetScale;
  let prevCX = (minX + maxX) / 2;
  let prevCY = (minY + maxY) / 2;

  if (currentStep > 0) {
      let pMinX = 0, pMaxX = sequence[0];
      let pMinY = 0, pMaxY = sequence[0];

      for (let i = 1; i < currentStep; i++) {
          const fib = sequence[i];
          const dir = i % 4;
          if (dir === 0) { pMaxX += fib; pMaxY = Math.max(pMaxY, pMinY + fib); }
          else if (dir === 1) { pMinY -= fib; pMaxX = Math.max(pMaxX, pMinX + fib); }
          else if (dir === 2) { pMinX -= fib; pMinY = Math.min(pMinY, pMaxY - fib); }
          else if (dir === 3) { pMaxY += fib; pMinX = Math.min(pMinX, pMaxX - fib); }
      }
      let prevW = pMaxX - pMinX;
      let prevH = pMaxY - pMinY;
      prevScale = Math.min((width - padding) / prevW, (height - padding) / prevH);
      prevCX = (pMinX + pMaxX) / 2;
      prevCY = (pMinY + pMaxY) / 2;
  }

  // Interpolate scale and center based on progress
  let currentScale = prevScale + (targetScale - prevScale) * progress;
  let currentCX = (minX + maxX) / 2;
  let currentCY = (minY + maxY) / 2;
  let interpCX = prevCX + (currentCX - prevCX) * progress;
  let interpCY = prevCY + (currentCY - prevCY) * progress;

  ctx.translate(width / 2, height / 2);
  ctx.scale(currentScale, currentScale);
  ctx.translate(-interpCX, -interpCY);

  // Draw the rectangles and arcs
  for (let i = 0; i <= currentStep; i++) {
    const rect = rects[i];
    const fib = rect.size;
    const color = colors[i % colors.length];
    const p = (i === currentStep) ? progress : 1;

    ctx.fillStyle = color;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1 / currentScale;

    // We want the square to grow out from the correct anchor point
    ctx.save();
    let anchorX, anchorY;
    if (rect.dir === 0) { anchorX = rect.x; anchorY = rect.y + fib; } // Right -> expand from bottom-left
    else if (rect.dir === 1) { anchorX = rect.x + fib; anchorY = rect.y + fib; } // Up -> expand from bottom-right
    else if (rect.dir === 2) { anchorX = rect.x + fib; anchorY = rect.y; } // Left -> expand from top-right
    else if (rect.dir === 3) { anchorX = rect.x; anchorY = rect.y; } // Down -> expand from top-left

    ctx.translate(anchorX, anchorY);
    ctx.scale(p, p);
    ctx.translate(-anchorX, -anchorY);
    ctx.fillRect(rect.x, rect.y, fib, fib);
    ctx.strokeRect(rect.x, rect.y, fib, fib);
    ctx.restore();

    // Draw spiral arc
    ctx.strokeStyle = spiralColor;
    ctx.lineWidth = 4 / currentScale;
    ctx.beginPath();

    let centerX, centerY, startAngle, endAngle;

    if (rect.dir === 0) { // Right: arc from bottom-left corner
        centerX = rect.x;
        centerY = rect.y + fib;
        startAngle = 1.5 * Math.PI;
        endAngle = startAngle + (0.5 * Math.PI * p);
    } else if (rect.dir === 1) { // Up: arc from bottom-right corner
        centerX = rect.x + fib;
        centerY = rect.y + fib;
        startAngle = 1.0 * Math.PI;
        endAngle = startAngle + (0.5 * Math.PI * p);
    } else if (rect.dir === 2) { // Left: arc from top-right corner
        centerX = rect.x + fib;
        centerY = rect.y;
        startAngle = 0.5 * Math.PI;
        endAngle = startAngle + (0.5 * Math.PI * p);
    } else if (rect.dir === 3) { // Down: arc from top-left corner
        centerX = rect.x;
        centerY = rect.y;
        startAngle = 0;
        endAngle = startAngle + (0.5 * Math.PI * p);
    }

    ctx.arc(centerX, centerY, fib, startAngle, endAngle);
    ctx.stroke();
  }

  ctx.restore();
}

function renderLoop(time) {
  if (!lastTime) lastTime = time;
  const dt = time - lastTime;
  lastTime = time;

  if (isPlaying) {
    progress += (dt / 1000) * speed;

    if (progress >= 1) {
      if (currentStep < maxSteps - 1) {
        currentStep++;
        progress = 0;
        updateStats();
      } else {
        // Stop at the end
        progress = 1;
        isPlaying = false;
        playPauseBtn.textContent = "Play";
      }
    }
  }

  draw();
  requestAnimationFrame(renderLoop);
}

// Initialization
resizeCanvas();
updateStats();
lastTime = performance.now();
requestAnimationFrame(renderLoop);
