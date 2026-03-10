document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });

  if (!gl) {
    alert('WebGL not supported');
    return;
  }

  // --- Particle Data ---
  const PARTICLE_COUNT = 50000;
  // Each particle takes 4 floats: posX, posY, velX, velY
  const particleData = new Float32Array(PARTICLE_COUNT * 4);
  const positionData = new Float32Array(PARTICLE_COUNT * 2);

  // Initialize particles
  function initParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Position (centered randomly)
      particleData[i * 4 + 0] = (Math.random() - 0.5) * 2.0;
      particleData[i * 4 + 1] = (Math.random() - 0.5) * 2.0;

      // Velocity
      particleData[i * 4 + 2] = (Math.random() - 0.5) * 0.01;
      particleData[i * 4 + 3] = (Math.random() - 0.5) * 0.01;
    }
  }

  initParticles();

  // --- WebGL Setup ---

  // Vertex Shader
  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      gl_PointSize = 2.0;
    }
  `;

  // Fragment Shader
  const fsSource = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.0, 1.0, 0.8, 0.6); // Neon cyan
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link failed:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // Buffer Setup
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Allocate buffer size
  gl.bufferData(gl.ARRAY_BUFFER, positionData.byteLength, gl.DYNAMIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Resize handler
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Blending for a glowing effect
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0.043, 0.059, 0.098, 1.0); // Match --bg-color #0b0f19

  // --- UI Controls ---
  const controls = {
    gravityX: 0.0,
    gravityY: -0.05,
    windX: 0.0,
    windY: 0.0,
    drag: 0.01
  };

  function updateControlDisplay(id, valId, prop) {
    const input = document.getElementById(id);
    const display = document.getElementById(valId);

    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      controls[prop] = prop === 'gravityY' ? -val : val; // Invert Y visually because typical math implies down is negative y
      display.textContent = Math.abs(val) < 0.01 && val !== 0 ? val.toExponential(1) : val.toFixed(2);

      // Just for UI - actually keep the real internal physics Y positive if they want "down" to mean -Y in WebGL
      // Since WebGL Y goes from -1 (bottom) to 1 (top), a negative gravity means it falls down.
      // So if slider is 0.05, we want it to fall down -> webgl y = -0.05
    });
  }

  updateControlDisplay('gravity-x', 'gravity-x-val', 'gravityX');

  // Gravity Y setup: User sees positive "0.05", but internal gravity is negative
  document.getElementById('gravity-y').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    controls.gravityY = -val;
    document.getElementById('gravity-y-val').textContent = val.toFixed(2);
  });

  updateControlDisplay('wind-x', 'wind-x-val', 'windX');
  updateControlDisplay('wind-y', 'wind-y-val', 'windY');

  document.getElementById('drag').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    controls.drag = val;
    document.getElementById('drag-val').textContent = val.toFixed(3);
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    initParticles();
  });

  // --- Physics & Render Loop ---
  let lastTime = 0;

  function render(time) {
    const dt = Math.min((time - lastTime) / 1000.0, 0.1); // clamp dt to avoid huge jumps
    lastTime = time;

    // Physics step
    const aspect = canvas.width / canvas.height;

    // Scale down vectors slightly so sliders 0-1 feel reasonable
    const gX = controls.gravityX * 0.1;
    const gY = controls.gravityY * 0.1;
    const wX = controls.windX * 0.1;
    const wY = controls.windY * 0.1;
    const dMultiplier = 1.0 - controls.drag;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let px = particleData[i * 4 + 0];
      let py = particleData[i * 4 + 1];
      let vx = particleData[i * 4 + 2];
      let vy = particleData[i * 4 + 3];

      // Accelerate
      vx += (gX + wX) * dt;
      vy += (gY + wY) * dt;

      // Apply drag
      vx *= dMultiplier;
      vy *= dMultiplier;

      // Move
      px += vx * dt;
      py += vy * dt;

      // Boundaries & Reset
      // Reset if way out of bounds or velocity is too crazy
      if (px < -1.2 || px > 1.2 || py < -1.2 || py > 1.2 || isNaN(px) || isNaN(py)) {
         px = (Math.random() - 0.5) * 0.5;
         py = (Math.random() - 0.5) * 0.5;
         vx = (Math.random() - 0.5) * 0.1;
         vy = (Math.random() - 0.5) * 0.1;
      }

      // Write back
      particleData[i * 4 + 0] = px;
      particleData[i * 4 + 1] = py;
      particleData[i * 4 + 2] = vx;
      particleData[i * 4 + 3] = vy;

      // For rendering, adjust X for aspect ratio to keep physics world square
      positionData[i * 2 + 0] = px / aspect;
      positionData[i * 2 + 1] = py;
    }

    // Clear and draw
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update WebGL buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positionData);

    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});
