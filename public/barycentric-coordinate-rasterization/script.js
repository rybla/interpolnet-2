const canvas = document.getElementById('rasterCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// UI Elements
const valX = document.getElementById('val-x');
const valY = document.getElementById('val-y');
const valAlpha = document.getElementById('val-alpha');
const valBeta = document.getElementById('val-beta');
const valGamma = document.getElementById('val-gamma');
const valColor = document.getElementById('val-color');
const colorSwatch = document.getElementById('color-swatch');
const btnReset = document.getElementById('btn-reset');

let width, height;
let triangle = [];
let bbox = {};
let currentPixel = { x: 0, y: 0 };
let isRasterizing = false;
let animationId = null;
let pixelData;

// Initialize
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    btnReset.addEventListener('click', reset);
    reset();
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Scale triangle based on new screen size
    const minDim = Math.min(width, height);
    const size = minDim * 0.8;
    const cx = width / 2;
    const cy = height / 2;

    triangle = [
        { x: cx, y: cy - size / 2, color: { r: 255, g: 0, b: 0 } }, // Top (Red)
        { x: cx - size / 2, y: cy + size / 2, color: { r: 0, g: 255, b: 0 } }, // Bottom Left (Green)
        { x: cx + size / 2, y: cy + size / 2, color: { r: 0, g: 0, b: 255 } }  // Bottom Right (Blue)
    ];

    if (!isRasterizing) {
        reset();
    }
}

function reset() {
    if (animationId) cancelAnimationFrame(animationId);

    // Clear canvas
    ctx.fillStyle = '#0d1117'; // Match CSS background
    ctx.fillRect(0, 0, width, height);

    // Calculate Bounding Box
    const minX = Math.floor(Math.min(triangle[0].x, triangle[1].x, triangle[2].x));
    const maxX = Math.ceil(Math.max(triangle[0].x, triangle[1].x, triangle[2].x));
    const minY = Math.floor(Math.min(triangle[0].y, triangle[1].y, triangle[2].y));
    const maxY = Math.ceil(Math.max(triangle[0].y, triangle[1].y, triangle[2].y));

    bbox = {
        minX: Math.max(0, minX),
        maxX: Math.min(width - 1, maxX),
        minY: Math.max(0, minY),
        maxY: Math.min(height - 1, maxY)
    };

    // Draw triangle outline
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.closePath();
    ctx.stroke();

    // Start rasterization
    currentPixel = { x: bbox.minX, y: bbox.minY };
    isRasterizing = true;
    pixelData = ctx.getImageData(0, 0, width, height);

    updateUI({ x: 0, y: 0 }, 0, 0, 0, { r: 0, g: 0, b: 0 });
    rasterizeStep();
}

function edgeFunction(a, b, c) {
    return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function rasterizeStep() {
    if (!isRasterizing) return;

    // Process a batch of pixels per frame to keep animation speed reasonable
    const pixelsPerFrame = 5000;
    let pixelsProcessed = 0;

    // Calculate total area of the triangle for barycentric coordinates
    const area = edgeFunction(triangle[0], triangle[1], triangle[2]);

    let lastValidPixel = null;
    let lastValidWeights = null;
    let lastValidColor = null;

    while (pixelsProcessed < pixelsPerFrame && isRasterizing) {
        const p = { x: currentPixel.x + 0.5, y: currentPixel.y + 0.5 }; // Sample at pixel center

        // Calculate barycentric weights (unnormalized)
        let w0 = edgeFunction(triangle[1], triangle[2], p); // Weight for vertex 0 (Red)
        let w1 = edgeFunction(triangle[2], triangle[0], p); // Weight for vertex 1 (Green)
        let w2 = edgeFunction(triangle[0], triangle[1], p); // Weight for vertex 2 (Blue)

        // Normalize weights
        w0 /= area;
        w1 /= area;
        w2 /= area;

        // Check if pixel is inside triangle
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
            // Interpolate color
            const r = Math.round(w0 * triangle[0].color.r + w1 * triangle[1].color.r + w2 * triangle[2].color.r);
            const g = Math.round(w0 * triangle[0].color.g + w1 * triangle[1].color.g + w2 * triangle[2].color.g);
            const b = Math.round(w0 * triangle[0].color.b + w1 * triangle[1].color.b + w2 * triangle[2].color.b);

            // Directly modify ImageData for performance
            const index = (currentPixel.y * width + currentPixel.x) * 4;
            pixelData.data[index] = r;
            pixelData.data[index + 1] = g;
            pixelData.data[index + 2] = b;
            pixelData.data[index + 3] = 255; // Alpha

            lastValidPixel = { x: currentPixel.x, y: currentPixel.y };
            lastValidWeights = { w0, w1, w2 };
            lastValidColor = { r, g, b };
        }

        // Move to next pixel
        currentPixel.x++;
        if (currentPixel.x > bbox.maxX) {
            currentPixel.x = bbox.minX;
            currentPixel.y++;
            if (currentPixel.y > bbox.maxY) {
                isRasterizing = false;
            }
        }
        pixelsProcessed++;
    }

    // Put image data back to canvas
    ctx.putImageData(pixelData, 0, 0);

    // Update UI with the last valid pixel processed in this batch (for visual feedback)
    if (lastValidPixel) {
        updateUI(lastValidPixel, lastValidWeights.w0, lastValidWeights.w1, lastValidWeights.w2, lastValidColor);
    } else {
        // If we didn't hit inside the triangle, just update coordinates
        updateUI(currentPixel, 0, 0, 0, { r: 0, g: 0, b: 0 });
    }

    if (isRasterizing) {
        animationId = requestAnimationFrame(rasterizeStep);
    } else {
        // Ensure final UI update shows completion or empty state
        valX.textContent = '-';
        valY.textContent = '-';
    }
}

function updateUI(pixel, w0, w1, w2, color) {
    valX.textContent = pixel.x;
    valY.textContent = pixel.y;
    valAlpha.textContent = Math.max(0, w0).toFixed(3);
    valBeta.textContent = Math.max(0, w1).toFixed(3);
    valGamma.textContent = Math.max(0, w2).toFixed(3);

    const rgbString = `rgb(${color.r}, ${color.g}, ${color.b})`;
    valColor.textContent = rgbString;
    colorSwatch.style.backgroundColor = rgbString;
}

// Start
init();