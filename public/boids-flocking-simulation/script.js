class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    let m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static sub(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }
}

class Boid {
  constructor(x, y) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.acceleration = new Vector2D(0, 0);
    this.r = 3.0;
    this.maxSpeed = 4;
    this.maxForce = 0.1;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  flock(boids, weights) {
    let sep = this.separate(boids);
    let ali = this.align(boids);
    let coh = this.cohere(boids);

    sep.mult(weights.separation);
    ali.mult(weights.alignment);
    coh.mult(weights.cohesion);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  borders(width, height) {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }

  separate(boids) {
    let desiredSeparation = 25.0;
    let steer = new Vector2D(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = this.position.dist(other.position);
      if ((d > 0) && (d < desiredSeparation)) {
        let diff = Vector2D.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) {
      steer.div(count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  align(boids) {
    let neighborDist = 50.0;
    let sum = new Vector2D(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = this.position.dist(other.position);
      if ((d > 0) && (d < neighborDist)) {
        sum.add(other.velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = Vector2D.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return new Vector2D(0, 0);
    }
  }

  cohere(boids) {
    let neighborDist = 50.0;
    let sum = new Vector2D(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = this.position.dist(other.position);
      if ((d > 0) && (d < neighborDist)) {
        sum.add(other.position);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return new Vector2D(0, 0);
    }
  }

  seek(target) {
    let desired = Vector2D.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }
}

const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
let boids = [];
const numBoids = 150;

let weights = {
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
};

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function initBoids() {
  boids = [];
  for (let i = 0; i < numBoids; i++) {
    boids.push(new Boid(Math.random() * canvas.width, Math.random() * canvas.height));
  }
}

function updateBoidSpeed(speed) {
  for (let boid of boids) {
    boid.maxSpeed = speed;
  }
}

function drawBoid(boid) {
  let theta = Math.atan2(boid.velocity.y, boid.velocity.x) + Math.PI / 2;

  ctx.save();
  ctx.translate(boid.position.x, boid.position.y);
  ctx.rotate(theta);

  const boidColor = getComputedStyle(document.body).getPropertyValue('--boid-color').trim() || '#3498db';
  const shadowColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#2c3e50';

  ctx.beginPath();
  ctx.moveTo(0, -boid.r * 2);
  ctx.lineTo(-boid.r, boid.r * 2);
  ctx.lineTo(boid.r, boid.r * 2);
  ctx.closePath();

  ctx.fillStyle = boidColor;
  ctx.fill();
  ctx.strokeStyle = shadowColor;
  ctx.stroke();

  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let boid of boids) {
    boid.flock(boids, weights);
    boid.update();
    boid.borders(canvas.width, canvas.height);
    drawBoid(boid);
  }

  requestAnimationFrame(animate);
}

function setupEventListeners() {
  window.addEventListener('resize', resizeCanvas);

  const sliders = ['separation', 'alignment', 'cohesion', 'speed'];

  sliders.forEach(param => {
    const slider = document.getElementById(`${param}-slider`);
    const display = document.getElementById(`${param}-value`);

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      display.textContent = value.toFixed(1);

      if (param === 'speed') {
        updateBoidSpeed(value);
      } else {
        weights[param] = value;
      }
    });
  });

  document.getElementById('reset-button').addEventListener('click', () => {
    initBoids();
    const speed = parseFloat(document.getElementById('speed-slider').value);
    updateBoidSpeed(speed);
  });
}

function init() {
  resizeCanvas();
  setupEventListeners();
  initBoids();
  const initialSpeed = parseFloat(document.getElementById('speed-slider').value);
  updateBoidSpeed(initialSpeed);
  animate();
}

// Ensure the page is fully loaded before initializing
window.addEventListener('load', init);
