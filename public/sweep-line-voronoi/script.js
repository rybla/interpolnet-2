const canvas = document.getElementById('voronoiCanvas');
const ctx = canvas.getContext('2d');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetSweepBtn = document.getElementById('resetSweepBtn');
const clearPointsBtn = document.getElementById('clearPointsBtn');
const speedSlider = document.getElementById('speedSlider');

let points = [];
let sweepY = 0;
let isPlaying = true;
let speed = 1;
let animationId;

// Initialize some default points
const defaultPoints = [
    {x: 0.2, y: 0.2},
    {x: 0.5, y: 0.3},
    {x: 0.8, y: 0.2},
    {x: 0.3, y: 0.6},
    {x: 0.7, y: 0.7},
    {x: 0.5, y: 0.8}
];

function resizeCanvas() {
    // Get actual dimensions of the container
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Convert normalized points to actual coordinates if we have normalized points
    if (points.length === 0) {
        points = defaultPoints.map(p => ({
            x: p.x * canvas.width,
            y: p.y * canvas.height
        }));
    }

    draw();
}

// Distance from point to parabola focus/directrix
function getParabolaY(x, focusX, focusY, directrixY) {
    if (Math.abs(focusY - directrixY) < 0.001) {
        return focusY; // Handle points on the sweep line
    }
    const dp = 2 * (focusY - directrixY);
    return (x - focusX) * (x - focusX) / dp + (focusY + directrixY) / 2;
}

function drawPoints() {
    ctx.fillStyle = '#e0e0e0';
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawSweepLine() {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sweepY);
    ctx.lineTo(canvas.width, sweepY);
    ctx.stroke();
}

function drawBeachLine() {
    if (points.length === 0) return;

    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const activePoints = points.filter(p => p.y < sweepY);
    if (activePoints.length === 0) return;

    for (let x = 0; x <= canvas.width; x += 2) {
        let maxY = 0;

        for (const p of activePoints) {
            const py = getParabolaY(x, p.x, p.y, sweepY);
            if (py > maxY) {
                maxY = py;
            }
        }

        if (x === 0) {
            ctx.moveTo(x, maxY);
        } else {
            ctx.lineTo(x, Math.min(maxY, canvas.height));
        }
    }
    ctx.stroke();
}

function drawApproximateVoronoi() {
    // For educational/visual purposes, we approximate the voronoi edges
    // by rendering pixels colored by nearest neighbor

    // To make it run fast enough for real-time, we'll draw a slightly low-res version
    // or just calculate the borders

    const activePoints = points.filter(p => p.y < sweepY);
    if (activePoints.length === 0) return;

    // Draw the completed voronoi cells above the beachline approximately
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Define some distinct colors for the cells
    const colors = activePoints.map((_, i) => {
        const hue = (i * 137.5) % 360; // Golden angle for distribution
        return `hsl(${hue}, 70%, 40%)`;
    });

    // We only need to draw the Voronoi part above the beachline
    // To make it efficient, we only render a sparse grid or compute boundaries
    // For this visual demo, calculating boundaries by checking neighborhood is effective

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';

    // Performance optimization: we'll only draw the voronoi diagram above the sweep line
    // We'll use a simple brute force nearest neighbor for a visual approximation

    const step = 4; // Resolution
    for (let y = 0; y < sweepY; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            // Check if (x,y) is above the beachline
            let isAboveBeachLine = true;
            for (const p of activePoints) {
                if (getParabolaY(x, p.x, p.y, sweepY) > y) {
                    isAboveBeachLine = false;
                    break;
                }
            }

            if (!isAboveBeachLine) continue;

            let minDist = Infinity;
            let minDist2 = Infinity;
            let closestIdx = -1;

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                // Only points processed by sweep line contribute to the completed diagram
                if (p.y > sweepY) continue;

                const dist = (x - p.x)**2 + (y - p.y)**2;
                if (dist < minDist) {
                    minDist2 = minDist;
                    minDist = dist;
                    closestIdx = i;
                } else if (dist < minDist2) {
                    minDist2 = dist;
                }
            }

            // Draw boundary pixels
            if (minDist2 - minDist < 100) {
                ctx.fillStyle = '#4facfe'; // Edge color
                ctx.fillRect(x, y, step, step);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    drawApproximateVoronoi();
    drawBeachLine();
    drawSweepLine();
    drawPoints();
}

function update() {
    if (isPlaying) {
        sweepY += speed;
        if (sweepY > canvas.height + 100) { // Let it go a bit past the bottom
            sweepY = 0;
        }
        draw();
    }
    animationId = requestAnimationFrame(update);
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    points.push({x, y});
    if (!isPlaying) {
        draw();
    }
});

playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
});

resetSweepBtn.addEventListener('click', () => {
    sweepY = 0;
    if (!isPlaying) {
        draw();
    }
});

clearPointsBtn.addEventListener('click', () => {
    points = [];
    sweepY = 0;
    if (!isPlaying) {
        draw();
    }
});

speedSlider.addEventListener('input', (e) => {
    speed = parseFloat(e.target.value);
});

// Initialize
resizeCanvas();
update();
