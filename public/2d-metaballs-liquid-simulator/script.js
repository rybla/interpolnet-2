/**
 * 2D Metaballs Liquid Simulator
 * Renders metaballs that smoothly merge using WebGL to calculate
 * the overlapping thresholds of their inverse-square distance functions.
 */

const canvas = document.getElementById("metaball-canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  console.error("WebGL not supported, falling back to experimental-webgl");
}

let width, height;

// Resize canvas to fill window
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
}
window.addEventListener("resize", resize);
resize();

// Shader sources
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    // Flip Y to match standard texture coordinates
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;

  // Array of metaball data: x, y, radius, extra (not used here but keeps alignment nice)
  uniform vec4 u_metaballs[20];
  uniform int u_num_metaballs;

  // Background and fluid colors
  const vec3 bg_color = vec3(0.043, 0.059, 0.098); // #0b0f19
  const vec3 liquid_color = vec3(0.0, 1.0, 0.8); // #00ffcc
  const float threshold = 1.0;

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;

    float sum = 0.0;

    // Evaluate inverse-square distance for each metaball
    for (int i = 0; i < 20; i++) {
      if (i >= u_num_metaballs) break;

      vec2 mb_pos = u_metaballs[i].xy;
      float mb_radius = u_metaballs[i].z;

      // Compute distance squared
      float distSq = dot(fragCoord - mb_pos, fragCoord - mb_pos);

      // Inverse-square falloff
      // We scale the radius squared by the distance squared
      sum += (mb_radius * mb_radius) / distSq;
    }

    // Smooth stepping for a nice anti-aliased edge
    float edge = smoothstep(threshold - 0.05, threshold + 0.05, sum);

    // Mix background and liquid colors based on the threshold sum
    vec3 color = mix(bg_color, liquid_color, edge);

    // Add a slight inner glow/specular effect
    if (sum > threshold) {
        float innerDist = smoothstep(threshold, threshold * 2.5, sum);
        color = mix(color, vec3(1.0, 1.0, 1.0), innerDist * 0.4);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Helper to compile shader
function compileShader(gl, type, source) {
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

// Compile shaders
const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Link program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("Program link error:", gl.getProgramInfoLog(program));
}

// Get uniform locations
const u_resolutionLoc = gl.getUniformLocation(program, "u_resolution");
const u_timeLoc = gl.getUniformLocation(program, "u_time");
const u_metaballsLoc = gl.getUniformLocation(program, "u_metaballs");
const u_numMetaballsLoc = gl.getUniformLocation(program, "u_num_metaballs");

// Setup full-screen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ]),
  gl.STATIC_DRAW
);

const a_positionLoc = gl.getAttribLocation(program, "a_position");

// Initialize metaballs
const numMetaballs = 15;
const metaballs = [];
for (let i = 0; i < numMetaballs; i++) {
  metaballs.push({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 4.0,
    vy: (Math.random() - 0.5) * 4.0,
    radius: Math.random() * 40 + 30, // 30 to 70
  });
}

// Float32Array for uploading to uniform
// 4 floats per metaball (x, y, radius, unused)
const metaballsData = new Float32Array(numMetaballs * 4);

let startTime = performance.now();

function render(currentTime) {
  const deltaTime = (currentTime - startTime) * 0.001;
  startTime = currentTime;

  // Update physics
  for (let i = 0; i < numMetaballs; i++) {
    const mb = metaballs[i];

    // Add some passive fluid-like floating motion
    mb.x += mb.vx;
    mb.y += mb.vy;

    // Add subtle gravity towards center
    const cx = width / 2;
    const cy = height / 2;
    const dx = cx - mb.x;
    const dy = cy - mb.y;
    mb.vx += dx * 0.0001;
    mb.vy += dy * 0.0001;

    // Bounce off walls
    if (mb.x - mb.radius < 0 && mb.vx < 0) mb.vx *= -1;
    if (mb.x + mb.radius > width && mb.vx > 0) mb.vx *= -1;
    if (mb.y - mb.radius < 0 && mb.vy < 0) mb.vy *= -1;
    if (mb.y + mb.radius > height && mb.vy > 0) mb.vy *= -1;

    // Pack into flat array
    metaballsData[i * 4 + 0] = mb.x;
    metaballsData[i * 4 + 1] = height - mb.y; // WebGL coordinates (y is up)
    metaballsData[i * 4 + 2] = mb.radius;
    metaballsData[i * 4 + 3] = 0.0;
  }

  // Render
  gl.viewport(0, 0, width, height);
  gl.clearColor(0.043, 0.059, 0.098, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(a_positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(a_positionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(u_resolutionLoc, width, height);
  gl.uniform1f(u_timeLoc, currentTime * 0.001);
  gl.uniform1i(u_numMetaballsLoc, numMetaballs);
  gl.uniform4fv(u_metaballsLoc, metaballsData);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

// Start loop
requestAnimationFrame((time) => {
  startTime = time;
  render(time);
});
