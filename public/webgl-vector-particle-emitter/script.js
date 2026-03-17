const MAX_PARTICLES = 5000;

// Vertex shader
const vsSource = `
  attribute vec2 aPosition;
  attribute vec2 aVelocity;
  attribute float aAge;
  attribute float aLife;

  varying float vAge;
  varying float vLife;

  void main() {
    vAge = aAge;
    vLife = aLife;

    // Convert from pixel coordinates to clip space (-1 to 1)
    // Assume canvas size is 800x600 for coordinate mapping
    vec2 clipSpace = (aPosition / vec2(800.0, 600.0)) * 2.0 - 1.0;

    // We want origin (0,0) at bottom-left in clip space, but canvas pixel origin is top-left.
    // So flip Y.
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

    // Size based on age (fade out / shrink)
    float lifeRatio = aAge / aLife;
    gl_PointSize = mix(6.0, 1.0, lifeRatio);
  }
`;

// Fragment shader
const fsSource = `
  precision mediump float;
  varying float vAge;
  varying float vLife;

  void main() {
    // Draw a soft circle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    float lifeRatio = vAge / vLife;

    // Color gradient from white/yellow to red/dark based on age
    vec3 startColor = vec3(1.0, 0.9, 0.5);
    vec3 endColor = vec3(0.8, 0.2, 0.1);
    vec3 color = mix(startColor, endColor, lifeRatio);

    // Alpha fade out
    float alpha = 1.0 - pow(lifeRatio, 2.0);

    // Soft edge
    alpha *= smoothstep(0.5, 0.2, dist);

    gl_FragColor = vec4(color, alpha);
  }
`;

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const glCanvas = document.getElementById('glcanvas');
const gl = glCanvas.getContext('webgl', { premultipliedAlpha: false });

if (!gl) {
  alert('Unable to initialize WebGL. Your browser or machine may not support it.');
}

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

const programInfo = {
  program: shaderProgram,
  attribLocations: {
    position: gl.getAttribLocation(shaderProgram, 'aPosition'),
    velocity: gl.getAttribLocation(shaderProgram, 'aVelocity'),
    age: gl.getAttribLocation(shaderProgram, 'aAge'),
    life: gl.getAttribLocation(shaderProgram, 'aLife'),
  },
};

// Particle state arrays
// 2 floats for position (x, y), 2 for velocity (x, y), 1 for age, 1 for life = 6 floats per particle
const particleData = new Float32Array(MAX_PARTICLES * 6);
const particleBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, particleData.byteLength, gl.DYNAMIC_DRAW);

// Enable blending for glowing particles
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

// Initialize vectors (wind, gravity, drag)
const styles = getComputedStyle(document.documentElement);
const windColor = styles.getPropertyValue('--wind-color').trim() || '#00bcd4';
const gravityColor = styles.getPropertyValue('--gravity-color').trim() || '#e91e63';
const dragColor = styles.getPropertyValue('--drag-color').trim() || '#ffeb3b';

let vectors = {
  wind: { x: 50, y: -20, color: windColor, name: 'Wind' },
  gravity: { x: 0, y: 100, color: gravityColor, name: 'Gravity' },
  drag: { x: -30, y: -30, color: dragColor, name: 'Drag (Damping)' }
};

// Vector origin point on overlay canvas
const origin = { x: 400, y: 300 };

let draggedVector = null;
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');

function drawArrow(ctx, fromX, fromY, toX, toY, color) {
  const headlen = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawVectors() {
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Draw origin
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  for (const key in vectors) {
    const v = vectors[key];
    const toX = origin.x + v.x;
    const toY = origin.y + v.y;
    drawArrow(ctx, origin.x, origin.y, toX, toY, v.color);

    // Draw grab handle
    ctx.beginPath();
    ctx.arc(toX, toY, 15, 0, Math.PI * 2);
    ctx.fillStyle = draggedVector === key ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0)';
    ctx.fill();

    // Label
    ctx.fillStyle = v.color;
    ctx.font = '14px sans-serif';
    ctx.fillText(v.name, toX + 15, toY);
  }
}

function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}

overlayCanvas.addEventListener('mousedown', (e) => {
  const pos = getMousePos(overlayCanvas, e);
  for (const key in vectors) {
    const v = vectors[key];
    const toX = origin.x + v.x;
    const toY = origin.y + v.y;
    const dist = Math.hypot(pos.x - toX, pos.y - toY);
    if (dist < 20) {
      draggedVector = key;
      break;
    }
  }
  drawVectors();
});

overlayCanvas.addEventListener('mousemove', (e) => {
  if (draggedVector) {
    const pos = getMousePos(overlayCanvas, e);
    vectors[draggedVector].x = pos.x - origin.x;
    vectors[draggedVector].y = pos.y - origin.y;
    drawVectors();
  }
});

window.addEventListener('mouseup', () => {
  if (draggedVector) {
    draggedVector = null;
    drawVectors();
  }
});

// Touch support
overlayCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const pos = getMousePos(overlayCanvas, touch);
  for (const key in vectors) {
    const v = vectors[key];
    const toX = origin.x + v.x;
    const toY = origin.y + v.y;
    const dist = Math.hypot(pos.x - toX, pos.y - toY);
    if (dist < 30) {
      draggedVector = key;
      break;
    }
  }
  drawVectors();
}, { passive: false });

overlayCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (draggedVector) {
    const touch = e.touches[0];
    const pos = getMousePos(overlayCanvas, touch);
    vectors[draggedVector].x = pos.x - origin.x;
    vectors[draggedVector].y = pos.y - origin.y;
    drawVectors();
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  if (draggedVector) {
    draggedVector = null;
    drawVectors();
  }
});


let lastTime = 0;
function render(time) {
  let dt = (time - lastTime) / 1000.0;
  if (dt > 0.1) dt = 0.1; // cap dt
  lastTime = time;

  // Emit new particles (e.g. 100 per frame)
  const emitCount = 50;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    // Check if dead
    if (particleData[i * 6 + 4] >= particleData[i * 6 + 5]) {
      if (Math.random() < emitCount / MAX_PARTICLES) {
        // Respawn
        particleData[i * 6 + 0] = origin.x; // x
        particleData[i * 6 + 1] = origin.y; // y
        // random starting velocity spread
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 50;
        particleData[i * 6 + 2] = Math.cos(angle) * speed; // vx
        particleData[i * 6 + 3] = Math.sin(angle) * speed; // vy
        particleData[i * 6 + 4] = 0.0; // age
        particleData[i * 6 + 5] = 2.0 + Math.random() * 3.0; // life (2-5 seconds)
      }
    }
  }

  // Update physics
  // Force scaling factor for visual intuition
  const forceScale = 5.0;
  // Drag is a vector, but we use its length to scale a damping factor. Or we can just use its direction and length as a constant force.
  // Actually, to make 'drag' vector intuitive, let's treat it as a friction force opposite to velocity, scaled by the drag vector's magnitude.
  const dragMagnitude = Math.hypot(vectors.drag.x, vectors.drag.y) * 0.01;

  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (particleData[i * 6 + 4] < particleData[i * 6 + 5]) {
      // It's alive
      // Increase age
      particleData[i * 6 + 4] += dt;

      // Calculate acceleration
      let ax = (vectors.wind.x + vectors.gravity.x) * forceScale;
      let ay = (vectors.wind.y + vectors.gravity.y) * forceScale;

      // Apply drag (opposite to current velocity)
      let vx = particleData[i * 6 + 2];
      let vy = particleData[i * 6 + 3];

      ax -= vx * dragMagnitude;
      ay -= vy * dragMagnitude;

      // Update velocity
      particleData[i * 6 + 2] += ax * dt;
      particleData[i * 6 + 3] += ay * dt;

      // Update position
      particleData[i * 6 + 0] += particleData[i * 6 + 2] * dt;
      particleData[i * 6 + 1] += particleData[i * 6 + 3] * dt;
    }
  }

  // Update WebGL buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, particleData);

  // Render WebGL
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shaderProgram);

  const stride = 24; // 6 floats * 4 bytes

  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);

  gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.position);

  gl.vertexAttribPointer(programInfo.attribLocations.velocity, 2, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(programInfo.attribLocations.velocity);

  gl.vertexAttribPointer(programInfo.attribLocations.age, 1, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(programInfo.attribLocations.age);

  gl.vertexAttribPointer(programInfo.attribLocations.life, 1, gl.FLOAT, false, stride, 20);
  gl.enableVertexAttribArray(programInfo.attribLocations.life);

  gl.drawArrays(gl.POINTS, 0, MAX_PARTICLES);

  requestAnimationFrame(render);
}

// Initial draw of vectors
drawVectors();
// Start loop
requestAnimationFrame(render);
