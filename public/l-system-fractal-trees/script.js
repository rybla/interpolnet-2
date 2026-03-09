// --- L-System Logic (Parsing) ---

/**
 * Expands an L-system axiom based on a set of rules and an iteration count.
 * @param {string} axiom The starting string.
 * @param {Object} rules A dictionary of rules, e.g., { 'F': 'FF+[+F-F-F]-[-F+F+F]' }
 * @param {number} iterations The number of times to apply the rules.
 * @returns {string} The expanded string.
 */
function expandLSystem(axiom, rules, iterations) {
  let currentString = axiom;

  for (let i = 0; i < iterations; i++) {
    let nextString = "";
    for (let j = 0; j < currentString.length; j++) {
      const char = currentString[j];
      // If there's a rule for the character, append its replacement; otherwise, keep the character.
      if (rules[char] !== undefined) {
        nextString += rules[char];
      } else {
        nextString += char;
      }
    }
    currentString = nextString;
  }

  return currentString;
}

// --- Turtle Graphics Rendering Logic ---

/**
 * Renders an L-system string onto a canvas using turtle graphics.
 * @param {CanvasRenderingContext2D} ctx The 2D rendering context.
 * @param {string} instructions The expanded L-system string.
 * @param {number} startX Starting X coordinate.
 * @param {number} startY Starting Y coordinate.
 * @param {number} startAngle Starting angle in degrees (0 is right, 90 is down, -90 is up).
 * @param {number} length Length to move/draw.
 * @param {number} angleIncrement Angle to turn right/left.
 * @param {string} strokeStyle Color of the lines.
 * @param {number} lineWidth Thickness of the lines.
 */
function drawLSystem(ctx, instructions, startX, startY, startAngle, length, angleIncrement, strokeStyle = '#10ac84', lineWidth = 2) {
  // Clear the canvas explicitly bounds
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let currentX = startX;
  let currentY = startY;
  // Convert angle increment from degrees to radians
  const angleIncrementRad = angleIncrement * (Math.PI / 180);
  let currentAngleRad = startAngle * (Math.PI / 180);

  // Stack to store states (position and angle)
  const stack = [];

  ctx.beginPath();
  ctx.moveTo(currentX, currentY);

  for (let i = 0; i < instructions.length; i++) {
    const command = instructions[i];

    if (command === 'F') {
      // Draw forward
      currentX += length * Math.cos(currentAngleRad);
      currentY += length * Math.sin(currentAngleRad);
      ctx.lineTo(currentX, currentY);
    } else if (command === 'f') {
      // Move forward without drawing
      currentX += length * Math.cos(currentAngleRad);
      currentY += length * Math.sin(currentAngleRad);
      ctx.moveTo(currentX, currentY);
    } else if (command === '+') {
      // Turn right (clockwise)
      currentAngleRad += angleIncrementRad;
    } else if (command === '-') {
      // Turn left (counter-clockwise)
      currentAngleRad -= angleIncrementRad;
    } else if (command === '[') {
      // Save state to stack
      stack.push({ x: currentX, y: currentY, angle: currentAngleRad });
    } else if (command === ']') {
      // Restore state from stack
      if (stack.length > 0) {
        const state = stack.pop();
        currentX = state.x;
        currentY = state.y;
        currentAngleRad = state.angle;
        // Move without drawing to the restored position
        ctx.moveTo(currentX, currentY);
      }
    }
  }

  // Draw everything we've collected
  ctx.stroke();
}

// --- Interactivity & DOM Logic ---
document.addEventListener("DOMContentLoaded", () => {
  // Constants
  const PRESETS = {
    'fractal-plant': {
      axiom: 'X',
      rules: { 'X': 'F+[[X]-X]-F[-FX]+X', 'F': 'FF' },
      iterations: 6,
      angle: 25,
      length: 10,
      scale: 0.5,
      startAngle: -90, // Up
      startYRatio: 0.95,
      startXRatio: 0.5
    },
    'sierpinski-triangle': {
      axiom: 'F-G-G',
      rules: { 'F': 'F-G+F+G-F', 'G': 'GG' },
      iterations: 5,
      angle: 120,
      length: 15,
      scale: 0.5,
      startAngle: 0,
      startYRatio: 0.9,
      startXRatio: 0.1
    },
    'dragon-curve': {
      axiom: 'FX',
      rules: { 'X': 'X+YF+', 'Y': '-FX-Y' },
      iterations: 10,
      angle: 90,
      length: 10,
      scale: 0.7,
      startAngle: 0,
      startYRatio: 0.5,
      startXRatio: 0.5
    },
    'koch-curve': {
      axiom: 'F',
      rules: { 'F': 'F+F-F-F+F' },
      iterations: 4,
      angle: 90,
      length: 10,
      scale: 0.33,
      startAngle: 0,
      startYRatio: 0.9,
      startXRatio: 0.1
    },
    'binary-tree': {
      axiom: '0',
      rules: { '1': '11', '0': '1[+0]-0' },
      iterations: 7,
      angle: 45,
      length: 50,
      scale: 0.5,
      startAngle: -90,
      startYRatio: 0.95,
      startXRatio: 0.5,
      // Custom mapping for Binary tree since it uses 0 and 1
      customMap: { '0': 'F', '1': 'F' }
    },
    'custom': {
      axiom: 'F',
      rules: { 'F': 'F[+F]F[-F]F' },
      iterations: 4,
      angle: 25,
      length: 20,
      scale: 0.5,
      startAngle: -90,
      startYRatio: 0.95,
      startXRatio: 0.5
    }
  };

  // DOM Elements
  const canvas = document.getElementById('tree-canvas');
  const ctx = canvas.getContext('2d');
  const presetSelect = document.getElementById('preset-select');
  const axiomInput = document.getElementById('axiom-input');
  const rulesContainer = document.getElementById('rules-container');
  const addRuleBtn = document.getElementById('add-rule-btn');
  const iterationsSlider = document.getElementById('iterations-slider');
  const iterationsValue = document.getElementById('iterations-value');
  const angleSlider = document.getElementById('angle-slider');
  const angleValue = document.getElementById('angle-value');
  const lengthSlider = document.getElementById('length-slider');
  const lengthValue = document.getElementById('length-value');
  const scaleSlider = document.getElementById('scale-slider');
  const scaleValue = document.getElementById('scale-value');
  const container = document.querySelector('.canvas-container');

  // State
  let currentPreset = PRESETS['fractal-plant'];
  let rulesData = {}; // Internal state of rules

  // Resize handler
  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
  }
  window.addEventListener('resize', resizeCanvas);

  // Helper to extract rules from DOM
  function updateRulesDataFromDOM() {
    rulesData = {};
    const rows = document.querySelectorAll('.rule-row');
    rows.forEach(row => {
      const keyInput = row.querySelector('.rule-key');
      const valInput = row.querySelector('.rule-value');
      if (keyInput.value && valInput.value) {
        rulesData[keyInput.value] = valInput.value;
      }
    });
  }

  // Create a new rule row in the DOM
  function createRuleRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'rule-row';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'rule-key';
    keyInput.value = key;
    keyInput.placeholder = 'A';
    keyInput.maxLength = 1;

    const separator = document.createElement('span');
    separator.textContent = '→';
    separator.style.color = 'var(--secondary-color)';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'rule-value';
    valueInput.value = value;
    valueInput.placeholder = 'AB';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn remove-btn';
    removeBtn.textContent = '-';
    removeBtn.ariaLabel = 'Remove Rule';

    row.appendChild(keyInput);
    row.appendChild(separator);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);

    rulesContainer.appendChild(row);

    // Add event listeners
    const triggerRender = () => {
      updateRulesDataFromDOM();
      render();
    };

    keyInput.addEventListener('input', triggerRender);
    valueInput.addEventListener('input', triggerRender);
    removeBtn.addEventListener('click', () => {
      row.remove();
      triggerRender();
    });
  }

  // Populate UI from preset
  function loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    currentPreset = preset; // Update current context

    axiomInput.value = preset.axiom;
    iterationsSlider.value = preset.iterations;
    iterationsValue.textContent = preset.iterations;
    angleSlider.value = preset.angle;
    angleValue.textContent = preset.angle;
    lengthSlider.value = preset.length;
    lengthValue.textContent = preset.length;
    scaleSlider.value = preset.scale;
    scaleValue.textContent = preset.scale;

    // Clear and populate rules
    rulesContainer.innerHTML = '';
    rulesData = { ...preset.rules };
    for (const [key, value] of Object.entries(preset.rules)) {
      createRuleRow(key, value);
    }

    render();
  }

  // Main Render Loop
  let renderAnimationFrameId = null;
  function render() {
    if (renderAnimationFrameId) {
      cancelAnimationFrame(renderAnimationFrameId);
    }

    renderAnimationFrameId = requestAnimationFrame(() => {
      const axiom = axiomInput.value;
      const iterations = parseInt(iterationsSlider.value, 10);
      const angleIncrement = parseFloat(angleSlider.value);
      const startingLength = parseInt(lengthSlider.value, 10);
      const scaleFactor = parseFloat(scaleSlider.value);
      // Scale length based on iterations so the tree fits reasonably
      const currentLength = startingLength * Math.pow(scaleFactor, iterations);

      // Expand the string
      let expandedString = expandLSystem(axiom, rulesData, iterations);

      // If the preset has a custom mapping (like binary-tree mapping 0,1 to F), apply it
      if (currentPreset.customMap) {
         let mappedString = "";
         for(let i=0; i<expandedString.length; i++) {
           const char = expandedString[i];
           if (currentPreset.customMap[char]) {
             mappedString += currentPreset.customMap[char];
           } else {
             mappedString += char;
           }
         }
         expandedString = mappedString;
      }

      // Starting positions (use preset relative positions or default to bottom center)
      const startX = canvas.width * (currentPreset.startXRatio || 0.5);
      const startY = canvas.height * (currentPreset.startYRatio || 0.95);
      const startAngle = currentPreset.startAngle !== undefined ? currentPreset.startAngle : -90;

      // Draw
      drawLSystem(
        ctx,
        expandedString,
        startX,
        startY,
        startAngle,
        currentLength,
        angleIncrement,
        '#00d2d3', // Using primary color
        2
      );
    });
  }

  // Event Listeners for UI updates
  presetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  axiomInput.addEventListener('input', render);

  addRuleBtn.addEventListener('click', () => {
    createRuleRow();
    render();
  });

  iterationsSlider.addEventListener('input', (e) => {
    iterationsValue.textContent = e.target.value;
    render();
  });

  angleSlider.addEventListener('input', (e) => {
    angleValue.textContent = e.target.value;
    render();
  });

  lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
    render();
  });

  scaleSlider.addEventListener('input', (e) => {
    scaleValue.textContent = e.target.value;
    render();
  });

  // Init
  resizeCanvas(); // Will also call initial load via width/height
  loadPreset('fractal-plant');
});

// Temporary export for testing/verification if needed in a non-browser environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { expandLSystem, drawLSystem };
}