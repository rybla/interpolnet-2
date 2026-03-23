// WebGL Gray-Scott Reaction-Diffusion Model

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL is not supported by your browser.");
}

// Ensure the floating point texture extension is available
const ext = gl.getExtension("OES_texture_float");
if (!ext) {
  alert("OES_texture_float extension is not supported by your browser. The demo may not work.");
}

// Adjust simulation resolution for performance
const SIM_RESOLUTION = 512;
let texWidth = SIM_RESOLUTION;
let texHeight = SIM_RESOLUTION;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Calculate texture size keeping aspect ratio but capped at SIM_RESOLUTION
  const aspect = canvas.width / canvas.height;
  if (aspect > 1) {
    texWidth = SIM_RESOLUTION;
    texHeight = Math.floor(SIM_RESOLUTION / aspect);
  } else {
    texHeight = SIM_RESOLUTION;
    texWidth = Math.floor(SIM_RESOLUTION * aspect);
  }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// --- Shaders ---

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    // Convert from clip space (-1 to +1) to texture space (0 to +1)
    v_texCoord = a_position * 0.5 + 0.5;
  }
`;

// Reaction-Diffusion Simulation Shader
const simFragmentShaderSource = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_state;
  uniform vec2 u_resolution; // The size of the texture
  uniform vec2 u_mouse;      // Normalized mouse coordinates
  uniform float u_brushSize; // Brush radius
  uniform float u_brushActive; // 1.0 if painting, 0.0 otherwise

  // Gray-Scott parameters
  const float dA = 1.0;
  const float dB = 0.5;
  const float feed = 0.055;
  const float kill = 0.062;
  const float dt = 1.0;

  void main() {
    vec2 pos = v_texCoord;
    vec2 step = 1.0 / u_resolution;

    // Read current cell and 8 neighbors
    vec2 state = texture2D(u_state, pos).rg;

    // Laplacian 3x3 kernel approximation
    //  0.05  0.2  0.05
    //   0.2 -1.0  0.2
    //  0.05  0.2  0.05
    vec2 laplacian =
      texture2D(u_state, pos + vec2(-step.x, -step.y)).rg * 0.05 +
      texture2D(u_state, pos + vec2(0.0, -step.y)).rg * 0.2 +
      texture2D(u_state, pos + vec2(step.x, -step.y)).rg * 0.05 +
      texture2D(u_state, pos + vec2(-step.x, 0.0)).rg * 0.2 +
      texture2D(u_state, pos + vec2(step.x, 0.0)).rg * 0.2 +
      texture2D(u_state, pos + vec2(-step.x, step.y)).rg * 0.05 +
      texture2D(u_state, pos + vec2(0.0, step.y)).rg * 0.2 +
      texture2D(u_state, pos + vec2(step.x, step.y)).rg * 0.05 -
      state * 1.0;

    float A = state.r;
    float B = state.g;

    float reaction = A * B * B;

    float nextA = A + (dA * laplacian.r - reaction + feed * (1.0 - A)) * dt;
    float nextB = B + (dB * laplacian.g + reaction - (kill + feed) * B) * dt;

    // Add chemical "food" (B) if the mouse is pressed and nearby
    if (u_brushActive > 0.0) {
      // Fix aspect ratio when calculating distance
      vec2 diff = pos - u_mouse;
      diff.x *= u_resolution.x / u_resolution.y;
      float dist = length(diff);
      if (dist < u_brushSize) {
        nextB = 0.9;
      }
    }

    // Clamp to valid range to prevent instability blowing up visually
    gl_FragColor = vec4(clamp(nextA, 0.0, 1.0), clamp(nextB, 0.0, 1.0), 0.0, 1.0);
  }
`;

// Display Shader: Maps concentrations to distinct colors
const renderFragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_state;

  void main() {
    vec2 state = texture2D(u_state, v_texCoord).rg;
    float B = state.g;

    // Map chemical B concentration to a vivid color palette
    // Background is deep violet/black, patterns are bright cyan/green
    vec3 color = vec3(0.043, 0.059, 0.098); // --bg-color approx: rgb(11, 15, 25)

    // Adding some neon cyan where B is high
    vec3 neon = vec3(0.0, 1.0, 0.8); // --primary-color approx: #00ffcc

    // Smoothstep to make edges sharper
    float intensity = smoothstep(0.1, 0.4, B);

    gl_FragColor = vec4(mix(color, neon, intensity), 1.0);
  }
`;

// --- WebGL Setup Helpers ---

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vsSource, fsSource) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Error linking program:", gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

const simProgram = createProgram(vertexShaderSource, simFragmentShaderSource);
const renderProgram = createProgram(vertexShaderSource, renderFragmentShaderSource);

// --- Geometry Setup ---
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

const posLocSim = gl.getAttribLocation(simProgram, "a_position");
const posLocRender = gl.getAttribLocation(renderProgram, "a_position");

// --- Texture and Framebuffer Setup ---

function createTexture() {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Initial state: A=1, B=0 everywhere
  const initialState = new Float32Array(texWidth * texHeight * 4);
  for (let i = 0; i < texWidth * texHeight * 4; i += 4) {
    initialState[i] = 1.0;     // A
    initialState[i + 1] = 0.0; // B
    initialState[i + 2] = 0.0;
    initialState[i + 3] = 1.0;
  }

  // Seed the center with chemical B
  const cx = Math.floor(texWidth / 2);
  const cy = Math.floor(texHeight / 2);
  const radius = 10;
  for (let y = cy - radius; y < cy + radius; y++) {
    for (let x = cx - radius; x < cx + radius; x++) {
      if ((x-cx)*(x-cx) + (y-cy)*(y-cy) < radius*radius) {
        const idx = (y * texWidth + x) * 4;
        initialState[idx + 1] = 1.0; // B
      }
    }
  }

  // Use gl.FLOAT since we requested OES_texture_float
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.FLOAT, initialState);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createFramebuffer(texture) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return fb;
}

let texA = createTexture();
let fbA = createFramebuffer(texA);

let texB = createTexture();
let fbB = createFramebuffer(texB);

// --- Interaction ---
let mouseX = 0;
let mouseY = 0;
let isPointerActive = false;

function updatePointer(e) {
  // Normalize coordinates to 0.0 -> 1.0, mapping to texture space
  // Flip Y axis because WebGL texture Y is bottom-to-top
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  mouseX = (clientX - rect.left) / rect.width;
  mouseY = 1.0 - ((clientY - rect.top) / rect.height);
}

canvas.addEventListener("pointerdown", (e) => {
  isPointerActive = true;
  updatePointer(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (isPointerActive) {
    updatePointer(e);
  }
});

canvas.addEventListener("pointerup", () => {
  isPointerActive = false;
});
canvas.addEventListener("pointerleave", () => {
  isPointerActive = false;
});
// Touch specific events to prevent default behaviors
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  isPointerActive = true;
  updatePointer(e);
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (isPointerActive) updatePointer(e);
}, { passive: false });
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  isPointerActive = false;
}, { passive: false });

// --- Render Loop ---

const simStepsPerFrame = 15; // Run multiple simulation steps per frame for speed

const uResLoc = gl.getUniformLocation(simProgram, "u_resolution");
const uMouseLoc = gl.getUniformLocation(simProgram, "u_mouse");
const uBrushSizeLoc = gl.getUniformLocation(simProgram, "u_brushSize");
const uBrushActiveLoc = gl.getUniformLocation(simProgram, "u_brushActive");
const uStateSimLoc = gl.getUniformLocation(simProgram, "u_state");

const uStateRenderLoc = gl.getUniformLocation(renderProgram, "u_state");

function render() {

  // 1. Simulation Pass
  gl.useProgram(simProgram);
  gl.viewport(0, 0, texWidth, texHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLocSim);
  gl.vertexAttribPointer(posLocSim, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(uResLoc, texWidth, texHeight);
  gl.uniform2f(uMouseLoc, mouseX, mouseY);
  gl.uniform1f(uBrushSizeLoc, 0.02); // 2% of the screen
  gl.uniform1f(uBrushActiveLoc, isPointerActive ? 1.0 : 0.0);
  gl.uniform1i(uStateSimLoc, 0);

  for (let i = 0; i < simStepsPerFrame; i++) {
    // Read from texA, write to fbB
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap: Read from texB, write to fbA
    let tempTex = texA;
    texA = texB;
    texB = tempTex;

    let tempFb = fbA;
    fbA = fbB;
    fbB = tempFb;

    // Disable brush after first step so we don't apply it 15 times a frame instantly blowing up the chemical
    if (i === 0) {
      gl.uniform1f(uBrushActiveLoc, 0.0);
    }
  }

  // 2. Render Pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Render to canvas
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(renderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLocRender);
  gl.vertexAttribPointer(posLocRender, 2, gl.FLOAT, false, 0, 0);

  // Use the output texture of the final simulation step (which is now texA because of the swap)
  gl.bindTexture(gl.TEXTURE_2D, texA);
  gl.uniform1i(uStateRenderLoc, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

render();
