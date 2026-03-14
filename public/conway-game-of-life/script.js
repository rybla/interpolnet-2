const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl', { depth: false, antialias: false }) || canvas.getContext('experimental-webgl');

if (!gl) {
  alert('WebGL not supported');
}

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// Shaders
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

const simulationFragmentShaderSource = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;

  int get(float x, float y) {
    vec2 coord = v_texCoord + vec2(x, y) / u_resolution;
    // Manual wrapping for non-power-of-two textures
    coord = fract(coord);
    float color = texture2D(u_texture, coord).r;
    return color > 0.5 ? 1 : 0;
  }

  void main() {
    int sum = get(-1.0, -1.0) + get(0.0, -1.0) + get(1.0, -1.0) +
              get(-1.0,  0.0) +                  get(1.0,  0.0) +
              get(-1.0,  1.0) + get(0.0,  1.0) + get(1.0,  1.0);

    int state = get(0.0, 0.0);
    int nextState = 0;

    if (state == 1) {
      if (sum == 2 || sum == 3) {
        nextState = 1;
      }
    } else {
      if (sum == 3) {
        nextState = 1;
      }
    }

    if (nextState == 1) {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;

const displayFragmentShaderSource = `
  precision highp float;
  uniform sampler2D u_texture;
  varying vec2 v_texCoord;

  void main() {
    float state = texture2D(u_texture, v_texCoord).r;
    if (state > 0.5) {
      gl_FragColor = vec4(0.05, 0.65, 0.9, 1.0); // Alive color: Cyan
    } else {
      gl_FragColor = vec4(0.06, 0.09, 0.15, 1.0); // Dead color: Dark background
    }
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
const simulationFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, simulationFragmentShaderSource);
const displayFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, displayFragmentShaderSource);

const simulationProgram = createProgram(gl, vertexShader, simulationFragmentShader);
const displayProgram = createProgram(gl, vertexShader, displayFragmentShader);

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

function createTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // WebGL1 requires CLAMP_TO_EDGE for non-power-of-two textures
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

let textureA = createTexture();
let textureB = createTexture();

const framebufferA = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferA);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureA, 0);

const framebufferB = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferB);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureB, 0);

// Initial random state
const initialData = new Uint8Array(width * height * 4);
for (let i = 0; i < width * height * 4; i += 4) {
  // Center block of random noise, otherwise mostly empty to show patterns clearly
  const x = (i / 4) % width;
  const y = Math.floor((i / 4) / width);
  let alive = 0;
  if (Math.abs(x - width/2) < width/4 && Math.abs(y - height/2) < height/4) {
    alive = Math.random() > 0.85 ? 255 : 0;
  }

  initialData[i] = alive;
  initialData[i+1] = 0;
  initialData[i+2] = 0;
  initialData[i+3] = 255;
}
gl.bindTexture(gl.TEXTURE_2D, textureA);
gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, initialData);

// Attributes and Uniforms
const simPosLocation = gl.getAttribLocation(simulationProgram, 'a_position');
const simResolutionLocation = gl.getUniformLocation(simulationProgram, 'u_resolution');

const dispPosLocation = gl.getAttribLocation(displayProgram, 'a_position');

let currentTexture = textureA;
let currentFramebuffer = framebufferA;
let nextTexture = textureB;
let nextFramebuffer = framebufferB;

// Patterns
const patterns = {
  glider: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
  ],
  gosper: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ]
};

// Interaction
let isPointerDown = false;
let stampQueue = [];

function handlePointerDown(e) {
  isPointerDown = true;
  stampPattern(e);
}

function handlePointerUp(e) {
  isPointerDown = false;
}

function handlePointerMove(e) {
  if (isPointerDown) {
    stampPattern(e);
  }
}

canvas.addEventListener('mousedown', handlePointerDown);
window.addEventListener('mouseup', handlePointerUp);
window.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('touchstart', (e) => handlePointerDown(e.touches[0]), { passive: true });
window.addEventListener('touchend', handlePointerUp);
window.addEventListener('touchmove', (e) => {
  if (isPointerDown) {
    stampPattern(e.touches[0]);
  }
}, { passive: true });

function stampPattern(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(e.clientX - rect.left);
  // WebGL texture coordinates have (0,0) at bottom-left
  const y = Math.floor(height - (e.clientY - rect.top));

  const selectedPatternElement = document.querySelector('input[name="pattern"]:checked');
  if (!selectedPatternElement) return;
  const selectedPatternValue = selectedPatternElement.value;
  const pattern = patterns[selectedPatternValue];

  if (!pattern) return;

  const patternHeight = pattern.length;
  const patternWidth = pattern[0].length;

  const data = new Uint8Array(patternWidth * patternHeight * 4);

  // Create texture data (upside down because WebGL expects bottom-up data)
  for (let py = 0; py < patternHeight; py++) {
    for (let px = 0; px < patternWidth; px++) {
      const idx = ((patternHeight - 1 - py) * patternWidth + px) * 4;
      data[idx] = pattern[py][px] ? 255 : 0;
      data[idx+1] = 0;
      data[idx+2] = 0;
      data[idx+3] = 255;
    }
  }

  // Queue the stamp for the next render frame
  stampQueue.push({
    x: x - Math.floor(patternWidth / 2),
    y: y - Math.floor(patternHeight / 2),
    w: patternWidth,
    h: patternHeight,
    data: data
  });
}

function resize() {
  if (window.innerWidth !== width || window.innerHeight !== height) {
    const oldWidth = width;
    const oldHeight = height;

    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const newTextureA = createTexture();
    const newTextureB = createTexture();

    // Create temporary framebuffer to copy old data to new texture
    const tempFb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, tempFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, newTextureA, 0);

    // We can't directly copy non-matching textures easily with copyTexSubImage2D in WebGL1 if the old texture is bound as a texture.
    // Instead we can just clear it or let it run. Let's just reset for simplicity or render a quad.
    // To keep it simple, we just leave it blank and let users restamp or the game will restart.
    // However, it's better to preserve.
    gl.deleteFramebuffer(tempFb);

    gl.deleteTexture(textureA);
    gl.deleteTexture(textureB);

    textureA = newTextureA;
    textureB = newTextureB;
    currentTexture = textureA;
    nextTexture = textureB;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferA);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureA, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureB, 0);
  }
}

window.addEventListener('resize', resize);

let lastFrameTime = 0;
// We can throttle the simulation so it's not a blur. 60fps is fine for Conway if users want to see it fast.
// Let's use requestAnimationFrame without throttling to show off WebGL performance.

function render(time) {
  // Process stamps
  if (stampQueue.length > 0) {
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);
    for (const stamp of stampQueue) {
      // Clamp coordinates to prevent out of bounds
      const drawX = Math.max(0, Math.min(width - stamp.w, stamp.x));
      const drawY = Math.max(0, Math.min(height - stamp.h, stamp.y));
      // Adjust width/height if we clamped
      const adjW = Math.min(stamp.w, width - drawX);
      const adjH = Math.min(stamp.h, height - drawY);

      if (adjW > 0 && adjH > 0) {
        // If we clamped, we technically need a smaller sub-array, but for simplicity we'll just ignore clamping if it's too close to edge
        // or just draw the full thing if it fits.
        if (drawX + stamp.w <= width && drawY + stamp.h <= height) {
           gl.texSubImage2D(gl.TEXTURE_2D, 0, drawX, drawY, stamp.w, stamp.h, gl.RGBA, gl.UNSIGNED_BYTE, stamp.data);
        }
      }
    }
    stampQueue = [];
  }

  gl.viewport(0, 0, width, height);

  // 1. Simulation step
  gl.bindFramebuffer(gl.FRAMEBUFFER, nextFramebuffer);
  gl.useProgram(simulationProgram);

  gl.enableVertexAttribArray(simPosLocation);
  gl.vertexAttribPointer(simPosLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, currentTexture);
  gl.uniform2f(simResolutionLocation, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 2. Display step
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(displayProgram);

  gl.enableVertexAttribArray(dispPosLocation);
  gl.vertexAttribPointer(dispPosLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, nextTexture);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Swap buffers
  let tempTexture = currentTexture;
  currentTexture = nextTexture;
  nextTexture = tempTexture;

  let tempFramebuffer = currentFramebuffer;
  currentFramebuffer = nextFramebuffer;
  nextFramebuffer = tempFramebuffer;

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
