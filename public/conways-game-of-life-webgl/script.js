const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

if (!gl) {
  alert('WebGL not supported');
  throw new Error('WebGL not supported');
}

// 1024x1024 grid size
const TEX_SIZE = 1024;
let isPlaying = false;
let simulationSpeed = 15;
let currentTool = 'pan';

// Camera state
let offsetX = 0;
let offsetY = 0;
let zoom = 1.0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Set up UI listeners
document.getElementById('btn-play').addEventListener('click', (e) => {
  isPlaying = true;
  document.querySelectorAll('.button-row button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

document.getElementById('btn-pause').addEventListener('click', (e) => {
  isPlaying = false;
  document.querySelectorAll('.button-row button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

document.getElementById('btn-step').addEventListener('click', () => {
  isPlaying = false;
  document.querySelectorAll('.button-row button').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-pause').classList.add('active');
  stepSimulation();
});

document.getElementById('slider-speed').addEventListener('input', (e) => {
  simulationSpeed = parseInt(e.target.value, 10);
});

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTool = e.target.dataset.tool;
    if (currentTool === 'pan') {
      canvas.classList.add('pan');
    } else {
      canvas.classList.remove('pan');
    }
  });
});

document.getElementById('btn-clear').addEventListener('click', () => {
  clearTexture(textures[0]);
  clearTexture(textures[1]);
  renderDisplay();
});

// Compile shader function
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Create program function
function createProgram(gl, vertexShaderSrc, fragmentShaderSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// Full screen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1.0, -1.0,
   1.0, -1.0,
  -1.0,  1.0,
  -1.0,  1.0,
   1.0, -1.0,
   1.0,  1.0,
]), gl.STATIC_DRAW);

// Shaders
const vertexShaderSource = document.getElementById('vertex-shader').text;
const simulationShaderSource = document.getElementById('simulation-shader').text;
const displayShaderSource = document.getElementById('display-shader').text;

const simProgram = createProgram(gl, vertexShaderSource, simulationShaderSource);
const displayProgram = createProgram(gl, vertexShaderSource, displayShaderSource);

// Uniform locations
const simStateLoc = gl.getUniformLocation(simProgram, 'u_state');
const simResLoc = gl.getUniformLocation(simProgram, 'u_resolution');

const dispStateLoc = gl.getUniformLocation(displayProgram, 'u_state');
const dispOffsetLoc = gl.getUniformLocation(displayProgram, 'u_offset');
const dispZoomLoc = gl.getUniformLocation(displayProgram, 'u_zoom');
const dispResLoc = gl.getUniformLocation(displayProgram, 'u_resolution');

// Create textures and framebuffers for ping-ponging
function createTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Use NEAREST filtering for pixel-perfect cells
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  // Empty data initially
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEX_SIZE, TEX_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return tex;
}

const textures = [createTexture(), createTexture()];
const framebuffers = [gl.createFramebuffer(), gl.createFramebuffer()];

for (let i = 0; i < 2; i++) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
}

let activeIdx = 0; // The texture we are reading from

function clearTexture(tex) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[activeIdx]);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Clear both initially
clearTexture(textures[0]);
clearTexture(textures[1]);

// Stamping patterns
const patterns = {
  cell: {
    width: 1, height: 1,
    data: new Uint8Array([255, 255, 255, 255])
  },
  glider: {
    width: 3, height: 3,
    data: new Uint8Array([
      0,0,0,0,     255,255,255,255, 0,0,0,0,
      0,0,0,0,     0,0,0,0,     255,255,255,255,
      255,255,255,255, 255,255,255,255, 255,255,255,255
    ])
  },
  gun: {
    // Gosper Glider Gun (36x9)
    width: 36, height: 9,
    data: (function() {
      const grid = [
        "........................O...........",
        "......................O.O...........",
        "............OO......OO............OO",
        "...........O...O....OO............OO",
        "OO........O.....O...OO..............",
        "OO........O...O.OO....O.O...........",
        "..........O.....O.......O...........",
        "...........O...O....................",
        "............OO......................"
      ];
      const data = new Uint8Array(36 * 9 * 4);
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 36; x++) {
          const idx = (y * 36 + x) * 4;
          const isAlive = grid[y][x] === 'O';
          data[idx] = isAlive ? 255 : 0;
          data[idx+1] = isAlive ? 255 : 0;
          data[idx+2] = isAlive ? 255 : 0;
          data[idx+3] = 255;
        }
      }
      return data;
    })()
  }
};

function stampPattern(x, y, patternKey) {
  const pattern = patterns[patternKey];
  if (!pattern) return;

  gl.bindTexture(gl.TEXTURE_2D, textures[activeIdx]);

  // Ensure we don't stamp outside bounds (wrap manually if needed, or just clamp for simplicity)
  // WebGL texSubImage2D will fail if out of bounds, so we wrap it ourselves for torus

  const w = pattern.width;
  const h = pattern.height;

  // Basic implementation without wrapping for simplicity, just clamping bounds
  const px = Math.floor(x);
  const py = Math.floor(y); // Flip y for WebGL texture coords

  if (px >= 0 && py >= 0 && px + w <= TEX_SIZE && py + h <= TEX_SIZE) {
     gl.texSubImage2D(gl.TEXTURE_2D, 0, px, py, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pattern.data);
  } else {
     // Handle edge wrap roughly
     for (let iy=0; iy<h; iy++) {
         for (let ix=0; ix<w; ix++) {
             const targetX = (px + ix) % TEX_SIZE;
             const targetY = (py + iy) % TEX_SIZE;
             const targetXWrapped = targetX < 0 ? targetX + TEX_SIZE : targetX;
             const targetYWrapped = targetY < 0 ? targetY + TEX_SIZE : targetY;

             const srcIdx = (iy * w + ix) * 4;
             const subData = new Uint8Array([pattern.data[srcIdx], pattern.data[srcIdx+1], pattern.data[srcIdx+2], 255]);
             gl.texSubImage2D(gl.TEXTURE_2D, 0, targetXWrapped, targetYWrapped, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, subData);
         }
     }
  }
}

function resizeCanvas() {
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

function stepSimulation() {
  resizeCanvas();

  const nextIdx = 1 - activeIdx;

  // Run simulation shader
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[nextIdx]);
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  gl.useProgram(simProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positionLocation = gl.getAttribLocation(simProgram, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[activeIdx]);
  gl.uniform1i(simStateLoc, 0);
  gl.uniform2f(simResLoc, TEX_SIZE, TEX_SIZE);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Swap buffers
  activeIdx = nextIdx;

  renderDisplay();
}

function renderDisplay() {
  resizeCanvas();

  // Draw to canvas
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(displayProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positionLocationDisp = gl.getAttribLocation(displayProgram, "a_position");
  gl.enableVertexAttribArray(positionLocationDisp);
  gl.vertexAttribPointer(positionLocationDisp, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[activeIdx]);
  gl.uniform1i(dispStateLoc, 0);

  gl.uniform2f(dispOffsetLoc, offsetX, offsetY);
  gl.uniform1f(dispZoomLoc, zoom);
  gl.uniform2f(dispResLoc, canvas.width, canvas.height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Convert screen coordinates to texture coordinates
function getTexCoords(screenX, screenY) {
  const aspect = canvas.width / canvas.height;

  // Normalize screen coords (-0.5 to 0.5)
  let nx = (screenX / canvas.width) - 0.5;
  let ny = 0.5 - (screenY / canvas.height); // WebGL Y is up

  // Apply aspect ratio
  if (aspect > 1.0) {
      nx *= aspect;
  } else {
      ny /= aspect;
  }

  // Apply zoom and offset inverse
  const ux = nx / zoom - offsetX;
  const uy = ny / zoom - offsetY;

  // Map back to 0-1 and wrap
  let tx = (ux + 0.5);
  let ty = (uy + 0.5);

  tx = tx - Math.floor(tx);
  ty = ty - Math.floor(ty);

  return {
      x: tx * TEX_SIZE,
      y: ty * TEX_SIZE
  };
}

// Interaction handling
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if (currentTool !== 'pan') {
    const texPos = getTexCoords(e.clientX, e.clientY);
    stampPattern(texPos.x, texPos.y, currentTool);
    renderDisplay();
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  if (currentTool === 'pan') {
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;

    // Convert screen drag to offset units
    const aspect = canvas.width / canvas.height;
    const factorX = (aspect > 1.0 ? aspect : 1.0) / canvas.width / zoom;
    const factorY = (aspect > 1.0 ? 1.0 : 1.0/aspect) / canvas.height / zoom;

    offsetX += dx * factorX;
    offsetY -= dy * factorY; // Y is inverted

    renderDisplay();
  } else if (currentTool === 'cell') {
    // Only drag for cells to draw lines
    const texPos = getTexCoords(e.clientX, e.clientY);
    stampPattern(texPos.x, texPos.y, currentTool);
    renderDisplay();
  }

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  // Zoom towards mouse position
  const oldTexPos = getTexCoords(e.clientX, e.clientY);

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  zoom *= zoomFactor;
  zoom = Math.max(0.1, Math.min(zoom, 50.0));

  // Adjust offset so mouse position stays at same texture coordinate
  const newTexPosUnadjusted = getTexCoords(e.clientX, e.clientY);

  offsetX += (newTexPosUnadjusted.x - oldTexPos.x) / TEX_SIZE;
  offsetY += (newTexPosUnadjusted.y - oldTexPos.y) / TEX_SIZE;

  renderDisplay();
}, { passive: false });

// Main loop
let lastTime = 0;
let timeAccumulator = 0;

function loop(time) {
  if (isPlaying) {
    const dt = time - lastTime;
    timeAccumulator += dt;

    const targetInterval = 1000 / simulationSpeed;

    // Allow multiple steps if lagging, up to a limit
    let steps = 0;
    while (timeAccumulator > targetInterval && steps < 5) {
      stepSimulation();
      timeAccumulator -= targetInterval;
      steps++;
    }
  } else {
      renderDisplay(); // Always render in case of resize or panning
  }

  lastTime = time;
  requestAnimationFrame(loop);
}

// Initial draw
resizeCanvas();
renderDisplay();
requestAnimationFrame(loop);
