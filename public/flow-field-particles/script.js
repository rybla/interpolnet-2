const canvas = document.getElementById('flow-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let width, height;
let cols, rows;
const resolution = 30; // size of each flow field grid cell
let flowfield = [];

// Array of particles
let particles = [];
const numParticles = 4000;

let zoff = 0; // time axis for noise

// A simple deterministic pseudo-random number generator
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Basic implementation of a value noise function (using pseudo-randoms)
const random = mulberry32(12345);

const P = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  P[i] = Math.floor(random() * 256);
}
const p = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  p[i] = P[i % 256];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
  return a + t * (b - a);
}

function grad(hash, x, y, z) {
  let h = hash & 15;
  let u = h < 8 ? x : y;
  let v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

function perlinNoise3D(x, y, z) {
  let X = Math.floor(x) & 255;
  let Y = Math.floor(y) & 255;
  let Z = Math.floor(z) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  let u = fade(x);
  let v = fade(y);
  let w = fade(z);

  let A = p[X] + Y;
  let AA = p[A] + Z;
  let AB = p[A + 1] + Z;
  let B = p[X + 1] + Y;
  let BA = p[B] + Z;
  let BB = p[B + 1] + Z;

  return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
    grad(p[BA], x - 1, y, z)),
    lerp(u, grad(p[AB], x, y - 1, z),
      grad(p[BB], x - 1, y - 1, z))),
    lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1),
      grad(p[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
        grad(p[BB + 1], x - 1, y - 1, z - 1))));
}


class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 2 + Math.random() * 2;
    // Slight color variation (cyan to magenta)
    this.color = `hsl(${180 + Math.random() * 120}, 100%, 60%)`;
  }

  update() {
    let col = Math.floor(this.x / resolution);
    let row = Math.floor(this.y / resolution);

    // Keep col/row within bounds
    col = Math.max(0, Math.min(col, cols - 1));
    row = Math.max(0, Math.min(row, rows - 1));

    let index = col + row * cols;
    let angle = flowfield[index];

    // Apply force (vector) from the field
    let ax = Math.cos(angle) * 0.1;
    let ay = Math.sin(angle) * 0.1;

    this.vx += ax;
    this.vy += ay;

    // Limit speed
    let speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > this.maxSpeed * this.maxSpeed) {
      let speed = Math.sqrt(speedSq);
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Wrap around screen
    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;
    if (this.y > height) this.y = 0;
    if (this.y < 0) this.y = height;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  cols = Math.ceil(width / resolution);
  rows = Math.ceil(height / resolution);
  flowfield = new Array(cols * rows);

  // Redraw initial background fully on resize
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, width, height);

  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}

window.addEventListener('resize', resize);
resize();


function drawVector(x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // subtle vector color
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(size, 0);
  ctx.lineTo(size - 3, -3);
  ctx.moveTo(size, 0);
  ctx.lineTo(size - 3, 3);
  ctx.stroke();
  ctx.restore();
}

function animate() {
  requestAnimationFrame(animate);

  // Fade out effect to create trails
  ctx.fillStyle = 'rgba(11, 15, 25, 0.05)';
  ctx.fillRect(0, 0, width, height);

  let yoff = 0;
  let noiseScale = 0.05;

  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;

      // Generate noise value and map it to an angle
      let n = perlinNoise3D(xoff, yoff, zoff);
      // Map [-1, 1] to angle. Multiplying by PI*4 makes it swirl more.
      let angle = (n + 1) * Math.PI * 2;

      flowfield[index] = angle;
      xoff += noiseScale;

      // Draw the underlying vectors
      // We'll draw them slightly transparent so they form a background grid
      drawVector(x * resolution + resolution/2, y * resolution + resolution/2, angle, resolution * 0.8);
    }
    yoff += noiseScale;
  }
  zoff += 0.005; // Advance time to morph field

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }
}

animate();
