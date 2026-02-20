// Mark and Sweep Garbage Collection Demo

class HeapNode {
  constructor(id, x, y, type = 'object') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // 'root', 'object'
    this.marked = false;
    this.reachable = false; // For initial visualization state
  }
}

class GarbageCollector {
  constructor(svgElement) {
    this.svg = svgElement;
    this.nodes = new Map();
    this.edges = []; // Array of {from: id, to: id, id: uniqueEdgeId}
    this.nextId = 1;
    this.nextEdgeId = 1;
    this.isRunning = false;
    this.width = 800;
    this.height = 500;

    // Initialize with some roots
    this.initRoots();
  }

  initRoots() {
    const rootCount = 3;
    const spacing = this.width / (rootCount + 1);
    for (let i = 0; i < rootCount; i++) {
      const id = this.nextId++;
      const node = new HeapNode(id, spacing * (i + 1), 50, 'root');
      node.reachable = true;
      this.nodes.set(id, node);
    }
    this.render();
  }

  reset() {
    if (this.isRunning) return;
    this.nodes.clear();
    this.edges = [];
    this.nextId = 1;
    this.nextEdgeId = 1;

    // Remove existing graph elements but keep defs
    const elements = this.svg.querySelectorAll('.node-group, .edge');
    elements.forEach(el => el.remove());

    this.initRoots();
  }

  allocate() {
    if (this.isRunning) return;

    // Create a new node at a random position below the roots
    const id = this.nextId++;
    const x = Math.random() * (this.width - 100) + 50;
    const y = Math.random() * (this.height - 150) + 100;
    const newNode = new HeapNode(id, x, y, 'object');
    this.nodes.set(id, newNode);

    // Link from a random existing node (preference to reachable ones to simulate valid allocation)
    const potentialSources = Array.from(this.nodes.values());
    if (potentialSources.length > 0) {
      // 80% chance to link from a reachable node, 20% from any node (simulating some chaos or just general graph growth)
      // Actually, usually allocation links from a root or a live object.
      // Let's bias heavily towards reachable nodes to keep graph connected initially.
      const reachableSources = potentialSources.filter(n => n.reachable);
      const sources = reachableSources.length > 0 && Math.random() > 0.1 ? reachableSources : potentialSources;

      const source = sources[Math.floor(Math.random() * sources.length)];
      this.addEdge(source.id, newNode.id);
    }

    // Occasionally add a second reference to make the graph more interesting
    if (Math.random() > 0.7 && potentialSources.length > 1) {
        const source2 = potentialSources[Math.floor(Math.random() * potentialSources.length)];
        if (source2.id !== newNode.id) {
             this.addEdge(source2.id, newNode.id);
        }
    }

    this.updateReachability(); // Update visualization of what's currently reachable
    this.render();
  }

  addEdge(fromId, toId) {
    // Avoid duplicate edges
    if (this.edges.some(e => e.from === fromId && e.to === toId)) return;
    this.edges.push({ from: fromId, to: toId, id: this.nextEdgeId++ });
  }

  removeEdge(edgeId) {
    if (this.isRunning) return;
    this.edges = this.edges.filter(e => e.id !== edgeId);
    this.updateReachability();
    this.render();
  }

  // Simple BFS to update 'reachable' property for visualization (not the GC mark phase)
  updateReachability() {
    // Reset reachability
    this.nodes.forEach(n => {
        if (n.type !== 'root') n.reachable = false;
        else n.reachable = true;
    });

    const queue = [];
    this.nodes.forEach(n => {
      if (n.type === 'root') queue.push(n.id);
    });

    const visited = new Set(queue);

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentNode = this.nodes.get(currentId);
      if (!currentNode) continue;

      // Find all outgoing edges
      const outgoing = this.edges.filter(e => e.from === currentId);
      for (const edge of outgoing) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          const targetNode = this.nodes.get(edge.to);
          if (targetNode) {
            targetNode.reachable = true;
            queue.push(edge.to);
          }
        }
      }
    }
  }

  async runGC() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.disableControls(true);

    // 1. Mark Phase
    await this.markPhase();

    // 2. Sweep Phase
    await this.sweepPhase();

    // Reset marked status for next cycle
    this.nodes.forEach(n => n.marked = false);

    this.updateReachability();
    this.render();

    this.isRunning = false;
    this.disableControls(false);
  }

  async markPhase() {
      // Clear previous marks visually (though logic should be clean)
      this.nodes.forEach(n => n.marked = false);

      const roots = Array.from(this.nodes.values()).filter(n => n.type === 'root');
      const queue = [...roots];
      const visited = new Set();
      roots.forEach(r => visited.add(r.id));

      // Visually mark roots
      for(const root of roots) {
          root.marked = true;
      }
      this.render(); // Update to show marked roots

      await this.sleep(500);

      while(queue.length > 0) {
          const current = queue.shift();

          // Find neighbors
          const outgoing = this.edges.filter(e => e.from === current.id);

          if (outgoing.length > 0) {
              await this.sleep(200); // Small delay before processing neighbors
          }

          for(const edge of outgoing) {
              const targetNode = this.nodes.get(edge.to);
              if(targetNode && !targetNode.marked) {
                  // Mark the node
                  targetNode.marked = true;
                  visited.add(targetNode.id);
                  queue.push(targetNode);
                  this.render();
                  await this.sleep(300); // Animation delay for discovery
              }
          }
      }
      await this.sleep(500); // Pause before sweep
  }

  async sweepPhase() {
      const toRemove = [];
      this.nodes.forEach((node, id) => {
          if(!node.marked && node.type !== 'root') {
              toRemove.push(id);
          }
      });

      // Highlight removal
      for(const id of toRemove) {
          const el = document.getElementById(`node-${id}`);
          if(el) {
             // We can't use classList.add directly on SVGElement in some older browsers but standard is fine
             // Or set attribute
             const currentClass = el.getAttribute('class');
             el.setAttribute('class', currentClass + ' removing');

             // Also fade edges connected to it?
             // Not strictly necessary if node fades
          }
      }

      if (toRemove.length > 0) await this.sleep(800); // Wait for transition

      // Actual removal
      for(const id of toRemove) {
          this.nodes.delete(id);
          // Remove connected edges
          this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
      }

      this.render();
  }

  disableControls(disabled) {
      const btn1 = document.getElementById('allocate-btn');
      const btn2 = document.getElementById('run-gc-btn');
      const btn3 = document.getElementById('reset-btn');
      if(btn1) btn1.disabled = disabled;
      if(btn2) btn2.disabled = disabled;
      if(btn3) btn3.disabled = disabled;
  }

  sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    // 1. Edges
    // Remove edges that no longer exist
    const edgeGroup = this.svg.querySelectorAll('line.edge');
    edgeGroup.forEach(el => {
        const id = parseInt(el.getAttribute('data-id'));
        if(!this.edges.find(e => e.id === id)) {
            el.remove();
        }
    });

    // Add/Update edges
    this.edges.forEach(edge => {
        const source = this.nodes.get(edge.from);
        const target = this.nodes.get(edge.to);
        if (!source || !target) return;

        let el = document.getElementById(`edge-${edge.id}`);
        if (!el) {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            el.setAttribute('id', `edge-${edge.id}`);
            el.setAttribute('data-id', edge.id);
            el.setAttribute('class', 'edge');
            el.setAttribute('marker-end', 'url(#arrowhead)');
            // Add click listener to sever
            el.addEventListener('click', (e) => {
                // Prevent bubbling if necessary, but mainly stop if running
                if (this.isRunning) return;
                this.removeEdge(edge.id);
            });
            // Prepend so lines are behind nodes
            // We need to be careful with defs. defs should stay first.
            // this.svg.insertBefore(el, this.svg.firstChild) puts it before defs if defs is first.
            // We should append edges to a specific group or insert before the first node group.

            // Better strategy: Create groups for edges and nodes in init/reset?
            // Or just ensure we insert before any node group.
            const firstNode = this.svg.querySelector('g.node-group');
            if (firstNode) {
                this.svg.insertBefore(el, firstNode);
            } else {
                this.svg.appendChild(el);
            }
        }

        // Update positions
        el.setAttribute('x1', source.x);
        el.setAttribute('y1', source.y);
        el.setAttribute('x2', target.x);
        el.setAttribute('y2', target.y);
    });

    // 2. Nodes
    // Remove nodes
    const nodeElements = this.svg.querySelectorAll('g.node-group');
    nodeElements.forEach(el => {
        const id = parseInt(el.getAttribute('data-id'));
        if(!this.nodes.has(id)) {
            el.remove();
        }
    });

    // Add/Update nodes
    this.nodes.forEach(node => {
        let g = document.getElementById(`node-group-${node.id}`);

        if (!g) {
            g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('id', `node-group-${node.id}`);
            g.setAttribute('data-id', node.id);
            g.setAttribute('class', 'node-group');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('id', `node-${node.id}`);
            circle.setAttribute('r', 20);
            circle.setAttribute('class', 'node');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'label');
            text.textContent = node.type === 'root' ? 'R' : node.id;

            g.appendChild(circle);
            g.appendChild(text);
            this.svg.appendChild(g);
        }

        // Update positions
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // Update class based on state
        const circle = g.querySelector('circle');
        let className = 'node';
        if (node.type === 'root') className += ' root';
        else if (node.marked) className += ' marked';
        else if (node.reachable) className += ' reachable';
        else className += ' unreachable';

        // Preserve 'removing' class if it exists (added during sweep)
        if (circle.getAttribute('class').includes('removing')) {
            className += ' removing';
        }

        circle.setAttribute('class', className);
    });
  }
}

// Initialize
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const svg = document.getElementById('heap-canvas');
        if (svg) {
            const gc = new GarbageCollector(svg);

            const allocBtn = document.getElementById('allocate-btn');
            if (allocBtn) allocBtn.addEventListener('click', () => gc.allocate());

            const runBtn = document.getElementById('run-gc-btn');
            if (runBtn) runBtn.addEventListener('click', () => gc.runGC());

            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) resetBtn.addEventListener('click', () => gc.reset());

            // Initial allocation
            gc.allocate();
            gc.allocate();
            gc.allocate();
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GarbageCollector, HeapNode };
}
