// Constants
const STATES = {
    THINKING: 'THINKING',
    HUNGRY: 'HUNGRY',
    EATING: 'EATING',
    DEADLOCKED: 'DEADLOCKED' // Special state for visualization override
};

const COLORS = {
    [STATES.THINKING]: '#4CAF50', // Green
    [STATES.HUNGRY]: '#FFC107',   // Amber
    [STATES.EATING]: '#F44336',   // Red
    [STATES.DEADLOCKED]: '#9C27B0' // Purple
};

class Fork {
    constructor(id) {
        this.id = id;
        this.owner = null; // Philosopher ID or null
        // Visualization coordinates
        this.baseX = 0;
        this.baseY = 0;
        this.currentX = 0;
        this.currentY = 0;
    }
}

class Philosopher {
    constructor(id, leftFork, rightFork, simulation) {
        this.id = id;
        this.leftFork = leftFork;
        this.rightFork = rightFork;
        this.simulation = simulation;

        // Logic State
        this.state = STATES.THINKING;
        this.stateTimer = 0;
        this.maxStateTime = 0;
        this.waitTimer = 0;
        this.heldForks = [];

        // Visualization
        this.x = 0;
        this.y = 0;
        this.radius = 30;
    }

    reset() {
        this.dropForks();
        this.state = STATES.THINKING;
        this.stateTimer = Math.random() * this.simulation.params.thinkTime; // Randomize start
        this.maxStateTime = this.simulation.params.thinkTime;
        this.waitTimer = 0;
    }

    startThinking() {
        this.state = STATES.THINKING;
        this.maxStateTime = this.simulation.params.thinkTime * (0.8 + Math.random() * 0.4); // Add some variance
        this.stateTimer = 0;
        this.dropForks();
    }

    becomeHungry() {
        this.state = STATES.HUNGRY;
        this.waitTimer = 0;
    }

    startEating() {
        this.state = STATES.EATING;
        this.maxStateTime = this.simulation.params.eatTime * (0.8 + Math.random() * 0.4);
        this.stateTimer = 0;
    }

    dropForks() {
        if (this.leftFork.owner === this.id) this.leftFork.owner = null;
        if (this.rightFork.owner === this.id) this.rightFork.owner = null;
        this.heldForks = [];
    }

    update(dt) {
        if (this.state === STATES.THINKING) {
            this.stateTimer += dt;
            if (this.stateTimer >= this.maxStateTime) {
                this.becomeHungry();
            }
        } else if (this.state === STATES.HUNGRY) {
            this.waitTimer += dt;

            // Timeout Logic
            if (this.simulation.params.timeoutEnabled && this.waitTimer > this.simulation.params.waitTimeout) {
                // Give up and think again
                this.dropForks();
                this.startThinking();
                return;
            }

            // Fork Acquisition Logic (Resource Hierarchy or just Left-Right)
            // Here we implement naive Left-Right to allow Deadlock
            if (!this.heldForks.includes(this.leftFork)) {
                if (this.leftFork.owner === null) {
                    this.leftFork.owner = this.id;
                    this.heldForks.push(this.leftFork);
                }
            } else if (!this.heldForks.includes(this.rightFork)) {
                if (this.rightFork.owner === null) {
                    this.rightFork.owner = this.id;
                    this.heldForks.push(this.rightFork);
                    this.startEating();
                }
            }
        } else if (this.state === STATES.EATING) {
            this.stateTimer += dt;
            if (this.stateTimer >= this.maxStateTime) {
                this.startThinking();
            }
        }
    }
}

class Simulation {
    constructor() {
        this.philosophers = [];
        this.forks = [];
        this.running = false;
        this.lastTime = 0;

        this.params = {
            thinkTime: 2000,
            eatTime: 2000,
            waitTimeout: 1000,
            timeoutEnabled: true
        };

        this.init();
    }

    init() {
        // Create 5 forks
        for (let i = 0; i < 5; i++) {
            this.forks.push(new Fork(i));
        }

        // Create 5 philosophers
        for (let i = 0; i < 5; i++) {
            // Phil i uses Fork i (Left) and Fork (i+1)%5 (Right)
            let leftFork = this.forks[i];
            let rightFork = this.forks[(i + 1) % 5];
            this.philosophers.push(new Philosopher(i, leftFork, rightFork, this));
        }

        this.reset();
    }

    reset() {
        this.philosophers.forEach(p => p.reset());
        this.running = false;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    pause() {
        this.running = false;
    }

    checkDeadlock() {
        // Simple deadlock detection: Everyone is HUNGRY and holds 1 fork
        const potentialDeadlock = this.philosophers.every(p =>
            p.state === STATES.HUNGRY && p.heldForks.length === 1
        );
        return potentialDeadlock;
    }

    update(dt) {
        if (!this.running) return;

        // Update all philosophers
        // Shuffle order slightly or update sequentially? Sequential is fine for this granularity.
        this.philosophers.forEach(p => p.update(dt));
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);

        if (typeof window !== 'undefined') {
            this.draw();
            this.updateUI();
            requestAnimationFrame(this.loop.bind(this));
        }
    }

    // Visualization Logic
    draw() {
        const canvas = document.getElementById('simulation-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Resize canvas to fit container
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight; // Or fix aspect ratio

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const tableRadius = Math.min(cx, cy) * 0.5;
        const philosopherRadius = tableRadius * 0.3;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Table
        ctx.beginPath();
        ctx.arc(cx, cy, tableRadius + philosopherRadius/2, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Calculate positions
        const isDeadlocked = this.checkDeadlock();

        // Update positions
        this.philosophers.forEach((p, i) => {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // Start at top
            p.x = cx + Math.cos(angle) * tableRadius;
            p.y = cy + Math.sin(angle) * tableRadius;
        });

        this.forks.forEach((f, i) => {
            // Fork is initially between Phil i and Phil i+1
            const angle = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
            f.baseX = cx + Math.cos(angle) * (tableRadius * 0.7);
            f.baseY = cy + Math.sin(angle) * (tableRadius * 0.7);

            // Determine target position based on owner
            if (f.owner !== null) {
                const owner = this.philosophers[f.owner];
                // Offset towards owner
                f.currentX = f.currentX + (owner.x - f.currentX) * 0.2;
                f.currentY = f.currentY + (owner.y - f.currentY) * 0.2;
            } else {
                // Return to base
                f.currentX = f.currentX + (f.baseX - f.currentX) * 0.2;
                f.currentY = f.currentY + (f.baseY - f.currentY) * 0.2;
            }
        });

        // Draw Forks
        this.forks.forEach(f => {
            ctx.beginPath();
            ctx.arc(f.currentX, f.currentY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#aaa';
            ctx.fill();
            // Draw handle line?
            // Keep it simple: Dots
        });

        // Draw Philosophers
        this.philosophers.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, philosopherRadius, 0, Math.PI * 2);

            let color = COLORS[p.state];
            if (isDeadlocked) color = COLORS[STATES.DEADLOCKED];

            ctx.fillStyle = color;
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw ID
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.id + 1, p.x, p.y);

            // Draw timer progress ring if active
            if (p.state === STATES.EATING || p.state === STATES.THINKING) {
                const progress = p.stateTimer / p.maxStateTime;
                ctx.beginPath();
                ctx.arc(p.x, p.y, philosopherRadius + 5, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            if (p.state === STATES.HUNGRY && this.params.timeoutEnabled) {
                // Show timeout progress
                const progress = p.waitTimer / this.params.waitTimeout;
                ctx.beginPath();
                ctx.arc(p.x, p.y, philosopherRadius + 5, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
                ctx.strokeStyle = 'rgba(255,165,0,0.5)';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        });

        // Deadlock Warning
        if (isDeadlocked) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, cy - 30, canvas.width, 60);
            ctx.fillStyle = '#F44336';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("DEADLOCK DETECTED", cx, cy + 10);
        }
    }

    updateUI() {
        const statusDiv = document.getElementById('status-message');
        if (!statusDiv) return;

        if (this.checkDeadlock()) {
            statusDiv.textContent = "Status: DEADLOCKED! Reset or enable timeouts.";
            statusDiv.style.color = COLORS.DEADLOCKED;
        } else {
            statusDiv.textContent = this.running ? "Status: Running" : "Status: Paused";
            statusDiv.style.color = "#aaa";
        }
    }
}

// Frontend Initialization
if (typeof window !== 'undefined') {
    const sim = new Simulation();

    // Controls
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');

    const sliderThink = document.getElementById('slider-think');
    const valThink = document.getElementById('val-think');

    const sliderEat = document.getElementById('slider-eat');
    const valEat = document.getElementById('val-eat');

    const checkboxTimeout = document.getElementById('checkbox-timeout');
    const sliderTimeout = document.getElementById('slider-timeout');
    const valTimeout = document.getElementById('val-timeout');

    // Event Listeners
    btnStart.addEventListener('click', () => {
        if (!sim.running) sim.start();
    });

    btnPause.addEventListener('click', () => {
        sim.pause();
    });

    btnReset.addEventListener('click', () => {
        sim.reset();
        sim.draw();
        document.getElementById('status-message').textContent = "Status: Ready";
    });

    sliderThink.addEventListener('input', (e) => {
        sim.params.thinkTime = parseInt(e.target.value);
        valThink.textContent = sim.params.thinkTime + 'ms';
    });

    sliderEat.addEventListener('input', (e) => {
        sim.params.eatTime = parseInt(e.target.value);
        valEat.textContent = sim.params.eatTime + 'ms';
    });

    checkboxTimeout.addEventListener('change', (e) => {
        sim.params.timeoutEnabled = e.target.checked;
        const group = document.getElementById('timeout-slider-group');
        if (sim.params.timeoutEnabled) {
            group.style.opacity = '1';
            group.style.pointerEvents = 'auto';
        } else {
            group.style.opacity = '0.5';
            group.style.pointerEvents = 'none';
        }
    });

    sliderTimeout.addEventListener('input', (e) => {
        sim.params.waitTimeout = parseInt(e.target.value);
        valTimeout.textContent = sim.params.waitTimeout + 'ms';
    });

    // Initial Draw
    // Need to wait for layout?
    setTimeout(() => {
        sim.draw();
    }, 100);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Philosopher, Fork, Simulation, STATES };
}
