const GRID_SIZE = 100;
let grid = [];
let isPlaying = false;
let temperature = 2.27; // Default near critical temperature

const canvas = document.getElementById("simulation-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const playPauseBtn = document.getElementById("play-pause-btn");
const resetBtn = document.getElementById("reset-btn");
const tempSlider = document.getElementById("temperature-slider");
const tempValue = document.getElementById("temperature-value");
const magValue = document.getElementById("magnetization-value");

// Colors from CSS
const styles = getComputedStyle(document.documentElement);
const colorUp = styles.getPropertyValue('--spin-up-color').trim();
const colorDown = styles.getPropertyValue('--spin-down-color').trim();

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        255
    ] : [0, 0, 0, 255];
}

const rgbUp = hexToRgb(colorUp);
const rgbDown = hexToRgb(colorDown);

let imageData;

function initSimulation() {
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);

    // Initialize random spins
    grid = new Array(GRID_SIZE).fill(0).map(() =>
        new Array(GRID_SIZE).fill(0).map(() => Math.random() < 0.5 ? 1 : -1)
    );

    drawGrid();
    updateMagnetization();
}

function monteCarloStep() {
    // Perform multiple flips per frame for faster visible simulation
    const steps = GRID_SIZE * GRID_SIZE;

    for (let i = 0; i < steps; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        const spin = grid[x][y];

        // Periodic boundary conditions
        const left = grid[(x - 1 + GRID_SIZE) % GRID_SIZE][y];
        const right = grid[(x + 1) % GRID_SIZE][y];
        const top = grid[x][(y - 1 + GRID_SIZE) % GRID_SIZE];
        const bottom = grid[x][(y + 1) % GRID_SIZE];

        const sumNeighbors = left + right + top + bottom;
        const dE = 2 * spin * sumNeighbors;

        // Metropolis condition
        if (dE <= 0 || Math.random() < Math.exp(-dE / temperature)) {
            grid[x][y] = -spin;
        }
    }
}

function drawGrid() {
    const data = imageData.data;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const idx = (y * GRID_SIZE + x) * 4;
            const spin = grid[x][y];
            const rgb = spin === 1 ? rgbUp : rgbDown;

            data[idx] = rgb[0];
            data[idx + 1] = rgb[1];
            data[idx + 2] = rgb[2];
            data[idx + 3] = rgb[3];
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function updateMagnetization() {
    let sum = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            sum += grid[x][y];
        }
    }
    const mag = sum / (GRID_SIZE * GRID_SIZE);
    magValue.textContent = mag.toFixed(2);
}

function loop() {
    if (isPlaying) {
        monteCarloStep();
        drawGrid();
        updateMagnetization();
    }
    requestAnimationFrame(loop);
}

// Event Listeners
playPauseBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? "Pause" : "Play";
    if (isPlaying) {
        playPauseBtn.classList.remove("active");
    } else {
        playPauseBtn.classList.add("active");
    }
});

resetBtn.addEventListener("click", () => {
    initSimulation();
});

tempSlider.addEventListener("input", (e) => {
    temperature = parseFloat(e.target.value);
    tempValue.textContent = temperature.toFixed(2);
});

// Start simulation
initSimulation();
isPlaying = true;
playPauseBtn.textContent = "Pause";
playPauseBtn.classList.remove("active");
loop();
