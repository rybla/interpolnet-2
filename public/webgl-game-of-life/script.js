const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, depth: false, antialias: false });

if (!gl) {
  alert('WebGL 2 is required for this demo.');
  throw new Error('WebGL 2 not supported');
}

// Set unpack alignment to 1 because we are using tightly packed Uint8Arrays (gl.RED)
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

// Resolution scale. 1 = 1 pixel per cell. Use 2 or 3 for bigger cells if desired.
const SCALE = 2;
let width, height;

// Patterns
const PATTERNS = {
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

// Shaders
const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_position * 0.5 + 0.5;
}
`;

const simulationFragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

int get(int dx, int dy) {
  vec2 coord = v_texCoord + vec2(dx, dy) / u_resolution;
  // Wrap around logic can be handled by texture wrap mode,
  // but explicitly writing it here ensures correct behavior if needed.
  return int(texture(u_state, coord).r);
}

void main() {
  int sum =
    get(-1, -1) + get(0, -1) + get(1, -1) +
    get(-1,  0) +              get(1,  0) +
    get(-1,  1) + get(0,  1) + get(1,  1);

  int state = get(0, 0);

  if (state == 1) {
    if (sum == 2 || sum == 3) {
      outColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
      outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  } else {
    if (sum == 3) {
      outColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
      outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
}
`;

const renderFragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D u_state;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
  float state = texture(u_state, v_texCoord).r;
  if (state > 0.5) {
    // Alive color (neon cyan/green-ish)
    outColor = vec4(0.0, 0.95, 0.99, 1.0);
  } else {
    // Dead color (dark background)
    outColor = vec4(0.07, 0.07, 0.1, 1.0);
  }
}
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vsSource, fsSource) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

const simProgram = createProgram(vertexShaderSource, simulationFragmentShaderSource);
const renderProgram = createProgram(vertexShaderSource, renderFragmentShaderSource);

// Full screen quad
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

const simPositionLoc = gl.getAttribLocation(simProgram, 'a_position');
const renderPositionLoc = gl.getAttribLocation(renderProgram, 'a_position');
const simResolutionLoc = gl.getUniformLocation(simProgram, 'u_resolution');

// Create textures and framebuffers for ping-ponging
let textures = [];
let framebuffers = [];

function createTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
}

function initBuffers() {
  width = Math.ceil(window.innerWidth / SCALE);
  height = Math.ceil(window.innerHeight / SCALE);

  canvas.width = width;
  canvas.height = height;

  // Cleanup old if resize
  textures.forEach(t => gl.deleteTexture(t));
  framebuffers.forEach(f => gl.deleteFramebuffer(f));

  textures = [createTexture(), createTexture()];
  framebuffers = [gl.createFramebuffer(), gl.createFramebuffer()];

  // Initial random state
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() > 0.85 ? 255 : 0;
  }

  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    // R8 format for single channel byte
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, i === 0 ? data : null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
  }
}

initBuffers();
window.addEventListener('resize', initBuffers);

let currentRead = 0;
let currentWrite = 1;

function render() {
  // 1. Simulation step
  gl.useProgram(simProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(simPositionLoc);
  gl.vertexAttribPointer(simPositionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(simResolutionLoc, width, height);

  gl.bindTexture(gl.TEXTURE_2D, textures[currentRead]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[currentWrite]);
  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 2. Render to screen
  gl.useProgram(renderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(renderPositionLoc);
  gl.vertexAttribPointer(renderPositionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, textures[currentWrite]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // screen
  gl.viewport(0, 0, width, height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Ping pong
  let temp = currentRead;
  currentRead = currentWrite;
  currentWrite = temp;

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Stamping logic
let activeStamp = 'glider';

document.querySelectorAll('input[name="stamp"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    activeStamp = e.target.value;
  });
});

let isDrawing = false;

function stamp(e) {
  const rect = canvas.getBoundingClientRect();
  // Map mouse coordinate to scaled canvas coordinate
  const x = Math.floor((e.clientX - rect.left) / SCALE);
  // WebGL texture origin is bottom-left, but we can stamp relative to top-left if we adjust y
  const y = Math.floor((rect.bottom - e.clientY) / SCALE);

  const pattern = PATTERNS[activeStamp];
  const pHeight = pattern.length;
  const pWidth = pattern[0].length;

  const data = new Uint8Array(pWidth * pHeight);
  for (let r = 0; r < pHeight; r++) {
    for (let c = 0; c < pWidth; c++) {
      // Invert rows because WebGL textures are bottom-up
      data[(pHeight - 1 - r) * pWidth + c] = pattern[r][c] ? 255 : 0;
    }
  }

  // Write directly to the CURRENT READ texture so it's picked up by the next simulation step
  gl.bindTexture(gl.TEXTURE_2D, textures[currentRead]);

  // We need to handle wrapping manually if stamp goes off edge, but for simplicity
  // we'll just clamp to bounds or let texSubImage2D throw if completely out
  const startX = Math.max(0, x - Math.floor(pWidth / 2));
  const startY = Math.max(0, y - Math.floor(pHeight / 2));

  const stampW = Math.min(pWidth, width - startX);
  const stampH = Math.min(pHeight, height - startY);

  if (stampW > 0 && stampH > 0) {
     // Subset data if it goes off edge to avoid WebGL errors
     let subData = data;
     if (stampW !== pWidth || stampH !== pHeight) {
       subData = new Uint8Array(stampW * stampH);
       for (let r=0; r<stampH; r++) {
         for (let c=0; c<stampW; c++) {
           subData[r*stampW + c] = data[r*pWidth + c];
         }
       }
     }

     gl.texSubImage2D(
       gl.TEXTURE_2D, 0,
       startX, startY,
       stampW, stampH,
       gl.RED, gl.UNSIGNED_BYTE, subData
     );
  }
}

canvas.addEventListener('pointerdown', (e) => {
  isDrawing = true;
  stamp(e);
});

canvas.addEventListener('pointermove', (e) => {
  if (isDrawing) {
    // Optional: could limit stamp rate so we don't stamp every tiny pixel moved
    stamp(e);
  }
});

canvas.addEventListener('pointerup', () => {
  isDrawing = false;
});
canvas.addEventListener('pointerleave', () => {
  isDrawing = false;
});
