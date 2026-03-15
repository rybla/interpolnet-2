/**
 * Huffman Node definition
 */
class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
    this.x = 0;
    this.y = 0;
  }
}

/**
 * Elements
 */
const inputText = document.getElementById('input-text');
const shannonEntropyEl = document.getElementById('shannon-entropy');
const originalSizeEl = document.getElementById('original-size');
const compressedSizeEl = document.getElementById('compressed-size');
const compressionRatioEl = document.getElementById('compression-ratio');
const tableBody = document.getElementById('table-body');
const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');

let huffmanRoot = null;
let huffmanCodes = {};
let maxDepth = 0;

// Tree visualization config
const NODE_RADIUS = 16;
const LEVEL_HEIGHT = 60;
const CANVAS_PADDING = 40;

/**
 * Initialization and Event Listeners
 */
function init() {
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawTree();
  });

  inputText.addEventListener('input', processText);

  // Set initial text
  inputText.value = "Huffman coding is a data compression algorithm that assigns variable-length codes to characters based on their frequency of occurrence.";
  processText();
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

/**
 * Core Logic: Calculate frequencies
 */
function getFrequencies(text) {
  const freqMap = new Map();
  for (const char of text) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }
  return freqMap;
}

/**
 * Core Logic: Build Huffman Tree
 */
function buildHuffmanTree(freqMap) {
  if (freqMap.size === 0) return null;

  const nodes = [];
  for (const [char, freq] of freqMap.entries()) {
    nodes.push(new HuffmanNode(char, freq));
  }

  if (nodes.length === 1) {
    // Edge case for single character string
    const root = new HuffmanNode(null, nodes[0].freq);
    root.left = nodes[0];
    return root;
  }

  while (nodes.length > 1) {
    // Sort descending so pop() gets lowest freq
    nodes.sort((a, b) => b.freq - a.freq);

    const left = nodes.pop();
    const right = nodes.pop();

    const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
    nodes.push(parent);
  }

  return nodes[0];
}

/**
 * Core Logic: Generate Codes
 */
function generateCodes(node, currentCode = "", codes = {}) {
  if (!node) return codes;

  if (node.char !== null) {
    codes[node.char] = currentCode || "0"; // Handle single char edge case
  }

  generateCodes(node.left, currentCode + "0", codes);
  generateCodes(node.right, currentCode + "1", codes);

  return codes;
}

/**
 * Core Logic: Calculate Shannon Entropy
 */
function calculateEntropy(freqMap, totalChars) {
  if (totalChars === 0) return 0;
  let entropy = 0;
  for (const freq of freqMap.values()) {
    const p = freq / totalChars;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Update UI Stats and Table
 */
function updateUI(text, freqMap, codes) {
  const totalChars = text.length;
  const originalBits = totalChars * 8;
  let compressedBits = 0;

  const entropy = calculateEntropy(freqMap, totalChars);

  tableBody.innerHTML = '';

  // Sort characters by frequency (descending)
  const sortedChars = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);

  for (const [char, freq] of sortedChars) {
    const code = codes[char];
    compressedBits += freq * code.length;

    const row = document.createElement('tr');

    const charCell = document.createElement('td');
    charCell.textContent = char === ' ' ? 'Space' : char === '\n' ? '\\n' : char;

    const freqCell = document.createElement('td');
    freqCell.textContent = freq;

    const codeCell = document.createElement('td');
    codeCell.textContent = code;
    codeCell.style.color = 'var(--accent-color)';

    row.appendChild(charCell);
    row.appendChild(freqCell);
    row.appendChild(codeCell);
    tableBody.appendChild(row);
  }

  shannonEntropyEl.textContent = `${entropy.toFixed(2)} bits/char`;
  originalSizeEl.textContent = `${originalBits} bits`;
  compressedSizeEl.textContent = `${compressedBits} bits`;

  const ratio = originalBits === 0 ? 0 : ((originalBits - compressedBits) / originalBits) * 100;
  compressionRatioEl.textContent = `${ratio.toFixed(2)}% saved`;
}

/**
 * Process text input
 */
function processText() {
  const text = inputText.value;
  if (!text) {
    huffmanRoot = null;
    updateUI("", new Map(), {});
    drawTree();
    return;
  }

  const freqMap = getFrequencies(text);
  huffmanRoot = buildHuffmanTree(freqMap);
  huffmanCodes = generateCodes(huffmanRoot);

  updateUI(text, freqMap, huffmanCodes);
  layoutTree();
  drawTree();
}

/**
 * Calculate tree layout (x, y positions)
 */
function layoutTree() {
  if (!huffmanRoot) return;

  maxDepth = getTreeDepth(huffmanRoot);

  // Ensure canvas is tall enough and wide enough for the tree
  const requiredHeight = maxDepth * LEVEL_HEIGHT + CANVAS_PADDING * 2;
  const currentHeight = canvas.parentElement.clientHeight;
  const currentWidth = canvas.parentElement.clientWidth;

  if (requiredHeight > currentHeight) {
    canvas.height = requiredHeight;
  } else {
    canvas.height = currentHeight;
  }

  let leafCount = 0;
  const numLeaves = Object.keys(huffmanCodes).length;
  // Dynamic spacing based on available width or needed space
  const availableWidth = Math.max(currentWidth, numLeaves * NODE_RADIUS * 3);

  if (availableWidth > currentWidth) {
      canvas.width = availableWidth;
  } else {
      canvas.width = currentWidth;
  }

  const spacing = (canvas.width - CANVAS_PADDING * 2) / Math.max(1, numLeaves);

  function calculatePositions(node, depth) {
    if (!node) return;

    node.y = CANVAS_PADDING + depth * LEVEL_HEIGHT;

    if (node.left === null && node.right === null) {
      // Leaf node
      node.x = CANVAS_PADDING + (leafCount + 0.5) * spacing;
      leafCount++;
    } else {
      // Internal node
      calculatePositions(node.left, depth + 1);
      calculatePositions(node.right, depth + 1);

      if (node.left && node.right) {
        node.x = (node.left.x + node.right.x) / 2;
      } else if (node.left) {
        node.x = node.left.x;
      } else if (node.right) {
        node.x = node.right.x;
      }
    }
  }

  calculatePositions(huffmanRoot, 0);

  // Center tree if it's smaller than canvas
  const minX = getMinX(huffmanRoot);
  const maxX = getMaxX(huffmanRoot);
  const treeWidth = maxX - minX;

  if (treeWidth < canvas.width - CANVAS_PADDING * 2) {
    const offsetX = (canvas.width - treeWidth) / 2 - minX;
    shiftTreeX(huffmanRoot, offsetX);
  }
}

function getTreeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

function getMinX(node) {
  if (!node) return Infinity;
  let min = node.x;
  if (node.left) min = Math.min(min, getMinX(node.left));
  if (node.right) min = Math.min(min, getMinX(node.right));
  return min;
}

function getMaxX(node) {
  if (!node) return -Infinity;
  let max = node.x;
  if (node.left) max = Math.max(max, getMaxX(node.left));
  if (node.right) max = Math.max(max, getMaxX(node.right));
  return max;
}

function shiftTreeX(node, offset) {
  if (!node) return;
  node.x += offset;
  shiftTreeX(node.left, offset);
  shiftTreeX(node.right, offset);
}

/**
 * Render Tree to Canvas
 */
function drawTree() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!huffmanRoot) return;

  ctx.save();

  // Draw edges first
  drawEdges(huffmanRoot);
  // Draw nodes on top
  drawNodes(huffmanRoot);

  ctx.restore();
}

function drawEdges(node) {
  if (!node) return;

  ctx.lineWidth = 2;

  if (node.left) {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(node.left.x, node.left.y);
    ctx.strokeStyle = '#30363d'; // Default edge color
    ctx.stroke();

    // Draw '0' label
    ctx.fillStyle = '#8b949e';
    ctx.font = '12px var(--mono-font)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const midX = (node.x + node.left.x) / 2;
    const midY = (node.y + node.left.y) / 2;
    ctx.fillText('0', midX - 10, midY - 10);

    drawEdges(node.left);
  }

  if (node.right) {
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(node.right.x, node.right.y);
    ctx.strokeStyle = '#30363d';
    ctx.stroke();

    // Draw '1' label
    ctx.fillStyle = '#8b949e';
    ctx.font = '12px var(--mono-font)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const midX = (node.x + node.right.x) / 2;
    const midY = (node.y + node.right.y) / 2;
    ctx.fillText('1', midX + 10, midY - 10);

    drawEdges(node.right);
  }
}

function drawNodes(node) {
  if (!node) return;

  const isLeaf = node.left === null && node.right === null;

  ctx.beginPath();
  ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);

  if (isLeaf) {
    ctx.fillStyle = 'var(--secondary-color)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'var(--panel-bg)';
    ctx.fill();
    ctx.strokeStyle = 'var(--primary-color)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw text
  ctx.fillStyle = '#fff';
  ctx.font = '14px var(--font-family)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isLeaf) {
    let charDisplay = node.char;
    if (charDisplay === ' ') charDisplay = '␣';
    if (charDisplay === '\n') charDisplay = '↵';
    ctx.fillText(charDisplay, node.x, node.y);
  } else {
    // Show frequency for internal nodes
    ctx.font = '10px var(--mono-font)';
    ctx.fillText(node.freq, node.x, node.y);
  }

  drawNodes(node.left);
  drawNodes(node.right);
}

// Start
init();
