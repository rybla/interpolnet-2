// Orbital Mechanics Sandbox
const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnPause = document.getElementById('btn-pause');
const chkTrails = document.getElementById('chk-trails');
const sliderSpeed = document.getElementById('slider-speed');
const speedDisplay = document.getElementById('speed-display');
const sliderMass = document.getElementById('slider-mass');
const massDisplay = document.getElementById('mass-display');
const bodyCountDisplay = document.getElementById('body-count');

let width, height;
let bodies = [];
let isPaused = false;
let simSpeed = 1.0;
let showTrails = true;
let flingMass = 50;

// Physics constants
const G = 0.5; // Gravitational constant (scaled for visual effect)
const SOFTENING = 5.0; // Softening parameter to avoid infinite forces at distance=0
const THETA = 0.5; // Barnes-Hut accuracy threshold (0 = exact O(n^2), larger = less accurate, faster)
const TRAIL_LENGTH = 50;

// Drag state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let currentMouseX = 0;
let currentMouseY = 0;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Body {
  constructor(x, y, vx, vy, mass) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.mass = mass;
    this.radius = Math.max(2, Math.pow(mass, 0.333) * 1.5); // Radius proportional to cube root of mass
    this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    this.history = [];
    this.isDead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (showTrails) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > TRAIL_LENGTH) {
        this.history.shift();
      }
    } else {
      this.history = [];
    }
  }

  draw(ctx) {
    if (showTrails && this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// Barnes-Hut QuadTree Implementation
class Quad {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  contains(body) {
    return body.x >= this.x && body.x < this.x + this.size &&
           body.y >= this.y && body.y < this.y + this.size;
  }
}

class BHTreeNode {
  constructor(quad) {
    this.quad = quad;
    this.body = null;
    this.mass = 0;
    this.cmX = 0;
    this.cmY = 0;

    this.nw = null;
    this.ne = null;
    this.sw = null;
    this.se = null;
  }

  insert(body) {
    if (this.body === null && this.nw === null) {
      // Empty leaf
      this.body = body;
      this.mass = body.mass;
      this.cmX = body.x;
      this.cmY = body.y;
      return;
    }

    if (this.nw === null) {
      // Internal node without children (has a body). Subdivide and re-insert.

      // If bodies are exactly coincident, perturb slightly to avoid infinite recursion
      if (body.x === this.body.x && body.y === this.body.y) {
          body.x += (Math.random() - 0.5) * 0.01;
          body.y += (Math.random() - 0.5) * 0.01;
      }

      this.subdivide();
      this.insertIntoChildren(this.body);
      this.body = null; // No longer a leaf node
    }

    // Insert new body
    this.insertIntoChildren(body);

    // Update center of mass
    const totalMass = this.mass + body.mass;
    this.cmX = (this.cmX * this.mass + body.x * body.mass) / totalMass;
    this.cmY = (this.cmY * this.mass + body.y * body.mass) / totalMass;
    this.mass = totalMass;
  }

  subdivide() {
    const halfSize = this.quad.size / 2;
    this.nw = new BHTreeNode(new Quad(this.quad.x, this.quad.y, halfSize));
    this.ne = new BHTreeNode(new Quad(this.quad.x + halfSize, this.quad.y, halfSize));
    this.sw = new BHTreeNode(new Quad(this.quad.x, this.quad.y + halfSize, halfSize));
    this.se = new BHTreeNode(new Quad(this.quad.x + halfSize, this.quad.y + halfSize, halfSize));
  }

  insertIntoChildren(body) {
    if (this.nw.quad.contains(body)) this.nw.insert(body);
    else if (this.ne.quad.contains(body)) this.ne.insert(body);
    else if (this.sw.quad.contains(body)) this.sw.insert(body);
    else if (this.se.quad.contains(body)) this.se.insert(body);
  }

  calculateForceOn(body) {
    // Return empty force vector if node is empty
    if (this.mass === 0 || this.body === body) {
      return { fx: 0, fy: 0 };
    }

    const dx = this.cmX - body.x;
    const dy = this.cmY - body.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    // If node is a leaf (contains exactly one body) or is far enough away
    if (this.nw === null || (this.quad.size / dist) < THETA) {
      // Calculate force
      const forceMag = (G * this.mass * body.mass) / (distSq + SOFTENING * SOFTENING);
      return {
        fx: forceMag * (dx / dist),
        fy: forceMag * (dy / dist)
      };
    }

    // Internal node and close: calculate recursively
    let fx = 0;
    let fy = 0;

    if (this.nw !== null) {
      const fnw = this.nw.calculateForceOn(body);
      const fne = this.ne.calculateForceOn(body);
      const fsw = this.sw.calculateForceOn(body);
      const fse = this.se.calculateForceOn(body);

      fx = fnw.fx + fne.fx + fsw.fx + fse.fx;
      fy = fnw.fy + fne.fy + fsw.fy + fse.fy;
    }

    return { fx, fy };
  }
}

// Initial Setup
function createSolarSystem() {
  bodies = [];
  // Central star
  bodies.push(new Body(width / 2, height / 2, 0, 0, 2000));

  // Planets
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * (Math.min(width, height) / 2 - 50);
    // Circular orbit velocity approximation: v = sqrt(G*M/r)
    const speed = Math.sqrt((G * 2000) / dist);

    const x = width / 2 + Math.cos(angle) * dist;
    const y = height / 2 + Math.sin(angle) * dist;
    const vx = -Math.sin(angle) * speed;
    const vy = Math.cos(angle) * speed;

    bodies.push(new Body(x, y, vx, vy, 5 + Math.random() * 20));
  }
}

createSolarSystem();

// Physics Update
function updatePhysics(dt) {
  if (bodies.length === 0) return;

  // Find bounding box for QuadTree
  let minX = bodies[0].x;
  let minY = bodies[0].y;
  let maxX = bodies[0].x;
  let maxY = bodies[0].y;

  for (let i = 1; i < bodies.length; i++) {
    if (bodies[i].x < minX) minX = bodies[i].x;
    if (bodies[i].y < minY) minY = bodies[i].y;
    if (bodies[i].x > maxX) maxX = bodies[i].x;
    if (bodies[i].y > maxY) maxY = bodies[i].y;
  }

  // Make bounding box square and add some padding
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  let size = Math.max(sizeX, sizeY);
  size = Math.max(size, 1); // Prevent 0 size
  const pad = size * 0.1;
  const rootQuad = new Quad(minX - pad, minY - pad, size + pad * 2);

  // Build QuadTree
  const root = new BHTreeNode(rootQuad);
  for (const body of bodies) {
    if (!body.isDead) root.insert(body);
  }

  // Calculate forces and update velocities
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if (body.isDead) continue;

    const force = root.calculateForceOn(body);
    const ax = force.fx / body.mass;
    const ay = force.fy / body.mass;

    body.vx += ax * dt;
    body.vy += ay * dt;
  }

  // Update positions and handle simple collisions/merging
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].isDead) continue;
    bodies[i].update(dt);

    // Boundary reflection (optional, keeping it open space is also fine)
    // Uncomment for a closed box sandbox:
    /*
    if (bodies[i].x < 0 || bodies[i].x > width) bodies[i].vx *= -1;
    if (bodies[i].y < 0 || bodies[i].y > height) bodies[i].vy *= -1;
    */
  }

  // Basic inelastic collisions (merging) - naive O(n^2) for close encounters
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].isDead) continue;
    for (let j = i + 1; j < bodies.length; j++) {
      if (bodies[j].isDead) continue;

      const dx = bodies[i].x - bodies[j].x;
      const dy = bodies[i].y - bodies[j].y;
      const distSq = dx*dx + dy*dy;
      const minDist = bodies[i].radius + bodies[j].radius;

      if (distSq < minDist * minDist) {
        // Merge bodies (conservation of momentum)
        const newMass = bodies[i].mass + bodies[j].mass;
        const newVx = (bodies[i].vx * bodies[i].mass + bodies[j].vx * bodies[j].mass) / newMass;
        const newVy = (bodies[i].vy * bodies[i].mass + bodies[j].vy * bodies[j].mass) / newMass;

        // Bigger body absorbs smaller
        if (bodies[i].mass > bodies[j].mass) {
          bodies[i].mass = newMass;
          bodies[i].vx = newVx;
          bodies[i].vy = newVy;
          bodies[i].radius = Math.max(2, Math.pow(newMass, 0.333) * 1.5);
          bodies[j].isDead = true;
        } else {
          bodies[j].mass = newMass;
          bodies[j].vx = newVx;
          bodies[j].vy = newVy;
          bodies[j].radius = Math.max(2, Math.pow(newMass, 0.333) * 1.5);
          bodies[i].isDead = true;
        }
      }
    }
  }

  // Remove dead bodies
  bodies = bodies.filter(b => !b.isDead);
  bodyCountDisplay.innerText = bodies.length;
}

// Render Loop
let lastTime = 0;
let timeAccumulator = 0;

function animate(time) {
  requestAnimationFrame(animate);

  let dt = (time - lastTime) / 1000;
  // Cap dt to prevent massive jumps if tab is inactive
  if (dt > 0.1) dt = 0.1;
  lastTime = time;

  // Use fixed time steps for more stable physics integration
  const fixedDt = 0.016;

  if (!isPaused) {
    timeAccumulator += dt * simSpeed;
    while (timeAccumulator >= fixedDt) {
        updatePhysics(fixedDt);
        timeAccumulator -= fixedDt;
    }
  }

  // Draw
  ctx.fillStyle = '#0b0c10'; // Background color from CSS
  if (showTrails) {
      ctx.fillStyle = 'rgba(11, 12, 16, 0.3)'; // Fade effect for trails
  }
  ctx.fillRect(0, 0, width, height);

  for (const body of bodies) {
    body.draw(ctx);
  }

  // Draw drag line
  if (isDragging) {
    ctx.beginPath();
    ctx.moveTo(dragStartX, dragStartY);
    ctx.lineTo(currentMouseX, currentMouseY);
    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw preview body
    ctx.beginPath();
    ctx.arc(dragStartX, dragStartY, Math.max(2, Math.pow(flingMass, 0.333) * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(102, 252, 241, 0.5)';
    ctx.fill();
  }
}

requestAnimationFrame(animate);

// Interactions
canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  currentMouseX = e.clientX;
  currentMouseY = e.clientY;
});

window.addEventListener('pointermove', (e) => {
  if (isDragging) {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
  }
});

window.addEventListener('pointerup', (e) => {
  if (isDragging) {
    isDragging = false;
    const dx = dragStartX - currentMouseX;
    const dy = dragStartY - currentMouseY;

    // Scaling factor for velocity based on drag distance
    const velocityScale = 0.5;

    const newBody = new Body(dragStartX, dragStartY, dx * velocityScale, dy * velocityScale, flingMass);
    bodies.push(newBody);
    bodyCountDisplay.innerText = bodies.length;
  }
});

// UI Event Listeners
btnClear.addEventListener('click', () => {
  bodies = [];
  bodyCountDisplay.innerText = bodies.length;
});

btnPause.addEventListener('click', () => {
  isPaused = !isPaused;
});

chkTrails.addEventListener('change', (e) => {
  showTrails = e.target.checked;
});

sliderSpeed.addEventListener('input', (e) => {
  simSpeed = parseFloat(e.target.value);
  speedDisplay.innerText = simSpeed.toFixed(1);
});

sliderMass.addEventListener('input', (e) => {
  flingMass = parseInt(e.target.value);
  massDisplay.innerText = flingMass;
});

// Initialize display counter
bodyCountDisplay.innerText = bodies.length;
