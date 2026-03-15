const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const skewSlider = document.getElementById('skewSlider');
const probabilityValue = document.getElementById('probabilityValue');
const spawnBtn = document.getElementById('spawnBtn');
const autoSpawnBtn = document.getElementById('autoSpawnBtn');
const resetBtn = document.getElementById('resetBtn');

// Physics Configuration
const ROWS = 15;
const GRAVITY = 0.5;
const PEG_RADIUS = 4;
const BALL_RADIUS = 3;
const RESTITUTION = 0.4;
const DAMPING = 0.98;
const BINS_COUNT = ROWS + 1;
const BIN_HEIGHT = 150;

// Dynamic simulation parameters
let width, height;
let pegSpacingX, pegSpacingY;
let startY;
let pegs = [];
let bins = [];
let balls = [];
let rightProb = 0.5;
let isAutoSpawning = false;
let autoSpawnInterval;

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // UI Listeners
    skewSlider.addEventListener('input', (e) => {
        rightProb = parseInt(e.target.value) / 100;
        probabilityValue.textContent = e.target.value;
    });

    spawnBtn.addEventListener('click', () => spawnBalls(10));

    autoSpawnBtn.addEventListener('click', () => {
        isAutoSpawning = !isAutoSpawning;
        if (isAutoSpawning) {
            autoSpawnBtn.textContent = 'Stop Auto Drop';
            autoSpawnBtn.classList.add('active');
            autoSpawnInterval = setInterval(() => spawnBalls(1), 100);
        } else {
            autoSpawnBtn.textContent = 'Start Auto Drop';
            autoSpawnBtn.classList.remove('active');
            clearInterval(autoSpawnInterval);
        }
    });

    resetBtn.addEventListener('click', resetSimulation);

    requestAnimationFrame(update);
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    width = canvas.width;
    height = canvas.height;

    pegSpacingX = width / (ROWS + 2);
    pegSpacingY = (height - BIN_HEIGHT - 50) / ROWS;
    startY = 50;

    generatePegs();
    generateBins();
}

function generatePegs() {
    pegs = [];
    for (let row = 0; row < ROWS; row++) {
        let numPegs = row + 1;
        let startX = width / 2 - (numPegs - 1) * (pegSpacingX / 2);

        for (let col = 0; col < numPegs; col++) {
            pegs.push({
                x: startX + col * pegSpacingX,
                y: startY + row * pegSpacingY,
                r: PEG_RADIUS
            });
        }
    }
}

function generateBins() {
    bins = [];
    const binWidth = width / BINS_COUNT;
    for (let i = 0; i < BINS_COUNT; i++) {
        bins.push({
            x: i * binWidth,
            y: height - BIN_HEIGHT,
            w: binWidth,
            h: BIN_HEIGHT,
            count: 0
        });
    }
}

function resetSimulation() {
    balls = [];
    bins.forEach(bin => bin.count = 0);
}

function spawnBalls(count) {
    for (let i = 0; i < count; i++) {
        // Small random offset to prevent balls from stacking perfectly on top of each other
        const offsetX = (Math.random() - 0.5) * 2;
        balls.push({
            x: width / 2 + offsetX,
            y: 10,
            vx: (Math.random() - 0.5) * 1,
            vy: 0,
            r: BALL_RADIUS,
            settled: false,
            binIndex: -1
        });
    }
}

function updatePhysics() {
    for (let i = 0; i < balls.length; i++) {
        let ball = balls[i];
        if (ball.settled) continue;

        // Apply gravity
        ball.vy += GRAVITY;

        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Apply damping
        ball.vx *= DAMPING;
        ball.vy *= DAMPING;

        // Check peg collisions
        for (let peg of pegs) {
            let dx = ball.x - peg.x;
            let dy = ball.y - peg.y;
            let distSq = dx * dx + dy * dy;
            let minDist = ball.r + peg.r;

            if (distSq < minDist * minDist) {
                let dist = Math.sqrt(distSq);

                // Normal vector
                let nx = dx / dist;
                let ny = dy / dist;

                // Resolve penetration
                let penetration = minDist - dist;
                ball.x += nx * penetration;
                ball.y += ny * penetration;

                // Skew logic: When hitting the top half of a peg, bias the bounce left or right
                // Only bias if it's moving downwards and hits roughly top of the peg
                if (ball.vy > 0 && ny < -0.5) {
                    const goRight = Math.random() < rightProb;
                    // Apply a horizontal kick
                    ball.vx = goRight ? 2.5 : -2.5;
                    // Reset vertical velocity with some restitution
                    ball.vy *= -RESTITUTION;
                } else {
                    // Standard elastic bounce for other collisions
                    let dotProduct = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * dotProduct * nx) * RESTITUTION;
                    ball.vy = (ball.vy - 2 * dotProduct * ny) * RESTITUTION;
                }

                // Add slight randomness to prevent perfect balance
                ball.vx += (Math.random() - 0.5) * 0.5;
            }
        }

        // Wall collisions
        if (ball.x - ball.r < 0) {
            ball.x = ball.r;
            ball.vx *= -RESTITUTION;
        } else if (ball.x + ball.r > width) {
            ball.x = width - ball.r;
            ball.vx *= -RESTITUTION;
        }

        // Check Bin Entry
        if (ball.y > height - BIN_HEIGHT) {
            // Find which bin
            let binIndex = Math.floor(ball.x / (width / BINS_COUNT));
            if (binIndex < 0) binIndex = 0;
            if (binIndex >= BINS_COUNT) binIndex = BINS_COUNT - 1;

            // Simple settling mechanics
            let bin = bins[binIndex];
            let targetY = height - (bin.count * ball.r * 2) - ball.r;

            if (ball.y >= targetY) {
                ball.y = targetY;
                ball.vy = 0;
                ball.vx = 0;

                // If the ball has effectively stopped vertically, count it as settled
                if (Math.abs(ball.vy) < 0.1) {
                   ball.settled = true;
                   ball.binIndex = binIndex;
                   bin.count++;
                }
            } else {
                // Keep falling in the bin but constrain horizontally
                ball.x = bin.x + bin.w / 2;
                ball.vx = 0;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Pegs
    ctx.fillStyle = '#94a3b8';
    for (let peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Bins
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let bin of bins) {
        ctx.beginPath();
        ctx.moveTo(bin.x, bin.y);
        ctx.lineTo(bin.x, bin.y + bin.h);
        ctx.stroke();
    }

    // Draw Balls
    ctx.fillStyle = '#3b82f6';
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Distribution overlay
    drawDistribution();
}

function drawDistribution() {
    if (balls.length === 0) return;

    let maxCount = Math.max(...bins.map(b => b.count));
    if (maxCount === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red curve
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    for (let i = 0; i < bins.length; i++) {
        let bin = bins[i];
        let centerX = bin.x + bin.w / 2;
        // Map bin count to height, relative to max count but scaled visually
        let normalizedHeight = (bin.count / maxCount) * (BIN_HEIGHT - 20);
        let pointY = height - normalizedHeight;

        if (i === 0) {
            ctx.moveTo(centerX, pointY);
        } else {
            // Smooth curve
            let prevBin = bins[i - 1];
            let prevCenterX = prevBin.x + prevBin.w / 2;
            let prevNormalizedHeight = (prevBin.count / maxCount) * (BIN_HEIGHT - 20);
            let prevPointY = height - prevNormalizedHeight;

            let cpX = (prevCenterX + centerX) / 2;
            ctx.quadraticCurveTo(cpX, prevPointY, centerX, pointY);
        }
    }
    ctx.stroke();
}

let lastTime = performance.now();
const timeStep = 1000 / 60; // 60 FPS target
let accumulator = 0;

function update(time) {
    let deltaTime = time - lastTime;
    lastTime = time;

    // Prevent spiral of death
    if (deltaTime > 250) deltaTime = 250;

    accumulator += deltaTime;

    while (accumulator >= timeStep) {
        updatePhysics();
        accumulator -= timeStep;
    }

    draw();
    requestAnimationFrame(update);
}

// Start
init();
