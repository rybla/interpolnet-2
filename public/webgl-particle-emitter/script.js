const MAX_PARTICLES = 50000;
let particleCount = 0;

let gravityX = 0;
let gravityY = -5; // Towards bottom
let windX = 0;
let windY = 0;
let drag = 0.05;
let emissionRate = 1000; // particles per second

// Buffers
const positions = new Float32Array(MAX_PARTICLES * 2);
const velocities = new Float32Array(MAX_PARTICLES * 2);
const lifetimes = new Float32Array(MAX_PARTICLES);
const initialLifetimes = new Float32Array(MAX_PARTICLES);
const colors = new Float32Array(MAX_PARTICLES * 3);

let lastTime = 0;

function initWebGL(canvas) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false });
  if (!gl) {
    alert('WebGL not supported');
    return null;
  }
  return gl;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec3 a_color;
  attribute float a_lifetime;
  attribute float a_initialLifetime;

  varying vec3 v_color;
  varying float v_lifetime;
  varying float v_initialLifetime;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 3.0;

    v_color = a_color;
    v_lifetime = a_lifetime;
    v_initialLifetime = a_initialLifetime;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  varying vec3 v_color;
  varying float v_lifetime;
  varying float v_initialLifetime;

  void main() {
    float alpha = max(0.0, v_lifetime / v_initialLifetime);

    // Make particles round
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5)
      discard;

    gl_FragColor = vec4(v_color, alpha);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
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

function spawnParticle(index) {
  positions[index * 2] = 0; // x
  positions[index * 2 + 1] = 0; // y

  // Random velocity outwards
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 2 + 0.5;
  velocities[index * 2] = Math.cos(angle) * speed;
  velocities[index * 2 + 1] = Math.sin(angle) * speed;

  // Random lifetime
  const life = Math.random() * 2.0 + 1.0;
  lifetimes[index] = life;
  initialLifetimes[index] = life;

  // Neon synthwave colors (cyan, magenta, yellow)
  const colorType = Math.random();
  if (colorType < 0.33) {
    colors[index * 3] = 0.0;     // r
    colors[index * 3 + 1] = 1.0; // g
    colors[index * 3 + 2] = 0.8; // b (cyan)
  } else if (colorType < 0.66) {
    colors[index * 3] = 1.0;     // r
    colors[index * 3 + 1] = 0.0; // g
    colors[index * 3 + 2] = 1.0; // b (magenta)
  } else {
    colors[index * 3] = 1.0;     // r
    colors[index * 3 + 1] = 1.0; // g
    colors[index * 3 + 2] = 0.0; // b (yellow)
  }
}

function setupVectorControl(controlId, headId, lineId, onChange) {
  const control = document.getElementById(controlId);
  const head = document.getElementById(headId);
  const line = document.getElementById(lineId);

  let isDragging = false;

  const updateVisuals = (x, y) => {
    head.style.left = `calc(50% + ${x}px)`;
    head.style.top = `calc(50% + ${y}px)`;

    const angle = Math.atan2(y, x);
    const length = Math.sqrt(x*x + y*y);
    line.style.width = `${length}px`;
    line.style.transform = `translateY(-50%) rotate(${angle}rad)`;
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;

    const rect = control.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Constrain to container
    const maxRadius = Math.min(rect.width, rect.height) / 2 - 10;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    updateVisuals(dx, dy);
    onChange(dx / maxRadius, dy / maxRadius);
  };

  head.addEventListener('pointerdown', (e) => {
    isDragging = true;
    head.setPointerCapture(e.pointerId);
  });

  head.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));

  head.addEventListener('pointerup', (e) => {
    isDragging = false;
    head.releasePointerCapture(e.pointerId);
  });

  return updateVisuals;
}

function init() {
  const canvas = document.getElementById('glcanvas');

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const gl = initWebGL(canvas);
  if (!gl) return;

  const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vShader, fShader);

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const lifetimeBuffer = gl.createBuffer();
  const initialLifetimeBuffer = gl.createBuffer();

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const colorLoc = gl.getAttribLocation(program, 'a_color');
  const lifetimeLoc = gl.getAttribLocation(program, 'a_lifetime');
  const initialLifetimeLoc = gl.getAttribLocation(program, 'a_initialLifetime');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for neon effect

  // Set up UI
  const dragSlider = document.getElementById('drag-slider');
  const dragValue = document.getElementById('drag-value');
  dragSlider.addEventListener('input', (e) => {
    drag = parseFloat(e.target.value);
    dragValue.textContent = drag.toFixed(2);
  });

  const emissionSlider = document.getElementById('emission-slider');
  const emissionValue = document.getElementById('emission-value');
  emissionSlider.addEventListener('input', (e) => {
    emissionRate = parseInt(e.target.value, 10);
    emissionValue.textContent = emissionRate;
  });

  const maxVectorValue = 15; // Max acceleration

  const updateGravityVisuals = setupVectorControl('gravity-control', 'gravity-head', 'gravity-line', (nx, ny) => {
    gravityX = nx * maxVectorValue;
    gravityY = -ny * maxVectorValue; // Invert Y because canvas Y is down, WebGL Y is up
  });

  const updateWindVisuals = setupVectorControl('wind-control', 'wind-head', 'wind-line', (nx, ny) => {
    windX = nx * maxVectorValue;
    windY = -ny * maxVectorValue;
  });

  // Set initial visuals
  updateGravityVisuals(0, (5 / maxVectorValue) * (document.getElementById('gravity-control').getBoundingClientRect().height / 2 - 10)); // Initial gravity down (positive Y visually)
  updateWindVisuals(0, 0);

  document.getElementById('reset-btn').addEventListener('click', () => {
    gravityX = 0;
    gravityY = -5;
    windX = 0;
    windY = 0;
    drag = 0.05;
    emissionRate = 1000;

    dragSlider.value = drag;
    dragValue.textContent = drag.toFixed(2);
    emissionSlider.value = emissionRate;
    emissionValue.textContent = emissionRate;

    updateGravityVisuals(0, (5 / maxVectorValue) * (document.getElementById('gravity-control').getBoundingClientRect().height / 2 - 10));
    updateWindVisuals(0, 0);
  });

  let particlesToSpawn = 0;

  function render(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    if (dt > 0.1) { // Skip large delta times (e.g. tab was inactive)
      requestAnimationFrame(render);
      return;
    }

    // Spawn new particles
    particlesToSpawn += emissionRate * dt;
    while (particlesToSpawn >= 1 && particleCount < MAX_PARTICLES) {
      spawnParticle(particleCount);
      particleCount++;
      particlesToSpawn -= 1;
    }

    const aspect = canvas.width / canvas.height;

    // Update physics
    for (let i = 0; i < particleCount; i++) {
      lifetimes[i] -= dt;

      if (lifetimes[i] <= 0) {
        // Swap with last active particle to delete
        particleCount--;
        if (i < particleCount) {
          positions[i * 2] = positions[particleCount * 2];
          positions[i * 2 + 1] = positions[particleCount * 2 + 1];
          velocities[i * 2] = velocities[particleCount * 2];
          velocities[i * 2 + 1] = velocities[particleCount * 2 + 1];
          lifetimes[i] = lifetimes[particleCount];
          initialLifetimes[i] = initialLifetimes[particleCount];
          colors[i * 3] = colors[particleCount * 3];
          colors[i * 3 + 1] = colors[particleCount * 3 + 1];
          colors[i * 3 + 2] = colors[particleCount * 3 + 2];
          i--; // Re-process this index
        }
        continue;
      }

      // Calculate forces: F = gravity + wind - (drag * velocity)
      const forceX = gravityX + windX - (drag * velocities[i * 2]);
      const forceY = gravityY + windY - (drag * velocities[i * 2 + 1]);

      // Update velocity: v_new = v_old + force * dt
      velocities[i * 2] += forceX * dt;
      velocities[i * 2 + 1] += forceY * dt;

      // Update position: p_new = p_old + v_new * dt
      // Normalize position to clip space (-1 to 1) based on aspect ratio
      // Assuming a "world" coordinate system where height is 2 (-1 to 1)
      positions[i * 2] += (velocities[i * 2] * dt) / aspect;
      positions[i * 2 + 1] += velocities[i * 2 + 1] * dt;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.043, 0.059, 0.098, 1.0); // #0b0f19
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    if (particleCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions.subarray(0, particleCount * 2), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors.subarray(0, particleCount * 3), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, lifetimeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, lifetimes.subarray(0, particleCount), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(lifetimeLoc);
      gl.vertexAttribPointer(lifetimeLoc, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, initialLifetimeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, initialLifetimes.subarray(0, particleCount), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(initialLifetimeLoc);
      gl.vertexAttribPointer(initialLifetimeLoc, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, particleCount);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(time => {
    lastTime = time;
    render(time);
  });
}

window.addEventListener('DOMContentLoaded', init);