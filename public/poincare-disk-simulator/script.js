const canvas = document.getElementById('poincare-canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear-btn');

let width, height, cx, cy, radius;
let lines = [];
let currentLine = null;
let isDrawing = false;
let animationTime = 0;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cx = width / 2;
    cy = height / 2;
    // Calculate radius to fit nicely with some padding
    radius = Math.min(width, height) * 0.45;

    // On mobile, leave room for UI
    if (window.innerWidth <= 768) {
        cy = height / 2 + 30; // Shift down slightly
        radius = Math.min(width, height) * 0.4;
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    add(c) {
        return new Complex(this.re + c.re, this.im + c.im);
    }

    sub(c) {
        return new Complex(this.re - c.re, this.im - c.im);
    }

    mult(c) {
        return new Complex(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re);
    }

    div(c) {
        const denom = c.re * c.re + c.im * c.im;
        return new Complex(
            (this.re * c.re + this.im * c.im) / denom,
            (this.im * c.re - this.re * c.im) / denom
        );
    }

    modulusSq() {
        return this.re * this.re + this.im * this.im;
    }

    modulus() {
        return Math.sqrt(this.modulusSq());
    }

    conjugate() {
        return new Complex(this.re, -this.im);
    }

    scale(s) {
        return new Complex(this.re * s, this.im * s);
    }
}

// Map screen coordinates to unit disk complex coordinates
function screenToDisk(x, y) {
    return new Complex((x - cx) / radius, (y - cy) / radius);
}

// Map disk complex coordinates back to screen
function diskToScreen(c) {
    return { x: cx + c.re * radius, y: cy + c.im * radius };
}

// Check if a point is inside the unit disk
function isInside(c) {
    return c.modulusSq() < 1;
}

// Calculate the center and radius of the Euclidean circle orthogonal to the unit disk passing through p1 and p2
function calculateGeodesic(p1, p2) {
    // If points are essentially the same
    const diff = p1.sub(p2);
    if (diff.modulus() < 0.001) return null;

    // Check if line goes through origin (straight line in Euclidean sense)
    const cross = p1.re * p2.im - p1.im * p2.re;
    if (Math.abs(cross) < 0.001) {
        return { type: 'line', p1: p1, p2: p2 };
    }

    // Invert p1 in the unit circle to get a third point p1_inv that the circle must pass through
    // Inversion formula: p' = p / |p|^2 = 1 / p_conjugate
    const m1 = p1.modulusSq();
    const p1_inv = p1.scale(1 / m1);

    // Now find the circumcenter of triangle formed by p1, p2, p1_inv
    // Center is intersection of perpendicular bisectors
    const mid1 = p1.add(p2).scale(0.5);
    const mid2 = p1.add(p1_inv).scale(0.5);

    const dir1 = new Complex(-(p2.im - p1.im), p2.re - p1.re);
    const dir2 = new Complex(-(p1_inv.im - p1.im), p1_inv.re - p1.re);

    // Solve for intersection of lines: mid1 + t1*dir1 = mid2 + t2*dir2
    const det = dir1.re * dir2.im - dir1.im * dir2.re;
    if (Math.abs(det) < 0.0001) return { type: 'line', p1: p1, p2: p2 }; // Fallback

    const t1 = ((mid2.re - mid1.re) * dir2.im - (mid2.im - mid1.im) * dir2.re) / det;
    const center = mid1.add(dir1.scale(t1));
    const r = center.sub(p1).modulus();

    return { type: 'arc', center: center, r: r, p1: p1, p2: p2 };
}

function drawLineSegments(ctx, type, data, color, width, dash = false) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    if (dash) {
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -animationTime * 50; // Active animation
    } else {
        ctx.setLineDash([]);
    }

    if (data.type === 'line') {
        const s1 = diskToScreen(data.p1);
        const s2 = diskToScreen(data.p2);
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
    } else if (data.type === 'arc') {
        const sCenter = diskToScreen(data.center);
        const sR = data.r * radius;

        // Calculate angles
        let a1 = Math.atan2(data.p1.im - data.center.im, data.p1.re - data.center.re);
        let a2 = Math.atan2(data.p2.im - data.center.im, data.p2.re - data.center.re);

        // Normalize angles and determine shortest path
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        const anticlockwise = diff < 0;

        ctx.arc(sCenter.x, sCenter.y, sR, a1, a1 + diff, anticlockwise);
    }
    ctx.stroke();

    // Draw end points
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    const s1 = diskToScreen(data.p1);
    const s2 = diskToScreen(data.p2);
    ctx.beginPath(); ctx.arc(s1.x, s1.y, width * 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s2.x, s2.y, width * 1.5, 0, Math.PI*2); ctx.fill();
}

function render(time) {
    animationTime = time / 1000;

    // Clear background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);

    // Draw boundary disk
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#111122';
    ctx.fill();

    // Subtle glow on disk edge
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15 + Math.sin(animationTime * 2) * 5; // Passive breathing glow
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // Draw saved lines
    for (let i = 0; i < lines.length; i++) {
        const lineData = calculateGeodesic(lines[i].start, lines[i].end);
        if (lineData) {
            drawLineSegments(ctx, lineData.type, lineData, '#ffff00', 2, false);
            // Glowing overlay for saved lines
            ctx.globalCompositeOperation = 'lighter';
            drawLineSegments(ctx, lineData.type, lineData, 'rgba(255, 255, 0, 0.3)', 6, false);
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    // Draw current active line
    if (isDrawing && currentLine && currentLine.start && currentLine.end) {
        const lineData = calculateGeodesic(currentLine.start, currentLine.end);
        if (lineData) {
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            drawLineSegments(ctx, lineData.type, lineData, '#ff00ff', 3, true);
            ctx.shadowBlur = 0;
        }
    }

    requestAnimationFrame(render);
}

// Interaction logic
function getPointerPos(e) {
    if (e.touches) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleStart(e) {
    const pos = getPointerPos(e);
    const p = screenToDisk(pos.x, pos.y);
    if (isInside(p)) {
        isDrawing = true;
        currentLine = { start: p, end: p };
    }
}

function handleMove(e) {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    let p = screenToDisk(pos.x, pos.y);

    // Constrain to slightly inside disk to avoid infinity math issues
    if (p.modulusSq() >= 0.99) {
        p = p.scale(0.99 / p.modulus());
    }
    currentLine.end = p;
}

function handleEnd(e) {
    if (isDrawing) {
        if (currentLine.start && currentLine.end && currentLine.start.sub(currentLine.end).modulusSq() > 0.001) {
            lines.push({...currentLine});
        }
        isDrawing = false;
        currentLine = null;
    }
}

canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove); // Window to catch fast drags
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e); }, { passive: false });
window.addEventListener('touchmove', (e) => { if(isDrawing) e.preventDefault(); handleMove(e); }, { passive: false });
window.addEventListener('touchend', handleEnd);

clearBtn.addEventListener('click', () => {
    lines = [];
    // Active animation effect on button
    canvas.style.opacity = 0.5;
    setTimeout(() => canvas.style.opacity = 1, 100);
});

requestAnimationFrame(render);
