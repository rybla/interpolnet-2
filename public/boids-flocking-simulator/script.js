const canvas = document.getElementById('boidsCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let boids = [];
const numBoids = 150;

function resizeCanvas() {
  const container = canvas.parentElement;
  width = container.clientWidth;
  height = container.clientHeight;
  canvas.width = width;
  canvas.height = height;
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

  static sub(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  static dist(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Boid {
  constructor(x, y) {
    this.position = new Vector(x, y);
    this.velocity = new Vector((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    this.acceleration = new Vector(0, 0);
    this.r = 4.0;
    this.maxForce = 0.1;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  flock(boids, sepWeight, aliWeight, cohWeight) {
    let sep = this.separate(boids);
    let ali = this.align(boids);
    let coh = this.cohere(boids);

    sep.mult(sepWeight);
    ali.mult(aliWeight);
    coh.mult(cohWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  update(maxSpeed) {
    this.velocity.add(this.acceleration);
    this.velocity.limit(maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.edges();
  }

  separate(boids) {
    let desiredSeparation = 25.0;
    let steer = new Vector(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector.dist(this.position, other.position);

      if ((d > 0) && (d < desiredSeparation)) {
        let diff = Vector.sub(this.position, other.position);
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
      steer.mult(this.velocity.mag());
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  align(boids) {
    let neighborDist = 50.0;
    let sum = new Vector(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector.dist(this.position, other.position);

      if ((d > 0) && (d < neighborDist)) {
        sum.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.velocity.mag());
      let steer = Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return new Vector(0, 0);
    }
  }

  cohere(boids) {
    let neighborDist = 50.0;
    let sum = new Vector(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector.dist(this.position, other.position);

      if ((d > 0) && (d < neighborDist)) {
        sum.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return new Vector(0, 0);
    }
  }

  seek(target) {
    let desired = Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.velocity.mag() || 1);
    let steer = Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  edges() {
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
  }
}

for (let i = 0; i < numBoids; i++) {
  boids.push(new Boid(Math.random() * width, Math.random() * height));
}

const separationSlider = document.getElementById('separation');
const alignmentSlider = document.getElementById('alignment');
const cohesionSlider = document.getElementById('cohesion');
const speedSlider = document.getElementById('speed');

function drawBoid(boid) {
  const theta = Math.atan2(boid.velocity.y, boid.velocity.x) + Math.PI / 2;

  ctx.save();
  ctx.translate(boid.position.x, boid.position.y);
  ctx.rotate(theta);

  ctx.beginPath();
  ctx.moveTo(0, -boid.r * 2);
  ctx.lineTo(-boid.r, boid.r * 2);
  ctx.lineTo(boid.r, boid.r * 2);
  ctx.closePath();

  ctx.fillStyle = '#ff00ff';
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.stroke();

  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  const sepWeight = parseFloat(separationSlider.value);
  const aliWeight = parseFloat(alignmentSlider.value);
  const cohWeight = parseFloat(cohesionSlider.value);
  const maxSpeed = parseFloat(speedSlider.value);

  for (let i = 0; i < boids.length; i++) {
    boids[i].flock(boids, sepWeight, aliWeight, cohWeight);
    boids[i].update(maxSpeed);
    drawBoid(boids[i]);
  }

  requestAnimationFrame(animate);
}

animate();
