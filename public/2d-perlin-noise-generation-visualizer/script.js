const canvas = document.getElementById('noiseCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const gridSize = 4; // Number of grid cells along one axis (grid points = gridSize + 1)
let gradients = [];
let timeOffset = 0;

// Offscreen canvas for rendering pixel data (respects logical width/height)
const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');
let offImageData = null;

// Initialize the canvas and set up resize listener
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    generateGradients();
    requestAnimationFrame(animate);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    width = container.clientWidth;
    height = container.clientHeight;

    // Set up offscreen canvas to match logical dimensions
    offCanvas.width = width;
    offCanvas.height = height;
    offImageData = offCtx.createImageData(width, height);

    // For high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Normalize coordinates to 0..width, 0..height
    ctx.scale(dpr, dpr);
}

// Generate random gradient vectors for each grid point
function generateGradients() {
    gradients = [];
    for (let y = 0; y <= gridSize; y++) {
        let row = [];
        for (let x = 0; x <= gridSize; x++) {
            // Create a random unit vector
            const angle = Math.random() * Math.PI * 2;
            row.push({
                x: Math.cos(angle),
                y: Math.sin(angle),
                angle: angle,
                speed: (Math.random() - 0.5) * 0.02 // For animation
            });
        }
        gradients.push(row);
    }
}

// Update the gradient vectors slightly each frame
function updateGradients() {
    for (let y = 0; y <= gridSize; y++) {
        for (let x = 0; x <= gridSize; x++) {
            const grad = gradients[y][x];
            grad.angle += grad.speed;
            grad.x = Math.cos(grad.angle);
            grad.y = Math.sin(grad.angle);
        }
    }
}

// Fade function to smooth the interpolation (6t^5 - 15t^4 + 10t^3)
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
function lerp(t, a, b) {
    return a + t * (b - a);
}

// Dot product between distance vector and gradient vector
function dotGridGradient(ix, iy, x, y) {
    // Get gradient from integer coordinates
    const gradient = gradients[iy][ix];

    // Calculate distance vector
    const dx = x - ix;
    const dy = y - iy;

    // Compute the dot-product
    return (dx * gradient.x + dy * gradient.y);
}

// Compute Perlin noise at coordinates x, y
function perlin(x, y) {
    // Determine grid cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Determine interpolation weights
    let sx = x - x0;
    let sy = y - y0;

    // Apply smoothing fade function
    let u = fade(sx);
    let v = fade(sy);

    // Interpolate between grid point gradients
    let n0, n1, ix0, ix1, value;

    // Top row interpolation
    n0 = dotGridGradient(x0, y0, x, y);
    n1 = dotGridGradient(x1, y0, x, y);
    ix0 = lerp(u, n0, n1);

    // Bottom row interpolation
    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    ix1 = lerp(u, n0, n1);

    // Final interpolation between rows
    value = lerp(v, ix0, ix1);

    return value; // Ranges approximately from -1.0 to 1.0
}

// Render the noise as a grayscale background
function renderNoise() {
    if (!offImageData) return;

    const data = offImageData.data;

    // Size of each grid cell in pixels
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // To improve performance, we could skip pixels or use WebGL,
    // but for 400x400 to 800x800 it should be okay on modern devices.
    // However, JS loop over 800x800 is 640k iterations per frame.
    // Let's implement a lower resolution render if it's too slow,
    // but standard perlin noise algorithm optimizations (like precomputed tables)
    // aren't used here as we want to animate the vectors themselves.

    // A quick optimization: use a step size and draw blocks.
    const stepSize = Math.max(1, Math.floor(width / 150)); // Limit to ~150x150 evaluations

    for (let py = 0; py < height; py += stepSize) {
        for (let px = 0; px < width; px += stepSize) {
            // Map pixel coordinates to grid coordinates (0 to gridSize)
            const gx = px / cellWidth;
            const gy = py / cellHeight;

            // Get noise value (-1 to 1)
            const n = perlin(gx, gy);

            // Map to 0-255 grayscale
            // The actual range of typical Perlin noise is roughly -0.7 to 0.7, so we scale it.
            let color = Math.floor((n + 0.7) * (255 / 1.4));
            if (color < 0) color = 0;
            if (color > 255) color = 255;

            for (let dy = 0; dy < stepSize && py + dy < height; dy++) {
                for (let dx = 0; dx < stepSize && px + dx < width; dx++) {
                    const index = ((py + dy) * width + (px + dx)) * 4;
                    data[index] = color;     // R
                    data[index+1] = color;   // G
                    data[index+2] = color;   // B
                    data[index+3] = 255;     // Alpha
                }
            }
        }
    }

    // Write pixel data to off-screen canvas
    offCtx.putImageData(offImageData, 0, 0);
    // Draw off-screen canvas to main canvas (this respects the ctx.scale transform for High-DPI displays)
    ctx.drawImage(offCanvas, 0, 0);
}

// Draw the underlying gradient vectors as arrows
function renderVectors() {
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
        const x = i * cellWidth;
        const y = i * cellHeight;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw vectors
    const vectorLength = Math.min(cellWidth, cellHeight) * 0.4;

    for (let y = 0; y <= gridSize; y++) {
        for (let x = 0; x <= gridSize; x++) {
            const px = x * cellWidth;
            const py = y * cellHeight;
            const grad = gradients[y][x];

            const ex = px + grad.x * vectorLength;
            const ey = py + grad.y * vectorLength;

            // Draw circle at grid point
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw arrow line
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Draw arrowhead
            const arrowSize = 6;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - arrowSize * Math.cos(grad.angle - Math.PI/6), ey - arrowSize * Math.sin(grad.angle - Math.PI/6));
            ctx.lineTo(ex - arrowSize * Math.cos(grad.angle + Math.PI/6), ey - arrowSize * Math.sin(grad.angle + Math.PI/6));
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Main animation loop
function animate() {
    updateGradients();
    renderNoise();
    renderVectors();
    requestAnimationFrame(animate);
}

window.onload = init;
