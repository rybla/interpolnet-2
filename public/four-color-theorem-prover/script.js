const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener('resize', resize);
resize();

// 4 Colors Palette
const THEME_COLORS = [
  '#ff595e', // Red
  '#ffca3a', // Yellow
  '#8ac926', // Green
  '#1982c4', // Blue
];

const UNCOLORED = '#4b5563'; // Gray

// Data structures
let nodes = [];
let edges = [];

// Interaction state
let draggingNode = null;
let drawingEdgeFrom = null;
let mousePos = { x: 0, y: 0 };
let isHovering = false;
let hoveredNode = null;
let dragStartX = 0;
let dragStartY = 0;

const NODE_RADIUS = 18;

function hitTest(x, y) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = node.x - x;
    const dy = node.y - y;
    if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS * 1.5) {
      return node;
    }
  }
  return null;
}

// Graph Coloring Algorithm (Backtracking to use max 4 colors)
function updateColors() {
  // Reset colors
  nodes.forEach(n => { n.targetColor = -1; });

  // Build adjacency list
  const adj = new Map();
  nodes.forEach(n => adj.set(n, []));
  edges.forEach(e => {
    adj.get(e.a).push(e.b);
    adj.get(e.b).push(e.a);
  });

  // Sort nodes by degree (heuristic for backtracking)
  const sortedNodes = [...nodes].sort((a, b) => adj.get(b).length - adj.get(a).length);

  function solve(nodeIndex) {
    if (nodeIndex === sortedNodes.length) return true;

    const node = sortedNodes[nodeIndex];
    const neighbors = adj.get(node);

    // Try colors 0 to 3
    for (let c = 0; c < 4; c++) {
      let canUse = true;
      for (const neighbor of neighbors) {
        if (neighbor.targetColor === c) {
          canUse = false;
          break;
        }
      }

      if (canUse) {
        node.targetColor = c;
        if (solve(nodeIndex + 1)) {
          return true;
        }
        node.targetColor = -1; // backtrack
      }
    }
    return false;
  }

  const success = solve(0);

  if (!success) {
    // If we fail (e.g. non-planar K5), color greedily with available colors or leave uncolored
    // Just greedy fallback for visual feedback
    for (const node of sortedNodes) {
      if (node.targetColor !== -1) continue;

      const usedColors = new Set(adj.get(node).map(n => n.targetColor).filter(c => c !== -1));

      // Try to find any color
      for(let c = 0; c < 100; c++) {
        if (!usedColors.has(c)) {
          node.targetColor = c;
          break;
        }
      }
    }
  }
}

function parseColorToRgb(colorStr) {
  if (colorStr.startsWith('#')) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  } else if (colorStr.startsWith('rgb(')) {
    var result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(colorStr);
    return result ? {
      r: parseInt(result[1], 10),
      g: parseInt(result[2], 10),
      b: parseInt(result[3], 10)
    } : null;
  }
  return null;
}

function interpolateColor(color1, color2, factor) {
  let c1 = parseColorToRgb(color1);
  let c2 = parseColorToRgb(color2);
  if(!c1) c1 = {r:100, g:100, b:100};
  if(!c2) c2 = {r:100, g:100, b:100};

  let result = {
    r: Math.round(c1.r + factor * (c2.r - c1.r)),
    g: Math.round(c1.g + factor * (c2.g - c1.g)),
    b: Math.round(c1.b + factor * (c2.b - c1.b))
  };
  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

// Interaction
function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function pointerDown(e) {
  e.preventDefault();
  const pos = getEventPos(e);
  const hit = hitTest(pos.x, pos.y);

  if (hit) {
    draggingNode = hit;
    drawingEdgeFrom = hit;
    dragStartX = pos.x;
    dragStartY = pos.y;
  } else {
    // Add new node
    const newNode = {
      x: pos.x,
      y: pos.y,
      currentColor: UNCOLORED,
      targetColor: -1,
      colorAnimProgress: 1,
      pulse: 0
    };
    nodes.push(newNode);
    updateColors();
  }

  mousePos = pos;
}

function pointerMove(e) {
  e.preventDefault();
  const pos = getEventPos(e);
  mousePos = pos;

  hoveredNode = hitTest(pos.x, pos.y);
  canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';

  if (draggingNode) {
    // Check if we moved far enough to consider it drawing an edge rather than just moving
    const dx = pos.x - dragStartX;
    const dy = pos.y - dragStartY;
    if (dx * dx + dy * dy > 400) {
      // It's an edge draw
      draggingNode = null;
    } else {
      draggingNode.x = pos.x;
      draggingNode.y = pos.y;
    }
  }
}

function pointerUp(e) {
  e.preventDefault();
  const pos = getEventPos(e); // Note: might not exist on touchend

  if (drawingEdgeFrom) {
    // Find target
    const target = hitTest(mousePos.x, mousePos.y);
    if (target && target !== drawingEdgeFrom) {
      // Check if edge already exists
      const exists = edges.some(edge =>
        (edge.a === drawingEdgeFrom && edge.b === target) ||
        (edge.b === drawingEdgeFrom && edge.a === target)
      );
      if (!exists) {
        edges.push({ a: drawingEdgeFrom, b: target });
        updateColors();
      }
    }
  }

  draggingNode = null;
  drawingEdgeFrom = null;
}

canvas.addEventListener('mousedown', pointerDown);
canvas.addEventListener('mousemove', pointerMove);
window.addEventListener('mouseup', pointerUp);

canvas.addEventListener('touchstart', pointerDown, { passive: false });
canvas.addEventListener('touchmove', pointerMove, { passive: false });
window.addEventListener('touchend', pointerUp, { passive: false });

// Loop
let lastTime = 0;

function loop(time) {
  requestAnimationFrame(loop);

  const dt = (time - lastTime) / 1000 || 0;
  lastTime = time;

  ctx.clearRect(0, 0, width, height);

  // Draw edges
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.a.x, edge.a.y);
    ctx.lineTo(edge.b.x, edge.b.y);
    ctx.stroke();
  });

  // Draw temporary edge
  if (drawingEdgeFrom && !draggingNode) {
    ctx.beginPath();
    ctx.moveTo(drawingEdgeFrom.x, drawingEdgeFrom.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw nodes
  nodes.forEach(node => {
    // Update color animation
    const targetHex = node.targetColor >= 0 && node.targetColor < 4 ? THEME_COLORS[node.targetColor] : UNCOLORED;

    // Check if target color changed
    if (node._lastTargetColor !== targetHex) {
      node._lastTargetColor = targetHex;
      node.colorAnimProgress = 0;
      node.startColor = node.currentColor;
    }

    if (node.colorAnimProgress < 1) {
      node.colorAnimProgress += dt * 3; // speed
      if (node.colorAnimProgress > 1) node.colorAnimProgress = 1;

      // Easing
      const ease = 1 - Math.pow(1 - node.colorAnimProgress, 3);
      node.currentColor = interpolateColor(node.startColor, targetHex, ease);
    }

    // Pulse animation
    node.pulse += dt * 2;
    const currentRadius = NODE_RADIUS + Math.sin(node.pulse) * 1.5 + (hoveredNode === node ? 3 : 0);

    ctx.beginPath();
    ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.currentColor;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#161b22';
    ctx.stroke();
  });
}

requestAnimationFrame(loop);
