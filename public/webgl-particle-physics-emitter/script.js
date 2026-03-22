const MAX_PARTICLES = 10000;
const EMIT_RATE = 100; // particles per frame
const MAX_LIFETIME = 5.0; // seconds

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_life;
  uniform vec2 u_resolution;

  varying float v_life;

  void main() {
    // Convert from pixel space to clip space (-1 to +1)
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    // Flip Y
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // Size based on life
    gl_PointSize = 8.0 * (a_life / ${MAX_LIFETIME.toFixed(1)});
    v_life = a_life;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying float v_life;
  uniform vec3 u_color;

  void main() {
    // Create a soft circle
    vec2 pt = gl_PointCoord - vec2(0.5);
    float r = length(pt);
    if (r > 0.5) {
      discard;
    }

    // Fade out over lifetime and near edges
    float alpha = smoothstep(0.5, 0.0, r) * (v_life / ${MAX_LIFETIME.toFixed(1)});
    gl_FragColor = vec4(u_color, alpha);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

let gl, program;
let positionBuffer, lifeBuffer;
let positionLocation, lifeLocation;
let resolutionLocation, colorLocation;

function initWebGL(canvas) {
  gl = canvas.getContext('webgl', { premultipliedAlpha: false });
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  program = createProgram(gl, vertexShader, fragmentShader);

  positionLocation = gl.getAttribLocation(program, "a_position");
  lifeLocation = gl.getAttribLocation(program, "a_life");
  resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  colorLocation = gl.getUniformLocation(program, "u_color");

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * 2 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

  lifeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

// Physics state
let activeParticles = 0;
const positions = new Float32Array(MAX_PARTICLES * 2);
const velocities = new Float32Array(MAX_PARTICLES * 2);
const lives = new Float32Array(MAX_PARTICLES);

// Global forces
const forces = {
  gravity: { x: 0, y: 300, color: '#00ffcc', active: false },
  wind: { x: 100, y: 0, color: '#ff00ff', active: false },
  drag: { x: -2, y: -2, color: '#ffcc00', active: false } // Drag is represented as a scaled vector for UI, but logic is different
};

// UI Canvas context
let uiCtx;
let canvasWidth, canvasHeight;

function emitParticles(dt) {
  const particlesToEmit = Math.min(EMIT_RATE, MAX_PARTICLES - activeParticles);
  const emitX = canvasWidth / 2;
  const emitY = canvasHeight / 2;

  for (let i = 0; i < particlesToEmit; i++) {
    const idx = activeParticles;
    const pIdx = idx * 2;

    positions[pIdx] = emitX;
    positions[pIdx + 1] = emitY;

    // Random initial velocity burst
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 50 + 50;
    velocities[pIdx] = Math.cos(angle) * speed;
    velocities[pIdx + 1] = Math.sin(angle) * speed;

    lives[idx] = MAX_LIFETIME;
    activeParticles++;
  }
}

function updatePhysics(dt) {
  // Cap dt to prevent huge jumps if tab is backgrounded
  dt = Math.min(dt, 0.1);

  let i = 0;
  while (i < activeParticles) {
    lives[i] -= dt;

    if (lives[i] <= 0) {
      // Swap with last active particle to remove
      activeParticles--;
      const lastIdx = activeParticles;

      positions[i * 2] = positions[lastIdx * 2];
      positions[i * 2 + 1] = positions[lastIdx * 2 + 1];
      velocities[i * 2] = velocities[lastIdx * 2];
      velocities[i * 2 + 1] = velocities[lastIdx * 2 + 1];
      lives[i] = lives[lastIdx];
      continue; // Check the swapped particle
    }

    const pIdx = i * 2;

    // Calculate forces
    let ax = forces.gravity.x + forces.wind.x;
    let ay = forces.gravity.y + forces.wind.y;

    // Drag acts opposite to velocity. The vector length is the drag coefficient.
    const dragCoeff = Math.sqrt(forces.drag.x * forces.drag.x + forces.drag.y * forces.drag.y) * 0.01;
    ax -= velocities[pIdx] * dragCoeff;
    ay -= velocities[pIdx + 1] * dragCoeff;

    // Euler integration
    velocities[pIdx] += ax * dt;
    velocities[pIdx + 1] += ay * dt;

    positions[pIdx] += velocities[pIdx] * dt;
    positions[pIdx + 1] += velocities[pIdx + 1] * dt;

    i++;
  }
}

function renderWebGL() {
  if (!gl || activeParticles === 0) return;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.04, 0.06, 0.1, 1.0); // Match var(--bg-color) somewhat
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform3f(colorLocation, 1.0, 1.0, 1.0); // White particles

  // Update buffers with active subset
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions.subarray(0, activeParticles * 2));
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, lives.subarray(0, activeParticles));
  gl.enableVertexAttribArray(lifeLocation);
  gl.vertexAttribPointer(lifeLocation, 1, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.POINTS, 0, activeParticles);
}

function renderUI() {
  uiCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  // Draw base points
  uiCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  uiCtx.beginPath();
  uiCtx.arc(cx, cy, 4, 0, Math.PI * 2);
  uiCtx.fill();

  // Draw forces
  for (const key in forces) {
    const force = forces[key];

    // Draw line
    uiCtx.beginPath();
    uiCtx.moveTo(cx, cy);
    uiCtx.lineTo(cx + force.x, cy + force.y);
    uiCtx.strokeStyle = force.color;
    uiCtx.lineWidth = force.active ? 4 : 2;
    uiCtx.stroke();

    // Draw arrow head (draggable point)
    uiCtx.beginPath();
    uiCtx.arc(cx + force.x, cy + force.y, 10, 0, Math.PI * 2);
    uiCtx.fillStyle = force.color;
    uiCtx.fill();

    if (force.active) {
      uiCtx.strokeStyle = 'white';
      uiCtx.lineWidth = 2;
      uiCtx.stroke();
    }
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (dt > 0) {
    emitParticles(dt);
    updatePhysics(dt);
    renderWebGL();
    renderUI();
  }

  requestAnimationFrame(loop);
}

// Interaction state
let draggingForce = null;

function handlePointerDown(e) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  // Find if we clicked on an arrow head
  for (const key in forces) {
    const force = forces[key];
    const dx = e.clientX - (cx + force.x);
    const dy = e.clientY - (cy + force.y);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 15) {
      draggingForce = key;
      forces[key].active = true;
      break;
    }
  }
}

function handlePointerMove(e) {
  if (draggingForce) {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    forces[draggingForce].x = e.clientX - cx;
    forces[draggingForce].y = e.clientY - cy;
  }
}

function handlePointerUp() {
  if (draggingForce) {
    forces[draggingForce].active = false;
    draggingForce = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const webglCanvas = document.getElementById('webgl-canvas');
    const uiCanvas = document.getElementById('ui-canvas');

    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    webglCanvas.width = canvasWidth;
    webglCanvas.height = canvasHeight;
    uiCanvas.width = canvasWidth;
    uiCanvas.height = canvasHeight;

    uiCtx = uiCanvas.getContext('2d');

    initWebGL(webglCanvas);

    uiCanvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    window.addEventListener('resize', () => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        webglCanvas.width = canvasWidth;
        webglCanvas.height = canvasHeight;
        uiCanvas.width = canvasWidth;
        uiCanvas.height = canvasHeight;
    });

    requestAnimationFrame(loop);
});
