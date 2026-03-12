const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5; // map to 0..1
  }
`;

// fragment shader calculates metaball inverse square distance sum
const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_threshold;

  // Use a hardcoded array size for uniform passing
  const int MAX_METABALLS = 50;
  uniform vec3 u_metaballs[MAX_METABALLS]; // x, y, radius
  uniform int u_num_metaballs;

  void main() {
    vec2 st = gl_FragCoord.xy;

    float sum = 0.0;

    for (int i = 0; i < MAX_METABALLS; i++) {
      if (i >= u_num_metaballs) break;

      vec2 mb_pos = u_metaballs[i].xy;
      float r = u_metaballs[i].z;

      float dx = st.x - mb_pos.x;
      float dy = st.y - mb_pos.y;

      float d2 = dx * dx + dy * dy;

      // Inverse-square distance contribution
      sum += (r * r) / d2;
    }

    // Liquid coloring based on threshold
    if (sum >= u_threshold) {
      // Create a gradient effect near the edge
      float edge = smoothstep(u_threshold, u_threshold + 0.5, sum);
      vec3 liquidColor = mix(vec3(0.0, 0.5, 1.0), vec3(0.3, 0.8, 1.0), edge);

      // Inner highlight
      float highlight = smoothstep(u_threshold + 1.0, u_threshold + 5.0, sum);
      liquidColor = mix(liquidColor, vec3(0.8, 0.9, 1.0), highlight);

      gl_FragColor = vec4(liquidColor, 1.0);
    } else {
      // Background
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
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

function init() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  // Setup Shaders
  const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vShader, fShader);

  // Lookups
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  const thresholdUniformLocation = gl.getUniformLocation(program, "u_threshold");
  const metaballsUniformLocation = gl.getUniformLocation(program, "u_metaballs");
  const numMetaballsUniformLocation = gl.getUniformLocation(program, "u_num_metaballs");

  // Create full-screen quad
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  // Resize handling
  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Metaballs state
  let metaballs = [];
  const MAX_METABALLS = 50;

  function initMetaballs(count, baseRadius) {
    metaballs = [];
    for (let i = 0; i < count; i++) {
      metaballs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        r: baseRadius * (0.8 + Math.random() * 0.4) // slight variation
      });
    }
  }

  // UI Setup
  const countInput = document.getElementById('metaball-count');
  const countVal = document.getElementById('metaball-count-val');

  const thresholdInput = document.getElementById('threshold');
  const thresholdVal = document.getElementById('threshold-val');

  const radiusInput = document.getElementById('base-radius');
  const radiusVal = document.getElementById('base-radius-val');

  const speedInput = document.getElementById('speed');
  const speedVal = document.getElementById('speed-val');

  // Initial setup
  let currentCount = parseInt(countInput.value);
  let currentRadius = parseInt(radiusInput.value);
  initMetaballs(currentCount, currentRadius);

  // UI Event Listeners
  countInput.addEventListener('input', (e) => {
    countVal.textContent = e.target.value;
    currentCount = parseInt(e.target.value);
    initMetaballs(currentCount, currentRadius);
  });

  thresholdInput.addEventListener('input', (e) => {
    thresholdVal.textContent = parseFloat(e.target.value).toFixed(1);
  });

  radiusInput.addEventListener('input', (e) => {
    radiusVal.textContent = e.target.value;
    currentRadius = parseInt(e.target.value);
    // update existing metaball radii while preserving positions
    metaballs.forEach(mb => {
      mb.r = currentRadius * (0.8 + Math.random() * 0.4);
    });
  });

  speedInput.addEventListener('input', (e) => {
    speedVal.textContent = parseFloat(e.target.value).toFixed(1);
  });

  // Animation Loop
  let lastTime = performance.now();
  function render(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    const speedMultiplier = parseFloat(speedInput.value);
    const threshold = parseFloat(thresholdInput.value);

    // Update metaball positions
    for (let i = 0; i < metaballs.length; i++) {
      const mb = metaballs[i];
      mb.x += mb.vx * speedMultiplier * 60 * dt;
      mb.y += mb.vy * speedMultiplier * 60 * dt;

      // Bounce off walls (accounting for radius roughly)
      if (mb.x < mb.r || mb.x > canvas.width - mb.r) {
        mb.vx *= -1;
        // Keep within bounds
        mb.x = Math.max(mb.r, Math.min(mb.x, canvas.width - mb.r));
      }
      if (mb.y < mb.r || mb.y > canvas.height - mb.r) {
        mb.vy *= -1;
        // Keep within bounds
        mb.y = Math.max(mb.r, Math.min(mb.y, canvas.height - mb.r));
      }
    }

    // Render
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    gl.uniform1f(thresholdUniformLocation, threshold);
    gl.uniform1i(numMetaballsUniformLocation, metaballs.length);

    // Flatten metaball data for uniform
    const metaballData = new Float32Array(MAX_METABALLS * 3);
    for (let i = 0; i < metaballs.length; i++) {
      metaballData[i * 3 + 0] = metaballs[i].x;
      // WebGL y is usually flipped from canvas, but gl_FragCoord is bottom-left, so we can pass canvas coordinates directly and they match gl_FragCoord.
      metaballData[i * 3 + 1] = canvas.height - metaballs[i].y; // flip y for gl_FragCoord
      metaballData[i * 3 + 2] = metaballs[i].r;
    }
    gl.uniform3fv(metaballsUniformLocation, metaballData);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

// Ensure init runs after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
