
// --- Constants & Data ---

const PROPERTIES = {
  'active': { type: 'boolean', shape: 'square', color: '#569cd6', order: 0 },
  'data': { type: 'object', shape: 'diamond', color: '#dcdcaa', order: 1 },
  'id': { type: 'number', shape: 'triangle', color: '#4ec9b0', order: 2 },
  'name': { type: 'string', shape: 'circle', color: '#ce9178', order: 3 },
};

const ORDERED_KEYS = ['active', 'data', 'id', 'name'];
const ROW_HEIGHT = 50;
const TOTAL_HEIGHT = ORDERED_KEYS.length * ROW_HEIGHT; // 200px

const LEVELS = [
  {
    title: "Level 1: Exact Match",
    description: "Find the block that matches the interface exactly.",
    target: { name: "User", requiredProps: ["id", "name"] },
    blocks: [
      { id: "b1", props: { "id": 1, "name": "Alice" } },
      { id: "b2", props: { "id": 2 } },
      { id: "b3", props: { "name": "Bob" } }
    ]
  },
  {
    title: "Level 2: Structural Subtyping",
    description: "A block with EXTRA properties is still a match! (Width subtyping)",
    target: { name: "Point", requiredProps: ["id"] },
    blocks: [
      { id: "b1", props: { "active": true } },
      { id: "b2", props: { "id": 10, "name": "Origin" } },
      { id: "b3", props: { "name": "P1" } }
    ]
  },
  {
    title: "Level 3: Interface Composition",
    description: "Matches must fulfill ALL requirements.",
    target: { name: "Config", requiredProps: ["active", "id"] },
    blocks: [
      { id: "b1", props: { "active": true, "id": 55 } },
      { id: "b2", props: { "active": true, "name": "test" } },
      { id: "b3", props: { "id": 100 } }
    ]
  }
];

// --- Shape Generator ---

class ShapeGenerator {

  static getConnectorPath(shape, x, y, size, direction) {
    const r = size / 2;
    if (direction === 'right-notch') {
      // Inward notch from Right Edge
      switch (shape) {
        case 'triangle': return `L ${x - r} ${y} L ${x} ${y + r}`;
        case 'square': return `L ${x - r} ${y - r} L ${x - r} ${y + r} L ${x} ${y + r}`;
        case 'circle': return `A ${r} ${r} 0 0 0 ${x} ${y + r}`;
        case 'diamond': return `L ${x - r} ${y} L ${x} ${y + r}`;
      }
    } else if (direction === 'right-tab') {
      // Outward tab from Right Edge
      switch (shape) {
        case 'triangle': return `L ${x + r} ${y} L ${x} ${y + r}`;
        case 'square': return `L ${x + r} ${y - r} L ${x + r} ${y + r} L ${x} ${y + r}`;
        case 'circle': return `A ${r} ${r} 0 0 1 ${x} ${y + r}`;
        case 'diamond': return `L ${x + r} ${y} L ${x} ${y + r}`;
      }
    }
    return `L ${x} ${y}`;
  }

  static generateSlotPath(width, height, requiredProps) {
    // Interface Slot: Rect with notches on right edge.
    let d = `M 0 0 L ${width} 0`; // Top

    // Go down the right side
    ORDERED_KEYS.forEach((key, index) => {
      const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
      const r = 10;
      // Start of row segment on right edge
      d += `L ${width} ${y - r}`;

      if (requiredProps.includes(key)) {
        const propInfo = PROPERTIES[key];
        d += this.getConnectorPath(propInfo.shape, width, y, 20, 'right-notch');
      } else {
        d += `L ${width} ${y + r}`; // Flat line
      }
    });

    d += `L ${width} ${height} L 0 ${height} Z`;
    return d;
  }

  static generateBlockPath(width, height, props) {
    // Data Block: Rect with tabs on RIGHT edge.
    // Start Top-Left (0,0), go Right.
    let d = `M 0 0 L ${width} 0`; // Top

    // Go down the right side
    ORDERED_KEYS.forEach((key, index) => {
      const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
      const r = 10;
      // Start of row segment on right edge
      d += `L ${width} ${y - r}`;

      if (props.hasOwnProperty(key)) {
        const propInfo = PROPERTIES[key];
        d += this.getConnectorPath(propInfo.shape, width, y, 20, 'right-tab');
      } else {
        d += `L ${width} ${y + r}`; // Flat line
      }
    });

    d += `L ${width} ${height} L 0 ${height} Z`;
    return d;
  }
}

// --- Game Logic ---

let currentLevelIndex = 0;
let draggedElement = null;
let originalParent = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

const paletteEl = document.getElementById('palette');
const workspaceEl = document.getElementById('workspace');
const targetSlotEl = document.getElementById('target-slot');
const infoPanelEl = document.getElementById('level-instructions');
const codeDisplayEl = document.getElementById('code-display');
const nextLevelBtn = document.getElementById('next-level-btn');
const resetBtn = document.getElementById('reset-btn');

function init() {
  renderLevel(currentLevelIndex);

  document.addEventListener('pointermove', handleDragMove);
  document.addEventListener('pointerup', handleDragEnd);

  nextLevelBtn.addEventListener('click', () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      currentLevelIndex++;
      renderLevel(currentLevelIndex);
    } else {
        infoPanelEl.textContent = "All levels completed! Great job!";
    }
  });

  resetBtn.addEventListener('click', () => {
    renderLevel(currentLevelIndex);
  });
}

function renderLevel(index) {
  const level = LEVELS[index];

  // Reset UI
  paletteEl.innerHTML = '';
  targetSlotEl.innerHTML = '';
  targetSlotEl.style.borderColor = '#3e3e42';
  nextLevelBtn.disabled = true;
  infoPanelEl.textContent = `${level.title}: ${level.description}`;

  // Render Target Slot
  const slotWidth = 150;
  const slotHeight = TOTAL_HEIGHT; // Fixed height
  const slotPath = ShapeGenerator.generateSlotPath(slotWidth, slotHeight, level.target.requiredProps);

  const slotSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  slotSvg.setAttribute("width", slotWidth + 20); // Extra width for connectors
  slotSvg.setAttribute("height", slotHeight);
  slotSvg.style.overflow = 'visible';
  slotSvg.classList.add("slot-svg");

  const slotPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  slotPathEl.setAttribute("d", slotPath);
  slotPathEl.setAttribute("fill", "#252526");
  slotPathEl.setAttribute("stroke", "#569cd6");
  slotPathEl.setAttribute("stroke-width", "2");
  slotPathEl.setAttribute("stroke-dasharray", "5,5");

  slotSvg.appendChild(slotPathEl);

  // Text label
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("x", slotWidth / 2);
  textEl.setAttribute("y", slotHeight / 2);
  textEl.setAttribute("text-anchor", "middle");
  textEl.setAttribute("fill", "#858585");
  textEl.textContent = level.target.name;
  slotSvg.appendChild(textEl);

  targetSlotEl.appendChild(slotSvg);
  targetSlotEl.dataset.requiredProps = JSON.stringify(level.target.requiredProps);

  // Render Blocks
  level.blocks.forEach(blockData => {
    const blockEl = createBlockElement(blockData);
    paletteEl.appendChild(blockEl);
  });

  updateCodeDisplay(level.target, null);
}

function createBlockElement(blockData) {
  const width = 100;
  const height = TOTAL_HEIGHT;
  const path = ShapeGenerator.generateBlockPath(width, height, blockData.props);

  const div = document.createElement('div');
  div.classList.add('block');
  div.dataset.props = JSON.stringify(Object.keys(blockData.props));
  div.dataset.fullProps = JSON.stringify(blockData.props);
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width + 20); // Extra width for tabs
  svg.setAttribute("height", height);
  svg.style.overflow = 'visible';

  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", path);
  pathEl.setAttribute("fill", "#3e3e42");
  pathEl.setAttribute("stroke", "#9cdcfe");
  pathEl.setAttribute("stroke-width", "2");

  svg.appendChild(pathEl);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", width / 2);
  text.setAttribute("y", height / 2);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "#d4d4d4");
  text.style.fontSize = "12px";
  text.textContent = `{...}`;
  svg.appendChild(text);

  div.appendChild(svg);

  div.addEventListener('pointerdown', handleDragStart);
  div.addEventListener('mouseenter', () => updateCodeDisplay(null, blockData));
  div.addEventListener('mouseleave', () => updateCodeDisplay(LEVELS[currentLevelIndex].target, null));

  return div;
}

function handleDragStart(e) {
  if (draggedElement) return;
  draggedElement = e.currentTarget;
  originalParent = draggedElement.parentElement;

  const rect = draggedElement.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  draggedElement.classList.add('dragging');
  draggedElement.style.position = 'absolute';
  draggedElement.style.left = `${rect.left}px`;
  draggedElement.style.top = `${rect.top}px`;
  draggedElement.style.zIndex = 1000;

  document.body.appendChild(draggedElement);

  draggedElement.setPointerCapture(e.pointerId);
}

function handleDragMove(e) {
  if (!draggedElement) return;
  e.preventDefault();
  draggedElement.style.left = `${e.clientX - dragOffsetX}px`;
  draggedElement.style.top = `${e.clientY - dragOffsetY}px`;
}

function handleDragEnd(e) {
  if (!draggedElement) return;

  draggedElement.releasePointerCapture(e.pointerId);

  const slotRect = targetSlotEl.getBoundingClientRect();
  const blockRect = draggedElement.getBoundingClientRect();

  const blockCenterX = blockRect.left + blockRect.width / 2;
  const blockCenterY = blockRect.top + blockRect.height / 2;

  const isOverSlot = (
    blockCenterX >= slotRect.left &&
    blockCenterX <= slotRect.right &&
    blockCenterY >= slotRect.top &&
    blockCenterY <= slotRect.bottom
  );

  if (isOverSlot) {
    checkFit();
  } else {
    returnToPalette();
  }
}

function checkFit() {
  const blockProps = JSON.parse(draggedElement.dataset.props);
  const requiredProps = JSON.parse(targetSlotEl.dataset.requiredProps);

  const fits = requiredProps.every(req => blockProps.includes(req));

  if (fits) {
    const slotRect = targetSlotEl.getBoundingClientRect();
    // Center it
    draggedElement.style.left = `${slotRect.left + (slotRect.width - draggedElement.offsetWidth) / 2}px`;
    draggedElement.style.top = `${slotRect.top + (slotRect.height - draggedElement.offsetHeight) / 2}px`;

    draggedElement.classList.remove('dragging');
    draggedElement.style.cursor = 'default';
    draggedElement.style.zIndex = '';

    draggedElement.removeEventListener('pointerdown', handleDragStart);

    targetSlotEl.style.borderColor = '#4ec9b0';
    infoPanelEl.textContent = "Success! The block satisfies the interface.";
    nextLevelBtn.disabled = false;
    draggedElement = null;
  } else {
    draggedElement.classList.add('shake');
    const missing = requiredProps.filter(req => !blockProps.includes(req));
    infoPanelEl.textContent = `Type Mismatch: Missing required property '${missing.join(', ')}'`;
    setTimeout(() => {
      draggedElement.classList.remove('shake');
      returnToPalette();
    }, 500);
  }
}

function returnToPalette() {
  if (!draggedElement) return;
  draggedElement.classList.remove('dragging');
  draggedElement.style.position = '';
  draggedElement.style.left = '';
  draggedElement.style.top = '';
  draggedElement.style.zIndex = '';
  originalParent.appendChild(draggedElement);
  draggedElement = null;
}

function updateCodeDisplay(target, block) {
  let text = '';

  if (target) {
    text += `interface ${target.name} {\n`;
    target.requiredProps.forEach(key => {
      const type = PROPERTIES[key].type;
      text += `  ${key}: ${type};\n`;
    });
    text += `}\n\n`;
  }

  if (block) {
    text += `const block = {\n`;
    Object.entries(block.props).forEach(([key, val]) => {
       const displayVal = typeof val === 'string' ? `"${val}"` : val;
       text += `  ${key}: ${displayVal},\n`;
    });
    text += `};`;
  }

  codeDisplayEl.textContent = text || '// Hover over an item';
}

if (typeof window !== 'undefined') {
  init();
}
