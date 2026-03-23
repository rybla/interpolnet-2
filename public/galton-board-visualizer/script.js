/**
 * script.js
 * Galton Board Visualizer
 */

const canvas = document.getElementById('galton-canvas');
const ctx = canvas.getContext('2d');

const rowsSlider = document.getElementById('rows-slider');
const rowsValue = document.getElementById('rows-value');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const btnToggle = document.getElementById('btn-toggle');
const btnReset = document.getElementById('btn-reset');

let isRunning = true;
let numRows = parseInt(rowsSlider.value, 10);
let dropSpeed = parseInt(speedSlider.value, 10);

// Physics & Geometry Settings
let width = 0;
let height = 0;
let pegRadius = 0;
let ballRadius = 0;
let rowHeight = 0;
let colWidth = 0;
let startY = 0;
let startX = 0;
let binHeight = 0;

// State
let pegs = [];
let bins = [];
let maxBinCapacity = 0;
let fallingBalls = [];
let settledBalls = [];
let lastDropTime = 0;
let dropInterval = 1000;
let frameCount = 0;

const GRAVITY = 0.3;
const RESTITUTION = 0.5; // bounciness
const DAMPING = 0.99; // air resistance

function init() {
    resize();
    window.addEventListener('resize', resize);

    rowsSlider.addEventListener('input', (e) => {
        numRows = parseInt(e.target.value, 10);
        rowsValue.textContent = numRows;
        reset();
    });

    speedSlider.addEventListener('input', (e) => {
        dropSpeed = parseInt(e.target.value, 10);
        updateSpeedLabel();
    });

    btnToggle.addEventListener('click', () => {
        isRunning = !isRunning;
        btnToggle.textContent = isRunning ? 'Pause' : 'Resume';
        if (isRunning) requestAnimationFrame(loop);
    });

    btnReset.addEventListener('click', reset);

    updateSpeedLabel();
    reset();
    requestAnimationFrame(loop);
}

function updateSpeedLabel() {
    dropInterval = Math.max(10, 1000 - dropSpeed * 10);
    if (dropSpeed < 30) speedValue.textContent = "Slow";
    else if (dropSpeed < 70) speedValue.textContent = "Medium";
    else if (dropSpeed < 90) speedValue.textContent = "Fast";
    else speedValue.textContent = "Max";
}

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    width = canvas.width;
    height = canvas.height;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    width /= window.devicePixelRatio;
    height /= window.devicePixelRatio;

    calculateGeometry();
}

function calculateGeometry() {
    // 80% of width for the board
    const boardWidth = width * 0.9;

    colWidth = boardWidth / (numRows + 1);
    rowHeight = (height * 0.65) / numRows;

    pegRadius = Math.min(colWidth * 0.2, rowHeight * 0.2, 8);
    ballRadius = pegRadius * 0.8;

    startX = width / 2;
    startY = height * 0.1;

    binHeight = height - (startY + (numRows * rowHeight));

    // Recalculate max capacity based on bin width and height
    const binInnerWidth = colWidth - 2;
    const ballsPerLayer = Math.max(1, Math.floor(binInnerWidth / (ballRadius * 2)));
    const maxLayers = Math.floor(binHeight / (ballRadius * 2));
    maxBinCapacity = ballsPerLayer * maxLayers;

    generatePegs();
}

function generatePegs() {
    pegs = [];
    bins = new Array(numRows + 1).fill(0);

    for (let row = 0; row < numRows; row++) {
        const pegsInRow = row + 1;
        const rowWidth = pegsInRow * colWidth;
        const startPosX = startX - (rowWidth / 2) + (colWidth / 2);

        for (let col = 0; col < pegsInRow; col++) {
            pegs.push({
                x: startPosX + (col * colWidth),
                y: startY + (row * rowHeight)
            });
        }
    }
}

function reset() {
    fallingBalls = [];
    settledBalls = [];
    bins = new Array(numRows + 1).fill(0);
    calculateGeometry();
}

function spawnBall() {
    // slight random offset to prevent perfectly symmetrical locking
    const offsetX = (Math.random() - 0.5) * 1.0;
    fallingBalls.push({
        x: startX + offsetX,
        y: startY - rowHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0,
        color: `hsl(${45 + Math.random() * 20}, 90%, 60%)` // Gold variations
    });
}

function resolveCollision(ball, peg) {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = ballRadius + pegRadius;

    if (distance < minDist) {
        // Resolve penetration
        const overlap = minDist - distance;
        const nx = dx / distance;
        const ny = dy / distance;

        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // Simple reflection
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;

        ball.vx *= RESTITUTION;
        ball.vy *= RESTITUTION;

        // Add some random noise on collision to ensure bifurcation
        ball.vx += (Math.random() - 0.5) * 0.5;
    }
}

// Binomial coefficient helper
function choose(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}

function drawNormalCurve() {
    if (settledBalls.length === 0 && fallingBalls.length === 0) return;

    const totalBalls = settledBalls.length + fallingBalls.length;
    let maxExpected = 0;
    const expectedDist = [];

    for (let k = 0; k <= numRows; k++) {
        const p = choose(numRows, k) * Math.pow(0.5, numRows);
        const expected = p * totalBalls;
        expectedDist.push(expected);
        if (expected > maxExpected) maxExpected = expected;
    }

    // Scale curve to fit in the bin area based on max actual or expected
    let maxActual = Math.max(...bins, 1);
    const scaleY = (binHeight * 0.9) / Math.max(maxExpected, maxActual, 1);

    const rowWidth = (numRows + 1) * colWidth;
    const binsStartX = startX - (rowWidth / 2) + (colWidth / 2);

    ctx.beginPath();
    for (let k = 0; k <= numRows; k++) {
        const binX = binsStartX + (k * colWidth);
        const binY = height - (expectedDist[k] * scaleY);

        if (k === 0) ctx.moveTo(binX, binY);
        else ctx.lineTo(binX, binY);
    }

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)'; // Cyan
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(binsStartX + (numRows * colWidth), height);
    ctx.lineTo(binsStartX, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.fill();
}

function update() {
    const now = performance.now();
    if (now - lastDropTime > dropInterval) {
        spawnBall();
        lastDropTime = now;
    }

    // Update falling balls
    for (let i = fallingBalls.length - 1; i >= 0; i--) {
        const ball = fallingBalls[i];

        ball.vy += GRAVITY;
        ball.vx *= DAMPING;
        ball.vy *= DAMPING;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision with pegs
        for (const peg of pegs) {
            // broad phase optimization
            if (Math.abs(ball.y - peg.y) > rowHeight) continue;
            resolveCollision(ball, peg);
        }

        // Check if ball entered a bin
        const bottomRowY = startY + ((numRows - 1) * rowHeight);
        if (ball.y > bottomRowY + rowHeight / 2) {
            const rowWidth = (numRows + 1) * colWidth;
            const binsStartX = startX - (rowWidth / 2);

            // Calculate which bin it fell into
            let binIndex = Math.floor((ball.x - binsStartX) / colWidth);
            binIndex = Math.max(0, Math.min(numRows, binIndex));

            // Move to settled
            bins[binIndex]++;
            settledBalls.push({
                bin: binIndex,
                color: ball.color
            });

            fallingBalls.splice(i, 1);

            // Auto-flush if a bin is full to prevent overflow
            if (bins[binIndex] >= maxBinCapacity) {
                flushBins();
            }
        }
    }
}

function flushBins() {
    // Keep proportions, divide everything by 2
    for(let i=0; i<bins.length; i++) {
        bins[i] = Math.floor(bins[i] / 2);
    }

    // Rebuild settled balls array to match new bin counts
    const newSettled = [];
    for(let b=0; b<bins.length; b++) {
        for(let i=0; i<bins[b]; i++) {
            newSettled.push({ bin: b, color: `hsl(${45 + Math.random() * 20}, 90%, 60%)` });
        }
    }
    settledBalls = newSettled;
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Normal Distribution Curve
    drawNormalCurve();

    // Draw Pegs
    ctx.fillStyle = '#475569'; // Slate 600
    for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Bins Separators
    const rowWidth = (numRows + 1) * colWidth;
    const binsStartX = startX - (rowWidth / 2);
    const binsStartY = startY + ((numRows - 0.5) * rowHeight);

    ctx.strokeStyle = '#334155'; // Slate 700
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= numRows + 1; i++) {
        const lineX = binsStartX + (i * colWidth);
        ctx.moveTo(lineX, binsStartY);
        ctx.lineTo(lineX, height);
    }
    // Bottom line
    ctx.moveTo(binsStartX, height - 1);
    ctx.lineTo(binsStartX + rowWidth, height - 1);
    ctx.stroke();

    // Draw Settled Balls
    const binInnerWidth = colWidth - 2;
    const ballsPerLayer = Math.max(1, Math.floor(binInnerWidth / (ballRadius * 2)));

    // Group settled balls by bin to draw them stacked
    const settledCounts = new Array(numRows + 1).fill(0);

    for (const ball of settledBalls) {
        const binIndex = ball.bin;
        const count = settledCounts[binIndex];

        const layer = Math.floor(count / ballsPerLayer);
        const posInLayer = count % ballsPerLayer;

        // Center the layer if it's not full
        const currentLayerBalls = Math.min(ballsPerLayer, bins[binIndex] - (layer * ballsPerLayer));
        const layerWidth = currentLayerBalls * (ballRadius * 2);

        const binLeft = binsStartX + (binIndex * colWidth) + 1;
        const binCenterX = binLeft + (colWidth / 2);

        const bx = binCenterX - (layerWidth / 2) + (posInLayer * ballRadius * 2) + ballRadius;
        const by = height - 2 - ballRadius - (layer * ballRadius * 2);

        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        settledCounts[binIndex]++;
    }

    // Draw Falling Balls
    for (const ball of fallingBalls) {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function loop() {
    if (isRunning) {
        // Run physics multiple steps per frame for better collision accuracy at high speeds
        const physicsSteps = 2;
        for(let i=0; i<physicsSteps; i++) {
            update();
        }
    }
    draw();
    if (isRunning) {
        requestAnimationFrame(loop);
    }
}

init();