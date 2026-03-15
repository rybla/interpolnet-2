const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert("WebGL not supported in this browser.");
}

// Ensure float textures are supported
const ext = gl.getExtension('OES_texture_float');
if (!ext) {
    alert("WebGL OES_texture_float extension not supported. The simulation will not work correctly.");
}

// Shader sources
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
    varying vec2 v_texCoord;
    uniform sampler2D u_state;
    uniform vec2 u_resolution;

    uniform float u_dA;
    uniform float u_dB;
    uniform float u_feed;
    uniform float u_kill;
    uniform float u_dt;

    uniform vec2 u_brushPos;
    uniform float u_brushSize;
    uniform float u_isBrushing;

    void main() {
        vec2 uv = v_texCoord;
        vec2 pixel = 1.0 / u_resolution;

        vec4 center = texture2D(u_state, uv);
        float a = center.r;
        float b = center.g;

        // Laplacian
        float sumA = -a;
        float sumB = -b;

        sumA += texture2D(u_state, uv + vec2(-pixel.x, 0.0)).r * 0.2;
        sumA += texture2D(u_state, uv + vec2(pixel.x, 0.0)).r * 0.2;
        sumA += texture2D(u_state, uv + vec2(0.0, -pixel.y)).r * 0.2;
        sumA += texture2D(u_state, uv + vec2(0.0, pixel.y)).r * 0.2;

        sumA += texture2D(u_state, uv + vec2(-pixel.x, -pixel.y)).r * 0.05;
        sumA += texture2D(u_state, uv + vec2(pixel.x, -pixel.y)).r * 0.05;
        sumA += texture2D(u_state, uv + vec2(-pixel.x, pixel.y)).r * 0.05;
        sumA += texture2D(u_state, uv + vec2(pixel.x, pixel.y)).r * 0.05;

        sumB += texture2D(u_state, uv + vec2(-pixel.x, 0.0)).g * 0.2;
        sumB += texture2D(u_state, uv + vec2(pixel.x, 0.0)).g * 0.2;
        sumB += texture2D(u_state, uv + vec2(0.0, -pixel.y)).g * 0.2;
        sumB += texture2D(u_state, uv + vec2(0.0, pixel.y)).g * 0.2;

        sumB += texture2D(u_state, uv + vec2(-pixel.x, -pixel.y)).g * 0.05;
        sumB += texture2D(u_state, uv + vec2(pixel.x, -pixel.y)).g * 0.05;
        sumB += texture2D(u_state, uv + vec2(-pixel.x, pixel.y)).g * 0.05;
        sumB += texture2D(u_state, uv + vec2(pixel.x, pixel.y)).g * 0.05;

        float reaction = a * b * b;

        float newA = a + (u_dA * sumA - reaction + u_feed * (1.0 - a)) * u_dt;
        float newB = b + (u_dB * sumB + reaction - (u_kill + u_feed) * b) * u_dt;

        // Brush
        if (u_isBrushing > 0.5) {
            vec2 d = (uv - u_brushPos) * u_resolution;
            if (length(d) < u_brushSize) {
                newB = 0.9;
            }
        }

        gl_FragColor = vec4(clamp(newA, 0.0, 1.0), clamp(newB, 0.0, 1.0), 0.0, 1.0);
    }
`;

const renderFragmentShaderSource = `
    precision highp float;
    varying vec2 v_texCoord;
    uniform sampler2D u_state;

    // Color mapping
    vec3 getColor(float v) {
        vec3 color1 = vec3(0.0, 0.0, 0.0);       // Black
        vec3 color2 = vec3(0.0, 0.5, 0.4);       // Teal
        vec3 color3 = vec3(0.0, 1.0, 0.8);       // Bright Cyan
        vec3 color4 = vec3(1.0, 1.0, 1.0);       // White

        if (v < 0.2) return mix(color1, color2, v / 0.2);
        if (v < 0.5) return mix(color2, color3, (v - 0.2) / 0.3);
        return mix(color3, color4, (v - 0.5) / 0.5);
    }

    void main() {
        vec4 state = texture2D(u_state, v_texCoord);
        float b = state.g;
        gl_FragColor = vec4(getColor(b), 1.0);
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
        return null;
    }
    return program;
}

// Compile shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const simFragShader = createShader(gl, gl.FRAGMENT_SHADER, simulationFragmentShaderSource);
const renderFragShader = createShader(gl, gl.FRAGMENT_SHADER, renderFragmentShaderSource);

const simProgram = createProgram(gl, vertexShader, simFragShader);
const renderProgram = createProgram(gl, vertexShader, renderFragShader);

// Buffer
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

let width, height;
let fboA, fboB, texA, texB;

function createTexture() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Use RGBA FLOAT for the required high precision of reaction-diffusion
    const data = new Float32Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        data[i * 4] = 1.0;     // A
        data[i * 4 + 1] = 0.0; // B
        data[i * 4 + 2] = 0.0;
        data[i * 4 + 3] = 1.0;
    }

    // Seed center
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const radius = 10;
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = (y * width + x) * 4;
                data[idx + 1] = 1.0;
            }
        }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
    return tex;
}

function createFramebuffer(tex) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fbo;
}

function resize() {
    const container = document.getElementById('canvas-container');
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        // Use a power of two for better performance or just actual size
        // We'll use a fixed internal resolution for stable simulation speed
        width = 512;
        height = 512;

        gl.viewport(0, 0, width, height);

        if (texA) gl.deleteTexture(texA);
        if (texB) gl.deleteTexture(texB);
        if (fboA) gl.deleteFramebuffer(fboA);
        if (fboB) gl.deleteFramebuffer(fboB);

        texA = createTexture();
        texB = createTexture();
        fboA = createFramebuffer(texA);
        fboB = createFramebuffer(texB);
    }
}

window.addEventListener('resize', resize);
resize();

// Parameters
const params = {
    feed: 0.055,
    kill: 0.062,
    dA: 1.0,
    dB: 0.5,
    brushSize: 10,
    isBrushing: 0,
    brushPos: [0, 0],
    stepsPerFrame: 8,
    dt: 1.0
};

// UI Elements
const feedInput = document.getElementById('feed-rate');
const killInput = document.getElementById('kill-rate');
const diffAInput = document.getElementById('diff-a');
const diffBInput = document.getElementById('diff-b');
const brushSizeInput = document.getElementById('brush-size');

const feedVal = document.getElementById('feed-val');
const killVal = document.getElementById('kill-val');
const diffAVal = document.getElementById('diff-a-val');
const diffBVal = document.getElementById('diff-b-val');
const brushSizeVal = document.getElementById('brush-size-val');

function updateParams() {
    params.feed = parseFloat(feedInput.value);
    params.kill = parseFloat(killInput.value);
    params.dA = parseFloat(diffAInput.value);
    params.dB = parseFloat(diffBInput.value);
    params.brushSize = parseFloat(brushSizeInput.value);

    feedVal.textContent = params.feed.toFixed(4);
    killVal.textContent = params.kill.toFixed(4);
    diffAVal.textContent = params.dA.toFixed(2);
    diffBVal.textContent = params.dB.toFixed(2);
    brushSizeVal.textContent = params.brushSize;
}

[feedInput, killInput, diffAInput, diffBInput, brushSizeInput].forEach(el => {
    el.addEventListener('input', updateParams);
});

// Presets
const presets = {
    coral: { feed: 0.0545, kill: 0.0620 },
    mitosis: { feed: 0.0360, kill: 0.0650 },
    maze: { feed: 0.0290, kill: 0.0570 },
    spots: { feed: 0.0180, kill: 0.0510 }
};

document.getElementById('preset-coral').addEventListener('click', () => applyPreset('coral'));
document.getElementById('preset-mitosis').addEventListener('click', () => applyPreset('mitosis'));
document.getElementById('preset-maze').addEventListener('click', () => applyPreset('maze'));
document.getElementById('preset-spots').addEventListener('click', () => applyPreset('spots'));
document.getElementById('preset-clear').addEventListener('click', () => {
    if (texA) gl.deleteTexture(texA);
    if (fboA) gl.deleteFramebuffer(fboA);
    texA = createTexture(); // Recreate texture to clear
    fboA = createFramebuffer(texA);
});

function applyPreset(name) {
    const p = presets[name];
    feedInput.value = p.feed;
    killInput.value = p.kill;
    updateParams();
}

// Interaction
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Map to 0-1 range
    const x = (clientX - rect.left) / rect.width;
    const y = 1.0 - (clientY - rect.top) / rect.height; // Flip Y for WebGL
    return [x, y];
}

function pointerDown(e) {
    params.isBrushing = 1.0;
    params.brushPos = getPointerPos(e);
}

function pointerMove(e) {
    if (params.isBrushing) {
        params.brushPos = getPointerPos(e);
    }
}

function pointerUp() {
    params.isBrushing = 0.0;
}

canvas.addEventListener('mousedown', pointerDown);
canvas.addEventListener('mousemove', pointerMove);
window.addEventListener('mouseup', pointerUp);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); pointerDown(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerMove(e); }, { passive: false });
window.addEventListener('touchend', pointerUp);

// Simulation Uniforms
const simUniforms = {
    u_state: gl.getUniformLocation(simProgram, "u_state"),
    u_resolution: gl.getUniformLocation(simProgram, "u_resolution"),
    u_dA: gl.getUniformLocation(simProgram, "u_dA"),
    u_dB: gl.getUniformLocation(simProgram, "u_dB"),
    u_feed: gl.getUniformLocation(simProgram, "u_feed"),
    u_kill: gl.getUniformLocation(simProgram, "u_kill"),
    u_dt: gl.getUniformLocation(simProgram, "u_dt"),
    u_brushPos: gl.getUniformLocation(simProgram, "u_brushPos"),
    u_brushSize: gl.getUniformLocation(simProgram, "u_brushSize"),
    u_isBrushing: gl.getUniformLocation(simProgram, "u_isBrushing")
};

// Render Uniforms
const renderUniforms = {
    u_state: gl.getUniformLocation(renderProgram, "u_state")
};

function render() {
    // 1. Simulate step
    gl.useProgram(simProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const a_position = gl.getAttribLocation(simProgram, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, width, height);

    gl.uniform2f(simUniforms.u_resolution, width, height);
    gl.uniform1f(simUniforms.u_dA, params.dA);
    gl.uniform1f(simUniforms.u_dB, params.dB);
    gl.uniform1f(simUniforms.u_feed, params.feed);
    gl.uniform1f(simUniforms.u_kill, params.kill);
    gl.uniform1f(simUniforms.u_dt, params.dt);
    gl.uniform2f(simUniforms.u_brushPos, params.brushPos[0], params.brushPos[1]);
    gl.uniform1f(simUniforms.u_brushSize, params.brushSize);
    gl.uniform1f(simUniforms.u_isBrushing, params.isBrushing);

    for (let i = 0; i < params.stepsPerFrame; i++) {
        // Read from A, write to B
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texA);
        gl.uniform1i(simUniforms.u_state, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Swap A and B
        let tempTex = texA; texA = texB; texB = tempTex;
        let tempFbo = fboA; fboA = fboB; fboB = tempFbo;
    }

    // 2. Render to screen
    gl.useProgram(renderProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA); // Final state is in A after swap
    gl.uniform1i(renderUniforms.u_state, 0);

    const r_position = gl.getAttribLocation(renderProgram, "a_position");
    gl.enableVertexAttribArray(r_position);
    gl.vertexAttribPointer(r_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
