const svg = document.getElementById('fsm-svg');
const nodesLayer = document.getElementById('nodes-layer');
const linksLayer = document.getElementById('links-layer');
const drawingLayer = document.getElementById('drawing-layer');
const addStateBtn = document.getElementById('add-state-btn');
const clearBtn = document.getElementById('clear-btn');
const codeBlock = document.getElementById('generated-code');
const textEditor = document.getElementById('text-editor');
const labelInput = document.getElementById('label-input');

let nodes = [];
let links = [];
let nodeIdCounter = 0;

let selectedNode = null;
let selectedLink = null;
let draggingNode = null;
let drawingFromNode = null;
let currentDrawingLine = null;

let editingElement = null;
let editingType = null; // 'node' or 'link'

// Set canvas dimensions
function resizeCanvas() {
    const rect = svg.getBoundingClientRect();
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial

// Event Listeners
addStateBtn.addEventListener('click', () => {
    const rect = svg.getBoundingClientRect();
    addNode(rect.width / 2 + (Math.random() * 50 - 25), rect.height / 2 + (Math.random() * 50 - 25));
});

clearBtn.addEventListener('click', () => {
    nodes = [];
    links = [];
    nodeIdCounter = 0;
    selectedNode = null;
    selectedLink = null;
    render();
});

svg.addEventListener('mousedown', onMouseDown);
svg.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
svg.addEventListener('keydown', onKeyDown);
svg.addEventListener('dblclick', onDoubleClick);

labelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveEditing();
    } else if (e.key === 'Escape') {
        cancelEditing();
    }
});
labelInput.addEventListener('blur', saveEditing);

// State Management
function addNode(x, y) {
    const id = `State_${nodeIdCounter++}`;
    nodes.push({ id, label: id, x, y, r: 25 });
    render();
}

function removeNode(node) {
    nodes = nodes.filter(n => n !== node);
    links = links.filter(l => l.source !== node && l.target !== node);
    if (selectedNode === node) selectedNode = null;
    render();
}

function addLink(source, target) {
    // Avoid duplicate links
    const existing = links.find(l => l.source === source && l.target === target);
    if (!existing) {
        links.push({ source, target, label: 'EVENT' });
    }
    render();
}

function removeLink(link) {
    links = links.filter(l => l !== link);
    if (selectedLink === link) selectedLink = null;
    render();
}

// Interaction Handlers
function onMouseDown(e) {
    if (e.button !== 0) return; // Only left click

    const target = e.target;
    const isShift = e.shiftKey;

    // Find if clicked on node
    const nodeEl = target.closest('.fsm-node');
    if (nodeEl) {
        const id = nodeEl.dataset.id;
        const node = nodes.find(n => n.id === id);

        if (isShift) {
            // Start drawing link
            drawingFromNode = node;
            const pt = getMousePos(e);
            currentDrawingLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            currentDrawingLine.setAttribute('class', 'drawing-line');
            currentDrawingLine.setAttribute('marker-end', 'url(#arrowhead-drawing)');
            updateDrawingLine(node.x, node.y, pt.x, pt.y);
            drawingLayer.appendChild(currentDrawingLine);
            e.preventDefault(); // Prevent text selection
        } else {
            // Select and start dragging
            selectNode(node);
            draggingNode = node;
        }
        return;
    }

    // Find if clicked on link text
    const linkText = target.closest('.fsm-link-text');
    if (linkText) {
        const sourceId = linkText.dataset.source;
        const targetId = linkText.dataset.target;
        const link = links.find(l => l.source.id === sourceId && l.target.id === targetId);
        if (link) {
            selectLink(link);
            return;
        }
    }

    // Clicked on background
    if (!target.closest('.fsm-link')) {
        clearSelection();
        cancelEditing();
    }
}

function onMouseMove(e) {
    const pt = getMousePos(e);

    if (drawingFromNode && currentDrawingLine) {
        // Drawing a new link
        updateDrawingLine(drawingFromNode.x, drawingFromNode.y, pt.x, pt.y);
    } else if (draggingNode) {
        // Dragging a node
        draggingNode.x = pt.x;
        draggingNode.y = pt.y;
        render(); // update node and connected links
    }
}

function onMouseUp(e) {
    if (drawingFromNode) {
        // Stop drawing link
        const target = e.target;
        const nodeEl = target.closest('.fsm-node');
        if (nodeEl) {
            const id = nodeEl.dataset.id;
            const targetNode = nodes.find(n => n.id === id);
            if (targetNode) {
                addLink(drawingFromNode, targetNode);
            }
        }

        drawingFromNode = null;
        if (currentDrawingLine && currentDrawingLine.parentNode) {
            currentDrawingLine.parentNode.removeChild(currentDrawingLine);
        }
        currentDrawingLine = null;
    }

    if (draggingNode) {
        draggingNode = null;
    }
}

function onKeyDown(e) {
    // Don't delete if we are editing text
    if (!textEditor.classList.contains('hidden')) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedNode) {
            removeNode(selectedNode);
        } else if (selectedLink) {
            removeLink(selectedLink);
        }
    }
}

function onDoubleClick(e) {
    const target = e.target;

    // Double click node
    const nodeEl = target.closest('.fsm-node');
    if (nodeEl) {
        const id = nodeEl.dataset.id;
        const node = nodes.find(n => n.id === id);
        if (node) {
            startEditing(node, 'node', node.x, node.y);
        }
        return;
    }

    // Double click link
    const linkText = target.closest('.fsm-link-text');
    if (linkText) {
        const sourceId = linkText.dataset.source;
        const targetId = linkText.dataset.target;
        const link = links.find(l => l.source.id === sourceId && l.target.id === targetId);
        if (link) {
            const { midX, midY } = calculateLinkMidpoint(link.source, link.target);
            startEditing(link, 'link', midX, midY);
        }
    }
}

// Selection Helpers
function selectNode(node) {
    selectedNode = node;
    selectedLink = null;
    render();
    svg.focus();
}

function selectLink(link) {
    selectedLink = link;
    selectedNode = null;
    render();
    svg.focus();
}

function clearSelection() {
    selectedNode = null;
    selectedLink = null;
    render();
}

// Editing Helpers
function startEditing(element, type, x, y) {
    editingElement = element;
    editingType = type;

    labelInput.value = element.label;

    // Position overlay
    const rect = svg.getBoundingClientRect();
    textEditor.style.left = `${rect.left + x}px`;
    textEditor.style.top = `${rect.top + y}px`;
    textEditor.classList.remove('hidden');

    labelInput.focus();
    labelInput.select();
}

function saveEditing() {
    if (!editingElement) return;

    const val = labelInput.value.trim();
    if (val) {
        // Basic validation for code safety (alphanumeric and underscore)
        const safeVal = val.replace(/[^a-zA-Z0-9_]/g, '_');
        editingElement.label = safeVal;
    }

    cancelEditing();
    render();
}

function cancelEditing() {
    editingElement = null;
    editingType = null;
    textEditor.classList.add('hidden');
    labelInput.value = '';
    svg.focus();
}

// Rendering
function render() {
    renderLinks();
    renderNodes();
    generateCode();
}

function renderNodes() {
    nodesLayer.innerHTML = ''; // clear

    nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'fsm-node');
        g.dataset.id = node.id;
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        if (node === selectedNode) {
            g.classList.add('selected');
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'fsm-circle');
        circle.setAttribute('r', '25');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'fsm-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.textContent = node.label;

        g.appendChild(circle);
        g.appendChild(text);

        nodesLayer.appendChild(g);
    });
}

function renderLinks() {
    linksLayer.innerHTML = '';

    // Group links to handle bidirectional and self-loops
    const linkMap = new Map();
    links.forEach(l => {
        const key1 = `${l.source.id}->${l.target.id}`;
        const key2 = `${l.target.id}->${l.source.id}`;

        if (!linkMap.has(key1)) linkMap.set(key1, []);
        if (!linkMap.has(key2)) linkMap.set(key2, []);

        linkMap.get(key1).push(l);
    });

    links.forEach(link => {
        const isSelected = link === selectedLink;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `fsm-link ${isSelected ? 'selected' : ''}`);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'fsm-link-path');

        const isSelfLoop = link.source === link.target;
        const isBidirectional = link.source !== link.target && linkMap.get(`${link.target.id}->${link.source.id}`).length > 0;

        let pathData = '';
        let midX, midY;

        if (isSelfLoop) {
            // Self loop path
            const x = link.source.x;
            const y = link.source.y - link.source.r;
            pathData = `M ${x} ${y} C ${x - 40} ${y - 60}, ${x + 40} ${y - 60}, ${x} ${y}`;
            midX = x;
            midY = y - 45;
            path.setAttribute('marker-end', isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)');
        } else {
            // Calculate intersection with target circle
            const source = link.source;
            const target = link.target;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Adjust for bidirectional curve
                let offset = 0;
                if (isBidirectional) offset = 20;

                const angle = Math.atan2(dy, dx);

                // End point on target circle border
                const endX = target.x - target.r * Math.cos(angle) + offset * Math.sin(angle);
                const endY = target.y - target.r * Math.sin(angle) - offset * Math.cos(angle);

                // Start point on source circle border
                const startX = source.x + source.r * Math.cos(angle) + offset * Math.sin(angle);
                const startY = source.y + source.r * Math.sin(angle) - offset * Math.cos(angle);

                if (isBidirectional) {
                    midX = (startX + endX) / 2 + offset * Math.sin(angle);
                    midY = (startY + endY) / 2 - offset * Math.cos(angle);
                    pathData = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
                } else {
                    midX = (startX + endX) / 2;
                    midY = (startY + endY) / 2;
                    pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
                }
                path.setAttribute('marker-end', isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)');
            }
        }

        path.setAttribute('d', pathData);
        g.appendChild(path);

        // Add text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'fsm-link-text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY - 10);
        text.setAttribute('text-anchor', 'middle');
        text.dataset.source = link.source.id;
        text.dataset.target = link.target.id;
        text.textContent = link.label;

        g.appendChild(text);
        linksLayer.appendChild(g);
    });
}

function getMousePos(e) {
    const rect = svg.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function updateDrawingLine(x1, y1, x2, y2) {
    currentDrawingLine.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
}

function calculateLinkMidpoint(source, target) {
    if (source === target) {
        return { midX: source.x, midY: source.y - 45 };
    }
    return {
        midX: (source.x + target.x) / 2,
        midY: (source.y + target.y) / 2
    };
}

// Code Generation
function generateCode() {
    if (nodes.length === 0) {
        codeBlock.innerHTML = '<span class="comment">// Add states to generate code...</span>';
        return;
    }

    let code = '';

    // State enum
    code += '<span class="keyword">typedef enum</span> {\n';
    nodes.forEach((node, i) => {
        code += `    ${node.label}${i < nodes.length - 1 ? ',' : ''}\n`;
    });
    code += '} <span class="variable">State</span>;\n\n';

    // State variable
    code += '<span class="variable">State</span> currentState = ' + nodes[0].label + ';\n\n';

    // Main switch function
    code += '<span class="keyword">void</span> <span class="string">processEvent</span>(<span class="keyword">int</span> event) {\n';
    code += '    <span class="keyword">switch</span> (currentState) {\n';

    nodes.forEach(node => {
        code += `        <span class="keyword">case</span> ${node.label}:\n`;

        const nodeLinks = links.filter(l => l.source === node);
        if (nodeLinks.length > 0) {
            nodeLinks.forEach((link, idx) => {
                code += `            ${idx === 0 ? '<span class="keyword">if</span>' : '<span class="keyword">else if</span>'} (event == ${link.label}) {\n`;
                code += `                currentState = ${link.target.label};\n`;
                code += `            }\n`;
            });
        } else {
            code += `            <span class="comment">// No outgoing transitions</span>\n`;
        }

        code += `            <span class="keyword">break</span>;\n\n`;
    });

    code += '        <span class="keyword">default</span>:\n';
    code += '            <span class="comment">// Unhandled state</span>\n';
    code += '            <span class="keyword">break</span>;\n';
    code += '    }\n';
    code += '}\n';

    codeBlock.innerHTML = code;
}

// Initialize with a default state
addNode(150, 150);
