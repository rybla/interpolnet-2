// DOM Elements
const bgCanvas = document.getElementById("background-canvas");
const fgCanvas = document.getElementById("foreground-canvas");
const bgCtx = bgCanvas.getContext("2d");
const fgCtx = fgCanvas.getContext("2d");

// State
let width = window.innerWidth;
let height = window.innerHeight;
let seeds = [];
let sweepY = 0;
let previousBeachLine = new Array(Math.ceil(width)).fill(-Infinity);
let animationFrameId;

// Constants
const SWEEP_SPEED = 2; // Pixels per frame
const INITIAL_POINTS = 3;

// Initialization
function init() {
  resizeCanvases();
  window.addEventListener("resize", onResize);
  fgCanvas.addEventListener("pointerdown", onPointerDown);

  reset();
  for (let i = 0; i < INITIAL_POINTS; i++) {
    addRandomSeed();
  }

  startLoop();
}

// Utility Functions
function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 30;
  const lightness = 40 + Math.random() * 20;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function resizeCanvases() {
  width = window.innerWidth;
  height = window.innerHeight;

  bgCanvas.width = width;
  bgCanvas.height = height;
  fgCanvas.width = width;
  fgCanvas.height = height;

  previousBeachLine = new Array(Math.ceil(width)).fill(-Infinity);

  // Re-draw background on resize
  bgCtx.fillStyle = "#0f172a";
  bgCtx.fillRect(0, 0, width, height);
}

// Event Handlers
function onResize() {
  // Save current seeds, reset canvases and re-simulate to current sweepY
  const currentSeeds = [...seeds];
  const currentSweepY = sweepY;

  resizeCanvases();
  seeds = currentSeeds;

  // Fast forward simulation
  const targetSweepY = currentSweepY;
  sweepY = 0;

  // Pause animation temporarily
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Fast forward simulation loop
  while (sweepY < targetSweepY) {
    updateLogic();
  }

  startLoop();
}

function onPointerDown(e) {
  const rect = fgCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  addSeed(x, y);
}

// Logic Functions
function addRandomSeed() {
  const padding = 50;
  const x = padding + Math.random() * (width - 2 * padding);
  // Only add points below the current sweep line to avoid visual glitches
  const minY = Math.max(padding, sweepY + padding);

  if (minY < height - padding) {
    const y = minY + Math.random() * (height - padding - minY);
    addSeed(x, y);
  } else {
    // If we're at the bottom, just wrap around or add near the top
     const y = padding + Math.random() * (height / 2);
     // If we add a point above the sweep line, we need to restart the sweep
     if (y < sweepY) {
         addSeed(x, y);
         restartSweep();
     } else {
         addSeed(x, y);
     }
  }
}

function addSeed(x, y) {
  seeds.push({
    x: x,
    y: y,
    color: randomColor(),
    id: seeds.length,
  });

  // If the user clicks above the sweep line, it breaks the causal logic of the sweep line algorithm.
  // In a true Fortune's algorithm visualizer, we either disallow it, or restart the sweep.
  if (y < sweepY) {
     restartSweep();
  }
}

function restartSweep() {
    sweepY = 0;
    previousBeachLine.fill(-Infinity);
    bgCtx.fillStyle = "#0f172a";
    bgCtx.fillRect(0, 0, width, height);
}

function reset() {
  seeds = [];
  restartSweep();
}

// Mathematics for Parabolas
// Distance from point (px, py) to focus (fx, fy) equals distance to directrix (y = d)
// sqrt((px - fx)^2 + (py - fy)^2) = d - py   (if directrix is above focus, directrix moves down)
// Actually, Fortune's algorithm sweep line moves *down*.
// Let directrix be y = L. Let focus be (xf, yf).
// The parabola is the set of points (x, y) such that:
// (x - xf)^2 + (y - yf)^2 = (y - L)^2
// (x - xf)^2 + y^2 - 2y*yf + yf^2 = y^2 - 2y*L + L^2
// (x - xf)^2 + yf^2 - L^2 = 2y(yf - L)
// y = ((x - xf)^2 + yf^2 - L^2) / (2 * (yf - L))
function calculateParabolaY(x, focusX, focusY, directrixY) {
  // Prevent division by zero if focus is exactly on the directrix
  const dy = focusY - directrixY;
  if (Math.abs(dy) < 0.001) {
    // If the point is on the sweep line, its "parabola" is a vertical ray at x = focusX
    // For x === focusX, y is directrixY. For any other x, y is -Infinity.
    return Math.abs(x - focusX) < 0.5 ? directrixY : -Infinity;
  }

  // y = ( (x - fx)^2 + fy^2 - L^2 ) / (2 * (fy - L))
  return (Math.pow(x - focusX, 2) + focusY * focusY - directrixY * directrixY) / (2 * dy);
}

// Core Loop
function updateLogic() {
  if (sweepY > height + 200) {
      // Loop the animation when sweep line is well past the bottom
      // But only if we have seeds
      if (seeds.length > 0) {
          restartSweep();
          return;
      }
  }

  sweepY += SWEEP_SPEED;

  // Find active seeds (those above the sweep line)
  const activeSeeds = seeds.filter((seed) => seed.y < sweepY);

  if (activeSeeds.length === 0) return;

  // Calculate the current beach line for every pixel column
  const currentBeachLine = new Float32Array(Math.ceil(width));
  const currentBeachLineOwner = new Int32Array(Math.ceil(width));
  currentBeachLine.fill(-Infinity);
  currentBeachLineOwner.fill(-1);

  for (let x = 0; x < width; x++) {
    let maxY = -Infinity;
    let ownerId = -1;

    for (let i = 0; i < activeSeeds.length; i++) {
      const seed = activeSeeds[i];
      const py = calculateParabolaY(x, seed.x, seed.y, sweepY);

      // We want the HIGHEST y-value (closest to sweep line, since sweep line is moving down)
      // Actually, mathematically, the beach line is the sequence of parabolic arcs
      // forming the lower envelope (or upper envelope depending on coordinate system).
      // Since Y increases downwards, and sweep line Y > seed Y:
      // The distance to directrix is `sweepY - y`.
      // We want points (x,y) equidistant to focus and directrix.
      // The region above the beach line is closer to some seed than to the directrix.
      // The beach line itself is the boundary where distance to nearest seed == distance to directrix.
      // Parabola equation gives us `y`. We want the highest `y` value for each `x`
      // (highest numerical value, meaning furthest down the screen, closest to sweep line).
      if (py > maxY && py <= sweepY) {
        maxY = py;
        ownerId = seed.id;
      }
    }

    currentBeachLine[x] = maxY;
    currentBeachLineOwner[x] = ownerId;
  }

  // Draw to background canvas (Voronoi Regions)
  for (let x = 0; x < width; x++) {
    const ownerId = currentBeachLineOwner[x];
    if (ownerId !== -1) {
      const seed = seeds.find((s) => s.id === ownerId);
      if (seed) {
        const prevY = previousBeachLine[x];
        const currY = currentBeachLine[x];

        // We only paint if the beach line moved down (or stayed same)
        // and we have a valid previous Y.
        if (prevY !== -Infinity && currY > prevY) {
            bgCtx.fillStyle = seed.color;
            bgCtx.fillRect(x, prevY - 1, 1, currY - prevY + 2); // Slight overlap to prevent sub-pixel gaps
        }
      }
    }
    previousBeachLine[x] = currentBeachLine[x];
  }
}

function render() {
  // Clear foreground
  fgCtx.clearRect(0, 0, width, height);

  // Draw Sweep Line
  fgCtx.beginPath();
  fgCtx.moveTo(0, sweepY);
  fgCtx.lineTo(width, sweepY);
  fgCtx.strokeStyle = "#38bdf8";
  fgCtx.lineWidth = 2;
  fgCtx.stroke();

  // Draw Sweep Line Glow
  fgCtx.shadowColor = "#38bdf8";
  fgCtx.shadowBlur = 10;
  fgCtx.stroke();
  fgCtx.shadowBlur = 0; // Reset

  // Find active seeds for drawing beach line
  const activeSeeds = seeds.filter((seed) => seed.y < sweepY);

  if (activeSeeds.length > 0) {
    // Draw Beach Line Curve
    fgCtx.beginPath();

    // Recalculate beach line for drawing (can optimize by reusing data from logic step, but this is fine)
    let firstPoint = true;
    for (let x = 0; x < width; x += 2) { // Step by 2 for performance in rendering
        let maxY = -Infinity;
        for (let i = 0; i < activeSeeds.length; i++) {
            const seed = activeSeeds[i];
            const py = calculateParabolaY(x, seed.x, seed.y, sweepY);
            if (py > maxY && py <= sweepY) {
                maxY = py;
            }
        }

        if (maxY !== -Infinity) {
            if (firstPoint) {
                fgCtx.moveTo(x, maxY);
                firstPoint = false;
            } else {
                fgCtx.lineTo(x, maxY);
            }
        }
    }

    fgCtx.strokeStyle = "#fef08a"; // Yellow beach line
    fgCtx.lineWidth = 2;
    fgCtx.stroke();
  }

  // Draw Seeds
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];

    // Inner dot
    fgCtx.beginPath();
    fgCtx.arc(seed.x, seed.y, 4, 0, Math.PI * 2);
    fgCtx.fillStyle = "#ffffff";
    fgCtx.fill();

    // Outer ring matching cell color
    fgCtx.beginPath();
    fgCtx.arc(seed.x, seed.y, 8, 0, Math.PI * 2);
    fgCtx.strokeStyle = seed.color;
    fgCtx.lineWidth = 2;
    fgCtx.stroke();
  }
}

function startLoop() {
  function loop() {
    updateLogic();
    render();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
}

// Start
init();