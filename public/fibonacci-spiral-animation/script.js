const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

// Fibonacci Sequence State
let fibSequence = [1, 1]; // Start with the first two
const maxSquares = 25; // Stop after computing this many to avoid excessive numbers

function computeFibSequence() {
  while (fibSequence.length < maxSquares) {
    const len = fibSequence.length;
    fibSequence.push(fibSequence[len - 1] + fibSequence[len - 2]);
  }
}
computeFibSequence();

// UI Elements
const currentFnDisplay = document.getElementById('current-fn-display');
const currentSquaresDisplay = document.getElementById('current-squares-display');
const speedSlider = document.getElementById('speed-slider');
const playPauseBtn = document.getElementById('play-pause-btn');
const stepBackBtn = document.getElementById('step-back-btn');
const stepForwardBtn = document.getElementById('step-forward-btn');

// Animation State
let isPlaying = true;
let currentStep = 0; // Starts at 0
let currentAnimationProgress = 0; // 0 to 1 for the current square being drawn
let animationSpeed = parseInt(speedSlider.value) * 0.005;

// Theme Colors
const bodyStyles = getComputedStyle(document.body);
const spiralColor = bodyStyles.getPropertyValue('--spiral-color').trim();
const squareBorder = bodyStyles.getPropertyValue('--square-border').trim();
const squareBgEven = bodyStyles.getPropertyValue('--square-bg-even').trim();
const squareBgOdd = bodyStyles.getPropertyValue('--square-bg-odd').trim();

function getRectProperties(index) {
  // Returns position, size, and arc details for the n-th square
  let rx = 0;
  let ry = 0;

  // Track the bounding box of the previous square to know where to attach the next
  let prevRx = 0;
  let prevRy = 0;
  let prevSize = fibSequence[0];

  for (let i = 1; i <= index; i++) {
    const size = fibSequence[i];
    const prevDir = (i - 1) % 4;

    // Attach to the right
    if (prevDir === 0) {
      rx = prevRx + prevSize;
      ry = prevRy;
    }
    // Attach to the bottom
    else if (prevDir === 1) {
      rx = prevRx - size + prevSize;
      ry = prevRy + prevSize;
    }
    // Attach to the left
    else if (prevDir === 2) {
      rx = prevRx - size;
      ry = prevRy - size + prevSize;
    }
    // Attach to the top
    else if (prevDir === 3) {
      rx = prevRx;
      ry = prevRy - size;
    }

    prevRx = rx;
    prevRy = ry;
    prevSize = size;
  }

  const size = fibSequence[index];
  const dir = index % 4; // 0: Right, 1: Bottom, 2: Left, 3: Top

  let arcCx = rx;
  let arcCy = ry;
  let startAngle = 0;
  let endAngle = 0;

  if (dir === 0) {
      // Right block: Center is bottom-left, arc from Top (1.5PI) to Right (0/2PI)
      arcCx = rx;
      arcCy = ry + size;
      startAngle = Math.PI * 1.5;
      endAngle = Math.PI * 2;
  } else if (dir === 1) {
      // Bottom block: Center is top-left, arc from Right (0) to Bottom (0.5PI)
      arcCx = rx;
      arcCy = ry;
      startAngle = 0;
      endAngle = Math.PI * 0.5;
  } else if (dir === 2) {
      // Left block: Center is top-right, arc from Bottom (0.5PI) to Left (1PI)
      arcCx = rx + size;
      arcCy = ry;
      startAngle = Math.PI * 0.5;
      endAngle = Math.PI;
  } else if (dir === 3) {
      // Top block: Center is bottom-right, arc from Left (1PI) to Top (1.5PI)
      arcCx = rx + size;
      arcCy = ry + size;
      startAngle = Math.PI;
      endAngle = Math.PI * 1.5;
  }

  return { rx, ry, size, dir, arcCx, arcCy, startAngle, endAngle };
}

let scaleTarget = 1;
let scaleCurrent = 1;

let translateXTarget = 0;
let translateYTarget = 0;
let translateXCurrent = 0;
let translateYCurrent = 0;

function updateTargetView() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate bounding box for all drawn squares up to current step
    for (let i = 0; i <= currentStep; i++) {
        const { rx, ry, size } = getRectProperties(i);
        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx + size);
        maxY = Math.max(maxY, ry + size);
    }

    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;

    // Scale needs to fit the bounding box into the viewport with padding
    const padding = 50;
    const scaleX = (width - padding * 2) / Math.max(bboxWidth, 1);
    const scaleY = (height - padding * 2) / Math.max(bboxHeight, 1);

    scaleTarget = Math.min(scaleX, scaleY);
    // Enforce max zoom so small early squares aren't huge
    if (scaleTarget > 50) scaleTarget = 50;

    // Center the bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    translateXTarget = width / 2 - centerX * scaleTarget;
    translateYTarget = height / 2 - centerY * scaleTarget;
}

function drawSquare(index, progress) {
  const { rx, ry, size, startAngle, endAngle, arcCx, arcCy } = getRectProperties(index);

  ctx.save();
  ctx.translate(translateXCurrent, translateYCurrent);
  ctx.scale(scaleCurrent, scaleCurrent);

  // Draw square
  ctx.fillStyle = index % 2 === 0 ? squareBgEven : squareBgOdd;
  ctx.strokeStyle = squareBorder;
  ctx.lineWidth = 1 / scaleCurrent;

  // Progressively draw square if it's the current one
  const currentSize = progress >= 1 ? size : size * progress;

  if (progress < 1) {
    // Fading effect for drawing
    ctx.globalAlpha = progress;
  }

  ctx.fillRect(rx, ry, size, size);
  ctx.strokeRect(rx, ry, size, size);

  // Draw Spiral Arc
  if (progress > 0) {
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.strokeStyle = spiralColor;
    ctx.lineWidth = 2 / scaleCurrent;

    // Calculate the drawn angle based on progress
    const totalAngle = endAngle - startAngle;
    let currentEndAngle = startAngle;

    // Calculate the drawn angle based on progress. All intervals are 0.5 * PI.
    currentEndAngle = startAngle + (endAngle - startAngle) * progress;

    ctx.arc(arcCx, arcCy, size, startAngle, currentEndAngle, false);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, width, height);

  // Update view transform via lerp for smoothness
  scaleCurrent += (scaleTarget - scaleCurrent) * 0.05;
  translateXCurrent += (translateXTarget - translateXCurrent) * 0.05;
  translateYCurrent += (translateYTarget - translateYCurrent) * 0.05;

  // Draw previous squares fully
  for (let i = 0; i < currentStep; i++) {
    drawSquare(i, 1);
  }

  // Draw current animating square
  drawSquare(currentStep, currentAnimationProgress);

  // Update logic if playing
  if (isPlaying) {
    currentAnimationProgress += animationSpeed;

    if (currentAnimationProgress >= 1) {
      currentAnimationProgress = 0;
      currentStep++;
      updateTargetView();

      // Update UI
      currentFnDisplay.textContent = fibSequence[currentStep] || fibSequence[fibSequence.length-1];
      currentSquaresDisplay.textContent = currentStep;

      if (currentStep >= maxSquares) {
        isPlaying = false;
        playPauseBtn.textContent = '▶';
        currentStep = maxSquares - 1; // Cap it
        currentAnimationProgress = 1; // fully drawn
      }
    }
  }

  requestAnimationFrame(render);
}

// Initial setup
updateTargetView();
// Jump transform to start instead of lerping from 0
scaleCurrent = scaleTarget;
translateXCurrent = translateXTarget;
translateYCurrent = translateYTarget;

currentFnDisplay.textContent = fibSequence[0];
currentSquaresDisplay.textContent = '0';

requestAnimationFrame(render);

// Event Listeners
playPauseBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
});

speedSlider.addEventListener('input', (e) => {
  animationSpeed = parseInt(e.target.value) * 0.005;
});

stepForwardBtn.addEventListener('click', () => {
  if (currentStep < maxSquares - 1) {
    currentStep++;
    currentAnimationProgress = 1;
    updateTargetView();
    currentFnDisplay.textContent = fibSequence[currentStep];
    currentSquaresDisplay.textContent = currentStep;
  }
});

stepBackBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    currentAnimationProgress = 1;
    updateTargetView();
    currentFnDisplay.textContent = fibSequence[currentStep];
    currentSquaresDisplay.textContent = currentStep;
  }
});
