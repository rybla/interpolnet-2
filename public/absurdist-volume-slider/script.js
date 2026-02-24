// Vector Class
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vector(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector(this.x * n, this.y * n); }
    div(n) { return new Vector(this.x / n, this.y / n); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    dist(v) { return this.sub(v).mag(); }
    normalize() {
        const m = this.mag();
        return m === 0 ? new Vector(0, 0) : this.div(m);
    }
    copy() { return new Vector(this.x, this.y); }
}

// Particle Class (Point)
class Point {
    constructor(x, y, pinned = false) {
        this.pos = new Vector(x, y);
        this.oldPos = new Vector(x, y);
        this.pinned = pinned;
        this.radius = 5;
        this.friction = 0.98; // Air resistance
        this.groundFriction = 0.7;
        this.bounce = 0.4;
    }

    update(gravity) {
        if (this.pinned) return;

        // Verlet Integration
        const vel = this.pos.sub(this.oldPos).mult(this.friction);
        this.oldPos = this.pos.copy();
        this.pos = this.pos.add(vel).add(gravity);
    }

    applyForce(f) {
        if (this.pinned) return;
        this.pos = this.pos.add(f);
    }
}

// Constraint Class (Stick)
class Constraint {
    constructor(p1, p2, length = null, stiffness = 1) {
        this.p1 = p1;
        this.p2 = p2;
        this.length = length === null ? p1.pos.dist(p2.pos) : length;
        this.stiffness = stiffness;
    }

    resolve() {
        const diff = this.p1.pos.sub(this.p2.pos);
        const dist = diff.mag();

        if (dist === 0) return;

        const difference = (this.length - dist) / dist;
        const correction = diff.mult(difference * 0.5 * this.stiffness);

        if (!this.p1.pinned) this.p1.pos = this.p1.pos.add(correction);
        if (!this.p2.pinned) this.p2.pos = this.p2.pos.sub(correction);
    }
}

// Physics World
class PhysicsWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gravity = new Vector(0, 0.5);
        this.points = [];
        this.constraints = [];
        this.groundY = height - 50;
    }

    addPoint(p) {
        this.points.push(p);
        return p;
    }

    addConstraint(c) {
        this.constraints.push(c);
        return c;
    }

    update() {
        for (const p of this.points) {
            p.update(this.gravity);
            this.constrainPoint(p);
        }

        for (let i = 0; i < 8; i++) {
            for (const c of this.constraints) {
                c.resolve();
            }
            this.resolveCollisions();
            for (const p of this.points) {
                this.constrainPoint(p);
            }
        }
    }

    resolveCollisions() {
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];
                // Simple circle collision
                const dx = p1.pos.x - p2.pos.x;
                const dy = p1.pos.y - p2.pos.y;
                const distSq = dx*dx + dy*dy;
                const minDist = p1.radius + p2.radius;

                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const correctionX = nx * overlap * 0.2; // Softer collisions
                    const correctionY = ny * overlap * 0.2;

                    if (!p1.pinned) {
                        p1.pos.x += correctionX;
                        p1.pos.y += correctionY;
                    }
                    if (!p2.pinned) {
                        p2.pos.x -= correctionX;
                        p2.pos.y -= correctionY;
                    }
                }
            }
        }
    }

    constrainPoint(p) {
        if (p.pinned) return;
        const velX = p.pos.x - p.oldPos.x;
        // Ground
        if (p.pos.y > this.groundY - p.radius) {
            p.pos.y = this.groundY - p.radius;
            // Friction
            p.oldPos.x = p.pos.x - velX * this.groundFriction;
        }
        // Walls
        if (p.pos.x < p.radius) {
            p.pos.x = p.radius;
            p.oldPos.x = p.pos.x + velX * this.groundFriction;
        }
        if (p.pos.x > this.width - p.radius) {
            p.pos.x = this.width - p.radius;
            p.oldPos.x = p.pos.x + velX * this.groundFriction;
        }
    }

    createBox(x, y, w, h) {
        const p1 = this.addPoint(new Point(x, y));
        const p2 = this.addPoint(new Point(x + w, y));
        const p3 = this.addPoint(new Point(x + w, y + h));
        const p4 = this.addPoint(new Point(x, y + h));

        // Perimeter
        this.addConstraint(new Constraint(p1, p2));
        this.addConstraint(new Constraint(p2, p3));
        this.addConstraint(new Constraint(p3, p4));
        this.addConstraint(new Constraint(p4, p1));
        // Cross braces
        this.addConstraint(new Constraint(p1, p3));
        this.addConstraint(new Constraint(p2, p4));

        return [p1, p2, p3, p4];
    }
}

class AudioController {
    constructor() {
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
             this.ctx = new (window.AudioContext || window.webkitAudioContext)();
             this.masterGain = this.ctx.createGain();
             this.masterGain.connect(this.ctx.destination);
             this.enabled = true;
        } else {
            this.enabled = false;
        }
    }

    setVolume(val) {
        if (!this.enabled) return;
        // Clamp 0-1
        if (val < 0) val = 0;
        if (val > 1) val = 1;
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }

    playLaunch() {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playTestSound() {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

        osc.start();
        osc.stop(this.ctx.currentTime + 2);
    }
}

// Game Logic Class
class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.world = new PhysicsWorld(width, height);
        this.catapultOrigin = new Vector(150, height - 150);
        this.projectile = null;
        this.targetBlocks = [];
        this.fired = false;
        this.dragging = false;
        this.audio = new AudioController();
        this.volumeSet = false;
        this.settleTimer = 0;
        this.finalVolume = 0;
    }

    init() {
        this.world = new PhysicsWorld(this.width, this.height);
        this.world.groundY = this.height - 50;
        this.catapultOrigin = new Vector(150, this.height - 150);
        this.resetProjectile();
        this.createTower();
        this.fired = false;
        this.dragging = false;
        this.volumeSet = false;
        this.settleTimer = 0;
        this.finalVolume = 0;
        this.audio.setVolume(1);
    }

    resetProjectile() {
        this.projectile = new Point(this.catapultOrigin.x, this.catapultOrigin.y);
        this.projectile.radius = 15;
        this.projectile.mass = 5;
        this.projectile.pinned = true;
        this.world.addPoint(this.projectile);
    }

    createTower() {
        this.targetBlocks = [];
        const blockW = 40;
        const blockH = 40;
        const startX = this.width - 250;
        const groundY = this.world.groundY;

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6 - row; col++) {
                // Add gap to prevent initial overlap explosion (radius is 5, so need 10 gap min)
                const gap = 12;
                const x = startX + col * (blockW + gap) + (row * (blockW + gap) / 2);
                const y = groundY - (row + 1) * (blockH + gap);
                const boxPoints = this.world.createBox(x, y, blockW, blockH);
                this.targetBlocks.push({ points: boxPoints, initialY: y + blockH / 2 });
            }
        }
        return this.targetBlocks.length;
    }

    startDrag(pos) {
        if (this.fired) return false;
        if (pos.dist(this.projectile.pos) < 50) {
            this.dragging = true;
            return true;
        }
        return false;
    }

    drag(pos) {
        if (!this.dragging) return;

        const maxDrag = 150;
        const dragVec = pos.sub(this.catapultOrigin);
        if (dragVec.mag() > maxDrag) {
            const clamped = dragVec.normalize().mult(maxDrag);
            this.projectile.pos = this.catapultOrigin.add(clamped);
        } else {
            this.projectile.pos = pos;
        }
        this.projectile.oldPos = this.projectile.pos.copy();
    }

    endDrag() {
        if (!this.dragging) return;
        this.dragging = false;
        this.fired = true;
        this.projectile.pinned = false;

        const stretch = this.catapultOrigin.sub(this.projectile.pos);
        const power = 0.08;
        const force = stretch.mult(power);
        this.projectile.oldPos = this.projectile.pos.sub(force.mult(5));

        this.audio.playLaunch();
    }

    drawTrajectory(ctx) {
        if (!this.dragging) return;

        // Simple trajectory simulation
        const stretch = this.catapultOrigin.sub(this.projectile.pos);
        const power = 0.08;
        const force = stretch.mult(power);

        // Initial velocity approximation based on Verlet setup
        // vel = force * 5 (from endDrag logic: oldPos = pos - force*5)
        let vel = force.mult(5);
        let pos = this.projectile.pos.copy();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(70, 130, 180, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(pos.x, pos.y);

        // Simulate forward
        for (let i = 0; i < 30; i++) {
            pos = pos.add(vel);
            // Apply gravity
            vel = vel.add(this.world.gravity);
            // Apply friction
            vel = vel.mult(0.98);
            ctx.lineTo(pos.x, pos.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    update() {
        this.world.update();

        if (this.fired && !this.volumeSet) {
            if (this.isSettled()) {
                 this.settleTimer++;
                 if (this.settleTimer > 60) {
                     this.finalizeVolume();
                 }
            } else {
                this.settleTimer = 0;
            }
        }
    }

    isSettled() {
        let totalVel = 0;
        for (const p of this.world.points) {
            if (p.pinned) continue;
            const vel = p.pos.sub(p.oldPos).mag();
            totalVel += vel;
        }
        return totalVel < 1.0;
    }

    calculateVolume() {
        let displacement = 0;
        if (this.targetBlocks.length === 0) console.log("Target blocks empty!");

        for (const block of this.targetBlocks) {
            let avgY = 0;
            for (const p of block.points) avgY += p.pos.y;
            avgY /= block.points.length;

            const diff = Math.abs(avgY - block.initialY);
            if (diff > 5) displacement += diff;
        }

        // Scaling factor
        let vol = (displacement / 2000) * 100;
        if (vol > 100) vol = 100;
        return Math.floor(vol);
    }

    finalizeVolume() {
        this.volumeSet = true;
        this.finalVolume = this.calculateVolume();

        this.audio.setVolume(this.finalVolume / 100);
        this.audio.playTestSound();
    }
}


// Initialization for Browser
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const resetBtn = document.getElementById('reset-btn');
        const volDisplay = document.getElementById('volume-display');
        const volValue = document.getElementById('volume-value');
        const destructionMetric = document.getElementById('destruction-metric');

        let game = new Game(window.innerWidth, window.innerHeight);
        window.game = game; // Expose for debugging

        function resize() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            game.width = rect.width;
            game.height = rect.height;
            game.world.width = rect.width;
            game.world.height = rect.height;
            game.world.groundY = rect.height - 50;

            // Re-calculate catapult origin to stay on screen
            game.catapultOrigin = new Vector(150, game.height - 150);

            // If dragging or pinned, update projectile to follow origin
            if (game.projectile && game.projectile.pinned && !game.dragging) {
                game.projectile.pos = game.catapultOrigin.copy();
                game.projectile.oldPos = game.catapultOrigin.copy();
            }
        }

        window.addEventListener('resize', resize);

        // Initial setup
        resize();
        game.init();

        // Input Handling
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;
            if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            return new Vector(clientX - rect.left, clientY - rect.top);
        }

        canvas.addEventListener('mousedown', (e) => game.startDrag(getPos(e)));
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); game.startDrag(getPos(e)); }, {passive: false});

        window.addEventListener('mousemove', (e) => game.drag(getPos(e)));
        window.addEventListener('touchmove', (e) => { if(game.dragging) e.preventDefault(); game.drag(getPos(e)); }, {passive: false});

        window.addEventListener('mouseup', () => game.endDrag());
        window.addEventListener('touchend', () => game.endDrag());

        resetBtn.addEventListener('click', () => {
            game.init();
            volDisplay.classList.add('hidden');
        });

        // Rendering Loop
        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Physics Update
            game.update();

            // Check for Volume Result
            if (game.volumeSet && volDisplay.classList.contains('hidden')) {
                volDisplay.classList.remove('hidden');
                volValue.innerText = game.finalVolume + "%";
            }

            // Debug
            if (destructionMetric) {
                destructionMetric.innerText = Math.floor(game.calculateVolume()) + "% (Current)";
            }

            // Draw Ground
            ctx.beginPath();
            ctx.moveTo(0, game.world.groundY);
            ctx.lineTo(game.width, game.world.groundY);
            ctx.strokeStyle = '#4682b4';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Catapult Base
            ctx.beginPath();
            ctx.moveTo(game.catapultOrigin.x, game.world.groundY);
            ctx.lineTo(game.catapultOrigin.x, game.catapultOrigin.y);
            ctx.strokeStyle = '#003366';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw Trajectory Preview
            game.drawTrajectory(ctx);

            // Draw Rubber Bands
            if (!game.fired || (game.fired && game.projectile.pos.x < game.catapultOrigin.x + 50)) {
                ctx.beginPath();
                ctx.moveTo(game.catapultOrigin.x, game.catapultOrigin.y);
                ctx.lineTo(game.projectile.pos.x, game.projectile.pos.y);
                ctx.strokeStyle = '#ff4500';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Draw Constraints (Blocks)
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#003366';
            ctx.beginPath();
            for (const c of game.world.constraints) {
                ctx.moveTo(c.p1.pos.x, c.p1.pos.y);
                ctx.lineTo(c.p2.pos.x, c.p2.pos.y);
            }
            ctx.stroke();

            // Draw Projectile
            ctx.beginPath();
            ctx.arc(game.projectile.pos.x, game.projectile.pos.y, game.projectile.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4500';
            ctx.fill();
            ctx.stroke();

            requestAnimationFrame(loop);
        }

        loop();
    });
}

// Export for Testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector, Point, Constraint, PhysicsWorld, Game };
}
