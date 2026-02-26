
const canvas = document.getElementById('kinetic-canvas');
const ctx = canvas.getContext('2d');
const proceedBtn = document.getElementById('proceed-btn');

let width, height;
let boids = [];
let mouse = { x: -1000, y: -1000 };
let targetZone = { x: 0, y: 0, width: 0, height: 0 };
const sentence = "INTERPOLNET";
const fontSize = 80;
let isComplete = false;

// Physics constants
const MAX_SPEED = 6;
const MAX_FORCE = 0.2;
const FLEE_RADIUS = 150;
const ALIGN_RADIUS = 50;
const COHESION_RADIUS = 50;
const SEPARATION_RADIUS = 40;

class Boid {
    constructor(x, y, char, targetX, targetY) {
        this.pos = { x, y };
        this.vel = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
        this.acc = { x: 0, y: 0 };
        this.char = char;
        this.target = { x: targetX, y: targetY };
        this.maxSpeed = MAX_SPEED;
        this.maxForce = MAX_FORCE;
        this.angle = 0;
        this.trapped = false;
        this.color = '#fff';
    }

    applyForce(force) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }

    update() {
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;

        // Limit speed
        const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        if (speed > this.maxSpeed) {
            this.vel.x = (this.vel.x / speed) * this.maxSpeed;
            this.vel.y = (this.vel.y / speed) * this.maxSpeed;
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.acc.x = 0;
        this.acc.y = 0;

        // Screen wrapping (soft bounce)
        if (this.pos.x < 0) this.vel.x = Math.abs(this.vel.x);
        if (this.pos.x > width) this.vel.x = -Math.abs(this.vel.x);
        if (this.pos.y < 0) this.vel.y = Math.abs(this.vel.y);
        if (this.pos.y > height) this.vel.y = -Math.abs(this.vel.y);

        // Calculate rotation based on velocity
        if (!this.trapped) {
            this.angle = Math.atan2(this.vel.y, this.vel.x);
        } else {
             // Smoothly rotate to 0
             this.angle = this.angle * 0.9;
        }
    }

    behaviors(boids) {
        let flee = this.flee(mouse);
        let separate = this.separation(boids);
        let align = this.alignment(boids);
        let cohere = this.cohesion(boids);
        let seek = { x: 0, y: 0 };
        this.checkTrap();

        flee.x *= 2.5;
        flee.y *= 2.5;

        separate.x *= 1.5;
        separate.y *= 1.5;

        align.x *= 1.0;
        align.y *= 1.0;

        cohere.x *= 1.0;
        cohere.y *= 1.0;

        if (this.trapped) {
            // If trapped in the target zone, seek the specific target position
            seek = this.seek(this.target);
            seek.x *= 2.0; // Strong pull to snap into place
            seek.y *= 2.0;

            // Reduce max speed when trapped for stability
            this.maxSpeed = MAX_SPEED * 0.5;
            this.color = '#0f0'; // Turn green when snapped
        } else {
            this.maxSpeed = MAX_SPEED;
            this.color = '#fff';
            // Weak attraction to center to keep them from drifting too far
            seek = this.seek({x: width/2, y: height/2});
            seek.x *= 0.1;
            seek.y *= 0.1;
        }

        this.applyForce(flee);
        this.applyForce(separate);
        this.applyForce(align);
        this.applyForce(cohere);
        this.applyForce(seek);
    }

    checkTrap() {
        // Check if inside target zone
        if (this.pos.x > targetZone.x &&
            this.pos.x < targetZone.x + targetZone.width &&
            this.pos.y > targetZone.y &&
            this.pos.y < targetZone.y + targetZone.height) {
            this.trapped = true;
        } else {
            this.trapped = false;
        }
    }

    seek(target) {
        let desired = {
            x: target.x - this.pos.x,
            y: target.y - this.pos.y
        };
        const d = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

        // Arrive behavior (slow down when close)
        let speed = this.maxSpeed;
        if (d < 100) {
            speed = (d / 100) * this.maxSpeed;
        }

        desired.x = (desired.x / d) * speed;
        desired.y = (desired.y / d) * speed;

        let steer = {
            x: desired.x - this.vel.x,
            y: desired.y - this.vel.y
        };

        return this.limit(steer, this.maxForce);
    }

    flee(target) {
        let desired = {
            x: this.pos.x - target.x,
            y: this.pos.y - target.y
        };
        const d = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

        if (d < FLEE_RADIUS) {
            desired.x = (desired.x / d) * this.maxSpeed;
            desired.y = (desired.y / d) * this.maxSpeed;

            let steer = {
                x: desired.x - this.vel.x,
                y: desired.y - this.vel.y
            };
            return this.limit(steer, this.maxForce);
        } else {
            return { x: 0, y: 0 };
        }
    }

    separation(boids) {
        let steer = { x: 0, y: 0 };
        let count = 0;

        for (let other of boids) {
            let d = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
            if ((d > 0) && (d < SEPARATION_RADIUS)) {
                let diff = {
                    x: this.pos.x - other.pos.x,
                    y: this.pos.y - other.pos.y
                };
                diff.x /= d;
                diff.y /= d;
                steer.x += diff.x;
                steer.y += diff.y;
                count++;
            }
        }

        if (count > 0) {
            steer.x /= count;
            steer.y /= count;

            if (Math.hypot(steer.x, steer.y) > 0) {
                steer.x = (steer.x / Math.hypot(steer.x, steer.y)) * this.maxSpeed;
                steer.y = (steer.y / Math.hypot(steer.x, steer.y)) * this.maxSpeed;
                steer.x -= this.vel.x;
                steer.y -= this.vel.y;
                return this.limit(steer, this.maxForce);
            }
        }
        return { x: 0, y: 0 };
    }

    alignment(boids) {
        let sum = { x: 0, y: 0 };
        let count = 0;
        for (let other of boids) {
            let d = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
            if ((d > 0) && (d < ALIGN_RADIUS)) {
                sum.x += other.vel.x;
                sum.y += other.vel.y;
                count++;
            }
        }
        if (count > 0) {
            sum.x /= count;
            sum.y /= count;
            if (Math.hypot(sum.x, sum.y) > 0) {
                sum.x = (sum.x / Math.hypot(sum.x, sum.y)) * this.maxSpeed;
                sum.y = (sum.y / Math.hypot(sum.x, sum.y)) * this.maxSpeed;
                let steer = {
                    x: sum.x - this.vel.x,
                    y: sum.y - this.vel.y
                };
                return this.limit(steer, this.maxForce);
            }
        }
        return { x: 0, y: 0 };
    }

    cohesion(boids) {
        let sum = { x: 0, y: 0 };
        let count = 0;
        for (let other of boids) {
            let d = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
            if ((d > 0) && (d < COHESION_RADIUS)) {
                sum.x += other.pos.x;
                sum.y += other.pos.y;
                count++;
            }
        }
        if (count > 0) {
            sum.x /= count;
            sum.y /= count;
            return this.seek(sum);
        }
        return { x: 0, y: 0 };
    }

    limit(vector, max) {
        const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (mag > max) {
            return {
                x: (vector.x / mag) * max,
                y: (vector.y / mag) * max
            };
        }
        return vector;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.char, 0, 0);
        ctx.restore();
    }
}

function init() {
    resize();

    ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    const totalWidth = ctx.measureText(sentence).width;
    const startX = (width - totalWidth) / 2;
    const startY = height / 2;

    // Define target zone (with some padding)
    targetZone = {
        x: startX - 50,
        y: startY - fontSize,
        width: totalWidth + 100,
        height: fontSize * 2
    };

    // Create boids scattered randomly
    let currentX = startX;
    for (let i = 0; i < sentence.length; i++) {
        const char = sentence[i];
        const charWidth = ctx.measureText(char).width;

        // Random initial position
        const rx = Math.random() * width;
        const ry = Math.random() * height;

        // Target position (centered horizontally relative to current character width)
        const tx = currentX + charWidth / 2;
        const ty = startY;

        boids.push(new Boid(rx, ry, char, tx, ty));

        currentX += charWidth; // Tight spacing
    }

    animate();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Re-calculate target zone if already initialized
    if (boids.length > 0) {
         ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
         const totalWidth = ctx.measureText(sentence).width;
         const startX = (width - totalWidth) / 2;
         const startY = height / 2;

         targetZone = {
             x: startX - 50,
             y: startY - fontSize,
             width: totalWidth + 100,
             height: fontSize * 2
         };

         let currentX = startX;
         for (let boid of boids) {
             const charWidth = ctx.measureText(boid.char).width;
             boid.target.x = currentX + charWidth / 2;
             boid.target.y = startY;
             currentX += charWidth;
         }
    }
}

function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, width, height);

    // Draw Target Zone
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(targetZone.x, targetZone.y, targetZone.width, targetZone.height);
    ctx.setLineDash([]);

    let trappedCount = 0;
    let allStable = true;

    for (let boid of boids) {
        boid.behaviors(boids);
        boid.update();
        boid.draw(ctx);
        if (boid.trapped) {
            trappedCount++;
            let d = Math.hypot(boid.pos.x - boid.target.x, boid.pos.y - boid.target.y);
            if (d > 10) allStable = false; // Must be very close
        } else {
            allStable = false;
        }
    }

    // Check Win Condition
    // We want them trapped AND close to their targets
    if (trappedCount === sentence.length && allStable && !isComplete) {
        isComplete = true;
        proceedBtn.classList.add('visible');
        proceedBtn.disabled = false;
    }
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: false });

proceedBtn.addEventListener('click', () => {
    alert("Welcome to Interpolnet!");
});

// Initialize on load
init();
