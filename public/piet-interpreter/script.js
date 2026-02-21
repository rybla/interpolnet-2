// Constants
const PIET_COLORS = [
  // Light
  { hue: 0, lightness: 0, hex: "#FFC0C0", name: "Light Red" },
  { hue: 1, lightness: 0, hex: "#FFFFC0", name: "Light Yellow" },
  { hue: 2, lightness: 0, hex: "#C0FFC0", name: "Light Green" },
  { hue: 3, lightness: 0, hex: "#C0FFFF", name: "Light Cyan" },
  { hue: 4, lightness: 0, hex: "#C0C0FF", name: "Light Blue" },
  { hue: 5, lightness: 0, hex: "#FFC0FF", name: "Light Magenta" },
  // Normal
  { hue: 0, lightness: 1, hex: "#FF0000", name: "Red" },
  { hue: 1, lightness: 1, hex: "#FFFF00", name: "Yellow" },
  { hue: 2, lightness: 1, hex: "#00FF00", name: "Green" },
  { hue: 3, lightness: 1, hex: "#00FFFF", name: "Cyan" },
  { hue: 4, lightness: 1, hex: "#0000FF", name: "Blue" },
  { hue: 5, lightness: 1, hex: "#FF00FF", name: "Magenta" },
  // Dark
  { hue: 0, lightness: 2, hex: "#C00000", name: "Dark Red" },
  { hue: 1, lightness: 2, hex: "#C0C000", name: "Dark Yellow" },
  { hue: 2, lightness: 2, hex: "#00C000", name: "Dark Green" },
  { hue: 3, lightness: 2, hex: "#00C0C0", name: "Dark Cyan" },
  { hue: 4, lightness: 2, hex: "#0000C0", name: "Dark Blue" },
  { hue: 5, lightness: 2, hex: "#C000C0", name: "Dark Magenta" },
  // Special
  { hue: -1, lightness: -1, hex: "#FFFFFF", name: "White" },
  { hue: -1, lightness: -1, hex: "#000000", name: "Black" },
];

const OPERATIONS = [
  // Hue change: 0, 1, 2, 3, 4, 5
  // Lightness change 0
  ["none", "add", "div", "greater", "duplicate", "in_c"],
  // Lightness change 1
  ["push", "sub", "mod", "pointer", "roll", "out_n"],
  // Lightness change 2
  ["pop", "mul", "not", "switch", "in_n", "out_c"],
];

const DP = {
  RIGHT: 0,
  DOWN: 1,
  LEFT: 2,
  UP: 3,
};

const CC = {
  LEFT: 0,
  RIGHT: 1,
};

// State
let grid = []; // 2D array of color indices
let stack = [];
let dp = DP.RIGHT;
let cc = CC.LEFT;
let x = 0;
let y = 0;
let steps = 0;
let codelSize = 10;
let canvas;
let ctx;
let executionInterval = null;
let speed = 10;
let isRunning = false;
let outputBuffer = "";

// DOM Elements
let canvasEl, stackContainer, outputConsole, dpDisplay, ccDisplay, stepsDisplay, btnPlay, btnPause, btnStep, btnReset, speedSlider, speedDisplay, imageUpload;

if (typeof document !== 'undefined') {
  canvasEl = document.getElementById("piet-canvas");
  stackContainer = document.getElementById("stack-container");
  outputConsole = document.getElementById("output-console");
  dpDisplay = document.getElementById("dp-display");
  ccDisplay = document.getElementById("cc-display");
  stepsDisplay = document.getElementById("steps-display");
  btnPlay = document.getElementById("btn-play");
  btnPause = document.getElementById("btn-pause");
  btnStep = document.getElementById("btn-step");
  btnReset = document.getElementById("btn-reset");
  speedSlider = document.getElementById("speed-slider");
  speedDisplay = document.getElementById("speed-display");
  imageUpload = document.getElementById("image-upload");
}

// Helper to get color object from index
function getColor(index) {
  if (index < 0 || index >= PIET_COLORS.length) return PIET_COLORS[19]; // Default to black on error
  return PIET_COLORS[index];
}

// Helper to get color index from hex
function getColorIndex(r, g, b) {
    let minDist = Infinity;
    let closestIndex = 19; // Black

    PIET_COLORS.forEach((color, index) => {
        const hex = color.hex;
        const cr = parseInt(hex.substring(1, 3), 16);
        const cg = parseInt(hex.substring(3, 5), 16);
        const cb = parseInt(hex.substring(5, 7), 16);

        const dist = Math.sqrt((r - cr)**2 + (g - cg)**2 + (b - cb)**2);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = index;
        }
    });
    return closestIndex;
}

function updateStatus() {
  if (!dpDisplay) return;
  const dpNames = ["RIGHT", "DOWN", "LEFT", "UP"];
  const ccNames = ["LEFT", "RIGHT"];
  dpDisplay.textContent = dpNames[dp];
  ccDisplay.textContent = ccNames[cc];
  if (stepsDisplay) stepsDisplay.textContent = steps;
}

function logOutput(val) {
    outputBuffer += val;
    if (outputConsole) {
        outputConsole.value = outputBuffer;
        outputConsole.scrollTop = outputConsole.scrollHeight;
    }
}

function updateStackView() {
    if (!stackContainer) return;
    stackContainer.innerHTML = "";
    stack.forEach(val => {
        const el = document.createElement("div");
        el.className = "stack-item";
        el.textContent = val;
        stackContainer.appendChild(el);
    });
}

// Image Loading and Rendering

function initCanvas() {
  canvas = canvasEl;
  if (canvas) ctx = canvas.getContext("2d");
}

function processImage(img) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(img, 0, 0);

  const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  grid = [];
  for (let y = 0; y < img.height; y++) {
    const row = [];
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Skip alpha for now, assume opaque
      row.push(getColorIndex(r, g, b));
    }
    grid.push(row);
  }

  // Adjust canvas size and render
  render();
}

function render() {
  if (!grid.length || !canvas) return;

  const rows = grid.length;
  const cols = grid[0].length;

  // Dynamically calculate codel size to fit canvas, but with a max and min
  const maxW = canvas.parentElement.clientWidth - 40; // padding
  const maxH = window.innerHeight * 0.7;

  const sizeX = Math.floor(maxW / cols);
  const sizeY = Math.floor(maxH / rows);
  codelSize = Math.max(1, Math.min(sizeX, sizeY, 30)); // Max 30px per codel, min 1px

  // Ensure canvas dimensions are integers
  canvas.width = cols * codelSize;
  canvas.height = rows * codelSize;

  // Disable smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false;

  drawGrid();
  drawCursor();
}

function drawGrid() {
  if (!ctx || !grid.length) return;

  const rows = grid.length;
  const cols = grid[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorIndex = grid[r][c];
      const color = getColor(colorIndex);
      ctx.fillStyle = color.hex;
      ctx.fillRect(c * codelSize, r * codelSize, codelSize, codelSize);
    }
  }
}

function drawCursor() {
  if (!ctx || !grid.length) return;
  if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return;

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * codelSize, y * codelSize, codelSize, codelSize);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(x * codelSize + 2, y * codelSize + 2, codelSize - 4, codelSize - 4);
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      processImage(img);
      resetInterpreter();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function resetInterpreter() {
  x = 0;
  y = 0;
  dp = DP.RIGHT;
  cc = CC.LEFT;
  stack = [];
  outputBuffer = "";
  steps = 0;
  if (outputConsole) outputConsole.value = "";
  stopExecution();

  updateStatus();
  updateStackView();
  render();
}

// Interpreter Logic

function getCodelBlock(startX, startY) {
  const color = grid[startY][startX];
  const block = [];
  const visited = new Set();
  const queue = [{x: startX, y: startY}];
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const {x, y} = queue.shift();
    block.push({x, y});

    const neighbors = [
      {x: x + 1, y: y},
      {x: x - 1, y: y},
      {x: x, y: y + 1},
      {x: x, y: y - 1}
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < grid[0].length && n.y >= 0 && n.y < grid.length) {
        if (!visited.has(`${n.x},${n.y}`) && grid[n.y][n.x] === color) {
          visited.add(`${n.x},${n.y}`);
          queue.push(n);
        }
      }
    }
  }
  return block;
}

function findExitEdge(block) {
  let edgeCodels = [];
  if (dp === DP.RIGHT) {
    let maxX = -1;
    for (const c of block) maxX = Math.max(maxX, c.x);
    edgeCodels = block.filter(c => c.x === maxX);
  } else if (dp === DP.DOWN) {
    let maxY = -1;
    for (const c of block) maxY = Math.max(maxY, c.y);
    edgeCodels = block.filter(c => c.y === maxY);
  } else if (dp === DP.LEFT) {
    let minX = Infinity;
    for (const c of block) minX = Math.min(minX, c.x);
    edgeCodels = block.filter(c => c.x === minX);
  } else if (dp === DP.UP) {
    let minY = Infinity;
    for (const c of block) minY = Math.min(minY, c.y);
    edgeCodels = block.filter(c => c.y === minY);
  }

  let result = edgeCodels[0];

  if (dp === DP.RIGHT) {
    if (cc === CC.LEFT) result = edgeCodels.reduce((a, b) => a.y < b.y ? a : b);
    else result = edgeCodels.reduce((a, b) => a.y > b.y ? a : b);
  } else if (dp === DP.DOWN) {
    if (cc === CC.LEFT) result = edgeCodels.reduce((a, b) => a.x > b.x ? a : b);
    else result = edgeCodels.reduce((a, b) => a.x < b.x ? a : b);
  } else if (dp === DP.LEFT) {
    if (cc === CC.LEFT) result = edgeCodels.reduce((a, b) => a.y > b.y ? a : b);
    else result = edgeCodels.reduce((a, b) => a.y < b.y ? a : b);
  } else if (dp === DP.UP) {
    if (cc === CC.LEFT) result = edgeCodels.reduce((a, b) => a.x < b.x ? a : b);
    else result = edgeCodels.reduce((a, b) => a.x > b.x ? a : b);
  }

  return result;
}

function step() {
  if (!grid.length) return;

  // Check if currently on White (index 18)
  if (grid[y][x] === 18) {
      let attempts = 0;
      while (attempts < 8) {
          // Slide logic: move 1 step in DP direction
          let nextX = x;
          let nextY = y;
          if (dp === DP.RIGHT) nextX++;
          else if (dp === DP.DOWN) nextY++;
          else if (dp === DP.LEFT) nextX--;
          else if (dp === DP.UP) nextY--;

          let hitWall = false;
          if (nextX < 0 || nextX >= grid[0].length || nextY < 0 || nextY >= grid.length) {
              hitWall = true;
          } else if (grid[nextY][nextX] === 19) { // Black
              hitWall = true;
          }

          if (hitWall) {
              if (attempts % 2 === 0) {
                  cc = (cc + 1) % 2;
              } else {
                  dp = (dp + 1) % 4;
              }
              attempts++;
              updateStatus();
          } else {
              x = nextX;
              y = nextY;
              steps++;
              updateStatus();
              render();
              return;
          }
      }
      console.log("Program terminated (Trapped in White)");
      stopExecution();
      return;
  }

  let attempts = 0;
  let currentBlock = getCodelBlock(x, y);
  let currentColorIdx = grid[y][x];

  while (attempts < 8) {
    let currentCodel = findExitEdge(currentBlock);

    let nextX = currentCodel.x;
    let nextY = currentCodel.y;

    if (dp === DP.RIGHT) nextX++;
    else if (dp === DP.DOWN) nextY++;
    else if (dp === DP.LEFT) nextX--;
    else if (dp === DP.UP) nextY--;

    let hitWall = false;
    if (nextX < 0 || nextX >= grid[0].length || nextY < 0 || nextY >= grid.length) {
      hitWall = true;
    } else {
      let nextColorIdx = grid[nextY][nextX];
      if (nextColorIdx === 19) {
        hitWall = true;
      }
    }

    if (hitWall) {
      if (attempts % 2 === 0) {
        cc = (cc + 1) % 2;
      } else {
        dp = (dp + 1) % 4;
      }
      attempts++;
    } else {
      let nextColorIdx = grid[nextY][nextX];

      // Normal color transition
      executeOperation(currentColorIdx, nextColorIdx, currentBlock.length);
      x = nextX;
      y = nextY;
      steps++;
      updateStatus();
      render();
      return;
    }
  }

  console.log("Program terminated");
  stopExecution();
}

function executeOperation(c1, c2, blockSize) {
    if (c1 === 18 || c2 === 18 || c1 === 19 || c2 === 19) return;

    const color1 = PIET_COLORS[c1];
    const color2 = PIET_COLORS[c2];

    let hueDiff = color2.hue - color1.hue;
    if (hueDiff < 0) hueDiff += 6;

    let lightnessDiff = color2.lightness - color1.lightness;
    if (lightnessDiff < 0) lightnessDiff += 3;

    const opName = OPERATIONS[lightnessDiff][hueDiff];
    performOp(opName, blockSize);
}

function performOp(opName, val) {
    console.log(`Operation: ${opName}, Val: ${val}`);

    switch (opName) {
        case "push":
            stack.push(val);
            break;
        case "pop":
            if (stack.length > 0) stack.pop();
            break;
        case "add":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                stack.push(b + a);
            }
            break;
        case "sub":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                stack.push(b - a);
            }
            break;
        case "mul":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                stack.push(b * a);
            }
            break;
        case "div":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                if (a !== 0) stack.push(Math.floor(b / a));
                else {
                    stack.push(b);
                    stack.push(a);
                }
            }
            break;
        case "mod":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                if (a !== 0) {
                    let res = b % a;
                    if (res < 0 && a > 0) res += a;
                    else if (res > 0 && a < 0) res += a;
                    stack.push(res);
                } else {
                    stack.push(b);
                    stack.push(a);
                }
            }
            break;
        case "not":
            if (stack.length >= 1) {
                const a = stack.pop();
                stack.push(a === 0 ? 1 : 0);
            }
            break;
        case "greater":
            if (stack.length >= 2) {
                const a = stack.pop();
                const b = stack.pop();
                stack.push(b > a ? 1 : 0);
            }
            break;
        case "pointer":
            if (stack.length >= 1) {
                const a = stack.pop();
                let turns = a % 4;
                if (turns < 0) turns += 4;
                dp = (dp + turns) % 4;
                updateStatus();
            }
            break;
        case "switch":
            if (stack.length >= 1) {
                const a = stack.pop();
                let toggles = Math.abs(a) % 2;
                if (toggles === 1) cc = (cc + 1) % 2;
                updateStatus();
            }
            break;
        case "duplicate":
            if (stack.length >= 1) {
                stack.push(stack[stack.length - 1]);
            }
            break;
        case "roll":
            if (stack.length >= 2) {
                let rolls = stack.pop();
                let depth = stack.pop();
                if (depth > 0 && depth <= stack.length) {
                    let subStack = stack.splice(stack.length - depth, depth);
                    rolls = rolls % depth;
                    if (rolls < 0) rolls += depth;

                    for (let i = 0; i < rolls; i++) {
                        subStack.unshift(subStack.pop());
                    }
                    stack.push(...subStack);
                } else {
                    stack.push(depth);
                    stack.push(rolls);
                }
            }
            break;
        case "in_n":
            const inputN = prompt("Enter a number:");
            if (inputN !== null && !isNaN(parseInt(inputN))) {
                stack.push(parseInt(inputN));
            }
            break;
        case "in_c":
            const inputC = prompt("Enter a character:");
            if (inputC !== null && inputC.length > 0) {
                stack.push(inputC.charCodeAt(0));
            }
            break;
        case "out_n":
            if (stack.length >= 1) {
                const val = stack.pop();
                logOutput(val);
            }
            break;
        case "out_c":
            if (stack.length >= 1) {
                const val = stack.pop();
                logOutput(String.fromCharCode(val));
            }
            break;
        case "none":
        default:
            break;
    }
    updateStackView();
}

function stopExecution() {
    isRunning = false;
    if (executionInterval) clearInterval(executionInterval);
    if (btnPlay) btnPlay.disabled = false;
    if (btnPause) btnPause.disabled = true;
    if (btnStep) btnStep.disabled = false;
}

function startExecution() {
    if (isRunning) return;
    isRunning = true;
    if (btnPlay) btnPlay.disabled = true;
    if (btnPause) btnPause.disabled = false;
    if (btnStep) btnStep.disabled = true;

    const interval = Math.max(10, 1000 / speed);
    executionInterval = setInterval(step, interval);
}

function pauseExecution() {
    isRunning = false;
    if (executionInterval) clearInterval(executionInterval);
    if (btnPlay) btnPlay.disabled = false;
    if (btnPause) btnPause.disabled = true;
    if (btnStep) btnStep.disabled = false;
}

function updateSpeed() {
    if (speedSlider) {
        speed = parseInt(speedSlider.value);
        if (speedDisplay) speedDisplay.textContent = speed + "x";
        if (isRunning) {
            clearInterval(executionInterval);
            const interval = Math.max(10, 1000 / speed);
            executionInterval = setInterval(step, interval);
        }
    }
}

// Event Listeners
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        initCanvas();

        if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
        if (btnReset) btnReset.addEventListener('click', resetInterpreter);
        if (btnStep) btnStep.addEventListener('click', () => step());
        if (btnPlay) btnPlay.addEventListener('click', startExecution);
        if (btnPause) btnPause.addEventListener('click', pauseExecution);
        if (speedSlider) speedSlider.addEventListener('input', updateSpeed);
    });
}

// Exports for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PIET_COLORS,
        getColorIndex,
        getColor,
        DP,
        CC
    };
}
