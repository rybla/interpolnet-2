class Node {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
    this.x = 0;
    this.y = 0;
  }
}

class MinPriorityQueue {
  constructor() {
    this.elements = [];
  }
  enqueue(node) {
    let added = false;
    for (let i = 0; i < this.elements.length; i++) {
      if (node.freq < this.elements[i].freq) {
        this.elements.splice(i, 0, node);
        added = true;
        break;
      }
    }
    if (!added) {
      this.elements.push(node);
    }
  }
  dequeue() {
    return this.elements.shift();
  }
  isEmpty() {
    return this.elements.length === 0;
  }
  size() {
    return this.elements.length;
  }
}

const textInput = document.getElementById('text-input');
const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');
const huffmanCodesContainer = document.getElementById('huffman-codes');
const encodedOutput = document.getElementById('encoded-output');
const entropyValue = document.getElementById('entropy-value');
const originalSizeValue = document.getElementById('original-size');
const compressedSizeValue = document.getElementById('compressed-size');
const compressionRatioValue = document.getElementById('compression-ratio');

let treeRoot = null;
let codesMap = {};
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  drawTree();
}

window.addEventListener('resize', resizeCanvas);

function getFrequencies(str) {
  const freqs = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }
  return freqs;
}

function buildHuffmanTree(freqs) {
  const pq = new MinPriorityQueue();
  for (const char in freqs) {
    pq.enqueue(new Node(char, freqs[char]));
  }

  if (pq.isEmpty()) return null;
  if (pq.size() === 1) {
    return new Node(null, pq.elements[0].freq, pq.dequeue(), null);
  }

  while (pq.size() > 1) {
    const left = pq.dequeue();
    const right = pq.dequeue();
    const parent = new Node(null, left.freq + right.freq, left, right);
    pq.enqueue(parent);
  }

  return pq.dequeue();
}

function generateCodes(node, currentCode = '') {
  if (!node) return;

  if (node.char !== null) {
    codesMap[node.char] = currentCode || '0';
  }

  generateCodes(node.left, currentCode + '0');
  generateCodes(node.right, currentCode + '1');
}

function calculateShannonEntropy(freqs, totalChars) {
  let entropy = 0;
  for (const char in freqs) {
    const p = freqs[char] / totalChars;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function updateStats(str, freqs) {
  if (!str) {
    entropyValue.textContent = '0 bits/symbol';
    originalSizeValue.textContent = '0 bits';
    compressedSizeValue.textContent = '0 bits';
    compressionRatioValue.textContent = '0%';
    huffmanCodesContainer.innerHTML = '';
    encodedOutput.textContent = '';
    return;
  }

  const entropy = calculateShannonEntropy(freqs, str.length);
  entropyValue.textContent = `${entropy.toFixed(3)} bits/symbol`;

  const origSize = str.length * 8;
  originalSizeValue.textContent = `${origSize} bits`;

  let compSize = 0;
  let encodedStr = '';
  for (let i = 0; i < str.length; i++) {
    const code = codesMap[str[i]];
    compSize += code.length;
    encodedStr += code;
  }

  compressedSizeValue.textContent = `${compSize} bits`;

  const ratio = ((origSize - compSize) / origSize) * 100;
  compressionRatioValue.textContent = `${Math.max(0, ratio).toFixed(2)}% saved`;

  encodedOutput.textContent = encodedStr;

  huffmanCodesContainer.innerHTML = '';
  for (const char in codesMap) {
    const div = document.createElement('div');
    div.className = 'code-item';

    const displayChar = char === ' ' ? 'Space' : char === '\n' ? '\\n' : char;

    const charSpan = document.createElement('span');
    charSpan.className = 'code-char';
    charSpan.textContent = `'${displayChar}'`;

    const valSpan = document.createElement('span');
    valSpan.className = 'code-val';
    valSpan.textContent = codesMap[char];

    div.appendChild(charSpan);
    div.appendChild(valSpan);
    huffmanCodesContainer.appendChild(div);
  }
}

function assignCoordinates(node, depth = 0, leftBoundary = 0, rightBoundary = canvas.width) {
  if (!node) return;

  const totalWeight = getTreeWidth(node);
  const leftWeight = getTreeWidth(node.left);
  const rightWeight = getTreeWidth(node.right);

  const boundaryWidth = rightBoundary - leftBoundary;

  if (totalWeight <= 1) {
    node.x = (leftBoundary + rightBoundary) / 2;
  } else {
    // Distribute space proportionally based on the number of leaf nodes in each subtree
    const leftRatio = leftWeight / totalWeight;
    const splitPoint = leftBoundary + boundaryWidth * leftRatio;
    node.x = splitPoint;
  }

  node.y = depth * 60 + 50;

  if (node.left) {
    assignCoordinates(node.left, depth + 1, leftBoundary, node.x);
  }
  if (node.right) {
    assignCoordinates(node.right, depth + 1, node.x, rightBoundary);
  }
}

function drawNode(node) {
  if (!node) return;

  const styles = getComputedStyle(document.body);
  const primaryColor = styles.getPropertyValue('--primary-color').trim() || '#9d4edd';
  const secondaryColor = styles.getPropertyValue('--secondary-color').trim() || '#3c096c';
  const textColor = styles.getPropertyValue('--text-color').trim() || '#e0dced';
  const accentColor = styles.getPropertyValue('--accent-color').trim() || '#ff9e00';

  if (node.left) {
    ctx.beginPath();
    ctx.moveTo(node.x + offsetX, node.y + offsetY);
    ctx.lineTo(node.left.x + offsetX, node.left.y + offsetY);
    ctx.strokeStyle = '#5a189a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawNode(node.left);
  }
  if (node.right) {
    ctx.beginPath();
    ctx.moveTo(node.x + offsetX, node.y + offsetY);
    ctx.lineTo(node.right.x + offsetX, node.right.y + offsetY);
    ctx.strokeStyle = '#5a189a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawNode(node.right);
  }

  ctx.beginPath();
  ctx.arc(node.x + offsetX, node.y + offsetY, 18, 0, Math.PI * 2);
  ctx.fillStyle = node.char === null ? secondaryColor : primaryColor;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  if (node.char !== null) ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayText = node.char !== null ? node.char : node.freq;
  if (displayText === ' ') displayText = '␣';
  if (displayText === '\n') displayText = '↵';

  ctx.fillText(displayText, node.x + offsetX, node.y + offsetY);
}

function drawTree() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!treeRoot) return;

  drawNode(treeRoot);
}

function processInput() {
  const str = textInput.value;
  if (!str) {
    treeRoot = null;
    updateStats('', {});
    drawTree();
    return;
  }

  const freqs = getFrequencies(str);
  treeRoot = buildHuffmanTree(freqs);

  codesMap = {};
  generateCodes(treeRoot);

  updateStats(str, freqs);

  assignCoordinates(treeRoot, 0, 0, Math.max(canvas.width, getTreeWidth(treeRoot) * 40));

  offsetX = 0;
  offsetY = 0;
  drawTree();
}

function getTreeWidth(node) {
  if (!node) return 0;
  if (!node.left && !node.right) return 1;
  return getTreeWidth(node.left) + getTreeWidth(node.right);
}

textInput.addEventListener('input', processInput);

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startDragX = e.clientX - offsetX;
  startDragY = e.clientY - offsetY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  offsetX = e.clientX - startDragX;
  offsetY = e.clientY - startDragY;
  drawTree();
});

// Initial Setup
resizeCanvas();
textInput.value = "Hello Huffman Entropy Compression!";
processInput();
