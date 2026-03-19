const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  draw();
}

window.addEventListener('resize', resize);

const colors = [
  '#f94144', '#f3722c', '#f8961e', '#f9c74f',
  '#90be6d', '#43aa8b', '#577590', '#277da1'
];

let sequence = [1, 1];
let maxSteps = 2; // Initial steps to show
let targetScale = 1;
let currentScale = 1;
let scaleSpeed = 0.05;

let isAnimating = false;
let animationProgress = 0;

function fib(n) {
  if (sequence.length > n) return sequence[n];
  for (let i = sequence.length; i <= n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence[n];
}

canvas.addEventListener('click', () => {
  if (isAnimating) return;

  maxSteps++;
  fib(maxSteps);

  // Calculate bounding box roughly to figure out target scale
  // Actually we can just keep zooming out by the golden ratio
  targetScale *= 1 / 1.618;

  isAnimating = true;
  animationProgress = 0;
  requestAnimationFrame(animate);
});


function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);

  currentScale += (targetScale - currentScale) * scaleSpeed;

  // To keep it looking good, let's establish a base unit
  const baseUnit = Math.min(width, height) / 3;
  ctx.scale(baseUnit * currentScale, baseUnit * currentScale);

  // We need to translate so that the center of the growing spiral stays near the center of the screen.
  // The spiral center is the limit point, but a simple approximation is to center the golden rectangle.
  // For simplicity, we just draw from the center.

  let x = 0;
  let y = 0;
  let direction = 0; // 0: right, 1: up, 2: left, 3: down

  ctx.lineWidth = 1 / (baseUnit * currentScale);
  if (ctx.lineWidth > 1) ctx.lineWidth = 1; // max line width relative to scale

  for (let i = 0; i < maxSteps; i++) {
    const f = fib(i);
    const color = colors[i % colors.length];

    // Draw the square
    ctx.strokeStyle = color;
    ctx.beginPath();

    // Determine square origin based on direction
    let startX = x;
    let startY = y;

    if (direction === 0) {
      startY = y - f;
    } else if (direction === 1) {
      startX = x - f;
      startY = y - f;
    } else if (direction === 2) {
      startX = x - f;
    } else if (direction === 3) {
      // no changes needed, it goes down and right
    }

    ctx.fillStyle = color + '40'; // transparent
    ctx.fillRect(startX, startY, f, f);
    ctx.strokeRect(startX, startY, f, f);

    // Draw the arc
    ctx.beginPath();
    let arcCenterX, arcCenterY;
    if (direction === 0) {
      arcCenterX = startX;
      arcCenterY = startY + f;
      ctx.arc(arcCenterX, arcCenterY, f, 1.5 * Math.PI, 2 * Math.PI);
    } else if (direction === 1) {
      arcCenterX = startX + f;
      arcCenterY = startY + f;
      ctx.arc(arcCenterX, arcCenterY, f, Math.PI, 1.5 * Math.PI);
    } else if (direction === 2) {
      arcCenterX = startX + f;
      arcCenterY = startY;
      ctx.arc(arcCenterX, arcCenterY, f, 0.5 * Math.PI, Math.PI);
    } else if (direction === 3) {
      arcCenterX = startX;
      arcCenterY = startY;
      ctx.arc(arcCenterX, arcCenterY, f, 0, 0.5 * Math.PI);
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 / (baseUnit * currentScale);
    ctx.stroke();

    // Update x, y for next square
    if (direction === 0) {
      x += f;
    } else if (direction === 1) {
      y -= f;
    } else if (direction === 2) {
      x -= f;
    } else if (direction === 3) {
      y += f;
    }

    direction = (direction + 1) % 4;
  }

  ctx.restore();
}

function animate() {
  if (!isAnimating) return;

  animationProgress += 0.05;
  if (animationProgress >= 1) {
    animationProgress = 1;
    isAnimating = false;
  }

  draw();

  if (isAnimating || Math.abs(targetScale - currentScale) > 0.001) {
    requestAnimationFrame(animate);
  }
}

// Initial setup
resize();
animate();
