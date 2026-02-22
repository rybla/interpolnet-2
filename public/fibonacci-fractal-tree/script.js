
// State
const state = {
  n: 5,
  memo: false,
  speed: 20, // ms delay between steps
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
};

// DOM Elements
const ui = {
  nInput: document.getElementById('n-input'),
  nValue: document.getElementById('n-value'),
  memoToggle: document.getElementById('memo-toggle'),
  speedInput: document.getElementById('speed-input'),
  speedValue: document.getElementById('speed-value'),
  resetBtn: document.getElementById('reset-btn'),
  svgContainer: document.getElementById('svg-container'),
  totalCalls: document.getElementById('total-calls'),
  maxDepth: document.getElementById('max-depth'),
};

// SVG Setup
const ns = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(ns, 'svg');
const mainGroup = document.createElementNS(ns, 'g');
svg.appendChild(mainGroup);
ui.svgContainer.appendChild(svg);

// Tree Data Generation
let idCounter = 0;
let memoCache = new Set();
let totalCalls = 0;
let maxDepth = 0;

function resetStats() {
  idCounter = 0;
  memoCache.clear();
  totalCalls = 0;
  maxDepth = 0;
}

function buildFibTree(n, depth = 0) {
  const id = `node-${idCounter++}`;
  totalCalls++;
  maxDepth = Math.max(maxDepth, depth);

  const node = {
    id,
    value: n,
    depth,
    children: [],
    isMemoized: false,
    x: 0,
    y: 0,
    width: 0 // Will be used for layout
  };

  // Base cases
  if (n <= 1) {
    node.width = 1;
    return node;
  }

  // Memoization check
  if (state.memo && memoCache.has(n)) {
    node.isMemoized = true;
    node.width = 1; // Treated as a leaf
    return node;
  }

  // Recursive step
  if (state.memo) {
    memoCache.add(n);
  }

  const left = buildFibTree(n - 1, depth + 1);
  const right = buildFibTree(n - 2, depth + 1);

  node.children = [left, right];
  return node;
}

// Layout Algorithm
function calculateLayout(root) {
  // 1. Assign leaf indices to calculate X positions
  let leafIndex = 0;

  function traverseLeaves(node) {
    if (node.children.length === 0) {
      node.x = leafIndex * 60; // Horizontal spacing
      leafIndex++;
    } else {
      node.children.forEach(traverseLeaves);
      // Parent X is average of first and last child
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    }
    node.y = node.depth * 80 + 50; // Vertical spacing + padding
  }

  traverseLeaves(root);
  return { width: leafIndex * 60, height: (maxDepth + 1) * 80 };
}

// Rendering
let animationFrameId = null;
let timeouts = [];

function clearAnimation() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  timeouts.forEach(clearTimeout);
  timeouts = [];
  mainGroup.innerHTML = ''; // Clear SVG
}

function renderTree() {
  clearAnimation();
  resetStats();

  const root = buildFibTree(state.n);

  // Update stats UI
  ui.totalCalls.textContent = totalCalls;
  ui.maxDepth.textContent = maxDepth;

  const layoutSize = calculateLayout(root);

  // Center the tree initially
  const svgWidth = ui.svgContainer.clientWidth;
  const svgHeight = ui.svgContainer.clientHeight;

  state.translateX = svgWidth / 2 - layoutSize.width / 2 + (layoutSize.width > 0 ? 30 : 0); // +30 to center single nodes better
  state.translateY = 50;
  updateTransform();

  // Create elements (hidden initially)
  const nodes = [];
  const links = [];

  function traverseAndCreate(node) {
    // Create links to children
    node.children.forEach(child => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', 'link');
      path.setAttribute('d', generatePath(node, child));
      path.id = `link-${node.id}-${child.id}`;
      mainGroup.appendChild(path);
      links.push({ el: path, source: node, target: child });

      traverseAndCreate(child);
    });

    // Create node group
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', `node ${node.isMemoized ? 'memoized' : 'normal'}`);
    g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    g.dataset.value = node.value;
    g.id = node.id;

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('r', 20);
    g.appendChild(circle);

    const text = document.createElementNS(ns, 'text');
    text.textContent = node.value;
    text.setAttribute('dy', '0.35em'); // Vertical center
    g.appendChild(text);

    // Event listeners for hover
    g.addEventListener('mouseenter', () => highlightRelated(node.value));
    g.addEventListener('mouseleave', clearHighlight);

    mainGroup.appendChild(g);
    nodes.push({ el: g, data: node });
  }

  traverseAndCreate(root);

  // Animation: BFS or Pre-order "blooming"
  animateBloom(nodes, links);
}

function generatePath(source, target) {
  // Curved Bezier path
  return `M${source.x},${source.y} C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y}`;
}

function animateBloom(nodes, links) {
  // Sort nodes by depth, then by x (left to right) for a nice wave effect
  // Or just by traversal order (id)

  // Let's do traversal order (Pre-order is how we pushed them)
  // Actually, nodes were pushed in pre-order.

  // We want links to appear when the source node blooms?
  // Or when the target node blooms?
  // Let's make links appear with the target node.

  const baseDelay = 1000 / state.speed;

  nodes.forEach((item, index) => {
    const delay = index * baseDelay;

    const timeout = setTimeout(() => {
      item.el.classList.add('bloomed');
      item.el.classList.add('visible');

      // Find links pointing to this node
      // Actually links are stored, we can find the link where target === item.data
      const incomingLink = links.find(l => l.target === item.data);
      if (incomingLink) {
        // We could animate stroke-dashoffset for drawing effect, but opacity fade is simpler and robust
        // CSS transition handles it if we just ensure style is right
        // But wait, links are already in DOM.
        // We need to hide them first?
        // CSS: .link starts with stroke-opacity: 0.6.
        // Let's just let them appear naturally or add a class?
        // Actually, let's keep it simple: Nodes pop in. Links are always there?
        // No, links should grow.
      }
    }, delay);
    timeouts.push(timeout);
  });
}

// Interaction Logic
function highlightRelated(value) {
  const allNodes = document.querySelectorAll('.node');
  const allLinks = document.querySelectorAll('.link');

  allNodes.forEach(node => {
    if (parseInt(node.dataset.value) === value) {
      node.classList.add('highlight-related');
    } else {
      node.style.opacity = '0.3';
    }
  });

  // Highlight links connected to highlighted nodes?
  // Maybe just dim unrelated ones.
  allLinks.forEach(link => {
    link.style.opacity = '0.1';
  });
}

function clearHighlight() {
  const allNodes = document.querySelectorAll('.node');
  const allLinks = document.querySelectorAll('.link');

  allNodes.forEach(node => {
    node.classList.remove('highlight-related');
    node.style.opacity = '';
  });

  allLinks.forEach(link => {
    link.classList.remove('highlight-related');
    link.style.opacity = '';
  });
}

// Zoom / Pan Logic
function updateTransform() {
  mainGroup.setAttribute('transform', `translate(${state.translateX}, ${state.translateY}) scale(${state.scale})`);
}

svg.addEventListener('mousedown', (e) => {
  state.isDragging = true;
  state.lastMouseX = e.clientX;
  state.lastMouseY = e.clientY;
  svg.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (state.isDragging) {
    const dx = e.clientX - state.lastMouseX;
    const dy = e.clientY - state.lastMouseY;
    state.translateX += dx;
    state.translateY += dy;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    updateTransform();
  }
});

window.addEventListener('mouseup', () => {
  state.isDragging = false;
  svg.style.cursor = 'grab';
});

svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const scaleFactor = 0.1;
  const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
  const newScale = Math.max(0.1, Math.min(5, state.scale + delta));

  // Zoom towards mouse pointer... slightly complex, let's just zoom center for now or simple zoom
  // Simple zoom:
  state.scale = newScale;
  updateTransform();
});

// UI Event Listeners
ui.nInput.addEventListener('input', (e) => {
  state.n = parseInt(e.target.value);
  ui.nValue.textContent = state.n;
  renderTree();
});

ui.memoToggle.addEventListener('change', (e) => {
  state.memo = e.target.checked;
  renderTree();
});

ui.speedInput.addEventListener('input', (e) => {
  // Logarithmic speed scale or linear?
  // Let's just map 1-100 to some delay factor
  // Lower delay = higher speed
  // Input 100 = fast, 1 = slow
  // But my logic uses `speed` as divisor: 1000 / speed.
  // So speed 1 = 1000ms delay. Speed 100 = 10ms delay.
  state.speed = parseInt(e.target.value);
  const multiplier = state.speed >= 20 ? `${(state.speed / 20).toFixed(1)}x` : `0.${state.speed}x`;
  ui.speedValue.textContent = multiplier;
});

ui.resetBtn.addEventListener('click', () => {
  renderTree();
});

// Initialize
if (typeof window !== 'undefined') {
    // Only run if in browser
    renderTree();
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildFibTree, calculateLayout, state };
}
