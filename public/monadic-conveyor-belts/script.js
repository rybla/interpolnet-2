
// --- Core Monad Logic ---

class Monad {
  constructor(value) {
    this.value = value;
  }
  static unit(value) {
    throw new Error("Not implemented");
  }
  bind(fn) {
    throw new Error("Not implemented");
  }
}

class Identity extends Monad {
  constructor(value) {
    super(value);
  }
  static unit(value) {
    return new Identity(value);
  }
  bind(fn) {
    return fn(this.value);
  }
  toString() {
    return `Identity(${this.value})`;
  }
}

class Maybe extends Monad {
  constructor(value) {
    super(value);
  }
  static unit(value) {
    return new Maybe(value);
  }
  static get Nothing() {
    return new Maybe(null);
  }
  isNothing() {
    return this.value === null;
  }
  bind(fn) {
    if (this.isNothing()) return Maybe.Nothing;
    return fn(this.value);
  }
  toString() {
    return this.isNothing() ? "Nothing" : `Just(${this.value})`;
  }
}

class Result extends Monad {
  constructor(value, error = null) {
    super(value);
  }
  static unit(value) {
    return new Result(value);
  }
  static Err(msg) {
    return new Result(null, msg);
  }
  isErr() {
    return this.error !== null;
  }
  bind(fn) {
    if (this.isErr()) return Result.Err(this.error);
    return fn(this.value);
  }
  toString() {
    return this.isErr() ? `Err(${this.error})` : `Ok(${this.value})`;
  }
}

// --- Node Operations ---
const Operations = {
  add: (n, MonadClass) => (x) => {
    return MonadClass.unit(x + n);
  },

  multiply: (n, MonadClass) => (x) => {
    return MonadClass.unit(x * n);
  },

  subtract: (n, MonadClass) => (x) => {
    return MonadClass.unit(x - n);
  },

  toString: (_, MonadClass) => (x) => {
    return MonadClass.unit(String(x));
  },

  isEven: (_, MonadClass) => (x) => {
    if (typeof x === 'number' && x % 2 === 0) {
      return MonadClass.unit(x);
    } else {
      if (MonadClass === Maybe) return Maybe.Nothing;
      if (MonadClass === Result) return Result.Err("Not Even");
      return MonadClass.unit(x); // Identity passes through
    }
  },

  isPositive: (_, MonadClass) => (x) => {
    if (typeof x === 'number' && x > 0) {
      return MonadClass.unit(x);
    } else {
      if (MonadClass === Maybe) return Maybe.Nothing;
      if (MonadClass === Result) return Result.Err("Not Positive");
      return MonadClass.unit(x);
    }
  }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Identity, Maybe, Result, Operations };
}

// --- Visualization Engine ---

const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    class ConveyorNode {
        constructor(id, type, val, x, y, monadClass) {
            this.id = id;
            this.type = type;
            this.val = val;
            this.x = x;
            this.y = y;
            this.width = 100;
            this.height = 80;
            this.updateOperation(monadClass);
        }

        updateOperation(monadClass) {
            this.operation = Operations[this.type](this.val, monadClass);
        }
    }

    class ConveyorItem {
        constructor(id, value, monadClass) {
            this.id = id;
            this.rawVal = value;
            this.monad = monadClass.unit(value);
            this.x = 0;
            this.y = 175; // Vertically centered on belt (y=150, height=100)
            this.state = 'moving';
            this.targetNode = null;
            this.processTimer = 0;
            this.scale = 1;
            this.opacity = 1;
        }
    }

    class Renderer {
        constructor(system) {
            this.system = system;
            this.svg = document.getElementById('conveyor-svg');
            this.beltLayer = document.getElementById('belt-layer');
            this.nodesLayer = document.getElementById('nodes-layer');
            this.itemsLayer = document.getElementById('items-layer');

            this.drawBelt();
            this.setupPatternAnimation();
        }

        drawBelt() {
            // Belt Background
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', 0);
            rect.setAttribute('y', 150);
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', 100);
            rect.setAttribute('fill', '#ddd');
            rect.setAttribute('stroke', '#999');
            this.beltLayer.appendChild(rect);

            // Animated Tread Pattern Surface
            const surface = document.createElementNS(SVG_NS, 'rect');
            surface.setAttribute('x', 0);
            surface.setAttribute('y', 150);
            surface.setAttribute('width', '100%');
            surface.setAttribute('height', 100);
            surface.setAttribute('fill', 'url(#belt-pattern)');
            surface.setAttribute('opacity', 0.5);
            this.beltLayer.appendChild(surface);
        }

        setupPatternAnimation() {
            this.pattern = document.getElementById('belt-pattern');
        }

        createNodeElement(node) {
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('class', 'node-group');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`); // y needs to be aligned with belt
            g.id = `node-${node.id}`;

            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('width', node.width);
            rect.setAttribute('height', node.height);
            rect.setAttribute('rx', 5);
            // Color based on type
            let color = '#fff';
            if (['isEven', 'isPositive'].includes(node.type)) color = '#e8f6f3'; // Light teal
            if (node.type === 'toString') color = '#fef9e7'; // Light yellow

            rect.setAttribute('fill', color);
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', 2);

            const text = document.createElementNS(SVG_NS, 'text');
            text.setAttribute('x', node.width / 2);
            text.setAttribute('y', node.height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = this.getNodeLabel(node);
            text.setAttribute('font-family', 'monospace');
            text.setAttribute('pointer-events', 'none');

            g.appendChild(rect);
            g.appendChild(text);
            this.nodesLayer.appendChild(g);
        }

        getNodeLabel(node) {
            if (node.type === 'add') return `+ ${node.val}`;
            if (node.type === 'multiply') return `× ${node.val}`;
            if (node.type === 'subtract') return `- ${node.val}`;
            if (node.type === 'isEven') return `isEven?`;
            if (node.type === 'isPositive') return `isPos?`;
            if (node.type === 'toString') return `toString`;
            return node.type;
        }

        createItemElement(item) {
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('class', 'item-box');
            g.id = `item-${item.id}`;
            g.setAttribute('transform', `translate(${item.x}, ${item.y})`);

            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('width', 50);
            rect.setAttribute('height', 50);
            rect.setAttribute('rx', 8);
            rect.setAttribute('stroke-width', 2);

            const text = document.createElementNS(SVG_NS, 'text');
            text.setAttribute('x', 25);
            text.setAttribute('y', 25);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', 'white');

            g.appendChild(rect);
            g.appendChild(text);
            this.itemsLayer.appendChild(g);
            this.updateItemVisuals(item, g);
        }

        removeItemElement(id) {
            const el = document.getElementById(`item-${id}`);
            if (el) el.remove();
        }

        clear() {
            this.itemsLayer.innerHTML = '';
            this.nodesLayer.innerHTML = '';
        }

        render() {
            // Animate Belt Pattern
            if (this.pattern) {
                const offset = -(Date.now() / 50 * this.system.speed) % 20;
                this.pattern.setAttribute('x', offset);
            }

            this.system.items.forEach(item => {
                let el = document.getElementById(`item-${item.id}`);
                if (!el) {
                    this.createItemElement(item);
                    el = document.getElementById(`item-${item.id}`);
                }

                // Update position
                el.setAttribute('transform', `translate(${item.x}, ${item.y}) scale(${item.scale})`);

                // Update visuals
                this.updateItemVisuals(item, el);
            });
        }

        updateItemVisuals(item, el) {
            const rect = el.querySelector('rect');
            const text = el.querySelector('text');

            let color = '#3498db'; // Default Blue (Identity)
            let stroke = '#2980b9';
            let displayText = '';
            let opacity = item.opacity;

            // Determine Box Style based on Monad State
            if (item.monad instanceof Maybe) {
                if (item.monad.isNothing()) {
                    color = '#ecf0f1'; // Light Grey
                    stroke = '#bdc3c7';
                    displayText = ''; // Empty box
                    opacity = 0.6;
                } else {
                    color = '#9b59b6'; // Purple
                    stroke = '#8e44ad';
                    displayText = String(item.monad.value);
                }
            } else if (item.monad instanceof Result) {
                if (item.monad.isErr()) {
                    color = '#e74c3c'; // Red
                    stroke = '#c0392b';
                    displayText = '!';
                } else {
                    color = '#2ecc71'; // Green
                    stroke = '#27ae60';
                    displayText = String(item.monad.value);
                }
            } else {
                // Identity
                 displayText = String(item.monad.value);
            }

            // Override visuals during processing animation
            if (item.state === 'processing_transform') {
                // "Unwrapped" look
                rect.setAttribute('fill', '#fff');
                rect.setAttribute('stroke', stroke);
                rect.setAttribute('stroke-dasharray', '4,4');
                text.setAttribute('fill', stroke);
            } else {
                // Normal "Wrapped" look
                rect.setAttribute('fill', color);
                rect.setAttribute('stroke', stroke);
                rect.removeAttribute('stroke-dasharray');
                text.setAttribute('fill', 'white');
            }

            rect.setAttribute('opacity', opacity);
            text.textContent = displayText;
        }
    }

    class ConveyorSystem {
        constructor() {
            this.nodes = [];
            this.items = [];
            this.speed = 2;
            this.monadClass = Identity;
            this.nodeIdCounter = 0;
            this.itemIdCounter = 0;
            this.renderer = null;
            this.isRunning = true;
        }

        init() {
            this.renderer = new Renderer(this);
            this.loop();
        }

        setMonadClass(clsName) {
            if (clsName === 'identity') this.monadClass = Identity;
            if (clsName === 'maybe') this.monadClass = Maybe;
            if (clsName === 'result') this.monadClass = Result;

            this.items = []; // Clear items
            this.renderer.itemsLayer.innerHTML = '';

            // Update existing nodes operation context
            this.nodes.forEach(n => n.updateOperation(this.monadClass));
        }

        addNode(type, val, x) {
            // Center y on belt. Belt center is 200. Node height 80. y = 160.
            const node = new ConveyorNode(this.nodeIdCounter++, type, val, x, 160, this.monadClass);
            this.nodes.push(node);
            this.nodes.sort((a, b) => a.x - b.x);
            this.renderer.createNodeElement(node);
        }

        spawnItem(value) {
            const item = new ConveyorItem(this.itemIdCounter++, value, this.monadClass);
            this.items.push(item);
        }

        loop() {
            if (this.isRunning) {
                this.update();
                this.renderer.render();
            }
            requestAnimationFrame(() => this.loop());
        }

        update() {
            const itemsToRemove = [];

            this.items.forEach(item => {
                if (item.state === 'moving') {
                    item.x += this.speed;

                    // Check for node interaction
                    // Find node that overlaps with item center
                    const itemCenter = item.x + 25;

                    for (const node of this.nodes) {
                        const nodeCenter = node.x + node.width / 2;
                        // Trigger range: approaching center
                        if (Math.abs(itemCenter - nodeCenter) < this.speed && item.targetNode !== node) {

                            // Check if we should process?
                            let skip = false;

                            // Maybe: Nothing skips processing (passes through).
                            if (item.monad instanceof Maybe && item.monad.isNothing()) skip = true;

                            // Result: Err skips processing (falls off)
                            if (item.monad instanceof Result && item.monad.isErr()) {
                                item.state = 'falling_off';
                                skip = true;
                            }

                            if (!skip) {
                                item.state = 'processing_enter';
                                item.targetNode = node;
                                item.processTimer = 0;
                                item.x = nodeCenter - 25; // Snap
                            }
                            break;
                        }
                    }

                    if (item.x > 800) {
                        itemsToRemove.push(item.id);
                    }
                } else if (item.state.startsWith('processing')) {
                    this.handleProcessing(item);
                } else if (item.state === 'falling_off') {
                    item.y += 5;
                    item.opacity -= 0.05;
                    if (item.y > 400 || item.opacity <= 0) {
                        itemsToRemove.push(item.id);
                    }
                }
            });

            itemsToRemove.forEach(id => {
                this.items = this.items.filter(i => i.id !== id);
                this.renderer.removeItemElement(id);
            });
        }

        handleProcessing(item) {
            item.processTimer++;
            const duration = 60; // Total frames

            // Phase 1: 0-20 (Unwrap)
            // Phase 2: 20-40 (Apply)
            // Phase 3: 40-60 (Rewrap)

            if (item.state === 'processing_enter') {
                if (item.processTimer > 20) {
                    item.state = 'processing_transform';

                    // Apply Logic
                    try {
                        item.monad = item.monad.bind(item.targetNode.operation);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } else if (item.state === 'processing_transform') {
                if (item.processTimer > 40) {
                    item.state = 'processing_exit';
                }
            } else if (item.state === 'processing_exit') {
                if (item.processTimer > 60) {
                    item.state = 'moving';
                    item.targetNode = null;
                }
            }
        }

        reset() {
            this.items.forEach(i => this.renderer.removeItemElement(i.id));
            this.items = [];
            this.nodes.forEach(n => {
                const el = document.getElementById(`node-${n.id}`);
                if (el) el.remove();
            });
            this.nodes = [];
            this.nodeIdCounter = 0;
            this.itemIdCounter = 0;
            this.renderer.nodesLayer.innerHTML = '';
        }
    }

    // Initialize Global System
    window.addEventListener('load', () => {
        if (!window.conveyorSystem) {
             const sys = new ConveyorSystem();
             window.conveyorSystem = sys;
             sys.init();

             // --- Interactions ---
             const draggables = document.querySelectorAll('.node-draggable');
             const dropZone = document.querySelector('.visualization-area');
             const overlay = document.getElementById('drop-zone-overlay');
             const svg = document.getElementById('conveyor-svg');

             draggables.forEach(el => {
                el.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('type', el.dataset.type);
                    e.dataTransfer.setData('val', el.dataset.val || '');
                    overlay.classList.remove('hidden');
                    setTimeout(() => overlay.classList.add('active'), 10);
                });

                el.addEventListener('dragend', () => {
                    overlay.classList.remove('active');
                    setTimeout(() => overlay.classList.add('hidden'), 200);
                });
             });

             dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
             });

             dropZone.addEventListener('dragenter', () => {
                overlay.classList.add('active');
             });

             dropZone.addEventListener('dragleave', (e) => {
                if (e.relatedTarget && !dropZone.contains(e.relatedTarget)) {
                   overlay.classList.remove('active');
                }
             });

             dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                overlay.classList.remove('active');
                setTimeout(() => overlay.classList.add('hidden'), 200);

                const type = e.dataTransfer.getData('type');
                if (!type) return;

                const valStr = e.dataTransfer.getData('val');
                const val = valStr ? parseInt(valStr, 10) : null;

                // Calculate SVG coordinates
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

                let x = Math.max(50, Math.min(750, svgP.x));
                x -= 50; // Center node

                sys.addNode(type, val, x);
             });

             // Controls
             const radios = document.querySelectorAll('input[name="monad-type"]');
             const description = document.getElementById('monad-description');

             radios.forEach(r => {
                r.addEventListener('change', (e) => {
                   const val = e.target.value;
                   sys.setMonadClass(val);

                   if (val === 'identity') description.textContent = "Baseline: Wraps value in a box.";
                   if (val === 'maybe') description.textContent = "Maybe: Handles nulls safely. Empty boxes pass through.";
                   if (val === 'result') description.textContent = "Result: Handles errors. Error crates fall off.";
                });
             });

             document.getElementById('spawn-btn').addEventListener('click', () => {
                const val = parseInt(document.getElementById('spawn-input').value, 10);
                sys.spawnItem(val);
             });

             document.getElementById('reset-btn').addEventListener('click', () => {
                sys.reset();
             });

             document.getElementById('speed-slider').addEventListener('input', (e) => {
                sys.speed = parseInt(e.target.value, 10);
            });
        }
    });
}
