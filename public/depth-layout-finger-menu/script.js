
// Menu Data Structure
const menuData = {
    label: "ROOT",
    children: [
        {
            label: "SYSTEM",
            children: [
                { label: "DIAGNOSTICS", children: [{ label: "CPU" }, { label: "MEMORY" }, { label: "DISK" }] },
                { label: "CONFIG", children: [{ label: "DISPLAY" }, { label: "AUDIO" }, { label: "INPUT" }] },
                { label: "LOGS", children: [{ label: "SYSTEM" }, { label: "SECURITY" }, { label: "APP" }] }
            ]
        },
        {
            label: "NETWORK",
            children: [
                { label: "STATUS", children: [] },
                { label: "WIFI", children: [{ label: "SCAN" }, { label: "CONNECT" }, { label: "FORGET" }] },
                { label: "ETHERNET", children: [] },
                { label: "BLUETOOTH", children: [] }
            ]
        },
        {
            label: "MEDIA",
            children: [
                { label: "PLAYER", children: [{ label: "PLAY" }, { label: "PAUSE" }, { label: "STOP" }] },
                { label: "LIBRARY", children: [{ label: "MUSIC" }, { label: "VIDEO" }, { label: "PHOTOS" }] }
            ]
        },
        {
            label: "TOOLS",
            children: [
                { label: "CALCULATOR", children: [] },
                { label: "NOTES", children: [] },
                { label: "TERMINAL", children: [] }
            ]
        },
        {
            label: "POWER",
            children: [
                { label: "SLEEP", children: [] },
                { label: "RESTART", children: [] },
                { label: "SHUTDOWN", children: [] }
            ]
        }
    ]
};

// State
let state = {
    path: [menuData],
    activeNode: menuData,
    cameraZ: -500,
    targetZ: -500,
    itemSpacing: 1000,
    focalLength: 800,
    isTransitioning: false,
    transitionProgress: 0
};

// Constants
const COLOR_PRIMARY = '#00ffaa';
const COLOR_SECONDARY = '#008855';
const FOG_DENSITY = 0.0005;

// DOM Elements
let canvas, ctx;
let breadcrumbsEl, instructionsEl;

// Initialization
function init() {
    if (typeof document !== 'undefined') {
        canvas = document.getElementById('tunnel-canvas');
        ctx = canvas.getContext('2d');
        breadcrumbsEl = document.getElementById('breadcrumbs');
        instructionsEl = document.getElementById('instructions');

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Input Listeners
        window.addEventListener('wheel', handleWheel);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('click', handleClick);

        // Start Loop
        requestAnimationFrame(loop);
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Logic
function getProjectedPoint(x, y, z) {
    const relativeZ = z - state.cameraZ;
    if (relativeZ <= 0) return null; // Behind camera

    const scale = state.focalLength / relativeZ;
    const screenX = canvas.width / 2 + x * scale;
    const screenY = canvas.height / 2 + y * scale;

    return { x: screenX, y: screenY, scale: scale, z: relativeZ };
}

function update() {
    // Smooth scroll
    const diff = state.targetZ - state.cameraZ;
    state.cameraZ += diff * 0.1;

    // Bounds checking for scrolling
    const maxZ = (state.activeNode.children.length - 1) * state.itemSpacing + 500;
    // const minZ = -500;

    // We allow targetZ to go out of bounds slightly for "bounce" effect but clamp it eventually?
    // Actually, let's just clamp targetZ directly for simplicity in navigation
    // state.targetZ = Math.max(minZ, Math.min(state.targetZ, maxZ));
    // But we want to fly "through" them.
}

function draw() {
    // Clear
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Tunnel/Grid lines (optional, adds speed feel)
    drawTunnelGrid();

    // Draw Items
    if (state.activeNode && state.activeNode.children) {
        // Sort by Z (painters algorithm) - farthest first
        // In our case, higher Z is farther away.
        // We iterate and project, then sort?
        // Actually, since z is just index * spacing, we can just iterate backwards.

        for (let i = state.activeNode.children.length - 1; i >= 0; i--) {
            const child = state.activeNode.children[i];
            const itemZ = i * state.itemSpacing;

            // Layout: Spiral or straight?
            // Let's do a slight spiral
            const angle = i * 0.5;
            const radius = 200;
            const itemX = Math.cos(angle) * radius;
            const itemY = Math.sin(angle) * radius;

            const proj = getProjectedPoint(itemX, itemY, itemZ);

            if (proj) {
                drawItem(child, proj, i);
            }
        }
    }

    // Draw Breadcrumbs
    if (breadcrumbsEl) {
        breadcrumbsEl.innerText = state.path.map(n => n.label).join(' > ');
    }
}

function drawTunnelGrid() {
    ctx.strokeStyle = COLOR_SECONDARY;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.1;

    // Draw rings
    const numRings = 10;
    const ringSpacing = 1000;
    // Calculate first ring Z based on camera to create infinite tunnel illusion
    const firstRingIndex = Math.floor(state.cameraZ / ringSpacing);

    for (let i = 0; i < numRings; i++) {
        const z = (firstRingIndex + i) * ringSpacing;
        const proj = getProjectedPoint(0, 0, z);
        if (proj) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 1000 * proj.scale, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1.0;
}

function drawItem(item, proj, index) {
    const distance = proj.z;

    // Fog calculation
    // Opacity falls off as distance increases
    // Also fade out if very close (clipping plane)
    let opacity = 1.0 / (1 + distance * FOG_DENSITY);
    if (distance < 100) opacity *= distance / 100;

    if (opacity < 0.01) return;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = COLOR_PRIMARY;
    ctx.strokeStyle = COLOR_PRIMARY;

    // Is this item the "active" one (closest to ideal viewing plane)?
    // Ideal plane: say z=500 relative to camera
    const distToIdeal = Math.abs(distance - 500);
    const isHovered = distToIdeal < 300; // rough "focus" area

    const fontSize = 40 * proj.scale;
    ctx.font = `${isHovered ? 'bold' : ''} ${fontSize}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw Box or Bracket
    const boxSize = 100 * proj.scale;

    ctx.beginPath();
    // Bracket shape
    const padding = 20 * proj.scale;
    // Left bracket
    ctx.moveTo(proj.x - boxSize, proj.y - boxSize/2);
    ctx.lineTo(proj.x - boxSize - padding, proj.y - boxSize/2);
    ctx.lineTo(proj.x - boxSize - padding, proj.y + boxSize/2);
    ctx.lineTo(proj.x - boxSize, proj.y + boxSize/2);

    // Right bracket
    ctx.moveTo(proj.x + boxSize, proj.y - boxSize/2);
    ctx.lineTo(proj.x + boxSize + padding, proj.y - boxSize/2);
    ctx.lineTo(proj.x + boxSize + padding, proj.y + boxSize/2);
    ctx.lineTo(proj.x + boxSize, proj.y + boxSize/2);

    ctx.lineWidth = 2 * proj.scale;
    ctx.stroke();

    // Draw Text
    ctx.fillText(item.label, proj.x, proj.y);

    // Glow if hovered
    if (isHovered) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLOR_PRIMARY;
        ctx.fillText(item.label, proj.x, proj.y);
        ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1.0;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Interaction Handlers
function handleWheel(e) {
    // Determine scroll direction
    // DeltaY positive = scroll down = move forward (increase Z)
    state.targetZ += e.deltaY * 2;
    // Clamp slightly so we don't go back before start
    if (state.targetZ < -700) state.targetZ = -700;
}

let touchStartY = 0;
function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}
function handleTouchMove(e) {
    const deltaY = touchStartY - e.touches[0].clientY;
    state.targetZ += deltaY * 2;
    touchStartY = e.touches[0].clientY;
    if (state.targetZ < -700) state.targetZ = -700;
}
function handleTouchEnd() {}

function handleClick(e) {
    // Find if we clicked on an item
    // We can just check which item is currently "focused" (closest to Z=500 relative)
    // Simplification: User "Enters" the item that is currently in front of them

    if (!state.activeNode.children) return;

    let closestIndex = -1;
    let minDist = Infinity;

    state.activeNode.children.forEach((child, i) => {
        const itemZ = i * state.itemSpacing;
        const relativeZ = itemZ - state.cameraZ;
        const dist = Math.abs(relativeZ - 500); // 500 is our "sweet spot"

        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    });

    if (closestIndex !== -1 && minDist < 400) { // Tolerance
        enterNode(state.activeNode.children[closestIndex]);
    } else {
        // Maybe navigate back if clicked far away? Or separate back button?
        // Let's make "Back" a virtual item at the start or end?
        // For now, clicking outside -> no op.
        // User can go back by scrolling all the way back? No, that's just Z.
        // Let's add a back logic: if scrolled to the very beginning, maybe "Back" appears?
        // Or simpler: Breadcrumbs click handler?
    }
}

function enterNode(node) {
    if (!node.children || node.children.length === 0) return; // Leaf node

    // Transition effect
    state.isTransitioning = true;

    // Logic:
    // 1. Set path
    state.path.push(node);
    // 2. Set active node
    state.activeNode = node;
    // 3. Reset camera for new tunnel
    state.cameraZ = -1500; // Start slightly back to fly in
    state.targetZ = -500;
}

// Breadcrumbs back navigation
if (typeof document !== 'undefined') {
    document.getElementById('breadcrumbs').addEventListener('click', () => {
        if (state.path.length > 1) {
            state.path.pop();
            state.activeNode = state.path[state.path.length - 1];
            state.cameraZ = -500;
            state.targetZ = -500;
        }
    });
}

// Start
init();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        menuData,
        getProjectedPoint,
        setCanvasMock: (mock) => { canvas = mock; }
    };
}
