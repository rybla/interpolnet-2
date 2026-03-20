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

const getFrequencies = (text) => {
  const freqs = new Map();
  for (const char of text) {
    freqs.set(char, (freqs.get(char) || 0) + 1);
  }
  return Array.from(freqs.entries()).map(([char, freq]) => new Node(char, freq));
};

const buildHuffmanTree = (nodes) => {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return new Node(null, nodes[0].freq, nodes[0], null);

  const pq = [...nodes].sort((a, b) => a.freq - b.freq);

  while (pq.length > 1) {
    const left = pq.shift();
    const right = pq.shift();
    const parent = new Node(null, left.freq + right.freq, left, right);

    // Insert parent back into sorted array
    let i = 0;
    while (i < pq.length && pq[i].freq < parent.freq) i++;
    pq.splice(i, 0, parent);
  }

  return pq[0];
};

const getCodes = (node, currentCode = "", codes = new Map()) => {
  if (!node) return codes;

  if (node.char !== null) {
    codes.set(node.char, currentCode || "0"); // "0" for single char case
  }

  getCodes(node.left, currentCode + "0", codes);
  getCodes(node.right, currentCode + "1", codes);

  return codes;
};

const calculateEntropy = (freqs, totalChars) => {
  let entropy = 0;
  for (const node of freqs) {
    const p = node.freq / totalChars;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

const formatChar = (char) => {
  if (char === ' ') return '␣ (Space)';
  if (char === '\n') return '↵ (Newline)';
  if (char === '\t') return '⇥ (Tab)';
  return char;
};

// --- UI and Canvas Rendering Logic ---

const updateStatsUI = (id, value, isFloat = false) => {
  const el = document.getElementById(id);
  const formatted = isFloat ? value.toFixed(2) : value;

  if (el.innerText !== formatted.toString()) {
    el.innerText = formatted;
    el.classList.remove('updated');
    void el.offsetWidth; // Trigger reflow
    el.classList.add('updated');
  }
};

const drawTree = (ctx, root, canvasWidth, canvasHeight) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!root) return;

  // Configuration
  const nodeRadius = 16;
  const levelHeight = 60;

  // First pass: Calculate positions and tree width
  const calculatePositions = (node, depth = 0, xOffset = 0) => {
    if (!node) return { width: 0, xOffset: xOffset };

    const left = calculatePositions(node.left, depth + 1, xOffset);
    const right = calculatePositions(node.right, depth + 1, left.xOffset);

    // Node is a leaf
    if (!node.left && !node.right) {
      node.x = xOffset + nodeRadius * 2;
      node.y = depth * levelHeight + 40;
      return { width: nodeRadius * 4, xOffset: node.x + nodeRadius * 2 };
    }

    // Node has children
    node.x = (node.left ? node.left.x : node.right.x) + ((node.right ? node.right.x : node.left.x) - (node.left ? node.left.x : node.right.x)) / 2;
    node.y = depth * levelHeight + 40;

    return { width: right.xOffset - xOffset, xOffset: right.xOffset };
  };

  const treeDim = calculatePositions(root);
  const totalWidth = treeDim.xOffset;
  const scale = Math.min(1, (canvasWidth - 40) / totalWidth);
  const xStart = (canvasWidth - totalWidth * scale) / 2;

  // Second pass: Render
  const renderNode = (node) => {
    if (!node) return;

    const x = xStart + node.x * scale;
    const y = node.y;

    // Draw edges
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64748b'; // --edge-color
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillStyle = '#f8fafc'; // --text-light
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (node.left) {
      const childX = xStart + node.left.x * scale;
      const childY = node.left.y;

      ctx.beginPath();
      ctx.moveTo(x, y + nodeRadius);
      ctx.lineTo(childX, childY - nodeRadius);
      ctx.stroke();

      // Label 0
      ctx.fillStyle = '#ec4899'; // --secondary-color
      ctx.fillText('0', x - (x - childX) / 2 - 10, y + (childY - y) / 2);
    }

    if (node.right) {
      const childX = xStart + node.right.x * scale;
      const childY = node.right.y;

      ctx.beginPath();
      ctx.moveTo(x, y + nodeRadius);
      ctx.lineTo(childX, childY - nodeRadius);
      ctx.stroke();

      // Label 1
      ctx.fillStyle = '#6366f1'; // --primary-color
      ctx.fillText('1', x + (childX - x) / 2 + 10, y + (childY - y) / 2);
    }

    // Draw node circle
    ctx.beginPath();
    ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);

    if (node.char !== null) {
      ctx.fillStyle = '#10b981'; // --node-leaf
    } else {
      ctx.fillStyle = '#3b82f6'; // --node-internal
    }

    ctx.fill();
    ctx.strokeStyle = '#334155'; // --border-color
    ctx.stroke();

    // Draw node text
    ctx.fillStyle = '#f8fafc'; // --text-light

    if (node.char !== null) {
      // Leaf node: display character
      let displayChar = node.char;
      if (displayChar === ' ') displayChar = '␣';
      else if (displayChar === '\n') displayChar = '↵';
      else if (displayChar === '\t') displayChar = '⇥';

      ctx.font = 'bold 14px "Fira Code", monospace';
      ctx.fillText(displayChar, x, y);

      // Frequency below
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillStyle = '#94a3b8'; // --text-muted
      ctx.fillText(node.freq, x, y + nodeRadius + 12);
    } else {
      // Internal node: display frequency
      ctx.font = 'bold 12px "Fira Code", monospace';
      ctx.fillText(node.freq, x, y);
    }

    // Recursion
    renderNode(node.left);
    renderNode(node.right);
  };

  renderNode(root);
};

const updateApp = () => {
  const textInput = document.getElementById('text-input');
  const text = textInput.value;

  const canvas = document.getElementById('tree-canvas');
  const ctx = canvas.getContext('2d');
  const tbody = document.getElementById('code-table-body');

  // Resize canvas for high DPI
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  if (text.length === 0) {
    updateStatsUI('entropy-value', 0, true);
    updateStatsUI('original-size-value', 0);
    updateStatsUI('compressed-size-value', 0);
    updateStatsUI('compression-ratio-value', 0, true);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tbody.innerHTML = '';
    return;
  }

  // 1. Calculate Frequencies
  const freqs = getFrequencies(text);

  // 2. Build Huffman Tree
  const root = buildHuffmanTree([...freqs]);

  // 3. Generate Codes
  const codes = getCodes(root);

  // 4. Calculate Stats
  const totalChars = text.length;
  const entropy = calculateEntropy(freqs, totalChars);
  const originalSize = totalChars * 8; // 8-bit ASCII assumption

  let compressedSize = 0;
  for (const char of text) {
    compressedSize += codes.get(char).length;
  }

  const compressionRatio = (1 - (compressedSize / originalSize)) * 100;

  // 5. Update DOM Stats
  updateStatsUI('entropy-value', entropy, true);
  updateStatsUI('original-size-value', originalSize);
  updateStatsUI('compressed-size-value', compressedSize);
  updateStatsUI('compression-ratio-value', Math.max(0, compressionRatio), true);

  // 6. Draw Tree
  drawTree(ctx, root, canvas.width, canvas.height);

  // 7. Update Table
  tbody.innerHTML = '';
  const sortedFreqs = [...freqs].sort((a, b) => b.freq - a.freq);

  for (const node of sortedFreqs) {
    const tr = document.createElement('tr');

    const tdChar = document.createElement('td');
    tdChar.className = 'char-cell';
    tdChar.textContent = formatChar(node.char);

    const tdFreq = document.createElement('td');
    tdFreq.textContent = node.freq;

    const tdCode = document.createElement('td');
    tdCode.className = 'code-cell';
    tdCode.textContent = codes.get(node.char);

    tr.appendChild(tdChar);
    tr.appendChild(tdFreq);
    tr.appendChild(tdCode);
    tbody.appendChild(tr);
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('text-input');
  textInput.addEventListener('input', updateApp);

  window.addEventListener('resize', updateApp);

  // Initial render empty state
  updateApp();
});
