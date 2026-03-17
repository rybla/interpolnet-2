// State variables
let axiom = 'F';
let rules = {
  'F': 'FF+[+F-F-F]-[-F+F+F]'
};
let iterations = 3;
let angle = 22.5;
let initialLength = 10;
let lengthFactor = 1;
let currentString = '';

// DOM Elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const axiomInput = document.getElementById('axiom');
const iterationsInput = document.getElementById('iterations');
const angleInput = document.getElementById('angle');
const lengthInput = document.getElementById('length');
const lengthFactorInput = document.getElementById('length-factor');
const iterationsVal = document.getElementById('iterations-val');
const angleVal = document.getElementById('angle-val');
const lengthVal = document.getElementById('length-val');
const lengthFactorVal = document.getElementById('length-factor-val');
const rulesContainer = document.getElementById('rules-container');
const addRuleBtn = document.getElementById('add-rule-btn');
const stringPreview = document.getElementById('string-preview');
const stringLength = document.getElementById('string-length');
const presetSelect = document.getElementById('preset-select');

// Helper to parse rules from UI
function updateRulesFromUI() {
  const ruleRows = rulesContainer.querySelectorAll('.rule-row');
  rules = {};
  ruleRows.forEach(row => {
    const charInput = row.querySelector('.rule-char');
    const replacementInput = row.querySelector('.rule-replacement');
    const char = charInput.value.trim();
    const replacement = replacementInput.value.trim();
    if (char && replacement) {
      rules[char] = replacement;
    }
  });
}

// Generate the L-System string
function generateLSystem() {
  currentString = axiom;
  for (let i = 0; i < iterations; i++) {
    let nextString = '';
    for (let j = 0; j < currentString.length; j++) {
      const char = currentString[j];
      nextString += rules[char] || char;
    }
    currentString = nextString;
  }

  stringPreview.textContent = currentString;
  stringLength.textContent = currentString.length;
}

// Render the L-System
function renderLSystem() {
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Calculate bounds to center the drawing
  let minX = 0; let maxX = 0;
  let minY = 0; let maxY = 0;

  let x = 0;
  let y = 0;
  let currentAngle = -Math.PI / 2; // Pointing up
  let currentLength = initialLength;

  const stack = [];
  const radianAngle = (angle * Math.PI) / 180;

  // First pass: Calculate bounds
  for (let i = 0; i < currentString.length; i++) {
    const char = currentString[i];

    if (char === 'F' || char === 'G') {
      x += currentLength * Math.cos(currentAngle);
      y += currentLength * Math.sin(currentAngle);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    } else if (char === '+') {
      currentAngle += radianAngle;
    } else if (char === '-') {
      currentAngle -= radianAngle;
    } else if (char === '[') {
      stack.push({ x, y, a: currentAngle, l: currentLength });
      currentLength *= lengthFactor;
    } else if (char === ']') {
      if (stack.length > 0) {
        const state = stack.pop();
        x = state.x;
        y = state.y;
        currentAngle = state.a;
        currentLength = state.l;
      }
    }
  }

  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  // Fit to screen if necessary
  let scale = 1;
  const margin = 40;
  if (treeWidth > width - margin || treeHeight > height - margin) {
    const scaleX = (width - margin) / treeWidth;
    const scaleY = (height - margin) / treeHeight;
    scale = Math.min(scaleX, scaleY);
  }

  // Reset for actual drawing
  x = width / 2 - ((minX + maxX) / 2) * scale;
  y = height / 2 - ((minY + maxY) / 2) * scale;
  currentAngle = -Math.PI / 2;
  currentLength = initialLength * scale;
  stack.length = 0;

  ctx.strokeStyle = '#22d3ee'; // Accent color
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y);

  // Second pass: Draw
  for (let i = 0; i < currentString.length; i++) {
    const char = currentString[i];

    if (char === 'F' || char === 'G') {
      x += currentLength * Math.cos(currentAngle);
      y += currentLength * Math.sin(currentAngle);
      ctx.lineTo(x, y);
    } else if (char === 'f') { // Move forward without drawing
      x += currentLength * Math.cos(currentAngle);
      y += currentLength * Math.sin(currentAngle);
      ctx.moveTo(x, y);
    } else if (char === '+') {
      currentAngle += radianAngle;
    } else if (char === '-') {
      currentAngle -= radianAngle;
    } else if (char === '[') {
      stack.push({ x, y, a: currentAngle, l: currentLength });
      currentLength *= lengthFactor;
    } else if (char === ']') {
      if (stack.length > 0) {
        const state = stack.pop();
        x = state.x;
        y = state.y;
        currentAngle = state.a;
        currentLength = state.l;
        ctx.moveTo(x, y);
      }
    }
  }

  ctx.stroke();
}

function updateAndRender() {
  updateRulesFromUI();
  generateLSystem();
  renderLSystem();
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  renderLSystem();
}

// Initialize UI with preset
function loadPreset(key) {
  const preset = presets[key];
  if (!preset) return;

  axiom = preset.axiom;
  axiomInput.value = axiom;

  iterations = preset.iterations;
  iterationsInput.value = iterations;
  iterationsVal.textContent = iterations;

  angle = preset.angle;
  angleInput.value = angle;
  angleVal.textContent = angle + '°';

  initialLength = preset.length;
  lengthInput.value = initialLength;
  lengthVal.textContent = initialLength;

  lengthFactor = preset.lengthFactor;
  lengthFactorInput.value = lengthFactor;
  lengthFactorVal.textContent = lengthFactor;

  rulesContainer.innerHTML = '';
  for (const [char, replacement] of Object.entries(preset.rules)) {
    addRuleToUI(char, replacement);
  }

  updateAndRender();
}

function addRuleToUI(char = '', replacement = '') {
  const row = document.createElement('div');
  row.className = 'rule-row';
  row.innerHTML = `
    <input type="text" class="rule-char" value="${char}" maxlength="1" />
    <span>&rarr;</span>
    <input type="text" class="rule-replacement" value="${replacement}" />
    <button class="remove-rule-btn btn-danger btn-small">&times;</button>
  `;

  const charInput = row.querySelector('.rule-char');
  const replacementInput = row.querySelector('.rule-replacement');
  const removeBtn = row.querySelector('.remove-rule-btn');

  charInput.addEventListener('input', () => { presetSelect.value = 'custom'; updateAndRender(); });
  replacementInput.addEventListener('input', () => { presetSelect.value = 'custom'; updateAndRender(); });
  removeBtn.addEventListener('click', () => {
    row.remove();
    presetSelect.value = 'custom';
    updateAndRender();
  });

  rulesContainer.appendChild(row);
}

// Event Listeners
axiomInput.addEventListener('input', (e) => {
  axiom = e.target.value;
  presetSelect.value = 'custom';
  updateAndRender();
});

iterationsInput.addEventListener('input', (e) => {
  iterations = parseInt(e.target.value, 10);
  iterationsVal.textContent = iterations;
  presetSelect.value = 'custom';
  updateAndRender();
});

angleInput.addEventListener('input', (e) => {
  angle = parseFloat(e.target.value);
  angleVal.textContent = angle + '°';
  presetSelect.value = 'custom';
  updateAndRender();
});

lengthInput.addEventListener('input', (e) => {
  initialLength = parseInt(e.target.value, 10);
  lengthVal.textContent = initialLength;
  presetSelect.value = 'custom';
  updateAndRender();
});

lengthFactorInput.addEventListener('input', (e) => {
  lengthFactor = parseFloat(e.target.value);
  lengthFactorVal.textContent = lengthFactor;
  presetSelect.value = 'custom';
  updateAndRender();
});

presetSelect.addEventListener('change', (e) => {
  if (e.target.value !== 'custom') {
    loadPreset(e.target.value);
  }
});

addRuleBtn.addEventListener('click', () => {
  addRuleToUI();
  presetSelect.value = 'custom';
  updateAndRender();
});

// Setup existing rules inputs
const initialRuleRows = rulesContainer.querySelectorAll('.rule-row');
initialRuleRows.forEach(row => {
  const charInput = row.querySelector('.rule-char');
  const replacementInput = row.querySelector('.rule-replacement');
  const removeBtn = row.querySelector('.remove-rule-btn');

  charInput.addEventListener('input', () => { presetSelect.value = 'custom'; updateAndRender(); });
  replacementInput.addEventListener('input', () => { presetSelect.value = 'custom'; updateAndRender(); });
  removeBtn.addEventListener('click', () => {
    row.remove();
    presetSelect.value = 'custom';
    updateAndRender();
  });
});

window.addEventListener('resize', resizeCanvas);

// Init
resizeCanvas();
updateAndRender();

// Presets
const presets = {
  custom: { axiom: 'F', rules: { 'F': 'FF+[+F-F-F]-[-F+F+F]' }, iterations: 3, angle: 22.5, length: 10, lengthFactor: 1 },
  tree1: { axiom: 'F', rules: { 'F': 'F[+F]F[-F]F' }, iterations: 5, angle: 25.7, length: 5, lengthFactor: 1 },
  weed: { axiom: 'F', rules: { 'F': 'F[+F]F[-F][F]' }, iterations: 5, angle: 20, length: 15, lengthFactor: 0.8 },
  bush: { axiom: 'X', rules: { 'X': 'F-[[X]+X]+F[+FX]-X', 'F': 'FF' }, iterations: 5, angle: 22.5, length: 10, lengthFactor: 1 },
  koch: { axiom: 'F', rules: { 'F': 'F+F-F-F+F' }, iterations: 4, angle: 90, length: 5, lengthFactor: 1 },
  sierpinski: { axiom: 'F-G-G', rules: { 'F': 'F-G+F+G-F', 'G': 'GG' }, iterations: 5, angle: 120, length: 10, lengthFactor: 1 },
  dragon: { axiom: 'FX', rules: { 'X': 'X+YF+', 'Y': '-FX-Y' }, iterations: 10, angle: 90, length: 5, lengthFactor: 1 }
};
