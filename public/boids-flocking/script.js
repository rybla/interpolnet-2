const canvas = document.getElementById('boidsCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// Simulation parameters
const params = {
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  maxSpeed: 4,
  maxForce: 0.1,
  visualRange: 75,
  separationRange: 25,
  numBoids: 150
};

// UI Elements
const sepSlider = document.getElementById('separationSlider');
const alignSlider = document.getElementById('alignmentSlider');
const cohSlider = document.getElementById('cohesionSlider');

const sepVal = document.getElementById('separationValue');
const alignVal = document.getElementById('alignmentValue');
const cohVal = document.getElementById('cohesionValue');

function updateParams() {
  params.separationWeight = parseFloat(sepSlider.value);
  params.alignmentWeight = parseFloat(alignSlider.value);
  params.cohesionWeight = parseFloat(cohSlider.value);

  sepVal.textContent = params.separationWeight.toFixed(1);
  alignVal.textContent = params.alignmentWeight.toFixed(1);
  cohVal.textContent = params.cohesionWeight.toFixed(1);
}

sepSlider.addEventListener('input', updateParams);
alignSlider.addEventListener('input', updateParams);
cohSlider.addEventListener('input', updateParams);

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Vector {
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
    this.x /= n;
    this.y /= n;
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const m = this.mag();
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

  heading() {
    return Math.atan2(this.y, this.x);
  }

  static sub(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }
}

class Boid {
  constructor(x, y) {
    this.position = new Vector(x, y);
    const angle = Math.random() * Math.PI * 2;
    this.velocity = new Vector(Math.cos(angle), Math.sin(angle));
    this.velocity.mult(Math.random() * 2 + 2);
    this.acceleration = new Vector(0, 0);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(params.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // Reset acceleration

    // Screen wrap
    if (this.position.x > width + 10) this.position.x = -10;
    else if (this.position.x < -10) this.position.x = width + 10;
    if (this.position.y > height + 10) this.position.y = -10;
    else if (this.position.y < -10) this.position.y = height + 10;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  flock(boids) {
    let sep = new Vector(0, 0);
    let ali = new Vector(0, 0);
    let coh = new Vector(0, 0);
    let sepCount = 0;
    let aliCohCount = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other !== this) {
        const d = this.position.dist(other.position);

        if (d > 0 && d < params.visualRange) {
          ali.add(other.velocity);
          coh.add(other.position);
          aliCohCount++;

          if (d < params.separationRange) {
            let diff = Vector.sub(this.position, other.position);
            diff.normalize();
            diff.div(d); // Weight by distance
            sep.add(diff);
            sepCount++;
          }
        }
      }
    }

    if (sepCount > 0) {
      sep.div(sepCount);
    }
    if (sep.mag() > 0) {
      sep.normalize();
      sep.mult(params.maxSpeed);
      sep.sub(this.velocity);
      sep.limit(params.maxForce);
    }

    if (aliCohCount > 0) {
      ali.div(aliCohCount);
      ali.normalize();
      ali.mult(params.maxSpeed);
      ali.sub(this.velocity);
      ali.limit(params.maxForce);

      coh.div(aliCohCount);
      coh = this.seek(coh);
    }

    sep.mult(params.separationWeight);
    ali.mult(params.alignmentWeight);
    coh.mult(params.cohesionWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  seek(target) {
    const desired = Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(params.maxSpeed);
    const steer = Vector.sub(desired, this.velocity);
    steer.limit(params.maxForce);
    return steer;
  }

  draw(ctx) {
    const angle = this.velocity.heading();

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();

    ctx.fillStyle = '#00ffcc';
    ctx.fill();

    ctx.restore();
  }
}

const boids = [];
for (let i = 0; i < params.numBoids; i++) {
  boids.push(new Boid(Math.random() * width, Math.random() * height));
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (let boid of boids) {
    boid.flock(boids);
    boid.update();
    boid.draw(ctx);
  }

  requestAnimationFrame(animate);
}

animate();
