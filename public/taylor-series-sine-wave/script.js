const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const termsSlider = document.getElementById('terms-slider');
const speedSlider = document.getElementById('animation-speed');
const termsValueSpan = document.getElementById('terms-value');
const formulaText = document.getElementById('formula-text');

let width, height;
let time = 0;
let currentTerms = 1;
let targetTerms = 1;
let animatedTerms = 1;
let animationSpeed = 1.0;

function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener('resize', resize);
resize();

// Math helpers
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Evaluate Taylor polynomial
function taylorSine(x, terms) {
  let sum = 0;
  // Interpolate between whole term counts
  const wholeTerms = Math.floor(terms);
  const remainder = terms - wholeTerms;

  for (let n = 0; n < Math.ceil(terms); n++) {
    let power = 2 * n + 1;
    let sign = n % 2 === 0 ? 1 : -1;
    let fact = factorial(power);
    let termValue = sign * Math.pow(x, power) / fact;

    if (n === wholeTerms) {
        sum += termValue * remainder; // Interpolated newest term
    } else {
        sum += termValue;
    }
  }
  return sum;
}

function updateFormulaText(terms) {
  const wholeTerms = Math.floor(terms);
  let formulaHTML = "sin(x) ≈ ";
  for (let n = 0; n < wholeTerms; n++) {
    let power = 2 * n + 1;
    let sign = n % 2 === 0 ? " + " : " - ";
    if (n === 0) sign = ""; // First term has no sign

    let factStr = power === 1 ? "" : `/${power}!`;
    let xStr = power === 1 ? "x" : `x^${power}`;

    formulaHTML += `<span class="math-term" style="animation-delay: ${n * 0.1}s">${sign}${xStr}${factStr}</span>`;
  }
  formulaText.innerHTML = formulaHTML;
}

// Input handling
termsSlider.addEventListener('input', (e) => {
  targetTerms = parseInt(e.target.value);
  termsValueSpan.textContent = targetTerms;
  updateFormulaText(targetTerms);
});

speedSlider.addEventListener('input', (e) => {
  animationSpeed = parseFloat(e.target.value);
});

// Initial formula setup
updateFormulaText(targetTerms);

// Drawing logic
function draw() {
  ctx.clearRect(0, 0, width, height);

  // Grid and Axes
  ctx.strokeStyle = '#1e2d4a';
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Map drawing coordinates to math coordinates
  const scaleX = width / (4 * Math.PI); // show roughly -2pi to 2pi
  const scaleY = height / 4; // y from -2 to 2 roughly
  const centerX = width / 2;
  const centerY = height / 2;

  // Axes
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();

  // Draw true sine wave (baseline)
  ctx.beginPath();
  ctx.strokeStyle = '#4a5b7c'; // Dim gray/blue
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]); // Dashed line

  for (let px = 0; px < width; px += 2) {
    let mathX = (px - centerX) / scaleX;
    let mathY = Math.sin(mathX);
    let py = centerY - (mathY * scaleY);

    if (px === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Taylor Approximation
  ctx.beginPath();
  ctx.strokeStyle = '#00ffcc'; // Neon cyan
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Add a glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffcc';

  // Animate terms towards target
  const diff = targetTerms - animatedTerms;
  animatedTerms += diff * 0.05 * animationSpeed;

  // Clamp to avoid tiny floating point oscillation
  if (Math.abs(targetTerms - animatedTerms) < 0.01) {
    animatedTerms = targetTerms;
  }

  // To create a "wrapping" effect that grows from center,
  // we draw outward up to a dynamic boundary based on the number of terms and time
  const maxMathX = 4 * Math.PI;

  let startedDrawing = false;
  for (let px = 0; px < width; px += 2) {
    let mathX = (px - centerX) / scaleX;

    let mathY = taylorSine(mathX, animatedTerms);
    let py = centerY - (mathY * scaleY);

    // Stop drawing if the approximation blows up to keep it clean
    if (py < -height || py > height * 2) {
        if(startedDrawing) {
            ctx.stroke();
            ctx.beginPath();
            startedDrawing = false;
        }
        continue;
    }

    if (!startedDrawing) {
        ctx.moveTo(px, py);
        startedDrawing = true;
    } else {
        ctx.lineTo(px, py);
    }
  }
  if(startedDrawing) ctx.stroke();

  // Reset shadow for other drawing
  ctx.shadowBlur = 0;

  time += 0.016 * animationSpeed;
  requestAnimationFrame(draw);
}

// Start loop
draw();
