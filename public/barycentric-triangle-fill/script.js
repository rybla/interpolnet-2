const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let isDragging = false;
let draggedVertex = null;
let animationStep = 0; // 0: init, 1: rasterizing, 2: done
let rasterX = 0;
let rasterY = 0;
let boundingBox = null;

// The three vertices
const vertices = [
    { x: 0, y: 0, r: 255, g: 0, b: 0, radius: 15 },
    { x: 0, y: 0, r: 0, g: 255, b: 0, radius: 15 },
    { x: 0, y: 0, r: 0, g: 0, b: 255, radius: 15 }
];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    resetRasterization();
    draw();
}

function initVertices() {
    vertices[0].x = width / 2;
    vertices[0].y = height * 0.2;
    vertices[1].x = width * 0.2;
    vertices[1].y = height * 0.8;
    vertices[2].x = width * 0.8;
    vertices[2].y = height * 0.8;
}

function resetRasterization() {
    animationStep = 0;
    computeBoundingBox();
    rasterX = boundingBox.minX;
    rasterY = boundingBox.minY;
    draw();
}

function computeBoundingBox() {
    boundingBox = {
        minX: Math.floor(Math.min(vertices[0].x, vertices[1].x, vertices[2].x)),
        minY: Math.floor(Math.min(vertices[0].y, vertices[1].y, vertices[2].y)),
        maxX: Math.ceil(Math.max(vertices[0].x, vertices[1].x, vertices[2].x)),
        maxY: Math.ceil(Math.max(vertices[0].y, vertices[1].y, vertices[2].y))
    };
    // clamp to screen
    boundingBox.minX = Math.max(0, boundingBox.minX);
    boundingBox.minY = Math.max(0, boundingBox.minY);
    boundingBox.maxX = Math.min(width, boundingBox.maxX);
    boundingBox.maxY = Math.min(height, boundingBox.maxY);
}

function draw() {
    if (animationStep === 0) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
    }

    // Draw edges
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();
    ctx.stroke();

    // Draw vertices
    vertices.forEach(v => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${v.r},${v.g},${v.b})`;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// Barycentric coordinates
function getBarycentric(p, a, b, c) {
    const v0 = { x: b.x - a.x, y: b.y - a.y };
    const v1 = { x: c.x - a.x, y: c.y - a.y };
    const v2 = { x: p.x - a.x, y: p.y - a.y };

    const d00 = v0.x * v0.x + v0.y * v0.y;
    const d01 = v0.x * v1.x + v0.y * v1.y;
    const d11 = v1.x * v1.x + v1.y * v1.y;
    const d20 = v2.x * v0.x + v2.y * v0.y;
    const d21 = v2.x * v1.x + v2.y * v1.y;

    const denom = d00 * d11 - d01 * d01;

    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1.0 - v - w;

    return { u, v, w };
}

function rasterizeStep() {
    if (animationStep !== 1) return;

    // Process a chunk of pixels per frame to keep it animated but fast enough
    const pixelsPerFrame = 2000;
    let pixelsProcessed = 0;

    while(pixelsProcessed < pixelsPerFrame && animationStep === 1) {
        if (rasterY > boundingBox.maxY) {
            animationStep = 2;
            break;
        }

        const p = { x: rasterX, y: rasterY };
        const coords = getBarycentric(p, vertices[0], vertices[1], vertices[2]);

        if (coords.u >= 0 && coords.v >= 0 && coords.w >= 0 &&
            coords.u <= 1 && coords.v <= 1 && coords.w <= 1) {

            const r = Math.round(coords.u * vertices[0].r + coords.v * vertices[1].r + coords.w * vertices[2].r);
            const g = Math.round(coords.u * vertices[0].g + coords.v * vertices[1].g + coords.w * vertices[2].g);
            const b = Math.round(coords.u * vertices[0].b + coords.v * vertices[1].b + coords.w * vertices[2].b);

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(rasterX, rasterY, 1, 1);
        }

        rasterX++;
        if (rasterX > boundingBox.maxX) {
            rasterX = boundingBox.minX;
            rasterY++;
        }
        pixelsProcessed++;
    }

    // redraw vertices over the fill
    draw();

    if (animationStep === 1) {
        requestAnimationFrame(rasterizeStep);
    }
}

// Interaction
function getEventPos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function pointerDown(e) {
    const pos = getEventPos(e);

    // check if clicked a vertex
    for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        const dist = Math.hypot(pos.x - v.x, pos.y - v.y);
        if (dist <= v.radius * 2) {
            isDragging = true;
            draggedVertex = v;
            resetRasterization();
            return;
        }
    }

    // click on empty space to advance state
    if (!isDragging) {
        if (animationStep === 0) {
            animationStep = 1;
            requestAnimationFrame(rasterizeStep);
        } else if (animationStep === 2) {
            resetRasterization();
        }
    }
}

function pointerMove(e) {
    if (!isDragging || !draggedVertex) return;
    const pos = getEventPos(e);
    draggedVertex.x = pos.x;
    draggedVertex.y = pos.y;
    resetRasterization();
}

function pointerUp() {
    isDragging = false;
    draggedVertex = null;
}

window.addEventListener('resize', resize);
canvas.addEventListener('mousedown', pointerDown);
canvas.addEventListener('mousemove', pointerMove);
window.addEventListener('mouseup', pointerUp);
canvas.addEventListener('touchstart', pointerDown);
canvas.addEventListener('touchmove', pointerMove);
window.addEventListener('touchend', pointerUp);

// Init
resize();
initVertices();
resetRasterization();
