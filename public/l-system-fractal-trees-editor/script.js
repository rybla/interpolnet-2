const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const axiomInput = document.getElementById('axiom');
const rulesContainer = document.getElementById('rules-container');
const addRuleBtn = document.getElementById('add-rule-btn');
const iterationsInput = document.getElementById('iterations');
const iterationsVal = document.getElementById('iterations-val');
const angleInput = document.getElementById('angle');
const angleVal = document.getElementById('angle-val');

// Resize canvas to fit container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawLSystem();
}

window.addEventListener('resize', resizeCanvas);

// Add event listeners to initial inputs
axiomInput.addEventListener('input', drawLSystem);
iterationsInput.addEventListener('input', (e) => {
    iterationsVal.textContent = e.target.value;
    drawLSystem();
});
angleInput.addEventListener('input', (e) => {
    angleVal.innerHTML = `${e.target.value}&deg;`;
    drawLSystem();
});

// Setup dynamic rule addition/removal
function attachRuleListeners(row) {
    const keyInput = row.querySelector('.rule-key');
    const valueInput = row.querySelector('.rule-value');
    const removeBtn = row.querySelector('.remove-rule-btn');

    keyInput.addEventListener('input', drawLSystem);
    valueInput.addEventListener('input', drawLSystem);
    removeBtn.addEventListener('click', () => {
        row.remove();
        drawLSystem();
    });
}

// Attach listeners to initial rule
attachRuleListeners(rulesContainer.querySelector('.rule-row'));

addRuleBtn.addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.className = 'rule-row';
    newRow.innerHTML = `
        <input type="text" class="rule-key" placeholder="Key">
        <span>&rarr;</span>
        <input type="text" class="rule-value" placeholder="Replacement">
        <button class="remove-rule-btn" aria-label="Remove Rule">&times;</button>
    `;
    rulesContainer.appendChild(newRow);
    attachRuleListeners(newRow);
});

// L-System Logic
function parseRules() {
    const rules = {};
    const rows = rulesContainer.querySelectorAll('.rule-row');
    rows.forEach(row => {
        const key = row.querySelector('.rule-key').value.trim();
        const value = row.querySelector('.rule-value').value;
        if (key && key.length === 1) {
            rules[key] = value;
        }
    });
    return rules;
}

function generateLSystem(axiom, rules, iterations) {
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

// Render the tree using turtle graphics
function executeTurtle(expandedString, angleDegrees, length, pass, ctx, bounds) {
    const angleRads = (angleDegrees * Math.PI) / 180;

    // Turtle state
    let x = pass === 1 ? 0 : bounds.startX;
    let y = pass === 1 ? 0 : bounds.startY;
    let currentAngle = -Math.PI / 2; // Pointing up

    let stack = [];

    if (pass === 2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    for (let i = 0; i < expandedString.length; i++) {
        const char = expandedString[i];

        if (char === 'F' || char === 'G') {
            x += length * Math.cos(currentAngle);
            y += length * Math.sin(currentAngle);

            if (pass === 1) {
                bounds.minX = Math.min(bounds.minX, x);
                bounds.maxX = Math.max(bounds.maxX, x);
                bounds.minY = Math.min(bounds.minY, y);
                bounds.maxY = Math.max(bounds.maxY, y);
            } else {
                ctx.lineTo(x, y);
            }
        } else if (char === '+') {
            currentAngle += angleRads;
        } else if (char === '-') {
            currentAngle -= angleRads;
        } else if (char === '[') {
            stack.push({ x, y, angle: currentAngle });
        } else if (char === ']') {
            if (stack.length > 0) {
                const state = stack.pop();
                x = state.x;
                y = state.y;
                currentAngle = state.angle;
                if (pass === 2) {
                    ctx.moveTo(x, y);
                }
            }
        }
        // X and Y are ignored for drawing, they are just for rules
    }

    if (pass === 2) {
        ctx.stroke();
    }
}

function drawLSystem() {
    const axiom = axiomInput.value.trim();
    if (!axiom) return;

    const rules = parseRules();
    const iterations = parseInt(iterationsInput.value);
    const angle = parseFloat(angleInput.value);

    // Expand the string
    const expandedString = generateLSystem(axiom, rules, iterations);

    // Initial bounds tracking
    const bounds = {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        startX: 0,
        startY: 0
    };

    // First pass: Calculate bounding box without drawing
    executeTurtle(expandedString, angle, 10, 1, null, bounds);

    // Calculate dimensions
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // Check for empty/invalid drawings
    if (width === 0 && height === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Determine padding and scale
    const padding = 20;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    // Scale factor to fit inside canvas
    const scale = Math.min(availableWidth / width, availableHeight / height);

    // New origin to center the drawing
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const xOffset = (canvas.width - scaledWidth) / 2 - bounds.minX * scale;
    const yOffset = (canvas.height - scaledHeight) / 2 - bounds.minY * scale;

    bounds.startX = xOffset;
    bounds.startY = yOffset;

    // Clear canvas for drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Styling
    ctx.strokeStyle = '#34d399'; // --tree-color
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Second pass: Draw perfectly scaled and centered
    executeTurtle(expandedString, angle, 10 * scale, 2, ctx, bounds);
}

// Initial draw setup
setTimeout(resizeCanvas, 0);