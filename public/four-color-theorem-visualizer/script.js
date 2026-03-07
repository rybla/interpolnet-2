const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

const NODE_RADIUS = 20;
const COLORS = [
  '#FF3366', // Vibrant Pink
  '#33CCFF', // Vibrant Cyan
  '#FFCC00', // Vibrant Yellow
  '#00FF66'  // Vibrant Green
];
const UNCOLORED = '#555555';

let nodes = [];
let edges = [];

// Dragging state
let isDragging = false;
let startNode = null;
let currentMousePos = null;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function getNodeAt(pos) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = pos.x - node.x;
    const dy = pos.y - node.y;
    if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
      return node;
    }
  }
  return null;
}

function handlePointerDown(e) {
  e.preventDefault();
  const pos = getMousePos(e);
  const node = getNodeAt(pos);

  if (node) {
    // Start edge creation
    isDragging = true;
    startNode = node;
    currentMousePos = pos;
  } else {
    // Add new node
    nodes.push({
      id: nodes.length,
      x: pos.x,
      y: pos.y,
      colorIndex: -1,
      targetColorIndex: -1,
      neighbors: []
    });
    recolorGraph();
  }
}

function handlePointerMove(e) {
  e.preventDefault();
  if (isDragging) {
    currentMousePos = getMousePos(e);
  }
}

function handlePointerUp(e) {
  e.preventDefault();
  if (isDragging) {
    const endPos = e.changedTouches ? {
      x: e.changedTouches[0].clientX - canvas.getBoundingClientRect().left,
      y: e.changedTouches[0].clientY - canvas.getBoundingClientRect().top
    } : getMousePos(e);

    const endNode = getNodeAt(endPos);

    if (endNode && endNode !== startNode) {
      // Check if edge already exists
      const exists = edges.some(edge =>
        (edge.a === startNode && edge.b === endNode) ||
        (edge.b === startNode && edge.a === endNode)
      );

      if (!exists) {
        edges.push({ a: startNode, b: endNode });
        startNode.neighbors.push(endNode);
        endNode.neighbors.push(startNode);
        recolorGraph();
      }
    }

    isDragging = false;
    startNode = null;
    currentMousePos = null;
  }
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);

canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
window.addEventListener('touchend', handlePointerUp, { passive: false });

// 4-Coloring Backtracking Algorithm
function recolorGraph() {
  // Reset target colors
  nodes.forEach(n => n.targetColorIndex = -1);

  if (nodes.length === 0) return;

  function isSafe(nodeIndex, colorIdx) {
    const node = nodes[nodeIndex];
    for (let neighbor of node.neighbors) {
      if (neighbor.targetColorIndex === colorIdx) {
        return false;
      }
    }
    return true;
  }

  function solve(nodeIndex) {
    if (nodeIndex === nodes.length) {
      return true;
    }

    // Heuristic: order colors randomly to create variations, or use fixed order
    // Fixed order guarantees consistent result for same graph, but might look boring.
    for (let c = 0; c < 4; c++) {
      if (isSafe(nodeIndex, c)) {
        nodes[nodeIndex].targetColorIndex = c;
        if (solve(nodeIndex + 1)) {
          return true;
        }
        nodes[nodeIndex].targetColorIndex = -1;
      }
    }
    return false;
  }

  // Sorting nodes by degree (highest first) can speed up graph coloring.
  // For simplicity and small graphs, simple order is usually fine.
  solve(0);
}

// Rendering
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function lerpColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

// To smoothly animate colors, we'll maintain a current color and target color
nodes.forEach(n => {
  n.currentColorStr = UNCOLORED;
});

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw edges
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#444';

  edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.a.x, edge.a.y);
    ctx.lineTo(edge.b.x, edge.b.y);
    ctx.stroke();
  });

  // Draw dragged edge
  if (isDragging && startNode && currentMousePos) {
    ctx.beginPath();
    ctx.moveTo(startNode.x, startNode.y);
    ctx.lineTo(currentMousePos.x, currentMousePos.y);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#888';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw nodes
  nodes.forEach(node => {
    const targetColorStr = node.targetColorIndex === -1 ? UNCOLORED : COLORS[node.targetColorIndex];

    if (!node.currentColorStr) node.currentColorStr = UNCOLORED;

    // Smooth transition
    node.currentColorStr = targetColorStr;

    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = node.currentColorStr;
    ctx.fill();

    // Draw border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  });

  requestAnimationFrame(draw);
}

draw();
