const canvas = document.getElementById("fractal-canvas");
const ctx = canvas.getContext("2d");

const axiomInput = document.getElementById("axiom");
const rulesInput = document.getElementById("rules");
const iterationsInput = document.getElementById("iterations");
const angleInput = document.getElementById("angle");
const lengthInput = document.getElementById("length");
const startXInput = document.getElementById("start-x");
const startYInput = document.getElementById("start-y");

const iterationsVal = document.getElementById("iterations-val");
const angleVal = document.getElementById("angle-val");
const lengthVal = document.getElementById("length-val");
const startXVal = document.getElementById("start-x-val");
const startYVal = document.getElementById("start-y-val");

function parseRules(ruleString) {
  const rules = {};
  const lines = ruleString.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const parts = trimmed.split("->");
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      if (key.length === 1) {
        rules[key] = value;
      }
    }
  }
  return rules;
}

function generateLSystem(axiom, rules, iterations) {
  let currentString = axiom;
  for (let i = 0; i < iterations; i++) {
    let nextString = "";
    for (let j = 0; j < currentString.length; j++) {
      const char = currentString[j];
      nextString += rules[char] || char;
    }
    currentString = nextString;
  }
  return currentString;
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  draw();
}

function drawTree(lSystemString, angleDeg, len) {
  const angleRad = (angleDeg * Math.PI) / 180;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startX = (parseFloat(startXInput.value) / 100) * canvas.width;
  const startY = (parseFloat(startYInput.value) / 100) * canvas.height;

  ctx.save();
  ctx.translate(startX, startY);
  ctx.rotate(Math.PI); // Point upwards (0 degrees in standard canvas is right, but trees grow up)

  const computedStyle = getComputedStyle(document.body);
  ctx.strokeStyle = computedStyle.getPropertyValue('--accent-color').trim() || '#10b981';
  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  ctx.beginPath();

  for (let i = 0; i < lSystemString.length; i++) {
    const char = lSystemString[i];

    if (char === "F" || char === "G" || char === "A" || char === "B") {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, len);
      ctx.translate(0, len);
    } else if (char === "f") {
      ctx.translate(0, len);
    } else if (char === "+") {
      ctx.rotate(-angleRad);
    } else if (char === "-") {
      ctx.rotate(angleRad);
    } else if (char === "[") {
      ctx.save();
    } else if (char === "]") {
      ctx.restore();
    }
  }

  ctx.stroke();
  ctx.restore();
}

let timeoutId = null;

function draw() {
  const axiom = axiomInput.value;
  const rules = parseRules(rulesInput.value);
  const iterations = parseInt(iterationsInput.value);
  const angle = parseFloat(angleInput.value);
  const length = parseFloat(lengthInput.value);

  iterationsVal.textContent = iterations;
  angleVal.textContent = angle;
  lengthVal.textContent = length;
  startXVal.textContent = startXInput.value;
  startYVal.textContent = startYInput.value;

  const lSystemString = generateLSystem(axiom, rules, iterations);

  if (timeoutId) {
    cancelAnimationFrame(timeoutId);
  }
  timeoutId = requestAnimationFrame(() => {
    drawTree(lSystemString, angle, length);
  });
}

// Event Listeners
window.addEventListener("resize", resizeCanvas);

axiomInput.addEventListener("input", draw);
rulesInput.addEventListener("input", draw);
iterationsInput.addEventListener("input", draw);
angleInput.addEventListener("input", draw);
lengthInput.addEventListener("input", draw);
startXInput.addEventListener("input", draw);
startYInput.addEventListener("input", draw);

// Presets
document.getElementById("preset-tree1").addEventListener("click", () => {
  axiomInput.value = "X";
  rulesInput.value = "X->F+[[X]-X]-F[-FX]+X\nF->FF";
  iterationsInput.value = 5;
  angleInput.value = 25;
  lengthInput.value = 5;
  startXInput.value = 50;
  startYInput.value = 100;
  draw();
});

document.getElementById("preset-tree2").addEventListener("click", () => {
  axiomInput.value = "F";
  rulesInput.value = "F->FF+[+F-F-F]-[-F+F+F]";
  iterationsInput.value = 4;
  angleInput.value = 22;
  lengthInput.value = 10;
  startXInput.value = 50;
  startYInput.value = 100;
  draw();
});

document.getElementById("preset-koch").addEventListener("click", () => {
  axiomInput.value = "F";
  rulesInput.value = "F->F+F-F-F+F";
  iterationsInput.value = 4;
  angleInput.value = 90;
  lengthInput.value = 5;
  startXInput.value = 10;
  startYInput.value = 90;
  draw();
});

document.getElementById("preset-sierpinski").addEventListener("click", () => {
  axiomInput.value = "A";
  rulesInput.value = "A->B-A-B\nB->A+B+A";
  iterationsInput.value = 6;
  angleInput.value = 60;
  lengthInput.value = 5;
  startXInput.value = 90;
  startYInput.value = 90;
  draw();
});

// Initial draw
resizeCanvas();
