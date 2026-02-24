document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('menu-area');
    const menuItemsData = [
        { text: 'ABOUT', href: '#' },
        { text: 'PROJECTS', href: '#' },
        { text: 'CONTACT', href: '#' },
        { text: 'BLOG', href: '#' },
        { text: 'SHOP', href: '#' },
        { text: 'MANIFESTO', href: '#' }
    ];

    let items = [];
    let mouse = { x: -1000, y: -1000 };
    let chaosInterval;

    // Physics constants
    const FRICTION = 0.9;
    const EASE = 0.05;
    const REPULSION_RADIUS = 300;
    const REPULSION_FORCE = 2.0;
    const CHAOS_DELAY = 4000;

    class MenuItem {
        constructor(data) {
            this.element = document.createElement('a');
            this.element.href = data.href;
            this.element.textContent = data.text;
            this.element.classList.add('menu-item');
            container.appendChild(this.element);

            this.width = this.element.offsetWidth;
            this.height = this.element.offsetHeight;

            this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            this.home = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            this.vel = { x: 0, y: 0 };

            // Randomize start position slightly
            this.pos.x += (Math.random() - 0.5) * 100;
            this.pos.y += (Math.random() - 0.5) * 100;

            this.randomizeHome();
        }

        randomizeHome() {
            // Keep within bounds but chaotic
            const margin = 100;
            this.home.x = margin + Math.random() * (window.innerWidth - 2 * margin - this.width);
            this.home.y = margin + Math.random() * (window.innerHeight - 2 * margin - this.height);

            // Occasionally glitch color
            if (Math.random() > 0.7) {
                const colors = ['glitch-1', 'glitch-2', 'glitch-3'];
                this.element.classList.remove(...colors);
                this.element.classList.add(colors[Math.floor(Math.random() * colors.length)]);
                setTimeout(() => this.element.classList.remove(...colors), 500);
            }
        }

        update() {
            // Attraction to home
            const dxHome = this.home.x - this.pos.x;
            const dyHome = this.home.y - this.pos.y;

            this.vel.x += dxHome * EASE * 0.1;
            this.vel.y += dyHome * EASE * 0.1;

            // Repulsion from mouse
            const dxMouse = this.pos.x + this.width / 2 - mouse.x;
            const dyMouse = this.pos.y + this.height / 2 - mouse.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < REPULSION_RADIUS) {
                const force = (1 - distMouse / REPULSION_RADIUS) * REPULSION_FORCE;
                this.vel.x += (dxMouse / distMouse) * force * 50;
                this.vel.y += (dyMouse / distMouse) * force * 50;
            }

            // Apply velocity and friction
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.vel.x *= FRICTION;
            this.vel.y *= FRICTION;

            // Render
            this.element.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
        }
    }

    function init() {
        items = menuItemsData.map(data => new MenuItem(data));

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('touchmove', e => {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        });

        window.addEventListener('resize', () => {
            items.forEach(item => item.randomizeHome());
        });

        // Chaos timer
        chaosInterval = setInterval(() => {
            items.forEach(item => item.randomizeHome());

            // Randomly flash background color for a frame
            if(Math.random() > 0.8) {
                document.body.style.backgroundColor = '#1a1a1a';
                setTimeout(() => document.body.style.backgroundColor = '', 50);
            }
        }, CHAOS_DELAY);

        animate();
    }

    function animate() {
        items.forEach(item => item.update());
        requestAnimationFrame(animate);
    }

    init();
});
