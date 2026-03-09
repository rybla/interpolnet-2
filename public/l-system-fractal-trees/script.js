const canvas = document.getElementById('lsystem-canvas');
const ctx = canvas.getContext('2d');
const axiomInput = document.getElementById('axiom');
const rulesList = document.getElementById('rules-list');
const addRuleBtn = document.getElementById('add-rule-btn');
const ruleTemplate = document.getElementById('rule-template');

let resizeTimeout;
let drawTimeout;

// Hardcoded visualization parameters (since unrequested controls were removed)
const iterations = 4;
const angle = 25;
const length = 10;
const scaleFactor = 1.0;

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  scheduleDraw();
}

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 100);
}

function init() {
  window.addEventListener('resize', handleResize);

  // Attach initial listeners
  axiomInput.addEventListener('input', scheduleDraw);
  addRuleBtn.addEventListener('click', () => addRule());

  // Initialize with a default rule
  addRule('F', 'FF+[+F-F-F]-[-F+F+F]');

  resizeCanvas();
}

function addRule(key = '', value = '') {
  const ruleNode = ruleTemplate.content.cloneNode(true);
  const ruleRow = ruleNode.querySelector('.rule-row');
  const keyInput = ruleNode.querySelector('.rule-key');
  const valueInput = ruleNode.querySelector('.rule-value');
  const removeBtn = ruleNode.querySelector('.remove-rule-btn');

  keyInput.value = key;
  valueInput.value = value;

  keyInput.addEventListener('input', scheduleDraw);
  valueInput.addEventListener('input', scheduleDraw);

  removeBtn.addEventListener('click', () => {
    ruleRow.classList.add('removing');
    setTimeout(() => {
      ruleRow.remove();
      scheduleDraw();
    }, 200);
  });

  rulesList.appendChild(ruleNode);
  scheduleDraw();
}

function getRules() {
  const rules = {};
  const rows = rulesList.querySelectorAll('.rule-row');

  rows.forEach(row => {
    const key = row.querySelector('.rule-key').value.trim();
    const value = row.querySelector('.rule-value').value;

    if (key && key.length === 1) {
      rules[key] = value;
    }
  });

  return rules;
}

function expandSystem(axiom, rules, iter) {
  let result = axiom;
  for (let i = 0; i < iter; i++) {
    let nextResult = '';
    for (let j = 0; j < result.length; j++) {
      const char = result[j];
      nextResult += rules[char] !== undefined ? rules[char] : char;
    }
    result = nextResult;
  }
  return result;
}

function scheduleDraw() {
  clearTimeout(drawTimeout);
  drawTimeout = setTimeout(draw, 16); // ~60fps debounce
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const axiom = axiomInput.value.trim();
  if (!axiom) return;

  const rules = getRules();
  const expandedStr = expandSystem(axiom, rules, iterations);

  renderLSystem(expandedStr);
}

function renderLSystem(str) {
  const radAngle = angle * (Math.PI / 180);

  ctx.save();

  // Calculate bounds to center the fractal
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  let currX = 0, currY = 0, currDir = -Math.PI / 2;
  const stateStack = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === 'F' || char === 'A' || char === 'B') {
      currX += length * Math.cos(currDir);
      currY += length * Math.sin(currDir);
      minX = Math.min(minX, currX);
      maxX = Math.max(maxX, currX);
      minY = Math.min(minY, currY);
      maxY = Math.max(maxY, currY);
    } else if (char === 'f') {
      currX += length * Math.cos(currDir);
      currY += length * Math.sin(currDir);
    } else if (char === '+') {
      currDir += radAngle;
    } else if (char === '-') {
      currDir -= radAngle;
    } else if (char === '[') {
      stateStack.push({x: currX, y: currY, dir: currDir});
    } else if (char === ']') {
      if (stateStack.length > 0) {
        const state = stateStack.pop();
        currX = state.x;
        currY = state.y;
        currDir = state.dir;
      }
    }
  }

  // Check bounds to prevent NaN errors on empty drawings
  if (minX === maxX) maxX += 1;
  if (minY === maxY) maxY += 1;

  const boundWidth = maxX - minX;
  const boundHeight = maxY - minY;

  // Calculate scale to fit canvas with padding
  const padding = 40;
  const scaleX = (canvas.width - padding * 2) / boundWidth;
  const scaleY = (canvas.height - padding * 2) / boundHeight;
  const scale = Math.min(scaleX, scaleY) * scaleFactor;

  // Center translation
  const cx = canvas.width / 2 - ((minX + maxX) / 2) * scale;
  const cy = canvas.height / 2 - ((minY + maxY) / 2) * scale;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Actual rendering
  ctx.lineWidth = 1.5 / scale;
  ctx.strokeStyle = '#00ffcc'; // Accent neon cyan
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  currX = 0;
  currY = 0;
  currDir = -Math.PI / 2;
  stateStack.length = 0; // Reset stack

  ctx.beginPath();
  ctx.moveTo(currX, currY);

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === 'F' || char === 'A' || char === 'B') {
      currX += length * Math.cos(currDir);
      currY += length * Math.sin(currDir);
      ctx.lineTo(currX, currY);
    } else if (char === 'f') {
      currX += length * Math.cos(currDir);
      currY += length * Math.sin(currDir);
      ctx.moveTo(currX, currY);
    } else if (char === '+') {
      currDir += radAngle;
    } else if (char === '-') {
      currDir -= radAngle;
    } else if (char === '[') {
      stateStack.push({x: currX, y: currY, dir: currDir});
    } else if (char === ']') {
      if (stateStack.length > 0) {
        const state = stateStack.pop();
        currX = state.x;
        currY = state.y;
        currDir = state.dir;
        ctx.moveTo(currX, currY);
      }
    }
  }

  ctx.stroke();
  ctx.restore();
}

// Start
document.addEventListener('DOMContentLoaded', init);
