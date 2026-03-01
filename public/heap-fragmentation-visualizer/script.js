const TOTAL_MEMORY = 32;

// Memory Array: null means free, positive integer means allocated block ID
let memory = Array(TOTAL_MEMORY).fill(null);
let nextBlockId = 1;

let isDragging = false;
let draggedSize = 0;
let dragClone = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let hoverIndexStart = -1;

const DOM = {
  array: null,
  cells: [],
  blocks: null,
  dragLayer: null,
  statTotalFree: null,
  statMaxContiguous: null,
};

function init() {
  if (typeof window === 'undefined') return;

  DOM.array = document.getElementById('memory-array');
  DOM.blocks = document.querySelectorAll('.draggable-block');
  DOM.dragLayer = document.getElementById('drag-layer');
  DOM.statTotalFree = document.getElementById('stat-total-free');
  DOM.statMaxContiguous = document.getElementById('stat-max-contiguous');

  renderMemoryArray();
  updateStats();

  DOM.blocks.forEach((block) => {
    block.addEventListener('pointerdown', handleDragStart);
  });

  window.addEventListener('pointermove', handleDragMove);
  window.addEventListener('pointerup', handleDragEnd);

  // Allow test mocking
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { allocate, free, getMemory, setMemoryForTest, getTotalFree, getMaxContiguous };
  }
}

function renderMemoryArray() {
  DOM.array.innerHTML = '';
  DOM.cells = [];

  for (let i = 0; i < TOTAL_MEMORY; i++) {
    const cell = document.createElement('div');
    cell.classList.add('memory-cell');
    cell.dataset.index = i;

    // Attach click listener to free memory if allocated
    cell.addEventListener('click', () => {
      const blockId = memory[i];
      if (blockId !== null) {
        free(blockId);
      }
    });

    DOM.array.appendChild(cell);
    DOM.cells.push(cell);
  }

  updateMemoryVisuals();
}

function updateMemoryVisuals() {
  for (let i = 0; i < TOTAL_MEMORY; i++) {
    const cell = DOM.cells[i];
    cell.className = 'memory-cell'; // reset classes

    const blockId = memory[i];
    if (blockId !== null) {
      cell.classList.add('allocated');
      cell.dataset.blockId = blockId;

      // Determine borders based on block adjacency
      if (i === 0 || memory[i - 1] !== blockId) {
        cell.classList.add('block-start');
      }
      if (i === TOTAL_MEMORY - 1 || memory[i + 1] !== blockId) {
        cell.classList.add('block-end');
      }
    } else {
      cell.classList.add('free');
      delete cell.dataset.blockId;
    }
  }
}

function updateStats() {
  const totalFree = getTotalFree();
  const maxContiguous = getMaxContiguous();

  DOM.statTotalFree.textContent = `${totalFree} units`;
  DOM.statMaxContiguous.textContent = `${maxContiguous} units`;
}

// Memory Logic
function getTotalFree() {
  return memory.filter(cell => cell === null).length;
}

function getMaxContiguous() {
  let maxCount = 0;
  let currentCount = 0;

  for (let i = 0; i < TOTAL_MEMORY; i++) {
    if (memory[i] === null) {
      currentCount++;
      if (currentCount > maxCount) maxCount = currentCount;
    } else {
      currentCount = 0;
    }
  }
  return maxCount;
}

function canAllocateAt(startIndex, size) {
  if (startIndex < 0 || startIndex + size > TOTAL_MEMORY) return false;
  for (let i = startIndex; i < startIndex + size; i++) {
    if (memory[i] !== null) return false;
  }
  return true;
}

function allocate(startIndex, size) {
  if (canAllocateAt(startIndex, size)) {
    const blockId = nextBlockId++;
    for (let i = startIndex; i < startIndex + size; i++) {
      memory[i] = blockId;
    }
    if (typeof window !== 'undefined') {
      updateMemoryVisuals();
      updateStats();
    }
    return true;
  }
  return false;
}

function free(blockId) {
  for (let i = 0; i < TOTAL_MEMORY; i++) {
    if (memory[i] === blockId) {
      memory[i] = null;
    }
  }
  if (typeof window !== 'undefined') {
    updateMemoryVisuals();
    updateStats();
  }
}

// Drag & Drop Handling
function handleDragStart(e) {
  const target = e.currentTarget;
  isDragging = true;
  draggedSize = parseInt(target.dataset.size);

  const rect = target.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  dragClone = document.createElement('div');
  dragClone.className = 'drag-clone';
  dragClone.textContent = `Size ${draggedSize}`;

  // Base clone size on first memory cell width + gaps
  if (DOM.cells.length > 0) {
    const cellRect = DOM.cells[0].getBoundingClientRect();
    const cellWidth = cellRect.width;
    const gap = 4; // var(--gap)
    dragClone.style.width = `${(cellWidth * draggedSize) + (gap * (draggedSize - 1))}px`;
    dragClone.style.height = `${cellRect.height}px`;
  } else {
    dragClone.style.width = `${draggedSize * 34}px`; // fallback
    dragClone.style.height = '30px';
  }

  DOM.dragLayer.appendChild(dragClone);
  moveClone(e.clientX, e.clientY);

  target.style.opacity = '0.5';
}

function handleDragMove(e) {
  if (!isDragging) return;
  e.preventDefault();

  moveClone(e.clientX, e.clientY);
  updateHoverFeedback(e.clientX, e.clientY);
}

function moveClone(x, y) {
  if (!dragClone) return;
  dragClone.style.left = `${x - dragOffsetX}px`;
  dragClone.style.top = `${y - dragOffsetY}px`;
}

function updateHoverFeedback(x, y) {
  // Clear previous hover state
  clearHoverFeedback();

  const el = document.elementFromPoint(x, y);
  if (!el || !el.classList.contains('memory-cell')) {
    hoverIndexStart = -1;
    return;
  }

  const index = parseInt(el.dataset.index);
  hoverIndexStart = index;

  const valid = canAllocateAt(index, draggedSize);
  const hoverClass = valid ? 'hover-valid' : 'hover-invalid';

  for (let i = index; i < Math.min(index + draggedSize, TOTAL_MEMORY); i++) {
    DOM.cells[i].classList.add(hoverClass);
  }
}

function clearHoverFeedback() {
  DOM.cells.forEach(cell => {
    cell.classList.remove('hover-valid', 'hover-invalid');
  });
}

function handleDragEnd(e) {
  if (!isDragging) return;

  clearHoverFeedback();

  // Find original block to reset opacity
  const originalBlock = document.querySelector(`.draggable-block[data-size="${draggedSize}"]`);
  if (originalBlock) originalBlock.style.opacity = '1';

  // Attempt allocation if dropped over a cell
  if (hoverIndexStart !== -1) {
    const valid = allocate(hoverIndexStart, draggedSize);
    if (!valid) {
      // Trigger error shake on original block
      if (originalBlock) {
        originalBlock.classList.remove('shake-error');
        void originalBlock.offsetWidth; // trigger reflow
        originalBlock.classList.add('shake-error');
        setTimeout(() => {
          originalBlock.classList.remove('shake-error');
        }, 400);
      }
    }
  }

  // Cleanup drag clone
  if (dragClone && dragClone.parentNode) {
    dragClone.parentNode.removeChild(dragClone);
  }

  isDragging = false;
  dragClone = null;
  hoverIndexStart = -1;
}

// Exports for Testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    allocate,
    free,
    getMemory: () => memory,
    setMemoryForTest: (newMemory) => { memory = newMemory; },
    getTotalFree,
    getMaxContiguous,
    TOTAL_MEMORY
  };
}

// Run init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
