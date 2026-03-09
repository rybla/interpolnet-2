const canvas = document.getElementById('slope-canvas');
const ctx = canvas.getContext('2d');

let width, height;
// Coordinate system boundaries
let mathMinX = -10;
let mathMaxX = 10;
let mathMinY = -10;
let mathMaxY = 10;

// The differential equation: dy/dx = f(x, y)
function f(x, y) {
    return Math.sin(x) + Math.cos(y);
}

// Map mathematical coordinates to canvas pixels
function mathToScreen(x, y) {
    const sx = ((x - mathMinX) / (mathMaxX - mathMinX)) * width;
    const sy = height - ((y - mathMinY) / (mathMaxY - mathMinY)) * height;
    return { x: sx, y: sy };
}

// Map canvas pixels to mathematical coordinates
function screenToMath(sx, sy) {
    const x = (sx / width) * (mathMaxX - mathMinX) + mathMinX;
    const y = ((height - sy) / height) * (mathMaxY - mathMinY) + mathMinY;
    return { x, y };
}

// Draw the slope field
function drawSlopeField() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)'; // var(--field-color) but solid in canvas
    ctx.lineWidth = 1.5;

    // Density of the grid
    const stepsX = 40;
    const stepsY = 40;

    const dx = (mathMaxX - mathMinX) / stepsX;
    const dy = (mathMaxY - mathMinY) / stepsY;

    const segmentLengthScreen = 10; // Fixed length in pixels

    ctx.beginPath();
    for (let x = mathMinX; x <= mathMaxX; x += dx) {
        for (let y = mathMinY; y <= mathMaxY; y += dy) {
            const slope = f(x, y);
            const angle = Math.atan(slope);

            // Map the center point to screen
            const center = mathToScreen(x, y);

            // Calculate segment endpoints in screen space
            const sx1 = center.x - Math.cos(angle) * (segmentLengthScreen / 2);
            const sy1 = center.y + Math.sin(angle) * (segmentLengthScreen / 2); // Inverted Y on screen

            const sx2 = center.x + Math.cos(angle) * (segmentLengthScreen / 2);
            const sy2 = center.y - Math.sin(angle) * (segmentLengthScreen / 2); // Inverted Y on screen

            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
        }
    }
    ctx.stroke();
}

// Ink drop integration
const inkDrops = [];
const dt = 0.05; // Time step for integration
const maxSteps = 1500; // Limit trail length

// Runge-Kutta 4th Order numerical integration
function rk4(x, y, h) {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + (h / 2) * k1);
    const k3 = f(x + h / 2, y + (h / 2) * k2);
    const k4 = f(x + h, y + h * k3);

    const newY = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const newX = x + h;
    return { x: newX, y: newY };
}

class InkTrace {
    constructor(startX, startY, color) {
        this.forwardPoints = [{x: startX, y: startY}];
        this.backwardPoints = [{x: startX, y: startY}];
        this.color = color;
        this.forwardActive = true;
        this.backwardActive = true;
    }

    step() {
        if (this.forwardActive && this.forwardPoints.length < maxSteps) {
            const lastPoint = this.forwardPoints[this.forwardPoints.length - 1];
            const nextPoint = rk4(lastPoint.x, lastPoint.y, dt);

            if (nextPoint.x > mathMaxX || nextPoint.x < mathMinX || nextPoint.y > mathMaxY || nextPoint.y < mathMinY) {
                this.forwardActive = false; // Stop integrating if out of bounds
            } else {
                this.forwardPoints.push(nextPoint);
            }
        } else {
            this.forwardActive = false;
        }

        if (this.backwardActive && this.backwardPoints.length < maxSteps) {
            const lastPoint = this.backwardPoints[this.backwardPoints.length - 1];
            // Integrate backward by using negative dt
            const nextPoint = rk4(lastPoint.x, lastPoint.y, -dt);

            if (nextPoint.x > mathMaxX || nextPoint.x < mathMinX || nextPoint.y > mathMaxY || nextPoint.y < mathMinY) {
                this.backwardActive = false;
            } else {
                this.backwardPoints.push(nextPoint);
            }
        } else {
            this.backwardActive = false;
        }
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();

        // Draw backward trace (reversed)
        for (let i = this.backwardPoints.length - 1; i >= 0; i--) {
            const p = mathToScreen(this.backwardPoints[i].x, this.backwardPoints[i].y);
            if (i === this.backwardPoints.length - 1) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }

        // Draw forward trace
        for (let i = 1; i < this.forwardPoints.length; i++) {
            const p = mathToScreen(this.forwardPoints[i].x, this.forwardPoints[i].y);
            ctx.lineTo(p.x, p.y);
        }

        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    isActive() {
        return this.forwardActive || this.backwardActive;
    }
}

// Generate neon colors for drops
const colors = ['#00ffcc', '#ff00ff', '#facc15', '#3b82f6', '#ef4444', '#10b981'];
let colorIndex = 0;

function spawnInkDrop(sx, sy) {
    const mathPos = screenToMath(sx, sy);
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    inkDrops.push(new InkTrace(mathPos.x, mathPos.y, color));
}

// Interaction
let isDragging = false;

canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    spawnInkDrop(e.clientX, e.clientY);
});

canvas.addEventListener('pointermove', (e) => {
    if (isDragging) {
        // Debounce spawning slightly to prevent too many drops
        if (Math.random() > 0.5) {
            spawnInkDrop(e.clientX, e.clientY);
        }
    }
});

canvas.addEventListener('pointerup', () => {
    isDragging = false;
});

canvas.addEventListener('pointercancel', () => {
    isDragging = false;
});

function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Adjust math coordinates slightly based on aspect ratio to keep grid square
    const aspect = width / height;
    const mathHeight = mathMaxY - mathMinY;
    const targetMathWidth = mathHeight * aspect;
    const centerMathX = (mathMaxX + mathMinX) / 2;

    mathMinX = centerMathX - targetMathWidth / 2;
    mathMaxX = centerMathX + targetMathWidth / 2;

    drawSlopeField(); // redraw immediately on resize
}

window.addEventListener('resize', resize);

// Main animation loop
function animate() {
    drawSlopeField();

    // Step and draw all active and inactive traces
    for (let drop of inkDrops) {
        if (drop.isActive()) {
            // Step multiple times per frame to speed up drawing
            for(let i=0; i < 10; i++) {
                drop.step();
            }
        }
        drop.draw();
    }

    requestAnimationFrame(animate);
}

// Init
resize();
animate();