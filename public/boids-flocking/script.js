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
    this.x /= n;
    this.y /= n;
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  normalize() {
    let m = this.mag();
    if (m !== 0 && m !== 1) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    if (this.magSq() > max * max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  static sub(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  static dist(v1, v2) {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Boid {
  constructor(x, y) {
    this.position = new Vector2D(x, y);
    // Give random initial velocity
    let angle = Math.random() * Math.PI * 2;
    this.velocity = new Vector2D(Math.cos(angle), Math.sin(angle));
    this.acceleration = new Vector2D(0, 0);
    this.r = 4.0;
    this.maxSpeed = 3;
    this.maxForce = 0.05;
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

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0); // Reset acceleration each frame
  }

  // Wraparound boundaries
  borders(width, height) {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }

  // Separation: Steer to avoid crowding local flockmates
  separate(boids) {
    let desiredSeparation = 25.0;
    let steer = new Vector2D(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector2D.dist(this.position, other.position);
      if ((d > 0) && (d < desiredSeparation)) {
        let diff = Vector2D.sub(this.position, other.position);
        diff.normalize();
        diff.div(d); // Weight by distance
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

  // Alignment: Steer towards the average heading of local flockmates
  align(boids) {
    let neighborDist = 50.0;
    let sum = new Vector2D(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector2D.dist(this.position, other.position);
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

  // Cohesion: Steer to move toward the average position of local flockmates
  cohere(boids) {
    let neighborDist = 50.0;
    let sum = new Vector2D(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = Vector2D.dist(this.position, other.position);
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

  // Helper to seek a target
  seek(target) {
    let desired = Vector2D.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("boidsCanvas");
  const ctx = canvas.getContext("2d");

  const container = canvas.parentElement;

  // Weights elements
  const sepSlider = document.getElementById("separationWeight");
  const sepValue = document.getElementById("separationValue");

  const aliSlider = document.getElementById("alignmentWeight");
  const aliValue = document.getElementById("alignmentValue");

  const cohSlider = document.getElementById("cohesionWeight");
  const cohValue = document.getElementById("cohesionValue");

  let boids = [];
  const numBoids = 150;

  // Theme color from CSS variable
  let boidColor = getComputedStyle(document.body).getPropertyValue('--boid-color').trim() || '#38bdf8';

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize flock
  for (let i = 0; i < numBoids; i++) {
    boids.push(new Boid(Math.random() * canvas.width, Math.random() * canvas.height));
  }

  // Update slider values
  sepSlider.addEventListener("input", (e) => {
    sepValue.textContent = e.target.value;
  });
  aliSlider.addEventListener("input", (e) => {
    aliValue.textContent = e.target.value;
  });
  cohSlider.addEventListener("input", (e) => {
    cohValue.textContent = e.target.value;
  });

  function drawBoid(boid) {
    let theta = boid.velocity.heading() + Math.PI / 2;

    ctx.save();
    ctx.translate(boid.position.x, boid.position.y);
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.moveTo(0, -boid.r * 2);
    ctx.lineTo(-boid.r, boid.r * 2);
    ctx.lineTo(boid.r, boid.r * 2);
    ctx.closePath();
    ctx.fillStyle = boidColor;
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parse current weights
    let sepW = parseFloat(sepSlider.value);
    let aliW = parseFloat(aliSlider.value);
    let cohW = parseFloat(cohSlider.value);

    for (let i = 0; i < boids.length; i++) {
      let boid = boids[i];
      boid.flock(boids, sepW, aliW, cohW);
      boid.update();
      boid.borders(canvas.width, canvas.height);
      drawBoid(boid);
    }

    requestAnimationFrame(animate);
  }

  // Start loop
  animate();
});
