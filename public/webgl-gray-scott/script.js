const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: false }) || canvas.getContext("webgl", { preserveDrawingBuffer: false });
if (!gl) {
  throw new Error("WebGL not supported");
}

let width, height;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// WebGL2 uses EXT_color_buffer_float, WebGL1 uses WEBGL_color_buffer_float and OES_texture_float
if (gl instanceof WebGL2RenderingContext) {
  gl.getExtension("EXT_color_buffer_float");
} else {
  const ext = gl.getExtension("OES_texture_float");
  if (!ext) {
    throw new Error("OES_texture_float extension is required for precise calculations.");
  }
  const ext2 = gl.getExtension("WEBGL_color_buffer_float");
  if (!ext2) {
    throw new Error("WEBGL_color_buffer_float extension is required to render to float textures.");
  }
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Could not compile shader: " + info);
  }
  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Could not link program: " + info);
  }
  return program;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

const positions = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

function createTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // Use CLAMP_TO_EDGE for WebGL1 NPOT support, REPEAT works in WebGL2
  const wrapMode = (gl instanceof WebGL2RenderingContext) ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);

  const data = new Float32Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 1.0;
    data[i + 1] = 0.0;
    data[i + 2] = 0.0;
    data[i + 3] = 1.0;
  }

  // Seed the center with some B
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = 10;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        const dx = centerX + x;
        const dy = centerY + y;
        if (dx >= 0 && dx < width && dy >= 0 && dy < height) {
           const idx = (dy * width + dx) * 4;
           data[idx + 1] = 1.0;
        }
      }
    }
  }

  // WebGL2 uses RGBA32F for internal format when using FLOAT, WebGL1 uses RGBA
  const internalFormat = (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA;
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, gl.FLOAT, data);
  return texture;
}

let texture0 = createTexture();
let texture1 = createTexture();

let fbo0 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture0, 0);

let fbo1 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const simulationFragmentShaderSource = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_timeStep;
  uniform vec2 u_mouse;
  uniform float u_radius;
  uniform float u_feedRate;
  uniform float u_killRate;

  void main() {
    vec2 pos = v_texCoord;
    vec4 state = texture2D(u_image, pos);
    float A = state.r;
    float B = state.g;

    vec2 dx = vec2(1.0 / u_resolution.x, 0.0);
    vec2 dy = vec2(0.0, 1.0 / u_resolution.y);

    vec4 n = texture2D(u_image, pos + dy);
    vec4 s = texture2D(u_image, pos - dy);
    vec4 e = texture2D(u_image, pos + dx);
    vec4 w = texture2D(u_image, pos - dx);
    vec4 ne = texture2D(u_image, pos + dx + dy);
    vec4 nw = texture2D(u_image, pos - dx + dy);
    vec4 se = texture2D(u_image, pos + dx - dy);
    vec4 sw = texture2D(u_image, pos - dx - dy);

    vec4 laplacian =
        0.2 * (n + s + e + w) +
        0.05 * (ne + nw + se + sw) -
        1.0 * state;

    float Da = 1.0;
    float Db = 0.5;

    float reaction = A * B * B;
    float newA = A + (Da * laplacian.r - reaction + u_feedRate * (1.0 - A)) * u_timeStep;
    float newB = B + (Db * laplacian.g + reaction - (u_killRate + u_feedRate) * B) * u_timeStep;

    if (u_mouse.x > 0.0 && u_mouse.y > 0.0) {
      vec2 d = gl_FragCoord.xy - u_mouse;
      if (dot(d, d) < u_radius * u_radius) {
        newB = 1.0;
      }
    }

    gl_FragColor = vec4(clamp(newA, 0.0, 1.0), clamp(newB, 0.0, 1.0), 0.0, 1.0);
  }
`;

const renderFragmentShaderSource = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;

  void main() {
    vec4 state = texture2D(u_image, v_texCoord);
    float B = state.g;

    // Colorful organic mapping: black to magenta to cyan to white based on concentration B
    vec3 color = vec3(0.0, 0.0, 0.0);

    if (B < 0.2) {
        color = mix(vec3(0.05, 0.09, 0.16), vec3(0.5, 0.1, 0.3), B / 0.2); // Dark blue to dark magenta
    } else if (B < 0.5) {
        color = mix(vec3(0.5, 0.1, 0.3), vec3(0.0, 1.0, 0.8), (B - 0.2) / 0.3); // Magenta to cyan
    } else {
        color = mix(vec3(0.0, 1.0, 0.8), vec3(1.0, 1.0, 1.0), (B - 0.5) / 0.5); // Cyan to white
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const simulationProgram = createProgram(vertexShaderSource, simulationFragmentShaderSource);
const renderProgram = createProgram(vertexShaderSource, renderFragmentShaderSource);

const positionLocation = gl.getAttribLocation(simulationProgram, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionLocation = gl.getUniformLocation(simulationProgram, "u_resolution");
const timeStepLocation = gl.getUniformLocation(simulationProgram, "u_timeStep");
const mouseLocation = gl.getUniformLocation(simulationProgram, "u_mouse");
const radiusLocation = gl.getUniformLocation(simulationProgram, "u_radius");
const feedRateLocation = gl.getUniformLocation(simulationProgram, "u_feedRate");
const killRateLocation = gl.getUniformLocation(simulationProgram, "u_killRate");

const renderPositionLocation = gl.getAttribLocation(renderProgram, "a_position");
gl.enableVertexAttribArray(renderPositionLocation);
gl.vertexAttribPointer(renderPositionLocation, 2, gl.FLOAT, false, 0, 0);

let isPointerDown = false;
let pointerX = -1;
let pointerY = -1;

function updatePointer(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  pointerX = clientX - rect.left;
  pointerY = height - (clientY - rect.top); // WebGL y goes bottom to top
}

canvas.addEventListener("mousedown", (e) => {
  isPointerDown = true;
  updatePointer(e);
});

canvas.addEventListener("mousemove", (e) => {
  if (isPointerDown) {
    updatePointer(e);
  }
});

canvas.addEventListener("mouseup", () => {
  isPointerDown = false;
  pointerX = -1;
  pointerY = -1;
});

canvas.addEventListener("mouseleave", () => {
  isPointerDown = false;
  pointerX = -1;
  pointerY = -1;
});

canvas.addEventListener("touchstart", (e) => {
  isPointerDown = true;
  updatePointer(e);
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (isPointerDown) {
    updatePointer(e);
  }
}, { passive: true });

canvas.addEventListener("touchend", () => {
  isPointerDown = false;
  pointerX = -1;
  pointerY = -1;
});

const STEPS_PER_FRAME = 12;

function render() {
  gl.useProgram(simulationProgram);

  gl.uniform2f(resolutionLocation, width, height);
  gl.uniform1f(timeStepLocation, 1.0);

  if (isPointerDown) {
      gl.uniform2f(mouseLocation, pointerX, pointerY);
  } else {
      gl.uniform2f(mouseLocation, -1.0, -1.0);
  }
  gl.uniform1f(radiusLocation, 20.0);

  // Typical Gray-Scott parameters for interesting patterns
  gl.uniform1f(feedRateLocation, 0.055);
  gl.uniform1f(killRateLocation, 0.062);

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    let tempFbo = fbo0;
    fbo0 = fbo1;
    fbo1 = tempFbo;

    let tempTex = texture0;
    texture0 = texture1;
    texture1 = tempTex;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(renderProgram);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
