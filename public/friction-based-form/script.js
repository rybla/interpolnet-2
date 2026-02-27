// Friction-Based Form Fields Demo Script

class HeatManager {
    constructor() {
        this.fields = new Map(); // Stores state for each input
        this.decayRate = 0.5; // Temperature loss per frame
        this.frictionCoefficient = 0.8; // Heat gain per pixel of movement
        this.thawThreshold = 80; // Temperature needed to unlock
        this.freezeThreshold = 60; // Temperature below which it re-locks
        this.maxTemp = 100;

        this.particleSystem = null;
        this.lastTime = 0;

        if (typeof document !== 'undefined') {
             this.init();
        }
    }

    init() {
        this.particleSystem = new ParticleSystem('particleCanvas');

        const inputs = document.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            const id = input.id || 'submitBtn';
            const wrapper = input.closest('.input-wrapper');

            // Initialize state
            this.fields.set(id, {
                id: id,
                element: input,
                wrapper: wrapper,
                temp: 0,
                isThawed: false,
                lastMouseX: 0,
                lastMouseY: 0,
                isHovering: false
            });

            // Add event listeners to the WRAPPER (to capture movement even when input is disabled)
            if (wrapper) {
                wrapper.addEventListener('mousemove', (e) => this.handleMouseMove(e, id));
                wrapper.addEventListener('mouseenter', (e) => {
                    const state = this.fields.get(id);
                    state.isHovering = true;
                    state.lastMouseX = e.clientX;
                    state.lastMouseY = e.clientY;
                });
                wrapper.addEventListener('mouseleave', () => {
                    const state = this.fields.get(id);
                    state.isHovering = false;
                });
            }

            // Keep it warm while typing
            input.addEventListener('input', () => {
                const state = this.fields.get(id);
                if (state) state.temp = Math.min(state.temp + 10, this.maxTemp);
            });
        });

        // Start the physics loop
        requestAnimationFrame((time) => this.loop(time));
    }

    handleMouseMove(e, id) {
        const state = this.fields.get(id);
        if (!state || !state.isHovering) return;

        // Calculate velocity
        const dx = e.clientX - state.lastMouseX;
        const dy = e.clientY - state.lastMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Add heat based on friction
        if (distance > 0) {
            // Cap heat gain per move event
            const heatGain = Math.min(distance * this.frictionCoefficient, 8);
            state.temp = Math.min(state.temp + heatGain, this.maxTemp);

            // Trigger particles if moving fast enough
            if (distance > 5 && this.particleSystem) {
                // Determine particle type based on heat
                const type = state.temp > 70 ? 'spark' : 'steam';
                this.particleSystem.spawn(e.clientX, e.clientY, type);
            }
        }

        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
    }

    loop(time) {
        // Calculate delta time for consistent speed
        const deltaTime = (time - this.lastTime) / 16.67;
        this.lastTime = time;

        // Safety cap for delta time (e.g., if tab was inactive)
        const dt = Math.min(deltaTime, 3.0);

        this.fields.forEach((state) => {
            // Decay temperature
            if (state.temp > 0) {
                state.temp = Math.max(0, state.temp - (this.decayRate * dt));
            }

            // Check thresholds
            if (!state.isThawed && state.temp >= this.thawThreshold) {
                this.thaw(state);
            } else if (state.isThawed && state.temp <= this.freezeThreshold) {
                this.freeze(state);
            }

            // Update UI
            this.updateUI(state);
        });

        if (this.particleSystem) {
            this.particleSystem.update();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    thaw(state) {
        state.isThawed = true;
        state.element.disabled = false;
        state.wrapper.classList.add('thawed');
    }

    freeze(state) {
        state.isThawed = false;
        state.element.disabled = true;
        state.wrapper.classList.remove('thawed');
    }

    updateUI(state) {
        const mercury = state.wrapper.querySelector('.mercury');
        const frost = state.wrapper.querySelector('.frost-overlay');

        // Update thermometer height
        if (mercury) {
             mercury.style.height = `${state.temp}%`;
             // Change color based on temp
             mercury.style.background = `linear-gradient(to top, #2196f3, hsl(${100 - state.temp}, 100%, 50%))`;
        }

        // Update frost opacity (inverse of temp)
        if (frost) {
            const opacity = Math.max(0, 0.95 - (state.temp / 100));
            frost.style.opacity = opacity;
        }

        // Visual shake if temp is high but not yet thawed
        if (state.temp > 40 && !state.isThawed) {
             const intensity = (state.temp - 40) / 10; // Increasing shake
             const x = (Math.random() - 0.5) * intensity;
             const y = (Math.random() - 0.5) * intensity;
             state.wrapper.style.transform = `translate(${x}px, ${y}px)`;
        } else {
             state.wrapper.style.transform = 'none';
        }
    }
}

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.particles = [];

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    spawn(x, y, type) {
        // Limit total particles for performance
        if (this.particles.length > 200) return;

        this.particles.push(new Particle(x, y, type));
    }

    update() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(this.ctx);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 20 - 10);
        this.type = type; // 'steam' or 'spark'

        if (type === 'spark') {
            this.vx = (Math.random() * 4 - 2);
            this.vy = -(Math.random() * 4 + 2);
            this.life = 1.0;
            this.decay = Math.random() * 0.05 + 0.02;
            this.size = Math.random() * 3 + 1;
            this.color = `255, ${Math.floor(Math.random() * 200)}, 50`;
        } else {
            // Steam
            this.vx = (Math.random() * 2 - 1);
            this.vy = -(Math.random() * 2 + 1);
            this.life = 0.8;
            this.decay = Math.random() * 0.02 + 0.005;
            this.size = Math.random() * 10 + 5;
            this.color = `200, 230, 255`;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        if (this.type === 'spark') {
            this.vy += 0.2; // Gravity
        } else {
            this.size *= 1.02; // Steam expands
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeatManager, ParticleSystem };
}

// Start only in browser
if (typeof window !== 'undefined') {
    window.onload = () => new HeatManager();
}
