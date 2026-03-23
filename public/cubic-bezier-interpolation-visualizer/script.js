const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tSlider = document.getElementById('t-slider');
const tValue = document.getElementById('t-value');
const playPauseBtn = document.getElementById('play-pause-btn');

let width, height;

// Control points initialized later based on screen size
let points = [];
let draggingPoint = null;

// Animation state
let t = 0;
let isPlaying = true;
let animDir = 1;
const speed = 0.005;
const POINT_RADIUS = 8;
const HIT_RADIUS = 20;

// Colors matching CSS variables
const COLORS = {
    bg: '#0b132b',
    p: '#ffffff',
    l1: '#3a506b',
    l2: '#5bc0be',
    l3: '#ff9f1c',
    curve: '#e71d36',
    curveTrace: 'rgba(231, 29, 54, 0.4)'
};

function init() {
    resize();
    window.addEventListener('resize', resize);

    // Initial points layout based on screen
    const cx = width / 2;
    const cy = height / 2;
    const padding = Math.min(width, height) * 0.1;

    points = [
        { x: padding, y: height - padding },
        { x: cx - padding, y: padding },
        { x: cx + padding, y: padding },
        { x: width - padding, y: height - padding }
    ];

    // Pointer events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    // UI Events
    tSlider.addEventListener('input', (e) => {
        t = parseFloat(e.target.value);
        isPlaying = false;
        playPauseBtn.textContent = 'Play';
        updateUI();
    });

    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    });

    requestAnimationFrame(loop);
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Math helpers
function lerp(p0, p1, t) {
    return {
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t
    };
}

function drawLine(p0, p1, color, lineWidth = 2) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function drawPoint(p, color, radius = POINT_RADIUS) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateUI() {
    tSlider.value = t;
    tValue.textContent = t.toFixed(2);
}

function drawBezierTrace() {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Static drawing of the full curve
    for (let st = 0; st <= 1; st += 0.01) {
        // level 1
        const a1 = lerp(points[0], points[1], st);
        const b1 = lerp(points[1], points[2], st);
        const c1 = lerp(points[2], points[3], st);
        // level 2
        const a2 = lerp(a1, b1, st);
        const b2 = lerp(b1, c1, st);
        // level 3 (final)
        const f = lerp(a2, b2, st);
        ctx.lineTo(f.x, f.y);
    }
    ctx.strokeStyle = COLORS.curveTrace;
    ctx.lineWidth = 4;
    ctx.stroke();
}

function render() {
    // Clear
    ctx.clearRect(0, 0, width, height);

    drawBezierTrace();

    // Level 1: Control lines
    drawLine(points[0], points[1], COLORS.l1, 2);
    drawLine(points[1], points[2], COLORS.l1, 2);
    drawLine(points[2], points[3], COLORS.l1, 2);

    // Interpolated Level 1 points
    const a1 = lerp(points[0], points[1], t);
    const b1 = lerp(points[1], points[2], t);
    const c1 = lerp(points[2], points[3], t);

    // Level 2 lines
    drawLine(a1, b1, COLORS.l2, 3);
    drawLine(b1, c1, COLORS.l2, 3);

    // Interpolated Level 2 points
    const a2 = lerp(a1, b1, t);
    const b2 = lerp(b1, c1, t);

    // Level 3 line
    drawLine(a2, b2, COLORS.l3, 4);

    // Final point
    const finalP = lerp(a2, b2, t);

    // Draw all points
    // Base control points
    points.forEach((p, i) => drawPoint(p, COLORS.p));

    // Intermediate points
    [a1, b1, c1].forEach(p => drawPoint(p, COLORS.l2, 5));
    [a2, b2].forEach(p => drawPoint(p, COLORS.l3, 6));

    // Draw Final Bezier Point with a glow
    ctx.shadowColor = COLORS.curve;
    ctx.shadowBlur = 10;
    drawPoint(finalP, COLORS.curve, 8);
    ctx.shadowBlur = 0;
}

function loop() {
    if (isPlaying) {
        t += speed * animDir;
        if (t >= 1) {
            t = 1;
            animDir = -1;
        } else if (t <= 0) {
            t = 0;
            animDir = 1;
        }
        updateUI();
    }

    render();
    requestAnimationFrame(loop);
}

// Interaction Handlers
function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handlePointerDown(e) {
    const pos = getCanvasPos(e);
    // Find closest point within HIT_RADIUS
    let closestDist = HIT_RADIUS;

    points.forEach((p, index) => {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < closestDist) {
            closestDist = dist;
            draggingPoint = index;
        }
    });

    if (draggingPoint !== null) {
        // Optional: pause animation when dragging
        // isPlaying = false;
        // playPauseBtn.textContent = 'Play';
        canvas.style.cursor = 'grabbing';
    }
}

function handlePointerMove(e) {
    if (draggingPoint !== null) {
        e.preventDefault(); // Prevent scrolling on mobile
        const pos = getCanvasPos(e);
        points[draggingPoint].x = pos.x;
        points[draggingPoint].y = pos.y;
    } else {
        const pos = getCanvasPos(e);
        let cursor = 'default';
        for (let p of points) {
            const dx = p.x - pos.x;
            const dy = p.y - pos.y;
            if (Math.sqrt(dx*dx + dy*dy) < HIT_RADIUS) {
                cursor = 'grab';
                break;
            }
        }
        canvas.style.cursor = cursor;
    }
}

function handlePointerUp() {
    draggingPoint = null;
    canvas.style.cursor = 'default';
}

init();
