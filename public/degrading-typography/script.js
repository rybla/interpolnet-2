
// WebGL context and canvas
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported');
}

// Shaders
const vertexShaderSource = `
    attribute vec2 a_position;
    // attribute float a_size; // Uniform size for now is simpler/faster

    uniform vec2 u_resolution;
    uniform float u_pointSize;

    void main() {
        // Convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;

        // Convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        // Convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = u_pointSize;
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;

// Compile shader helper
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const pointSizeUniformLocation = gl.getUniformLocation(program, "u_pointSize");

const positionBuffer = gl.createBuffer();

// Particle System State
let particles = []; // Array of particle objects
const GRAVITY = 0.5;
const DRAG = 0.95;
const HOVER_THRESHOLD_SPEED = 2.0; // Slightly higher threshold
const TRIGGER_RADIUS = 40;
const PARTICLE_SIZE = 2.0;

// Reusable Typed Arrays for WebGL
let positions = new Float32Array(0);

// Mouse State
let mouse = { x: -1000, y: -1000 };
let lastMouse = { x: -1000, y: -1000 };
let mouseSpeed = 0;

// Text Generation
function createParticlesFromText() {
    const width = canvas.width;
    const height = canvas.height;

    // Create an offscreen canvas
    const textCanvas = document.createElement('canvas');
    textCanvas.width = width;
    textCanvas.height = height;
    const ctx = textCanvas.getContext('2d');

    if (!ctx) return;

    // Background black (transparent effectively)
    ctx.clearRect(0, 0, width, height);

    // Draw Text
    // Adjust font size based on width
    const fontSize = Math.floor(Math.min(width / 10, 120));
    ctx.font = `bold ${fontSize}px "Courier New", monospace`; // Monospace for 'code' feel
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = ["THE WEB", "IS", "FLEETING", "", "DATA DECAYS"];
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight);
    });

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    particles = [];

    // Sample pixels
    const stride = 4; // Increase stride for performance if needed

    for (let y = 0; y < height; y += stride) {
        for (let x = 0; x < width; x += stride) {
            const index = (y * width + x) * 4;
            if (data[index + 3] > 128) {
                particles.push({
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    stable: true
                });
            }
        }
    }

    // Resize buffer arrays
    positions = new Float32Array(particles.length * 2);
}

function resizeCanvas() {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Check if the canvas is not the same size.
    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {

      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      createParticlesFromText();
    }
}

window.addEventListener('resize', resizeCanvas);
// Call resize immediately to init
resizeCanvas();

// Input Handling
window.addEventListener('mousemove', (e) => {
    // Mouse relative to viewport (since canvas is fullscreen)
    const x = e.clientX;
    const y = e.clientY;

    const dx = x - lastMouse.x;
    const dy = y - lastMouse.y;

    mouseSpeed = Math.sqrt(dx*dx + dy*dy);

    lastMouse.x = x;
    lastMouse.y = y;
    mouse.x = x;
    mouse.y = y;
});

// Animation Loop
function loop() {
    // Decay mouse speed
    mouseSpeed *= 0.9;

    // Update physics
    const count = particles.length;
    let activeCount = 0;

    // Pre-calculate squared radius
    const triggerRadiusSq = TRIGGER_RADIUS * TRIGGER_RADIUS;

    for (let i = 0; i < count; i++) {
        const p = particles[i];

        if (p.stable) {
            // Check interaction
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;

            // Optimization: bounding box check before sqrt/sq
            if (Math.abs(dx) < TRIGGER_RADIUS && Math.abs(dy) < TRIGGER_RADIUS) {
                 const distSq = dx*dx + dy*dy;
                 if (distSq < triggerRadiusSq) {
                     if (mouseSpeed < HOVER_THRESHOLD_SPEED) {
                         p.stable = false;
                         p.vx = (Math.random() - 0.5) * 4; // Explode out
                         p.vy = (Math.random() - 0.5) * 4;
                     }
                 }
            }
        } else {
            // Falling physics
            p.vy += GRAVITY;
            p.vx *= DRAG;
            p.x += p.vx;
            p.y += p.vy;

            // If completely off screen, we could stop updating it,
            // but for now simple checks are fine.
        }

        // Fill buffer
        // Only draw if on screen (with margin)
        if (p.x > -50 && p.x < canvas.width + 50 && p.y < canvas.height + 50) {
            positions[activeCount * 2] = p.x;
            positions[activeCount * 2 + 1] = p.y;
            activeCount++;
        }
    }

    // Draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Use subarray to only upload used data
    gl.bufferData(gl.ARRAY_BUFFER, positions.subarray(0, activeCount * 2), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(pointSizeUniformLocation, PARTICLE_SIZE);

    gl.drawArrays(gl.POINTS, 0, activeCount);

    requestAnimationFrame(loop);
}

// Start
requestAnimationFrame(loop);

// Conditional module export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createParticlesFromText,
        particles
    };
}
