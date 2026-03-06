const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear-btn');
const statusText = document.getElementById('status-text');

let width, height;
let isDrawing = false;
let userDrawing = [];
let fourierY = [];
let time = 0;
let path = [];
let state = 'waiting'; // 'waiting', 'drawing', 'animating'
let animationId;

// Resize canvas to fill the screen
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Keep path centered if animating
    if (state === 'animating') {
        path = [];
        time = 0;
    }
}

window.addEventListener('resize', resize);
resize();

// Discrete Fourier Transform
function dft(x) {
    const X = [];
    const N = x.length;
    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;
        for (let n = 0; n < N; n++) {
            const phi = (2 * Math.PI * k * n) / N;
            // x[n] is complex: x[n].re, x[n].im
            // e^(-i*phi) = cos(phi) - i*sin(phi)
            // (a + bi)(c - di) = ac + bd + i(bc - ad)
            re += x[n].re * Math.cos(phi) + x[n].im * Math.sin(phi);
            im += x[n].im * Math.cos(phi) - x[n].re * Math.sin(phi);
        }
        re = re / N;
        im = im / N;

        let freq = k;
        let amp = Math.sqrt(re * re + im * im);
        let phase = Math.atan2(im, re);

        X[k] = { re, im, freq, amp, phase };
    }
    return X;
}

function updateStatus(newStatus, isHighlight = false) {
    statusText.textContent = `Status: ${newStatus}`;
    if (isHighlight) {
        statusText.classList.add('status-highlight');
    } else {
        statusText.classList.remove('status-highlight');
    }
}

// Drawing interaction
function startDrawing(e) {
    if (state === 'animating') {
        clearCanvas();
    }
    state = 'drawing';
    isDrawing = true;
    userDrawing = [];
    path = [];
    time = 0;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    updateStatus('Drawing...', true);
    ctx.clearRect(0, 0, width, height);

    // Prevent default scrolling on touch
    if (e.type === 'touchstart') {
        e.preventDefault();
    }

    addPoint(e);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    if (userDrawing.length < 5) {
        // Not enough points
        state = 'waiting';
        updateStatus('Waiting for drawing...');
        userDrawing = [];
        ctx.clearRect(0, 0, width, height);
        return;
    }

    state = 'processing';
    updateStatus('Calculating Fourier Transform...', true);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
        // Prepare complex numbers for 2D DFT (x and y)
        const complexDrawing = [];

        // Downsample if too many points to keep performance reasonable
        const maxPoints = 300;
        let step = 1;
        if (userDrawing.length > maxPoints) {
            step = Math.ceil(userDrawing.length / maxPoints);
        }

        for (let i = 0; i < userDrawing.length; i += step) {
            // Center around 0,0 for rotation calculation
            complexDrawing.push({
                re: userDrawing[i].x - width/2,
                im: userDrawing[i].y - height/2
            });
        }

        // Calculate 2D DFT
        fourierY = dft(complexDrawing);

        // Sort by amplitude (largest circles first)
        fourierY.sort((a, b) => b.amp - a.amp);

        state = 'animating';
        updateStatus('Animating Epicycles', true);

        // Start animation loop
        animate();
    }, 50);
}

function getPointerPos(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return { x: clientX, y: clientY };
}

function addPoint(e) {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    userDrawing.push(pos);

    // Draw the current line
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(userDrawing[0].x, userDrawing[0].y);
    for (let i = 1; i < userDrawing.length; i++) {
        ctx.lineTo(userDrawing[i].x, userDrawing[i].y);
    }
    ctx.strokeStyle = 'rgba(163, 170, 181, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function clearCanvas() {
    state = 'waiting';
    userDrawing = [];
    fourierY = [];
    path = [];
    time = 0;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    ctx.clearRect(0, 0, width, height);
    updateStatus('Waiting for drawing...');
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', addPoint);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', addPoint, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

clearBtn.addEventListener('click', clearCanvas);

// Draw Epicycles
function drawEpicycles(x, y, rotation, fourier) {
    for (let i = 0; i < fourier.length; i++) {
        let prevx = x;
        let prevy = y;

        let freq = fourier[i].freq;
        let radius = fourier[i].amp;
        let phase = fourier[i].phase;

        x += radius * Math.cos(freq * time + phase + rotation);
        y += radius * Math.sin(freq * time + phase + rotation);

        // Draw circle
        ctx.beginPath();
        ctx.arc(prevx, prevy, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(38, 42, 63, 0.5)'; // subtle circle
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(prevx, prevy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)'; // cyan line
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw connecting dot at joints
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
        ctx.fill();
    }
    return { x, y };
}

// Main animation loop
function animate() {
    if (state !== 'animating') return;

    ctx.clearRect(0, 0, width, height);

    // Draw original path faintly in background
    if (userDrawing.length > 0) {
        ctx.beginPath();
        ctx.moveTo(userDrawing[0].x, userDrawing[0].y);
        for (let i = 1; i < userDrawing.length; i++) {
            ctx.lineTo(userDrawing[i].x, userDrawing[i].y);
        }
        ctx.strokeStyle = 'rgba(163, 170, 181, 0.2)'; // faint gray
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Center point
    let vx = drawEpicycles(width / 2, height / 2, 0, fourierY);

    // Add point to path
    path.unshift(vx); // Add to beginning

    // Draw the traced path
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
        if (i === 0) {
            ctx.moveTo(path[i].x, path[i].y);
        } else {
            ctx.lineTo(path[i].x, path[i].y);
        }
    }
    ctx.strokeStyle = '#ff00cc'; // vibrant pink trace
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 0, 204, 0.8)';
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Delta time based on number of points to ensure full cycle
    const dt = (2 * Math.PI) / fourierY.length;
    time += dt;

    // Keep path length manageable to prevent memory issues
    // Path represents one full cycle
    if (path.length > fourierY.length) {
        path.pop();
    }

    animationId = requestAnimationFrame(animate);
}
