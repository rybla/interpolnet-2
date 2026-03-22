const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
  alert('WebGL is not supported by your browser.');
}

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_life;
  attribute float a_maxLife;

  varying float v_lifePercentage;

  void main() {
    v_lifePercentage = a_life / a_maxLife;
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = mix(2.0, 6.0, v_lifePercentage);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying float v_lifePercentage;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    // Color gradient based on life
    vec3 startColor = vec3(0.0, 1.0, 0.8); // Cyan
    vec3 endColor = vec3(1.0, 0.0, 0.8);   // Pink

    vec3 color = mix(startColor, endColor, 1.0 - v_lifePercentage);

    // Fade out towards the end of life and smooth edges
    float alpha = smoothstep(0.5, 0.3, dist) * v_lifePercentage;

    gl_FragColor = vec4(color, alpha);
  }
`;

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

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'a_position');
const lifeLocation = gl.getAttribLocation(program, 'a_life');
const maxLifeLocation = gl.getAttribLocation(program, 'a_maxLife');

const positionBuffer = gl.createBuffer();
const lifeBuffer = gl.createBuffer();
const maxLifeBuffer = gl.createBuffer();

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Physics and Simulation State
let particles = {
  positions: new Float32Array(0),
  velocities: new Float32Array(0),
  lives: new Float32Array(0),
  maxLives: new Float32Array(0),
  activeCount: 0,
};

let simState = {
  windX: 0.0,
  windY: 0.0,
  gravity: -9.8,
  drag: 0.01,
  targetCount: 10000,
  emissionRate: 1000, // particles per second
};

function initParticles() {
  const count = simState.targetCount;
  particles.positions = new Float32Array(count * 2);
  particles.velocities = new Float32Array(count * 2);
  particles.lives = new Float32Array(count);
  particles.maxLives = new Float32Array(count);
  particles.activeCount = 0;
}

function spawnParticle(index) {
  // Spawn from center
  particles.positions[index * 2] = 0;
  particles.positions[index * 2 + 1] = 0;

  // Random initial velocity (cone pointing upwards initially, spread out)
  const angle = (Math.random() - 0.5) * Math.PI;
  const speed = Math.random() * 0.5 + 0.1;
  particles.velocities[index * 2] = Math.sin(angle) * speed;
  particles.velocities[index * 2 + 1] = Math.cos(angle) * speed;

  // Random lifespan between 1.0 and 3.0 seconds
  const life = Math.random() * 2.0 + 1.0;
  particles.lives[index] = life;
  particles.maxLives[index] = life;
}

initParticles();

let lastTime = performance.now();
let spawnAccumulator = 0;
let frameCount = 0;
let lastFpsTime = lastTime;

function updateAndRender() {
  const currentTime = performance.now();
  let dt = (currentTime - lastTime) / 1000.0; // Delta time in seconds
  lastTime = currentTime;

  // Cap delta time to prevent massive jumps when tab is in background
  dt = Math.min(dt, 0.1);

  // FPS calculation
  frameCount++;
  if (currentTime - lastFpsTime >= 1000) {
    document.getElementById('fps-val').innerText = frameCount;
    frameCount = 0;
    lastFpsTime = currentTime;
  }

  // Handle target count changes
  if (simState.targetCount !== particles.lives.length) {
    initParticles();
    // Re-calculate emission rate based on average life (approx 2.0s) to keep array populated
    simState.emissionRate = simState.targetCount / 2.0;
  } else {
    simState.emissionRate = simState.targetCount / 2.0;
  }

  // Spawn new particles
  const particlesToSpawn = simState.emissionRate * dt;
  spawnAccumulator += particlesToSpawn;

  while (spawnAccumulator >= 1.0 && particles.activeCount < simState.targetCount) {
    spawnParticle(particles.activeCount);
    particles.activeCount++;
    spawnAccumulator -= 1.0;
  }

  // Aspect ratio correction to keep forces visually consistent
  const aspect = canvas.width / canvas.height;

  // Update physics for active particles
  for (let i = 0; i < particles.activeCount; i++) {
    particles.lives[i] -= dt;

    if (particles.lives[i] <= 0) {
      // Swap with last active particle to remove
      particles.activeCount--;
      const last = particles.activeCount;
      if (i !== last) {
        particles.positions[i * 2] = particles.positions[last * 2];
        particles.positions[i * 2 + 1] = particles.positions[last * 2 + 1];
        particles.velocities[i * 2] = particles.velocities[last * 2];
        particles.velocities[i * 2 + 1] = particles.velocities[last * 2 + 1];
        particles.lives[i] = particles.lives[last];
        particles.maxLives[i] = particles.maxLives[last];
      }
      i--; // Re-check this index
      continue;
    }

    const vx = particles.velocities[i * 2];
    const vy = particles.velocities[i * 2 + 1];

    // Apply forces
    // F = ma -> a = F/m (assuming m=1)
    let ax = simState.windX * 0.1;
    let ay = simState.gravity * 0.1 + simState.windY * 0.1;

    // Apply drag: F_drag = -c * v
    ax -= simState.drag * vx;
    ay -= simState.drag * vy;

    // Update velocity
    particles.velocities[i * 2] += ax * dt;
    particles.velocities[i * 2 + 1] += ay * dt;

    // Update position
    particles.positions[i * 2] += particles.velocities[i * 2] * dt / aspect;
    particles.positions[i * 2 + 1] += particles.velocities[i * 2 + 1] * dt;
  }

  // Rendering
  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (particles.activeCount > 0) {
    const activePositions = particles.positions.subarray(0, particles.activeCount * 2);
    const activeLives = particles.lives.subarray(0, particles.activeCount);
    const activeMaxLives = particles.maxLives.subarray(0, particles.activeCount);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, activePositions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, activeLives, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(lifeLocation);
    gl.vertexAttribPointer(lifeLocation, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, maxLifeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, activeMaxLives, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(maxLifeLocation);
    gl.vertexAttribPointer(maxLifeLocation, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particles.activeCount);
  }

  requestAnimationFrame(updateAndRender);
}

requestAnimationFrame(updateAndRender);

// UI Event Listeners
document.getElementById('wind-x').addEventListener('input', (e) => {
  simState.windX = parseFloat(e.target.value);
  document.getElementById('wind-x-val').innerText = simState.windX.toFixed(1);
});

document.getElementById('wind-y').addEventListener('input', (e) => {
  simState.windY = parseFloat(e.target.value);
  document.getElementById('wind-y-val').innerText = simState.windY.toFixed(1);
});

document.getElementById('gravity').addEventListener('input', (e) => {
  simState.gravity = parseFloat(e.target.value);
  document.getElementById('gravity-val').innerText = simState.gravity.toFixed(1);
});

document.getElementById('drag').addEventListener('input', (e) => {
  simState.drag = parseFloat(e.target.value);
  document.getElementById('drag-val').innerText = simState.drag.toFixed(3);
});

document.getElementById('particle-count').addEventListener('input', (e) => {
  simState.targetCount = parseInt(e.target.value, 10);
  document.getElementById('count-val').innerText = simState.targetCount;
});
