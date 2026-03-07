const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');
const numberInput = document.getElementById('number-input');
const addBtn = document.getElementById('add-btn');
const resetBtn = document.getElementById('reset-btn');
const clearBtn = document.getElementById('clear-btn');

// --- Global State ---
let width = window.innerWidth;
let height = window.innerHeight;

// Graph data structure: Adjacency list mapping node -> array of children
// The tree is directed towards 1 (e.g., 2 -> 1, 4 -> 2, etc.) but for layout, we treat 1 as root and build upwards.
let graph = new Map(); // child -> [parents...] to build the tree from root(1) upwards
let nodes = new Map(); // node value -> node object { x, y, value, radius, color, isNew, sequenceIndex }

// Simulation / Render settings
const baseRadius = 8;
const ySpacing = 60; // Distance between levels
const xSpacing = 40; // Base horizontal spacing

// View transformations for Pan/Zoom
let transform = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let currentSequence = null; // Currently animating sequence
let animationProgress = 0; // 0 to 1 between nodes in the sequence
let animationSpeed = 0.05; // Base speed
let lastTime = 0;

// Initialize canvas size
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Initial centering if tree is empty
    if (nodes.size <= 1) {
        resetView();
    }
}
window.addEventListener('resize', resize);
resize();

// --- Data Logic ---

// Computes Collatz sequence for n until it reaches 1 or an already existing node
function computeCollatzPath(n) {
    const path = [];
    let current = n;

    while (true) {
        path.push(current);
        if (current === 1) break;
        if (nodes.has(current)) break; // Reached an existing part of the tree

        if (current % 2 === 0) {
            current = current / 2;
        } else {
            current = 3 * current + 1;
        }
    }
    return path;
}

// Add a sequence to the graph
function addSequenceToGraph(path) {
    for (let i = 0; i < path.length - 1; i++) {
        const parent = path[i];
        const child = path[i + 1];

        if (!graph.has(child)) {
            graph.set(child, []);
        }
        if (!graph.get(child).includes(parent)) {
            graph.get(child).push(parent);
        }

        // Initialize node if it doesn't exist
        if (!nodes.has(parent)) {
            nodes.set(parent, { value: parent, x: 0, y: 0, color: '#0ea5e9' }); // Default color
        }
    }

    // Ensure last node (either 1 or existing node) is initialized
    const lastNode = path[path.length - 1];
    if (!nodes.has(lastNode)) {
        nodes.set(lastNode, { value: lastNode, x: 0, y: 0, color: '#38bdf8' });
    }

    // Recompute layout
    computeLayout();
}

// --- Layout Algorithm ---

// A simple hierarchical layout.
// Traverses from root (1) upwards, computing subtree widths to prevent overlap.
function computeLayout() {
    if (!nodes.has(1)) return; // Empty tree

    // 1. Assign depths (levels) from root
    const depths = new Map();
    const q = [{ node: 1, depth: 0 }];
    let maxDepth = 0;

    while (q.length > 0) {
        const { node, depth } = q.shift();
        if (!depths.has(node)) {
            depths.set(node, depth);
            maxDepth = Math.max(maxDepth, depth);

            const parents = graph.get(node) || [];
            for (const p of parents) {
                q.push({ node: p, depth: depth + 1 });
            }
        }
    }

    // 2. Assign horizontal positions (X) recursively based on subtree width
    // To keep it simple, we'll do a post-order traversal to compute widths, then pre-order to set X.
    const subtreeWidths = new Map();

    function computeSubtreeWidth(node) {
        const parents = graph.get(node) || [];
        if (parents.length === 0) {
            subtreeWidths.set(node, xSpacing);
            return xSpacing;
        }

        let width = 0;
        for (const p of parents) {
            width += computeSubtreeWidth(p);
        }

        // Ensure minimum width
        width = Math.max(width, xSpacing);
        subtreeWidths.set(node, width);
        return width;
    }

    computeSubtreeWidth(1);

    // 3. Set actual coordinates (X, Y)
    // Root is centered horizontally
    function setPositions(node, x, depth) {
        const nodeObj = nodes.get(node);

        // Add a bit of organic randomness to X and Y
        const randX = (Math.random() - 0.5) * xSpacing * 0.3;
        const randY = (Math.random() - 0.5) * ySpacing * 0.2;

        nodeObj.targetX = x + randX;
        // Y grows upwards (negative Y in canvas coordinate space, relative to root)
        nodeObj.targetY = -(depth * ySpacing) + randY;

        // Animate newly added nodes from top
        if (nodeObj.x === undefined) {
             nodeObj.x = nodeObj.targetX;
             nodeObj.y = nodeObj.targetY - 200; // Start high up
             nodeObj.isNew = true;
        }

        const parents = graph.get(node) || [];
        const totalWidth = subtreeWidths.get(node) || xSpacing;
        let currentX = x - totalWidth / 2;

        for (const p of parents) {
            const pWidth = subtreeWidths.get(p) || xSpacing;
            setPositions(p, currentX + pWidth / 2, depth + 1);
            currentX += pWidth;
        }
    }

    // Initialize root position
    const rootNode = nodes.get(1);
    if(rootNode.x === undefined) {
         rootNode.x = 0;
         rootNode.y = 0;
         rootNode.targetX = 0;
         rootNode.targetY = 0;
         rootNode.color = '#facc15'; // Special color for root
    }

    setPositions(1, 0, 0);
}

// --- Interaction & Event Listeners ---

addBtn.addEventListener('click', handleAddNumber);
numberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddNumber();
});

resetBtn.addEventListener('click', resetView);

clearBtn.addEventListener('click', () => {
    graph.clear();
    nodes.clear();
    currentSequence = null;
    initTree();
});

function handleAddNumber() {
    const val = parseInt(numberInput.value);
    if (isNaN(val) || val < 1) return;

    numberInput.value = ''; // Clear input

    // Don't add if currently animating to prevent overlap issues
    if (currentSequence) return;

    const path = computeCollatzPath(val);

    // Reverse path so we animate from starting number down to root
    currentSequence = {
        path: path,
        index: 0,
        progress: 0
    };

    addSequenceToGraph(path);
}

function resetView() {
    // Focus near the root node
    let rootY = 0;
    if(nodes.has(1)) rootY = nodes.get(1).y;

    transform = {
        x: width / 2,
        y: height - 100, // Put root near bottom
        scale: 1
    };
}

// Pan & Zoom handlers
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    transform.x += dx;
    transform.y += dy;
    dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;

    // Zoom relative to mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const oldScale = transform.scale;
    let newScale = transform.scale * (direction > 0 ? zoomFactor : 1 / zoomFactor);

    // Clamp scale
    newScale = Math.max(0.05, Math.min(newScale, 5));

    const scaleRatio = newScale / oldScale;

    // Adjust transform to keep mouse point stationary
    transform.x = mouseX - (mouseX - transform.x) * scaleRatio;
    transform.y = mouseY - (mouseY - transform.y) * scaleRatio;
    transform.scale = newScale;
});

// Mobile Touch Support for Pan/Zoom
let initialDistance = null;
let lastTouchCenter = null;

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - dragStart.x;
        const dy = e.touches[0].clientY - dragStart.y;
        transform.x += dx;
        transform.y += dy;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        const scaleRatio = newDistance / initialDistance;

        const currentCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };

        const oldScale = transform.scale;
        let newScale = transform.scale * scaleRatio;
        newScale = Math.max(0.05, Math.min(newScale, 5));
        const actualRatio = newScale / oldScale;

        transform.x = currentCenter.x - (lastTouchCenter.x - transform.x) * actualRatio;
        transform.y = currentCenter.y - (lastTouchCenter.y - transform.y) * actualRatio;

        // Pan while zooming
        transform.x += currentCenter.x - lastTouchCenter.x;
        transform.y += currentCenter.y - lastTouchCenter.y;

        transform.scale = newScale;
        initialDistance = newDistance;
        lastTouchCenter = currentCenter;
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
    initialDistance = null;
    lastTouchCenter = null;
});


// --- Rendering & Animation Loop ---

function drawNode(x, y, value, color, glowRadius, isHighlighted) {
    ctx.beginPath();
    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);

    // Glow effect
    if (glowRadius > 0) {
        ctx.shadowBlur = glowRadius;
        ctx.shadowColor = color;
    } else {
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = color;
    ctx.fill();

    // Reset shadow for text
    ctx.shadowBlur = 0;

    // Draw value text
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#e0f2fe';
    ctx.font = isHighlighted ? 'bold 12px Courier New' : '10px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y - 15);
}

function drawEdge(startX, startY, endX, endY, progress = 1, color = '#1e3a8a') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Calculate control points for a smooth organic curve (vertical orientation)
    const controlY = startY + (endY - startY) * 0.5;

    // Calculate current point based on progress (0 to 1) using cubic bezier math
    // For visual simplicity, if progress < 1, we just draw a partial quadratic/cubic curve

    if (progress >= 1) {
        ctx.bezierCurveTo(startX, controlY, endX, controlY, endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    } else if (progress > 0) {
        // Interpolate bezier curve for animation
        const t = progress;
        // B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
        // P0=(startX, startY), P1=(startX, controlY), P2=(endX, controlY), P3=(endX, endY)

        // Compute intermediate point to draw line to
        const ix = Math.pow(1-t, 3)*startX + 3*Math.pow(1-t, 2)*t*startX + 3*(1-t)*Math.pow(t, 2)*endX + Math.pow(t, 3)*endX;
        const iy = Math.pow(1-t, 3)*startY + 3*Math.pow(1-t, 2)*t*controlY + 3*(1-t)*Math.pow(t, 2)*controlY + Math.pow(t, 3)*endY;

        ctx.lineTo(ix, iy); // Just straight line interpolation for the glowing head

        ctx.strokeStyle = '#38bdf8'; // Glowing color for animated edge
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    }
}

function update(dt) {
    // Animate nodes towards target positions
    nodes.forEach(node => {
        if (node.targetX !== undefined) {
            node.x += (node.targetX - node.x) * 0.1;
            node.y += (node.targetY - node.y) * 0.1;

            if (Math.abs(node.targetX - node.x) < 0.5) node.x = node.targetX;
            if (Math.abs(node.targetY - node.y) < 0.5) node.y = node.targetY;
        }
    });

    // Handle sequence animation
    if (currentSequence) {
        currentSequence.progress += animationSpeed * (dt / 16); // normalize speed

        if (currentSequence.progress >= 1) {
            currentSequence.progress = 0;
            currentSequence.index++;

            // Reached end of sequence
            if (currentSequence.index >= currentSequence.path.length - 1) {
                currentSequence = null;
                // Mark nodes as no longer new
                nodes.forEach(n => n.isNew = false);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Draw static edges
    nodes.forEach((node, nodeVal) => {
        const parents = graph.get(nodeVal) || [];
        parents.forEach(parentVal => {
            const parent = nodes.get(parentVal);
            if (!parent) return;

            // Don't draw the edge if it's currently being animated
            let isAnimatingEdge = false;
            if (currentSequence) {
                const seqPath = currentSequence.path;
                const pIdx = seqPath.indexOf(parentVal);
                const cIdx = seqPath.indexOf(nodeVal);
                if (pIdx !== -1 && cIdx === pIdx + 1 && currentSequence.index <= pIdx) {
                    isAnimatingEdge = true;
                }
            }

            if (!isAnimatingEdge) {
                drawEdge(parent.x, parent.y, node.x, node.y, 1, '#1e3a8a');
            }
        });
    });

    // 2. Draw animated edges and glowing "head"
    if (currentSequence) {
        const seqPath = currentSequence.path;
        const curIdx = currentSequence.index;
        const parentVal = seqPath[curIdx];
        const childVal = seqPath[curIdx + 1];

        if (parentVal !== undefined && childVal !== undefined) {
            const parent = nodes.get(parentVal);
            const child = nodes.get(childVal);

            if (parent && child) {
                drawEdge(parent.x, parent.y, child.x, child.y, currentSequence.progress, '#38bdf8');

                // Draw a bright dot at the current progress position
                const t = currentSequence.progress;
                const controlY = parent.y + (child.y - parent.y) * 0.5;
                const ix = Math.pow(1-t, 3)*parent.x + 3*Math.pow(1-t, 2)*t*parent.x + 3*(1-t)*Math.pow(t, 2)*child.x + Math.pow(t, 3)*child.x;
                const iy = Math.pow(1-t, 3)*parent.y + 3*Math.pow(1-t, 2)*t*controlY + 3*(1-t)*Math.pow(t, 2)*controlY + Math.pow(t, 3)*child.y;

                ctx.beginPath();
                ctx.arc(ix, iy, baseRadius * 1.5, 0, Math.PI*2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#38bdf8';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // 3. Draw nodes
    nodes.forEach((node, val) => {
        let isHighlighted = false;
        let glow = 0;
        let color = node.color || '#0ea5e9';

        if (val === 1) color = '#facc15'; // Root is distinct

        if (currentSequence) {
            if (currentSequence.path.includes(val)) {
                // Highlight nodes in the current sequence
                const idx = currentSequence.path.indexOf(val);
                if (idx <= currentSequence.index) {
                     isHighlighted = true;
                     glow = 15;
                     color = '#38bdf8';
                }
            }
        } else if (node.isNew) {
            glow = 10;
        }

        drawNode(node.x, node.y, val, color, glow, isHighlighted);
    });

    ctx.restore();
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// Initialization
function initTree() {
    // Add seed nodes (1 and maybe a small sequence)
    addSequenceToGraph([2, 1]);

    // Position root initially
    const root = nodes.get(1);
    root.x = 0; root.y = 0; root.targetX = 0; root.targetY = 0;

    resetView();
}

initTree();
requestAnimationFrame(loop);
