class Node {
  constructor(value) {
    this.value = value;
    this.parents = []; // Nodes that transition to this node
    this.child = null; // Node this transitions to (only 1 child since every number goes to exactly one other number)
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 15;
    this.color = '#00ffcc'; // Default color
    this.level = 0; // Distance from root (1)
    this.isNew = true;
    this.alpha = 0; // For fade-in
  }

  addParent(node) {
    if (!this.parents.includes(node)) {
      this.parents.push(node);
    }
  }
}

class CollatzTree {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = new Map(); // value -> Node
    this.root = this.getOrCreateNode(1);
    this.root.level = 0;

    // Viewport and physics
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Interaction state
    this.hoveredNode = null;
    this.clickedNode = null;
    this.highlightPath = new Set();

    // Layout parameters
    this.levelHeight = 80;
    this.nodeSpacing = 60;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInteraction();

    // Initial position for root
    this.root.x = 0;
    this.root.y = 0;
    this.root.targetX = 0;
    this.root.targetY = 0;
    this.root.alpha = 1;
    this.root.isNew = false;

    // Animation loop
    this.lastTime = performance.now();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupInteraction() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.camera.x, y: e.clientY - this.camera.y };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.camera.x = e.clientX - this.dragStart.x;
        this.camera.y = e.clientY - this.dragStart.y;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.camera.x = e.clientX - this.dragStart.x;
        this.camera.y = e.clientY - this.dragStart.y;
      } else {
        this.handlePointerMove(e.clientX, e.clientY);
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.isDragging) {
         if (this.hoveredNode) {
             if (this.clickedNode === this.hoveredNode) {
                 this.clickedNode = null; // Toggle off
             } else {
                 this.clickedNode = this.hoveredNode;
             }
             this.updateHighlightPath();
         } else {
             this.clickedNode = null;
             this.updateHighlightPath();
         }
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      const zoomSensitivity = 0.001;
      const zoomFactor = Math.exp(-e.deltaY * zoomSensitivity);

      // Calculate mouse position relative to center
      const mouseX = e.clientX - this.canvas.width / 2;
      const mouseY = e.clientY - this.canvas.height / 2;

      // Adjust camera position to zoom towards cursor
      this.camera.x = mouseX - (mouseX - this.camera.x) * zoomFactor;
      this.camera.y = mouseY - (mouseY - this.camera.y) * zoomFactor;

      this.camera.zoom *= zoomFactor;
      this.camera.zoom = Math.max(0.1, Math.min(this.camera.zoom, 5));
    });

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragStart = { x: e.touches[0].clientX - this.camera.x, y: e.touches[0].clientY - this.camera.y };
        this.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, {passive: false});

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.camera.x = e.touches[0].clientX - this.dragStart.x;
        this.camera.y = e.touches[0].clientY - this.dragStart.y;
        this.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, {passive: false});

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  handlePointerMove(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const worldX = (mouseX - this.canvas.width / 2 - this.camera.x) / this.camera.zoom;
    const worldY = (mouseY - this.canvas.height * 0.8 - this.camera.y) / this.camera.zoom;

    let found = null;
    let minDist = Infinity;

    for (let node of this.nodes.values()) {
        const dx = node.x - worldX;
        const dy = node.y - worldY;
        const distSq = dx*dx + dy*dy;
        // slightly larger hit area
        if (distSq < (node.radius * 2) * (node.radius * 2)) {
            if (distSq < minDist) {
                minDist = distSq;
                found = node;
            }
        }
    }

    if (this.hoveredNode !== found) {
        this.hoveredNode = found;
        this.updateHighlightPath();
        this.canvas.style.cursor = found ? 'pointer' : 'default';
    }
  }

  updateHighlightPath() {
      this.highlightPath.clear();

      let target = this.clickedNode || this.hoveredNode;
      if (!target) return;

      let current = target;
      while (current) {
          this.highlightPath.add(current);
          current = current.child;
      }
  }

  getOrCreateNode(value) {
    if (!this.nodes.has(value)) {
      this.nodes.set(value, new Node(value));
    }
    return this.nodes.get(value);
  }

  async addSequence(startValue) {
    if (startValue <= 0) return { length: 0, max: 0 };

    let current = startValue;
    let sequence = [current];
    let max = current;

    // Generate sequence
    while (current !== 1) {
      if (current % 2 === 0) {
        current = current / 2;
      } else {
        current = 3 * current + 1;
      }
      sequence.push(current);
      if (current > max) max = current;

      // Prevent infinite loops / memory overflow just in case, though Collatz conjecture says we always reach 1
      if (sequence.length > 5000) break;
    }

    // Build tree
    for (let i = 0; i < sequence.length - 1; i++) {
      const parentVal = sequence[i];
      const childVal = sequence[i+1];

      const parentNode = this.getOrCreateNode(parentVal);
      const childNode = this.getOrCreateNode(childVal);

      parentNode.child = childNode;
      childNode.addParent(parentNode);
    }

    // Calculate levels (distance to root) via BFS from root
    this.calculateLevels();

    // Layout nodes
    this.layoutTree();

    return { length: sequence.length, max: max };
  }

  calculateLevels() {
    // Reset levels to handle new paths
    for (let node of this.nodes.values()) {
      node.level = -1;
    }

    let queue = [this.root];
    this.root.level = 0;

    while (queue.length > 0) {
      let current = queue.shift();
      for (let parent of current.parents) {
        if (parent.level === -1 || parent.level > current.level + 1) {
          parent.level = current.level + 1;
          queue.push(parent);
        }
      }
    }
  }

  layoutTree() {
    // Group nodes by level
    const levels = new Map();
    let maxLevel = 0;

    for (let node of this.nodes.values()) {
      if (node.level === -1) continue; // Skip disconnected nodes

      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level).push(node);
      if (node.level > maxLevel) maxLevel = node.level;
    }

    // Simple top-down tree layout logic
    // Root is at (0,0)
    this.root.targetX = 0;
    this.root.targetY = 0;

    // Sort nodes in each level to minimize edge crossings (heuristic)
    for (let i = 1; i <= maxLevel; i++) {
      let levelNodes = levels.get(i) || [];

      // Sort by parent's x position to roughly align them
      levelNodes.sort((a, b) => {
        const ax = a.child ? a.child.targetX : 0;
        const bx = b.child ? b.child.targetX : 0;
        return ax - bx;
      });

      const width = (levelNodes.length - 1) * this.nodeSpacing;
      let startX = -width / 2;

      // Assign target positions
      for (let j = 0; j < levelNodes.length; j++) {
        let node = levelNodes[j];

        // Target Y goes UP for higher levels (root at bottom)
        node.targetY = -node.level * this.levelHeight;

        // Spread X out
        // If node has a child, try to center above child, but respect level spread
        let preferredX = startX + j * this.nodeSpacing;

        if (node.child && levelNodes.length > 1) {
             // Pull slightly towards child
             preferredX = preferredX * 0.7 + node.child.targetX * 0.3;
        }

        node.targetX = preferredX;

        // Set initial position for animation if new
        if (node.isNew) {
          if (node.child) {
            node.x = node.child.x;
            node.y = node.child.y;
          } else {
            node.x = node.targetX;
            node.y = node.targetY;
          }
          // Assign color based on level
          const hue = (node.level * 15) % 360;
          node.color = `hsl(${hue}, 100%, 60%)`;
        }
      }
    }

    // Simple force-directed relaxation step to un-bunch nodes
    for (let iter = 0; iter < 50; iter++) {
        for (let i = 1; i <= maxLevel; i++) {
            let levelNodes = levels.get(i) || [];
            for (let j = 0; j < levelNodes.length - 1; j++) {
                let a = levelNodes[j];
                let b = levelNodes[j+1];
                let dx = b.targetX - a.targetX;
                if (dx < this.nodeSpacing) {
                    let push = (this.nodeSpacing - dx) / 2;
                    a.targetX -= push;
                    b.targetX += push;
                }
            }
        }
    }
  }

  animate(currentTime) {
    let dt = (currentTime - this.lastTime) / 1000 || 0;
    this.lastTime = currentTime;

    this.updatePhysics(dt);
    this.draw();

    requestAnimationFrame((t) => this.animate(t));
  }

  updatePhysics(dt) {
    const stiffness = 5.0; // Spring stiffness
    const damping = 0.8; // Friction

    for (let node of this.nodes.values()) {
      // Spring force towards target
      let fx = (node.targetX - node.x) * stiffness;
      let fy = (node.targetY - node.y) * stiffness;

      node.vx += fx * dt;
      node.vy += fy * dt;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx * dt;
      node.y += node.vy * dt;

      // Fade in new nodes
      if (node.isNew) {
        node.alpha += 1.0 * dt;
        if (node.alpha >= 1) {
          node.alpha = 1;
          node.isNew = false;
        }
      }
    }

    // Auto-pan camera to keep tree centered vertically somewhat, or just lerp towards root
    // For simplicity, we just rely on user drag for now, but ensure root is visible
  }

  draw() {
    this.ctx.fillStyle = '#0b0f19';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Center origin, apply camera translation and zoom
    this.ctx.translate(this.canvas.width / 2 + this.camera.x, this.canvas.height * 0.8 + this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    const hasHighlight = this.highlightPath.size > 0;

    // Draw edges
    for (let node of this.nodes.values()) {
      if (!node.child) continue;

      const isHighlightedEdge = hasHighlight && this.highlightPath.has(node) && this.highlightPath.has(node.child);
      const isDimmed = hasHighlight && !isHighlightedEdge;

      this.ctx.lineWidth = isHighlightedEdge ? 4 : 2;

      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y);

      // Draw bezier curve to child
      let cp1x = node.x;
      let cp1y = node.y + this.levelHeight / 2;
      let cp2x = node.child.x;
      let cp2y = node.child.y - this.levelHeight / 2;

      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, node.child.x, node.child.y);

      // Use node color, with alpha
      this.ctx.strokeStyle = isHighlightedEdge ? '#ffffff' : node.color;
      let baseAlpha = Math.min(node.alpha, node.child.alpha);
      if (isDimmed) baseAlpha *= 0.15;
      else if (isHighlightedEdge) baseAlpha = 1.0;
      else baseAlpha *= 0.6;

      this.ctx.globalAlpha = baseAlpha;

      if (isHighlightedEdge) {
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = '#ffffff';
      } else {
          this.ctx.shadowBlur = 0;
      }

      this.ctx.stroke();
    }

    // Draw nodes
    for (let node of this.nodes.values()) {
      const isHighlighted = hasHighlight && this.highlightPath.has(node);
      const isDimmed = hasHighlight && !isHighlighted;

      let nodeAlpha = node.alpha;
      if (isDimmed) nodeAlpha *= 0.2;
      else if (isHighlighted) nodeAlpha = 1.0;

      this.ctx.globalAlpha = nodeAlpha;

      // Glow
      this.ctx.shadowBlur = isHighlighted ? 20 : 15;
      this.ctx.shadowColor = isHighlighted ? '#ffffff' : node.color;

      this.ctx.beginPath();
      let r = isHighlighted ? node.radius * 1.2 : node.radius;
      if (this.hoveredNode === node) r *= 1.1;
      this.ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = isHighlighted ? '#222' : '#111';
      this.ctx.fill();

      this.ctx.lineWidth = isHighlighted ? 3 : 2;
      this.ctx.strokeStyle = isHighlighted ? '#ffffff' : node.color;
      this.ctx.stroke();

      // Reset shadow for text
      this.ctx.shadowBlur = 0;

      // Draw value
      this.ctx.fillStyle = isHighlighted ? '#ffffff' : '#e0e6ed';
      this.ctx.font = isHighlighted ? 'bold 12px Courier New' : '10px Courier New';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.value, node.x, node.y);
    }

    this.ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tree-canvas');
  const tree = new CollatzTree(canvas);

  const form = document.getElementById('collatz-form');
  const input = document.getElementById('number-input');
  const lengthSpan = document.getElementById('seq-length');
  const maxSpan = document.getElementById('seq-max');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = parseInt(input.value);
    if (isNaN(val) || val <= 0) return;

    // Calculate and add
    const stats = await tree.addSequence(val);

    // Update stats
    lengthSpan.textContent = stats.length;
    maxSpan.textContent = stats.max;

    // Clear input for next
    input.value = '';
    input.focus();

    // Adjust zoom to fit slightly better based on tree height
    const maxLevel = Math.max(...Array.from(tree.nodes.values()).map(n => n.level));
    const requiredHeight = maxLevel * tree.levelHeight;
    if (requiredHeight > 0) {
      // Basic auto-zoom out logic
      const targetZoom = Math.min(1.0, (window.innerHeight * 0.7) / requiredHeight);
      tree.camera.zoom = targetZoom;
      // Center camera Y slightly
      tree.camera.y = requiredHeight * tree.camera.zoom * 0.3;
    }
  });

  // Initialize with the default value
  const initialVal = parseInt(input.value);
  if (!isNaN(initialVal)) {
    tree.addSequence(initialVal).then(stats => {
      lengthSpan.textContent = stats.length;
      maxSpan.textContent = stats.max;
    });
  }
});
