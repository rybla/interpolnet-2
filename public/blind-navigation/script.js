
class SoundManager {
    constructor() {
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    ping(frequency = 440, duration = 0.5) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

class UIElement {
    constructor(x, y, width, height, label, action) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.action = action;
    }

    contains(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    }

    draw(ctx, waves) {
        let maxIntensity = 0;

        for (let wave of waves) {
             // Find closest point on rectangle to circle center
             const closestX = Math.max(this.x, Math.min(wave.x, this.x + this.width));
             const closestY = Math.max(this.y, Math.min(wave.y, this.y + this.height));

             const distToBox = Math.hypot(wave.x - closestX, wave.y - closestY);

             // Find furthest point (one of the corners)
             const corners = [
                 {x: this.x, y: this.y},
                 {x: this.x + this.width, y: this.y},
                 {x: this.x, y: this.y + this.height},
                 {x: this.x + this.width, y: this.y + this.height}
             ];
             let maxDistToBox = 0;
             for(let c of corners) {
                 const d = Math.hypot(wave.x - c.x, wave.y - c.y);
                 if(d > maxDistToBox) maxDistToBox = d;
             }

             // Check intersection or proximity
             let dist = 0;
             if (wave.radius < distToBox) {
                 dist = distToBox - wave.radius;
             } else if (wave.radius > maxDistToBox) {
                 dist = wave.radius - maxDistToBox;
             } else {
                 dist = 0; // Intersection
             }

             if (dist < 150) {
                 const intensity = (1 - dist / 150) * wave.opacity;
                 maxIntensity = Math.max(maxIntensity, intensity);
             }
        }

        if (maxIntensity > 0.01) {
            ctx.strokeStyle = `rgba(0, 255, 0, ${maxIntensity})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Fill slightly
            ctx.fillStyle = `rgba(0, 255, 0, ${maxIntensity * 0.1})`;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.font = '16px monospace';
            ctx.fillStyle = `rgba(0, 255, 0, ${maxIntensity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        }
    }
}

class Wave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        // Max radius covers the screen diagonal roughly
        if (typeof window !== 'undefined') {
            this.maxRadius = Math.hypot(window.innerWidth, window.innerHeight);
        } else {
            this.maxRadius = 1000;
        }
        this.speed = 8;
        this.opacity = 1;
        this.dead = false;
    }

    update() {
        this.radius += this.speed;
        this.opacity -= 0.005; // Fade out slowly
        if (this.opacity <= 0) {
            this.opacity = 0;
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.opacity <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 0, ${this.opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Global state
let waves = [];
let uiElements = [];
let soundManager;
let canvas;
let ctx;
let animationId;

function showMessage(msg) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('status-message');
    if (!el) return;
    el.innerText = msg;
    el.classList.add('visible');
    el.style.opacity = 1;
    setTimeout(() => {
        el.style.opacity = 0;
    }, 2000);
}

function initUI() {
    if (!canvas) return;
    uiElements = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Header
    uiElements.push(new UIElement(20, 20, 100, 40, "Home", () => showMessage("Navigated Home")));
    uiElements.push(new UIElement(140, 20, 100, 40, "About", () => showMessage("Navigated to About")));
    uiElements.push(new UIElement(260, 20, 100, 40, "Contact", () => showMessage("Navigated to Contact")));

    // Main Content
    uiElements.push(new UIElement(cx - 150, cy - 100, 300, 200, "Main Content Area", () => showMessage("Clicked Main Content")));

    // Footer
    uiElements.push(new UIElement(cx - 100, canvas.height - 60, 200, 40, "Footer Link", () => showMessage("Footer Action")));
}

function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initUI();
}

function loop() {
    if (!ctx || !canvas) return;

    // Clear with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw waves
    for (let i = waves.length - 1; i >= 0; i--) {
        waves[i].update();
        waves[i].draw(ctx);
        if (waves[i].dead) waves.splice(i, 1);
    }

    // Draw UI elements
    for (let el of uiElements) {
        el.draw(ctx, waves);
    }

    animationId = requestAnimationFrame(loop);
}

function init() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', resize);
    soundManager = new SoundManager();

    canvas.addEventListener('click', (e) => {
        // Spawn wave
        waves.push(new Wave(e.clientX, e.clientY));
        if (soundManager) soundManager.ping(200 + Math.random() * 100);

        // Check hit
        let hit = false;
        for (let el of uiElements) {
            if (el.contains(e.clientX, e.clientY)) {
                el.action();
                if (soundManager) soundManager.ping(600, 0.1); // High pitch for hit
                hit = true;
            }
        }
    });

    resize();
    loop();
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', init);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UIElement,
        Wave,
        SoundManager,
        initUI,
        setCanvas: (c) => canvas = c, // For testing
        setCtx: (c) => ctx = c,       // For testing
        getWaves: () => waves,
        getUIElements: () => uiElements
    };
}
