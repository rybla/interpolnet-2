/**
 * Huffman Entropy Calculator
 * Interpolnet 2 Demo
 */

class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(node) {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.sinkDown(0);
        }
        return min;
    }

    bubbleUp(n) {
        const element = this.heap[n];
        while (n > 0) {
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.heap[parentN];
            if (element.freq >= parent.freq) break;
            this.heap[parentN] = element;
            this.heap[n] = parent;
            n = parentN;
        }
    }

    sinkDown(n) {
        const length = this.heap.length;
        const element = this.heap[n];
        while (true) {
            const rightChildN = (n + 1) * 2;
            const leftChildN = rightChildN - 1;
            let leftChild, rightChild;
            let swap = null;

            if (leftChildN < length) {
                leftChild = this.heap[leftChildN];
                if (leftChild.freq < element.freq) {
                    swap = leftChildN;
                }
            }
            if (rightChildN < length) {
                rightChild = this.heap[rightChildN];
                if (
                    (swap === null && rightChild.freq < element.freq) ||
                    (swap !== null && rightChild.freq < leftChild.freq)
                ) {
                    swap = rightChildN;
                }
            }
            if (swap === null) break;
            this.heap[n] = this.heap[swap];
            this.heap[swap] = element;
            n = swap;
        }
    }

    size() {
        return this.heap.length;
    }
}

class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const entropyVal = document.getElementById('entropy-val');
    const originalSizeVal = document.getElementById('original-size');
    const compressedSizeVal = document.getElementById('compressed-size');
    const compressionRatioVal = document.getElementById('compression-ratio');
    const freqTableBody = document.querySelector('#freq-table tbody');
    const svg = document.getElementById('tree-svg');

    const svgNS = "http://www.w3.org/2000/svg";

    let currentData = {
        text: '',
        frequencies: {},
        probabilities: {},
        tree: null,
        codes: {},
        entropy: 0,
        originalBits: 0,
        compressedBits: 0
    };

    // Visualization config
    const config = {
        nodeRadius: 20,
        levelHeight: 70,
        siblingSpacing: 50,
        margin: 40,
        animDuration: 300
    };

    let transformState = { x: 0, y: 0, scale: 1 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    let svgGroup = document.createElementNS(svgNS, 'g');
    svg.appendChild(svgGroup);

    // Pan & Zoom controls
    svg.addEventListener('mousedown', (e) => {
        isDragging = true;
        startDrag = { x: e.clientX - transformState.x, y: e.clientY - transformState.y };
        svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        svg.style.cursor = 'grab';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        transformState.x = e.clientX - startDrag.x;
        transformState.y = e.clientY - startDrag.y;
        updateTransform();
    });

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scaleAmount = 0.1;
        const delta = Math.sign(e.deltaY) * -1;
        const newScale = Math.max(0.1, Math.min(transformState.scale + delta * scaleAmount, 5));

        // Zoom towards mouse
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        transformState.x = mouseX - (mouseX - transformState.x) * (newScale / transformState.scale);
        transformState.y = mouseY - (mouseY - transformState.y) * (newScale / transformState.scale);
        transformState.scale = newScale;

        updateTransform();
    }, { passive: false });

    function updateTransform() {
        svgGroup.setAttribute('transform', `translate(${transformState.x}, ${transformState.y}) scale(${transformState.scale})`);
    }

    // Main App Logic
    textInput.addEventListener('input', () => {
        processText(textInput.value);
    });

    // --- Visualization Logic ---
    let layoutNodes = [];
    let layoutEdges = [];

    // Default init
    processText("hello world!");

    function processText(text) {
        if (!text) {
            clearApp();
            return;
        }

        currentData.text = text;

        // 1. Calculate Frequencies
        currentData.frequencies = {};
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            currentData.frequencies[char] = (currentData.frequencies[char] || 0) + 1;
        }

        const totalChars = text.length;

        // 2. Calculate Probabilities & Entropy
        currentData.probabilities = {};
        currentData.entropy = 0;
        for (const [char, freq] of Object.entries(currentData.frequencies)) {
            const p = freq / totalChars;
            currentData.probabilities[char] = p;
            currentData.entropy -= p * Math.log2(p);
        }

        // 3. Build Huffman Tree
        buildHuffmanTree();

        // 4. Generate Codes
        currentData.codes = {};
        generateCodes(currentData.tree, "");

        // 5. Calculate Metrics
        currentData.originalBits = totalChars * 8;
        currentData.compressedBits = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            currentData.compressedBits += currentData.codes[char].length;
        }

        updateUI();
    }

    function buildHuffmanTree() {
        const heap = new MinHeap();
        for (const [char, freq] of Object.entries(currentData.frequencies)) {
            heap.insert(new HuffmanNode(char, freq));
        }

        if (heap.size() === 1) {
            // Edge case: string with only one unique character
            const onlyNode = heap.extractMin();
            currentData.tree = new HuffmanNode(null, onlyNode.freq, onlyNode, null);
            return;
        }

        while (heap.size() > 1) {
            const left = heap.extractMin();
            const right = heap.extractMin();
            const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
            heap.insert(parent);
        }

        currentData.tree = heap.extractMin();
    }

    function generateCodes(node, currentCode) {
        if (!node) return;

        if (node.char !== null) {
            currentData.codes[node.char] = currentCode || "0"; // Handle single char case
            return;
        }
        generateCodes(node.left, currentCode + "0");
        generateCodes(node.right, currentCode + "1");
    }

    function clearApp() {
        currentData = { text: '', frequencies: {}, probabilities: {}, tree: null, codes: {}, entropy: 0, originalBits: 0, compressedBits: 0 };
        entropyVal.textContent = "0.00";
        originalSizeVal.textContent = "0 bits";
        compressedSizeVal.textContent = "0 bits";
        compressionRatioVal.textContent = "1.00x";
        freqTableBody.innerHTML = '';
        svgGroup.innerHTML = '';
    }

    function updateUI() {
        // Update Metrics
        entropyVal.textContent = currentData.entropy.toFixed(3) + " bits/char";
        originalSizeVal.textContent = currentData.originalBits + " bits";
        compressedSizeVal.textContent = currentData.compressedBits + " bits";
        const ratio = currentData.originalBits > 0 ? (currentData.originalBits / currentData.compressedBits).toFixed(2) : "1.00";
        compressionRatioVal.textContent = ratio + "x";

        // Update Table
        freqTableBody.innerHTML = '';
        const sortedChars = Object.keys(currentData.frequencies).sort((a, b) => currentData.frequencies[b] - currentData.frequencies[a] || a.localeCompare(b));

        sortedChars.forEach(char => {
            const tr = document.createElement('tr');
            tr.dataset.char = char;

            const tdChar = document.createElement('td');
            // Show visible rep for space, etc.
            let displayChar = char;
            if (char === ' ') displayChar = 'Space';
            else if (char === '\n') displayChar = 'Enter';
            tdChar.textContent = displayChar;

            const tdFreq = document.createElement('td');
            tdFreq.textContent = currentData.frequencies[char];

            const tdCode = document.createElement('td');
            tdCode.textContent = currentData.codes[char];

            tr.appendChild(tdChar);
            tr.appendChild(tdFreq);
            tr.appendChild(tdCode);

            // Hover interactions
            tr.addEventListener('mouseenter', () => highlightPath(char));
            tr.addEventListener('mouseleave', clearHighlight);

            freqTableBody.appendChild(tr);
        });

        // Update Visualization
        drawTree();
    }

    function layoutTree(root) {
        // Reingold-Tilford inspired simple layout
        if (!root) return { width: 0, nodes: [], edges: [] };

        const nodes = [];
        const edges = [];
        let idCounter = 0;

        function traverse(node, depth) {
            if (!node) return null;

            const layoutNode = {
                id: `node-${idCounter++}`,
                data: node,
                depth: depth,
                x: 0,
                y: depth * config.levelHeight,
                width: 0, // subtree width
                isLeaf: node.char !== null
            };

            if (node.char !== null) {
                layoutNode.width = config.nodeRadius * 2;
                nodes.push(layoutNode);
                return layoutNode;
            }

            const leftChild = traverse(node.left, depth + 1);
            const rightChild = traverse(node.right, depth + 1);

            if (leftChild) {
                edges.push({ source: layoutNode, target: leftChild, label: '0' });
                layoutNode.width += leftChild.width + config.siblingSpacing / 2;
            }
            if (rightChild) {
                edges.push({ source: layoutNode, target: rightChild, label: '1' });
                layoutNode.width += rightChild.width + config.siblingSpacing / 2;
            }

            nodes.push(layoutNode);
            return layoutNode;
        }

        const layoutRoot = traverse(root, 0);

        // Second pass: position X
        function positionNodes(node, xStart) {
            if (!node) return;

            if (node.isLeaf) {
                node.x = xStart + config.nodeRadius;
                return;
            }

            let currentX = xStart;
            const leftEdge = edges.find(e => e.source === node && e.label === '0');
            const rightEdge = edges.find(e => e.source === node && e.label === '1');

            if (leftEdge) {
                positionNodes(leftEdge.target, currentX);
                currentX += leftEdge.target.width + config.siblingSpacing;
            }

            if (rightEdge) {
                positionNodes(rightEdge.target, currentX);
            }

            // Center parent over children
            if (leftEdge && rightEdge) {
                node.x = (leftEdge.target.x + rightEdge.target.x) / 2;
            } else if (leftEdge) {
                node.x = leftEdge.target.x;
            } else if (rightEdge) {
                node.x = rightEdge.target.x;
            }
        }

        if (layoutRoot) {
            positionNodes(layoutRoot, 0);
        }

        // Center entire tree in SVG
        const treeWidth = layoutRoot ? layoutRoot.width : 0;
        const svgRect = svg.getBoundingClientRect();

        // Auto-fit logic if first draw
        if (transformState.scale === 1 && transformState.x === 0 && transformState.y === 0) {
            const reqWidth = treeWidth + config.margin * 2;
            const reqHeight = (Math.max(...nodes.map(n => n.depth)) + 1) * config.levelHeight + config.margin * 2;

            const scaleX = svgRect.width / reqWidth;
            const scaleY = svgRect.height / reqHeight;
            const scale = Math.min(1, Math.min(scaleX, scaleY));

            transformState.scale = scale;
            transformState.x = (svgRect.width - treeWidth * scale) / 2;
            transformState.y = config.margin * scale;
            updateTransform();
        }

        return { nodes, edges, root: layoutRoot };
    }

    function drawTree() {
        svgGroup.innerHTML = '';

        const layout = layoutTree(currentData.tree);
        layoutNodes = layout.nodes;
        layoutEdges = layout.edges;

        // Draw Edges
        layoutEdges.forEach(edge => {
            const g = document.createElementNS(svgNS, 'g');
            g.classList.add('edge-group');

            const path = document.createElementNS(svgNS, 'path');
            path.classList.add('link');
            // Add custom data attribute to identify path for highlighting
            if (edge.target.isLeaf) {
                path.dataset.toChar = edge.target.data.char;
            }

            const sourceY = edge.source.y + config.nodeRadius;
            const targetY = edge.target.y - config.nodeRadius;

            // Curve path
            const d = `M ${edge.source.x} ${sourceY}
                       C ${edge.source.x} ${(sourceY + targetY)/2},
                         ${edge.target.x} ${(sourceY + targetY)/2},
                         ${edge.target.x} ${targetY}`;
            path.setAttribute('d', d);
            g.appendChild(path);

            // Label (0 or 1)
            const text = document.createElementNS(svgNS, 'text');
            text.classList.add('link-label');
            text.setAttribute('x', (edge.source.x + edge.target.x) / 2);
            text.setAttribute('y', (sourceY + targetY) / 2);
            text.textContent = edge.label;
            g.appendChild(text);

            svgGroup.appendChild(g);
        });

        // Draw Nodes
        layoutNodes.forEach(node => {
            const g = document.createElementNS(svgNS, 'g');
            g.classList.add('node');
            if (node.isLeaf) g.classList.add('leaf');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

            if (node.isLeaf) {
                g.dataset.char = node.data.char;
            } else {
                g.dataset.internal = "true";
                // store all descendant leaf chars for path highlighting
                g.dataset.descendants = getLeafDescendants(node.data).join('');
            }

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('r', config.nodeRadius);
            g.appendChild(circle);

            if (node.isLeaf) {
                const charText = document.createElementNS(svgNS, 'text');
                charText.classList.add('node-char');
                charText.setAttribute('y', 4);
                let displayChar = node.data.char;
                if (displayChar === ' ') displayChar = '␣';
                else if (displayChar === '\n') displayChar = '↵';
                charText.textContent = displayChar;
                g.appendChild(charText);
            } else {
                const freqText = document.createElementNS(svgNS, 'text');
                freqText.classList.add('node-freq');
                freqText.setAttribute('y', 4);
                freqText.textContent = node.data.freq;
                g.appendChild(freqText);
            }

            // Hover interactions
            if (node.isLeaf) {
                g.addEventListener('mouseenter', () => highlightPath(node.data.char));
                g.addEventListener('mouseleave', clearHighlight);
            }

            svgGroup.appendChild(g);
        });
    }

    function getLeafDescendants(hNode) {
        if (!hNode) return [];
        if (hNode.char !== null) return [hNode.char];
        return [...getLeafDescendants(hNode.left), ...getLeafDescendants(hNode.right)];
    }

    function highlightPath(char) {
        if (!char) return;

        // Highlight table row
        document.querySelectorAll('#freq-table tbody tr').forEach(tr => {
            if (tr.dataset.char === char) tr.classList.add('highlighted');
            else tr.classList.remove('highlighted');
        });

        // Highlight SVG Nodes
        document.querySelectorAll('.node').forEach(g => {
            if (g.dataset.char === char) {
                g.classList.add('highlighted');
            } else if (g.dataset.internal === "true" && g.dataset.descendants.includes(char)) {
                g.classList.add('highlighted');
            } else {
                g.classList.remove('highlighted');
            }
        });

        // Highlight SVG Edges
        // A simple way is to re-traverse and mark the specific path, but we can also infer from descendants
        const code = currentData.codes[char];
        if(!code) return;

        let currentNode = layoutNodes.find(n => n.depth === 0); // Root

        document.querySelectorAll('.edge-group').forEach(eg => {
            eg.querySelector('.link').classList.remove('highlighted');
            eg.querySelector('.link-label').classList.remove('highlighted');
        });

        // We need to trace down the layout tree
        for(let i=0; i<code.length; i++) {
            const bit = code[i];
            // find the edge going from currentNode with this bit
            const edge = layoutEdges.find(e => e.source === currentNode && e.label === bit);
            if(edge) {
                // Find matching DOM element
                // We didn't bind DOM to edge directly, so we search by source/target matching D attribute
                const sourceY = edge.source.y + config.nodeRadius;
                const targetY = edge.target.y - config.nodeRadius;
                const expectedD = `M ${edge.source.x} ${sourceY} C ${edge.source.x} ${(sourceY + targetY)/2}, ${edge.target.x} ${(sourceY + targetY)/2}, ${edge.target.x} ${targetY}`;

                // Clean up string comparison formatting issues by checking a subset or exact
                document.querySelectorAll('.edge-group').forEach(eg => {
                    const path = eg.querySelector('path');
                    const d = path.getAttribute('d').replace(/\s+/g, ' ');
                    const expD = expectedD.replace(/\s+/g, ' ');
                    if(d === expD) {
                        path.classList.add('highlighted');
                        eg.querySelector('.link-label').classList.add('highlighted');
                    }
                });

                currentNode = edge.target;
            }
        }
    }

    function clearHighlight() {
        document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
    }
});