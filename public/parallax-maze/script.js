// Parallax Maze JS

const world = document.getElementById('world');
const scrollProxy = document.getElementById('scroll-proxy');
const scoreVal = document.getElementById('score-val');
const totalVal = document.getElementById('total-val');
const hintEl = document.querySelector('.hint');

// Configuration
const NUM_LAYERS = 4;
const TOTAL_SCROLL_HEIGHT = 15000;
const LAYER_SPEEDS = [0.2, 0.4, 0.7, 1.2]; // Layer 0 is furthest, Layer 3 is closest
const NUM_SECRETS = 8;
const VIEWPORT_WIDTH = window.innerWidth;
const VIEWPORT_HEIGHT = window.innerHeight;

// State
let secretsFound = 0;
let layerElements = [];
let targets = [];

function init() {
    // 1. Setup Scroll Proxy
    scrollProxy.style.height = `${TOTAL_SCROLL_HEIGHT}px`;

    // 2. Create Layers
    for (let i = 0; i < NUM_LAYERS; i++) {
        const layer = document.createElement('div');
        layer.classList.add('layer', `layer-${i}`);
        // Ensure z-index puts layer 0 at back, layer 3 at front
        layer.style.zIndex = i + 1;
        world.appendChild(layer);
        layerElements.push(layer);
    }

    // 3. Generate Level
    generateLevel();

    // 4. Start Render Loop
    requestAnimationFrame(render);

    // Update total count
    totalVal.textContent = NUM_SECRETS;
}

function generateLevel() {
    // Generate Secrets
    for (let i = 0; i < NUM_SECRETS; i++) {
        // Distribute secrets somewhat evenly along the scroll height
        // Avoid the very top (0) and very bottom
        const scrollYPos = Math.random() * (TOTAL_SCROLL_HEIGHT - 2000) + 1000;

        // Random horizontal position (keep away from edges)
        const targetX = Math.random() * (VIEWPORT_WIDTH - 200) + 100;
        // Random vertical position within the viewport at that scroll point
        // But relative to the VIEWPORT, not world.
        // We want the target to be visible when the USER is at scrollYPos.
        // So visually it should be at some y relative to screen top.
        const screenY = Math.random() * (VIEWPORT_HEIGHT - 200) + 100;

        createSecretMechanism(scrollYPos, targetX, screenY, i);
    }
}

function createSecretMechanism(targetScrollY, screenX, screenY, id) {
    // The "Secret" is physically placed on Layer 0 (the deepest layer).
    // We need to calculate its absolute CSS 'top' position on Layer 0
    // such that when window.scrollY == targetScrollY, the element is at screenY.

    // transformY = -scrollY * speed
    // visualY = cssTop + transformY
    // screenY = cssTop - (targetScrollY * speed)
    // cssTop = screenY + (targetScrollY * speed)

    const layer0Speed = LAYER_SPEEDS[0];
    const targetCssTop = screenY + (targetScrollY * layer0Speed);

    const target = document.createElement('div');
    target.classList.add('target');
    target.style.left = `${screenX}px`;
    target.style.top = `${targetCssTop}px`;
    target.dataset.id = id;
    target.textContent = '?';

    // Click Handler
    target.addEventListener('click', (e) => {
        if (!target.classList.contains('found')) {
            target.classList.add('found');
            target.textContent = '✓';
            secretsFound++;
            scoreVal.textContent = secretsFound;
            hintEl.textContent = "Secret found! Keep scrolling.";
            hintEl.style.color = '#0f0';
            setTimeout(() => {
                hintEl.textContent = "Scroll to align the layers...";
                hintEl.style.color = '#aaa';
            }, 2000);
        }
    });

    layerElements[0].appendChild(target);
    targets.push({ el: target, scrollY: targetScrollY });

    // Now, for every layer ABOVE Layer 0, we must create obstructions (Walls)
    // BUT leave a "Window" (gap) exactly where the target is visually located
    // when the user is at targetScrollY.

    for (let i = 1; i < NUM_LAYERS; i++) {
        const speed = LAYER_SPEEDS[i];

        // Calculate where the hole needs to be on THIS layer
        // cssTop = screenY + (targetScrollY * speed)
        const holeCssTop = screenY + (targetScrollY * speed);
        const holeCssLeft = screenX;
        const holeWidth = 80; // Slightly larger than target (60px)
        const holeHeight = 80;

        // We will build 4 walls AROUND this hole to mask the area.
        // But we don't want to cover the ENTIRE infinite world with 4 divs per secret per layer.
        // Let's just create a "Cluster" of walls around the target area to hide it.
        // Or better: Create large random noise walls, but explicitly CUT OUT this rect?
        // Simpler approach for this demo:
        // Place a few large "Blockers" on this layer that would NORMALLY cover this spot,
        // but offset them so they form a gap.

        createWindowFrame(layerElements[i], holeCssLeft, holeCssTop, holeWidth, holeHeight);
    }
}

function createWindowFrame(layerEl, holeX, holeY, holeW, holeH) {
    // Create 4 walls around the hole to form a frame
    // This frame ensures that if you are NOT aligned, one of these walls will likely block the target.
    // The walls should be large enough to obscure the target if you scroll slightly away.

    const wallThickness = 300; // How thick the walls are

    // Top Wall
    createWall(layerEl, holeX - wallThickness, holeY - wallThickness, holeW + wallThickness*2, wallThickness);
    // Bottom Wall
    createWall(layerEl, holeX - wallThickness, holeY + holeH, holeW + wallThickness*2, wallThickness);
    // Left Wall
    createWall(layerEl, holeX - wallThickness, holeY, wallThickness, holeH);
    // Right Wall
    createWall(layerEl, holeX + holeW, holeY, wallThickness, holeH);

    // Add some random "noise" walls nearby to make it look like a complex structure
    // rather than just a perfect box frame.
    for(let i=0; i<3; i++) {
        const w = Math.random() * 200 + 50;
        const h = Math.random() * 200 + 50;
        const x = holeX + (Math.random() * 600 - 300);
        const y = holeY + (Math.random() * 600 - 300);

        // Simple collision check to ensure we don't accidentally cover the hole with noise
        if (!rectOverlap(x, y, w, h, holeX, holeY, holeW, holeH)) {
            createWall(layerEl, x, y, w, h);
        }
    }
}

function createWall(layer, x, y, w, h) {
    const wall = document.createElement('div');
    wall.classList.add('wall');
    wall.style.left = `${x}px`;
    wall.style.top = `${y}px`;
    wall.style.width = `${w}px`;
    wall.style.height = `${h}px`;
    layer.appendChild(wall);
}

function rectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 < x2 ||
             x2 + w2 < x1 ||
             y1 + h1 < y2 ||
             y2 + h2 < y1);
}

function render() {
    const scrollY = window.scrollY;

    // Update parallax transforms
    for (let i = 0; i < NUM_LAYERS; i++) {
        const speed = LAYER_SPEEDS[i];
        const yPos = -scrollY * speed;
        layerElements[i].style.transform = `translate3d(0, ${yPos}px, 0)`;
    }

    // Optional: Visual Depth Cue / "Sonar"
    // Find closest target to current scroll alignment
    let minDist = Infinity;
    targets.forEach(t => {
        if (!t.el.classList.contains('found')) {
            const dist = Math.abs(t.scrollY - scrollY);
            if (dist < minDist) minDist = dist;
        }
    });

    // Modulate HUD opacity or something based on proximity?
    // Let's keep it simple for now. Maybe audio cues later if requested.

    requestAnimationFrame(render);
}

// Start
init();
