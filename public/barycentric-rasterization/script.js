const canvas = document.getElementById('render-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let width, height;
let isDragging = false;
let draggedVertex = null;

// Vertices of the triangle
const vertices = [
    { x: 0, y: 0, color: [255, 59, 48], radius: 15 },    // Red
    { x: 0, y: 0, color: [52, 199, 89], radius: 15 },    // Green
    { x: 0, y: 0, color: [0, 122, 255], radius: 15 }     // Blue
];

function resize() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Initialize triangle vertices relative to canvas size if not already set or out of bounds
    if (vertices[0].x === 0 && vertices[0].y === 0) {
        vertices[0].x = width * 0.5;
        vertices[0].y = height * 0.2;
        vertices[1].x = width * 0.2;
        vertices[1].y = height * 0.8;
        vertices[2].x = width * 0.8;
        vertices[2].y = height * 0.8;
    }

    restartRasterization();
}

window.addEventListener('resize', resize);

// Event handling
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    return { x, y };
}

function handlePointerDown(e) {
    const { x, y } = getPointerPos(e);

    // Check if clicked on a vertex
    for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        const dx = x - v.x;
        const dy = y - v.y;
        if (Math.sqrt(dx * dx + dy * dy) <= v.radius * 2) { // slightly larger hit area
            isDragging = true;
            draggedVertex = v;
            break;
        }
    }
}

function handlePointerMove(e) {
    if (!isDragging || !draggedVertex) return;

    const { x, y } = getPointerPos(e);
    draggedVertex.x = Math.max(0, Math.min(width, x));
    draggedVertex.y = Math.max(0, Math.min(height, y));

    restartRasterization();
}

function handlePointerUp() {
    isDragging = false;
    draggedVertex = null;
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);

canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    handlePointerMove(e);
}, { passive: false });
window.addEventListener('touchend', handlePointerUp);

// Rasterization state
let rasterState = null;
let animationId = null;

function computeBarycentric(x, y, v0, v1, v2) {
    const detT = (v1.y - v2.y) * (v0.x - v2.x) + (v2.x - v1.x) * (v0.y - v2.y);
    const w0 = ((v1.y - v2.y) * (x - v2.x) + (v2.x - v1.x) * (y - v2.y)) / detT;
    const w1 = ((v2.y - v0.y) * (x - v2.x) + (v0.x - v2.x) * (y - v2.y)) / detT;
    const w2 = 1 - w0 - w1;
    return { w0, w1, w2 };
}

function interpolateColor(w0, w1, w2) {
    const c0 = vertices[0].color;
    const c1 = vertices[1].color;
    const c2 = vertices[2].color;

    return [
        Math.round(w0 * c0[0] + w1 * c1[0] + w2 * c2[0]),
        Math.round(w0 * c0[1] + w1 * c1[1] + w2 * c2[1]),
        Math.round(w0 * c0[2] + w1 * c1[2] + w2 * c2[2])
    ];
}

function restartRasterization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Find bounding box
    const minX = Math.floor(Math.min(vertices[0].x, vertices[1].x, vertices[2].x));
    const maxX = Math.ceil(Math.max(vertices[0].x, vertices[1].x, vertices[2].x));
    const minY = Math.floor(Math.min(vertices[0].y, vertices[1].y, vertices[2].y));
    const maxY = Math.ceil(Math.max(vertices[0].y, vertices[1].y, vertices[2].y));

    // Create ImageData buffer for the whole canvas
    const imgData = ctx.createImageData(width, height);

    rasterState = {
        minX: Math.max(0, minX),
        maxX: Math.min(width - 1, maxX),
        minY: Math.max(0, minY),
        maxY: Math.min(height - 1, maxY),
        currentX: Math.max(0, minX),
        currentY: Math.max(0, minY),
        imgData: imgData,
        pixelsPerFrame: 20000 // Adjust this for animation speed
    };

    // Clear canvas before drawing
    ctx.clearRect(0, 0, width, height);

    // Draw wireframe triangle outline
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawVertices();

    // Start rasterization loop
    rasterizeFrame();
}

function rasterizeFrame() {
    if (!rasterState) return;

    const { minX, maxX, maxY, imgData, pixelsPerFrame } = rasterState;
    let { currentX, currentY } = rasterState;
    let pixelsProcessed = 0;

    // Create a temporary off-screen canvas/image data if we only want to update a dirty rectangle?
    // Actually, putImageData updates the whole thing or a dirty rect. We'll update the whole canvas for simplicity
    // but only calculate a chunk of pixels.

    while (pixelsProcessed < pixelsPerFrame && currentY <= maxY) {
        // Calculate barycentric coordinates
        const { w0, w1, w2 } = computeBarycentric(currentX, currentY, vertices[0], vertices[1], vertices[2]);

        // If inside the triangle
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
            const color = interpolateColor(w0, w1, w2);

            // Set pixel data
            const index = (currentY * width + currentX) * 4;
            imgData.data[index] = color[0];     // R
            imgData.data[index + 1] = color[1]; // G
            imgData.data[index + 2] = color[2]; // B
            imgData.data[index + 3] = 255;      // A
        }

        currentX++;
        pixelsProcessed++;

        if (currentX > maxX) {
            currentX = minX;
            currentY++;
        }
    }

    rasterState.currentX = currentX;
    rasterState.currentY = currentY;

    // Draw the image data to canvas
    // Using dirty rectangle for better performance
    if (pixelsProcessed > 0) {
        ctx.putImageData(imgData, 0, 0);

        // Redraw vertices on top
        drawVertices();

        // Continue animation
        animationId = requestAnimationFrame(rasterizeFrame);
    }
}

function drawVertices() {
    vertices.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${v.color[0]}, ${v.color[1]}, ${v.color[2]})`;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// Initial setup
resize();
