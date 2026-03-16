const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL is not supported by your browser.');
}

const ext = gl.getExtension('OES_texture_float');
if (!ext) {
    alert('OES_texture_float extension is not supported. The simulation requires high-precision float textures.');
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const floatTexParams = {
    format: gl.RGBA,
    type: gl.FLOAT,
    minFilter: gl.NEAREST,
    magFilter: gl.NEAREST,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE
};

function createTexture(width, height, data) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, floatTexParams.format, width, height, 0, floatTexParams.format, floatTexParams.type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, floatTexParams.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, floatTexParams.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, floatTexParams.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, floatTexParams.wrapT);
    return tex;
}

function createFramebuffer(texture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return fb;
}

const simWidth = 256;
const simHeight = 256;

// Initialize data: U = 1, V = 0
const initialData = new Float32Array(simWidth * simHeight * 4);
for (let i = 0; i < simWidth * simHeight; i++) {
    initialData[i * 4] = 1.0;     // U
    initialData[i * 4 + 1] = 0.0; // V
    initialData[i * 4 + 2] = 0.0;
    initialData[i * 4 + 3] = 1.0;

    // Add a seed block of V in the center
    const x = i % simWidth;
    const y = Math.floor(i / simWidth);
    if (x > simWidth / 2 - 10 && x < simWidth / 2 + 10 && y > simHeight / 2 - 10 && y < simHeight / 2 + 10) {
        initialData[i * 4 + 1] = 1.0;
    }
}

let texA = createTexture(simWidth, simHeight, initialData);
let texB = createTexture(simWidth, simHeight, null);

let fbA = createFramebuffer(texA);
let fbB = createFramebuffer(texB);

const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = (a_position + 1.0) / 2.0;
    }
`;

const simFragmentShaderSource = `
    precision highp float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_dt;
    uniform float u_diffU;
    uniform float u_diffV;
    uniform float u_f;
    uniform float u_k;
    uniform vec2 u_mouse;
    uniform float u_brushSize;
    uniform float u_isPainting;

    void main() {
        vec2 uv = v_texCoord;
        vec2 texel = 1.0 / u_resolution;

        // Laplacian using a 3x3 kernel
        vec2 state = texture2D(u_texture, uv).rg;
        vec2 N = texture2D(u_texture, uv + vec2(0.0, texel.y)).rg;
        vec2 S = texture2D(u_texture, uv - vec2(0.0, texel.y)).rg;
        vec2 E = texture2D(u_texture, uv + vec2(texel.x, 0.0)).rg;
        vec2 W = texture2D(u_texture, uv - vec2(texel.x, 0.0)).rg;

        vec2 NE = texture2D(u_texture, uv + vec2(texel.x, texel.y)).rg;
        vec2 NW = texture2D(u_texture, uv + vec2(-texel.x, texel.y)).rg;
        vec2 SE = texture2D(u_texture, uv + vec2(texel.x, -texel.y)).rg;
        vec2 SW = texture2D(u_texture, uv + vec2(-texel.x, -texel.y)).rg;

        vec2 laplacian = N + S + E + W - 4.0 * state + 0.2 * (NE + NW + SE + SW - 4.0 * state);

        float u = state.r;
        float v = state.g;
        float uvv = u * v * v;

        float du = u_diffU * laplacian.r - uvv + u_f * (1.0 - u);
        float dv = u_diffV * laplacian.g + uvv - (u_f + u_k) * v;

        vec2 newState = state + vec2(du, dv) * u_dt;

        // Add chemical food where mouse is painted
        if (u_isPainting > 0.5) {
            float dist = distance(uv * u_resolution, u_mouse * u_resolution);
            if (dist < u_brushSize) {
                newState.g = 0.9;
            }
        }

        gl_FragColor = vec4(clamp(newState, 0.0, 1.0), 0.0, 1.0);
    }
`;

const renderFragmentShaderSource = `
    precision highp float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;

    void main() {
        vec2 state = texture2D(u_texture, v_texCoord).rg;

        // Map concentration to a distinct color scheme
        // Using smoothstep to enhance contrast
        float val = smoothstep(0.1, 0.5, state.g);

        vec3 colorBg = vec3(0.1, 0.1, 0.1); // #1a1a1a
        vec3 colorAccent = vec3(0.0, 1.0, 0.8); // #00ffcc
        vec3 colorWhite = vec3(0.94, 0.94, 0.94); // #f0f0f0

        vec3 col = mix(colorBg, colorAccent, val);
        col = mix(col, colorWhite, smoothstep(0.4, 0.9, state.g));

        gl_FragColor = vec4(col, 1.0);
    }
`;

function createShader(type, source) {
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

function createProgram(vertexSource, fragmentSource) {
    const vs = createShader(gl.VERTEX_SHADER, vertexSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

const simProgram = createProgram(vertexShaderSource, simFragmentShaderSource);
const renderProgram = createProgram(vertexShaderSource, renderFragmentShaderSource);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
]), gl.STATIC_DRAW);

// Sim Uniforms
const simLocs = {
    position: gl.getAttribLocation(simProgram, 'a_position'),
    texture: gl.getUniformLocation(simProgram, 'u_texture'),
    resolution: gl.getUniformLocation(simProgram, 'u_resolution'),
    dt: gl.getUniformLocation(simProgram, 'u_dt'),
    diffU: gl.getUniformLocation(simProgram, 'u_diffU'),
    diffV: gl.getUniformLocation(simProgram, 'u_diffV'),
    f: gl.getUniformLocation(simProgram, 'u_f'),
    k: gl.getUniformLocation(simProgram, 'u_k'),
    mouse: gl.getUniformLocation(simProgram, 'u_mouse'),
    brushSize: gl.getUniformLocation(simProgram, 'u_brushSize'),
    isPainting: gl.getUniformLocation(simProgram, 'u_isPainting')
};

// Render Uniforms
const renderLocs = {
    position: gl.getAttribLocation(renderProgram, 'a_position'),
    texture: gl.getUniformLocation(renderProgram, 'u_texture')
};

let mouseX = 0;
let mouseY = 0;
let isPainting = false;

function updateMouse(e) {
    if (e.touches && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    updateMouse(e);
});
canvas.addEventListener('mousemove', (e) => {
    if (isPainting) updateMouse(e);
});
canvas.addEventListener('mouseup', () => isPainting = false);
canvas.addEventListener('mouseleave', () => isPainting = false);

canvas.addEventListener('touchstart', (e) => {
    isPainting = true;
    updateMouse(e);
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
    if (isPainting) updateMouse(e);
}, { passive: true });
canvas.addEventListener('touchend', () => isPainting = false);

function render() {
    // 1. Simulation step (ping-pong)
    gl.useProgram(simProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(simLocs.position);
    gl.vertexAttribPointer(simLocs.position, 2, gl.FLOAT, false, 0, 0);

    // Perform multiple simulation steps per frame for faster pattern growth
    for (let i = 0; i < 8; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
        gl.viewport(0, 0, simWidth, simHeight);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texA);
        gl.uniform1i(simLocs.texture, 0);

        gl.uniform2f(simLocs.resolution, simWidth, simHeight);
        gl.uniform1f(simLocs.dt, 1.0);
        gl.uniform1f(simLocs.diffU, 0.2097); // Standard diffusion for U
        gl.uniform1f(simLocs.diffV, 0.105);  // Standard diffusion for V
        gl.uniform1f(simLocs.f, 0.055);      // Feed rate (mitosis pattern)
        gl.uniform1f(simLocs.k, 0.062);      // Kill rate

        gl.uniform2f(simLocs.mouse, mouseX / canvas.width, 1.0 - mouseY / canvas.height); // Flip Y
        gl.uniform1f(simLocs.brushSize, 10.0);
        gl.uniform1f(simLocs.isPainting, isPainting ? 1.0 : 0.0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Swap textures and framebuffers
        let tempTex = texA;
        texA = texB;
        texB = tempTex;

        let tempFb = fbA;
        fbA = fbB;
        fbB = tempFb;
    }

    // 2. Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(renderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(renderLocs.position);
    gl.vertexAttribPointer(renderLocs.position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(renderLocs.texture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

render();
