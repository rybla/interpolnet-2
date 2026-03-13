/**
 * Grid-Based Fluid Solver
 * Based on Jos Stam's "Real-Time Fluid Dynamics for Games" (Stable Fluids)
 */

const canvas = document.getElementById("fluid-canvas");
const ctx = canvas.getContext("2d");

// Control Panel Elements
const colorPicker = document.getElementById("color-picker");
const brushSizeInput = document.getElementById("brush-size");
const viscosityInput = document.getElementById("viscosity");
const diffusionInput = document.getElementById("diffusion");
const fadingInput = document.getElementById("fading");
const clearButton = document.getElementById("clear-button");

// Simulation settings
let N = 100; // Grid resolution (N x N)
let iter = 4; // Solver iterations
let SCALE = 1; // Scale factor for canvas rendering

// Arrays size
let size = (N + 2) * (N + 2);

// Fluid arrays
let s = new Float32Array(size);
let density = new Float32Array(size);

let Vx = new Float32Array(size);
let Vy = new Float32Array(size);
let Vx0 = new Float32Array(size);
let Vy0 = new Float32Array(size);

// Color arrays for RGB dye
let densityR = new Float32Array(size);
let densityG = new Float32Array(size);
let densityB = new Float32Array(size);
let sR = new Float32Array(size);
let sG = new Float32Array(size);
let sB = new Float32Array(size);


// Interaction state
let pointer = {
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    isDown: false,
    color: { r: 0, g: 255, b: 255 }
};

// Physics parameters
let dt = 0.1;
let diff = parseFloat(diffusionInput.value);
let visc = parseFloat(viscosityInput.value);
let fadeRate = parseFloat(fadingInput.value);

// Helper function to map 2D coordinates to 1D array index
function IX(x, y) {
    return x + (N + 2) * y;
}

// Fluid Dynamics Core Functions
function set_bnd(b, x) {
    for (let i = 1; i <= N; i++) {
        x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
        x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
        x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
    }

    x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
    x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
    x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function lin_solve(b, x, x0, a, c) {
    let cRecip = 1.0 / c;
    for (let k = 0; k < iter; k++) {
        for (let j = 1; j <= N; j++) {
            for (let i = 1; i <= N; i++) {
                x[IX(i, j)] =
                    (x0[IX(i, j)] +
                        a *
                            (x[IX(i + 1, j)] +
                                x[IX(i - 1, j)] +
                                x[IX(i, j + 1)] +
                                x[IX(i, j - 1)])) *
                    cRecip;
            }
        }
        set_bnd(b, x);
    }
}

function add_source(x, s, dt) {
    for (let i = 0; i < size; i++) {
        x[i] += dt * s[i];
    }
}

function diffuse(b, x, x0, diff, dt) {
    let a = dt * diff * N * N;
    lin_solve(b, x, x0, a, 1 + 4 * a);
}

function advect(b, d, d0, u, v, dt) {
    let i0, j0, i1, j1;
    let x, y, s0, t0, s1, t1;
    let dt0 = dt * N;

    for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
            x = i - dt0 * u[IX(i, j)];
            y = j - dt0 * v[IX(i, j)];

            if (x < 0.5) x = 0.5;
            if (x > N + 0.5) x = N + 0.5;
            i0 = Math.floor(x);
            i1 = i0 + 1;

            if (y < 0.5) y = 0.5;
            if (y > N + 0.5) y = N + 0.5;
            j0 = Math.floor(y);
            j1 = j0 + 1;

            s1 = x - i0;
            s0 = 1.0 - s1;
            t1 = y - j0;
            t0 = 1.0 - t1;

            d[IX(i, j)] =
                s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
                s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
    }
    set_bnd(b, d);
}

function project(u, v, p, div) {
    let h = 1.0 / N;
    for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
            div[IX(i, j)] =
                -0.5 *
                h *
                (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]);
            p[IX(i, j)] = 0;
        }
    }
    set_bnd(0, div);
    set_bnd(0, p);

    lin_solve(0, p, div, 1, 4);

    for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
            u[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) / h;
            v[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) / h;
        }
    }
    set_bnd(1, u);
    set_bnd(2, v);
}

function vel_step(u, v, u0, v0, dt) {
    add_source(u, u0, dt);
    add_source(v, v0, dt);

    // Swap u and u0, v and v0
    let temp = u0; u0 = u; u = temp;
    temp = v0; v0 = v; v = temp;

    diffuse(1, u, u0, visc, dt);
    diffuse(2, v, v0, visc, dt);

    project(u, v, u0, v0);

    temp = u0; u0 = u; u = temp;
    temp = v0; v0 = v; v = temp;

    advect(1, u, u0, u0, v0, dt);
    advect(2, v, v0, u0, v0, dt);

    project(u, v, u0, v0);
}

function dens_step(x, x0, u, v, diff, dt) {
    add_source(x, x0, dt);

    let temp = x0; x0 = x; x = temp;

    diffuse(0, x, x0, diff, dt);

    temp = x0; x0 = x; x = temp;

    advect(0, x, x0, u, v, dt);
}

function fade_density(d, rate) {
    for (let i = 0; i < size; i++) {
        let decay = 1 - rate * dt;
        d[i] = d[i] * decay;
        if (d[i] < 0.001) d[i] = 0;
    }
}

// Setup and Canvas Resize
let imageData;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust grid scale based on screen size to maintain performance vs quality
    let minDimension = Math.min(canvas.width, canvas.height);
    // Determine scale so grid N matches screen reasonably
    SCALE = Math.max(canvas.width, canvas.height) / N;

    // Recreate imageData to match the new canvas size
    imageData = ctx.createImageData(canvas.width, canvas.height);
}

window.addEventListener("resize", resize);
resize();


// Input Handling
function parseColor(hex) {
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
    return { r, g, b };
}

pointer.color = parseColor(colorPicker.value);
colorPicker.addEventListener("input", (e) => {
    pointer.color = parseColor(e.target.value);
});

viscosityInput.addEventListener("input", (e) => {
    visc = parseFloat(e.target.value);
});

diffusionInput.addEventListener("input", (e) => {
    diff = parseFloat(e.target.value);
});

fadingInput.addEventListener("input", (e) => {
    fadeRate = parseFloat(e.target.value);
});

clearButton.addEventListener("click", () => {
    for (let i = 0; i < size; i++) {
        densityR[i] = 0;
        densityG[i] = 0;
        densityB[i] = 0;
        Vx[i] = 0;
        Vy[i] = 0;
    }
});

function updatePointer(e) {
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
}

canvas.addEventListener("pointerdown", (e) => {
    pointer.isDown = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.px = pointer.x;
    pointer.py = pointer.y;
});

window.addEventListener("pointermove", (e) => {
    if (pointer.isDown) {
        updatePointer(e);
    }
});

window.addEventListener("pointerup", () => {
    pointer.isDown = false;
});

function applyInput() {
    // Reset source arrays
    for (let i = 0; i < size; i++) {
        sR[i] = 0;
        sG[i] = 0;
        sB[i] = 0;
        Vx0[i] = 0;
        Vy0[i] = 0;
    }

    if (!pointer.isDown) return;

    let gridX = Math.floor((pointer.x / canvas.width) * N);
    let gridY = Math.floor((pointer.y / canvas.height) * N);

    // Calculate velocity based on pointer movement
    let dx = pointer.x - pointer.px;
    let dy = pointer.y - pointer.py;

    let force = 100.0;

    let brushRadius = parseInt(brushSizeInput.value);

    // Apply to a circular brush area
    for (let j = -brushRadius; j <= brushRadius; j++) {
        for (let i = -brushRadius; i <= brushRadius; i++) {
            let cx = gridX + i;
            let cy = gridY + j;

            if (cx >= 1 && cx <= N && cy >= 1 && cy <= N) {
                // Smooth falloff based on distance
                let dist = Math.sqrt(i*i + j*j);
                if (dist < brushRadius) {
                    let falloff = 1.0 - (dist / brushRadius);
                    let idx = IX(cx, cy);

                    sR[idx] = pointer.color.r * force * falloff;
                    sG[idx] = pointer.color.g * force * falloff;
                    sB[idx] = pointer.color.b * force * falloff;

                    Vx0[idx] = dx * force * falloff;
                    Vy0[idx] = dy * force * falloff;
                }
            }
        }
    }

    // Update previous pointer position to current
    pointer.px = pointer.x;
    pointer.py = pointer.y;
}

// Render loop
function renderCanvas() {
    let data = imageData.data;

    // Clear background
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 13;     // var(--bg-color) ~ #0d1117 (13, 17, 23)
        data[i + 1] = 17;
        data[i + 2] = 23;
        data[i + 3] = 255;
    }

    let cellWidth = canvas.width / N;
    let cellHeight = canvas.height / N;

    for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
            let idx = IX(i, j);
            let r = densityR[idx];
            let g = densityG[idx];
            let b = densityB[idx];

            if (r > 0 || g > 0 || b > 0) {
                // Map grid to screen pixels
                let screenX = Math.floor((i - 1) * cellWidth);
                let screenY = Math.floor((j - 1) * cellHeight);
                let endX = Math.ceil(screenX + cellWidth);
                let endY = Math.ceil(screenY + cellHeight);

                // Clamp max values to 255
                let outR = Math.min(255, r);
                let outG = Math.min(255, g);
                let outB = Math.min(255, b);

                // Additive blending onto background for the dye
                for (let py = screenY; py < endY && py < canvas.height; py++) {
                    for (let px = screenX; px < endX && px < canvas.width; px++) {
                        let pixelIdx = (py * canvas.width + px) * 4;
                        // Simple additive blend
                        data[pixelIdx] = Math.min(255, data[pixelIdx] + outR);
                        data[pixelIdx + 1] = Math.min(255, data[pixelIdx + 1] + outG);
                        data[pixelIdx + 2] = Math.min(255, data[pixelIdx + 2] + outB);
                    }
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function simulate() {
    applyInput();

    // Physics Step
    vel_step(Vx, Vy, Vx0, Vy0, dt);

    dens_step(densityR, sR, Vx, Vy, diff, dt);
    dens_step(densityG, sG, Vx, Vy, diff, dt);
    dens_step(densityB, sB, Vx, Vy, diff, dt);

    fade_density(densityR, fadeRate);
    fade_density(densityG, fadeRate);
    fade_density(densityB, fadeRate);

    // Render Step
    renderCanvas();

    requestAnimationFrame(simulate);
}

// Create initial visual interest
function addInitialSwirl() {
    let cx = Math.floor(N / 2);
    let cy = Math.floor(N / 2);
    let radius = 10;

    for (let j = -radius; j <= radius; j++) {
        for (let i = -radius; i <= radius; i++) {
            let idx = IX(cx + i, cy + j);
            if (i*i + j*j < radius*radius) {
                densityR[idx] = 255;
                densityG[idx] = 100;
                densityB[idx] = 255;
                // Add a rotational velocity kick
                Vx[idx] = -j * 10;
                Vy[idx] = i * 10;
            }
        }
    }
}

addInitialSwirl();
simulate();
