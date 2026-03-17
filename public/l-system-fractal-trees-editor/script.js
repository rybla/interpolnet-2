const presetSelect = document.getElementById('preset');
const axiomInput = document.getElementById('axiom');
const rulesTextarea = document.getElementById('rules');
const iterationsInput = document.getElementById('iterations');
const angleInput = document.getElementById('angle');
const lengthInput = document.getElementById('length');

const iterationsVal = document.getElementById('iterations-val');
const angleVal = document.getElementById('angle-val');
const lengthVal = document.getElementById('length-val');

const presets = {
  'fractal-plant': {
    axiom: 'X',
    rules: 'X=F+[[X]-X]-F[-FX]+X\nF=FF',
    iterations: 5,
    angle: 25,
    length: 5
  },
  'koch-curve': {
    axiom: 'F',
    rules: 'F=F+F-F-F+F',
    iterations: 4,
    angle: 90,
    length: 5
  },
  'sierpinski-triangle': {
    axiom: 'F-G-G',
    rules: 'F=F-G+F+G-F\nG=GG',
    iterations: 5,
    angle: 120,
    length: 10
  },
  'dragon-curve': {
    axiom: 'FX',
    rules: 'X=X+YF+\nY=-FX-Y',
    iterations: 8,
    angle: 90,
    length: 5
  }
};

function parseRules(rulesString) {
  const rules = {};
  const lines = rulesString.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('=');
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      if (key && value) {
        rules[key] = value;
      }
    }
  }
  return rules;
}

function getSystemParams() {
  return {
    axiom: axiomInput.value,
    rules: parseRules(rulesTextarea.value),
    iterations: parseInt(iterationsInput.value, 10),
    angle: parseFloat(angleInput.value),
    length: parseFloat(lengthInput.value)
  };
}

const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  render();
}

function expandSystem(axiom, rules, iterations) {
  let currentString = axiom;
  for (let i = 0; i < iterations; i++) {
    let nextString = '';
    for (let j = 0; j < currentString.length; j++) {
      const char = currentString[j];
      nextString += rules[char] !== undefined ? rules[char] : char;
    }
    currentString = nextString;
  }
  return currentString;
}

function drawTree(instructions, length, angleDegrees) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const angleRad = (angleDegrees * Math.PI) / 180;

  // Starting state
  let x = canvas.width / 2;
  let y = canvas.height - 20; // Start near the bottom
  let currentAngle = -Math.PI / 2; // Pointing upwards

  // To keep the drawing centered, we compute bounds first
  let minX = x, maxX = x, minY = y, maxY = y;

  const stack = [];

  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--tree-color').trim();
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // We do two passes:
  // 1. Calculate bounding box
  // 2. Actually draw with scaling/translation if needed

  let tempX = x;
  let tempY = y;
  let tempAngle = currentAngle;
  let tempStack = [];

  for (let i = 0; i < instructions.length; i++) {
    const cmd = instructions[i];
    if (cmd === 'F' || cmd === 'G') {
      tempX += length * Math.cos(tempAngle);
      tempY += length * Math.sin(tempAngle);
      minX = Math.min(minX, tempX);
      maxX = Math.max(maxX, tempX);
      minY = Math.min(minY, tempY);
      maxY = Math.max(maxY, tempY);
    } else if (cmd === '+') {
      tempAngle += angleRad;
    } else if (cmd === '-') {
      tempAngle -= angleRad;
    } else if (cmd === '[') {
      tempStack.push({x: tempX, y: tempY, angle: tempAngle});
    } else if (cmd === ']') {
      if (tempStack.length > 0) {
        const state = tempStack.pop();
        tempX = state.x;
        tempY = state.y;
        tempAngle = state.angle;
      }
    }
  }

  const padding = 40;
  const width = maxX - minX;
  const height = maxY - minY;

  const scaleX = (canvas.width - padding * 2) / (width || 1);
  const scaleY = (canvas.height - padding * 2) / (height || 1);
  const scale = Math.min(scaleX, scaleY, 1);

  const cx = minX + width / 2;
  const cy = minY + height / 2;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.moveTo(x, y);

  for (let i = 0; i < instructions.length; i++) {
    const cmd = instructions[i];
    if (cmd === 'F' || cmd === 'G') {
      x += length * Math.cos(currentAngle);
      y += length * Math.sin(currentAngle);
      ctx.lineTo(x, y);
    } else if (cmd === '+') {
      currentAngle += angleRad;
    } else if (cmd === '-') {
      currentAngle -= angleRad;
    } else if (cmd === '[') {
      stack.push({x, y, angle: currentAngle});
    } else if (cmd === ']') {
      if (stack.length > 0) {
        const state = stack.pop();
        x = state.x;
        y = state.y;
        currentAngle = state.angle;
        ctx.moveTo(x, y);
      }
    }
  }

  ctx.stroke();
  ctx.restore();
}

function render() {
  const { axiom, rules, iterations, length, angle } = getSystemParams();
  const expanded = expandSystem(axiom, rules, iterations);
  drawTree(expanded, length, angle);
}

// Event Listeners
presetSelect.addEventListener('change', (e) => {
  const presetKey = e.target.value;
  if (presetKey !== 'custom' && presets[presetKey]) {
    const p = presets[presetKey];
    axiomInput.value = p.axiom;
    rulesTextarea.value = p.rules;
    iterationsInput.value = p.iterations;
    angleInput.value = p.angle;
    lengthInput.value = p.length;

    iterationsVal.textContent = p.iterations;
    angleVal.textContent = p.angle;
    lengthVal.textContent = p.length;
    render();
  }
});

function handleInputChange(element, valElement) {
  element.addEventListener('input', () => {
    if (valElement) {
      valElement.textContent = element.value;
    }
    presetSelect.value = 'custom';
    requestAnimationFrame(render);
  });
}

handleInputChange(axiomInput);
handleInputChange(rulesTextarea);
handleInputChange(iterationsInput, iterationsVal);
handleInputChange(angleInput, angleVal);
handleInputChange(lengthInput, lengthVal);

window.addEventListener('resize', resizeCanvas);

// Initialize
resizeCanvas();
