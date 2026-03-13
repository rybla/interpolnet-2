const CONFIG = {
  numVirtualPages: 16,
  numRamFrames: 4,
  numSwapFrames: 8
};

const STATE = {
  virtualPages: [],
  ramFrames: [],
  swapFrames: [],
  fifoQueue: [] // Tracks RAM frames for FIFO replacement
};

const UI = {
  virtualContainer: document.getElementById('virtual-pages'),
  ramContainer: document.getElementById('ram-frames'),
  swapContainer: document.getElementById('swap-frames'),
  svgLines: document.getElementById('mapping-lines'),
  logList: document.getElementById('log-list'),
  btnAllocate: document.getElementById('btn-allocate'),
  btnAccessRandom: document.getElementById('btn-access-random'),
  btnReset: document.getElementById('btn-reset')
};

function init() {
  resetState();
  setupEventListeners();
  window.addEventListener('resize', drawLines);
}

function resetState() {
  STATE.virtualPages = Array.from({ length: CONFIG.numVirtualPages }, (_, i) => ({
    id: i,
    status: 'unallocated', // unallocated, ram, swap
    frameIndex: null
  }));

  STATE.ramFrames = Array.from({ length: CONFIG.numRamFrames }, (_, i) => ({
    id: i,
    pageId: null
  }));

  STATE.swapFrames = Array.from({ length: CONFIG.numSwapFrames }, (_, i) => ({
    id: i,
    pageId: null
  }));

  STATE.fifoQueue = [];

  UI.logList.innerHTML = '';
  logAction('system', 'System Initialized');
  renderAll();
}

function setupEventListeners() {
  UI.btnAllocate.addEventListener('click', allocatePage);
  UI.btnAccessRandom.addEventListener('click', accessRandomPage);
  UI.btnReset.addEventListener('click', resetState);
}

function logAction(type, message) {
  const li = document.createElement('li');
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

  let typeClass = '';
  if (type === 'alloc') typeClass = 'action-alloc';
  else if (type === 'fault') typeClass = 'action-fault';
  else if (type === 'swap') typeClass = 'action-swap';

  li.innerHTML = `<span class="time">[${timeStr}]</span> <span class="${typeClass}">${message}</span>`;
  UI.logList.appendChild(li);
  UI.logList.parentElement.scrollTop = UI.logList.parentElement.scrollHeight;
}

function allocatePage() {
  const unallocated = STATE.virtualPages.filter(p => p.status === 'unallocated');
  if (unallocated.length === 0) {
    logAction('fault', 'Out of Virtual Memory!');
    return;
  }
  const page = unallocated[0]; // Allocate next available

  logAction('alloc', `Allocating Virtual Page ${page.id}`);
  loadToRAM(page);
  renderAll();
  pulseElement(`vp-${page.id}`);
}

function accessRandomPage() {
  const allocated = STATE.virtualPages.filter(p => p.status !== 'unallocated');
  if (allocated.length === 0) {
    logAction('system', 'No pages allocated to access.');
    return;
  }

  const randomIndex = Math.floor(Math.random() * allocated.length);
  const page = allocated[randomIndex];

  logAction('alloc', `Accessing Virtual Page ${page.id}...`);
  pulseElement(`vp-${page.id}`);

  if (page.status === 'ram') {
    logAction('system', `Page ${page.id} is in RAM (Hit).`);
    pulseElement(`ram-${page.frameIndex}`);
  } else if (page.status === 'swap') {
    logAction('fault', `Page Fault! Page ${page.id} is in Swap.`);
    // Need to swap it in
    loadToRAM(page);
    renderAll();
  }
}

function loadToRAM(page) {
  // Is there free RAM?
  const freeRamIndex = STATE.ramFrames.findIndex(f => f.pageId === null);

  if (freeRamIndex !== -1) {
    // Put in free RAM
    // If it was in swap, free the swap frame
    if (page.status === 'swap') {
      const swapFrame = STATE.swapFrames.find(f => f.id === page.frameIndex);
      if (swapFrame) swapFrame.pageId = null;
    }

    STATE.ramFrames[freeRamIndex].pageId = page.id;
    page.status = 'ram';
    page.frameIndex = freeRamIndex;
    STATE.fifoQueue.push(freeRamIndex);
    logAction('system', `Mapped Page ${page.id} to RAM Frame ${freeRamIndex}.`);
  } else {
    // RAM is full, need to evict
    const victimFrameIndex = STATE.fifoQueue.shift();
    const victimRamFrame = STATE.ramFrames[victimFrameIndex];
    const victimPageId = victimRamFrame.pageId;
    const victimPage = STATE.virtualPages[victimPageId];

    logAction('swap', `RAM full. Evicting Page ${victimPageId} from RAM Frame ${victimFrameIndex}.`);

    // Find free swap
    const freeSwapIndex = STATE.swapFrames.findIndex(f => f.pageId === null);
    if (freeSwapIndex === -1) {
      logAction('fault', 'SYSTEM CRASH: Out of Swap Space!');
      return;
    }

    // Move victim to swap
    STATE.swapFrames[freeSwapIndex].pageId = victimPageId;
    victimPage.status = 'swap';
    victimPage.frameIndex = freeSwapIndex;
    logAction('swap', `Page ${victimPageId} moved to Swap Frame ${freeSwapIndex}.`);

    // If new page was in swap, free its old swap frame
    if (page.status === 'swap') {
      const oldSwapFrame = STATE.swapFrames.find(f => f.id === page.frameIndex);
      if (oldSwapFrame) oldSwapFrame.pageId = null;
    }

    // Load new page to the now-free RAM frame
    victimRamFrame.pageId = page.id;
    page.status = 'ram';
    page.frameIndex = victimFrameIndex;
    STATE.fifoQueue.push(victimFrameIndex);
    logAction('system', `Mapped Page ${page.id} to RAM Frame ${victimFrameIndex}.`);
  }
}

function renderAll() {
  renderVirtualPages();
  renderRamFrames();
  renderSwapFrames();
  requestAnimationFrame(drawLines);
}

function renderVirtualPages() {
  UI.virtualContainer.innerHTML = '';
  STATE.virtualPages.forEach(p => {
    const div = document.createElement('div');
    div.id = `vp-${p.id}`;
    div.className = `page ${p.status === 'unallocated' ? 'unallocated' : 'virtual-page-active'}`;
    div.textContent = `Page ${p.id}`;

    // Add click to access specific page
    if (p.status !== 'unallocated') {
      div.onclick = () => {
        logAction('alloc', `Accessing Virtual Page ${p.id}...`);
        pulseElement(div.id);
        if (p.status === 'ram') {
           logAction('system', `Page ${p.id} is in RAM (Hit).`);
           pulseElement(`ram-${p.frameIndex}`);
        } else {
           logAction('fault', `Page Fault! Page ${p.id} is in Swap.`);
           loadToRAM(p);
           renderAll();
        }
      };
    }

    UI.virtualContainer.appendChild(div);
  });
}

function renderRamFrames() {
  UI.ramContainer.innerHTML = '';
  STATE.ramFrames.forEach(f => {
    const div = document.createElement('div');
    div.id = `ram-${f.id}`;
    div.className = `page ${f.pageId !== null ? 'allocated-ram' : 'unallocated'}`;
    div.textContent = f.pageId !== null ? `RAM ${f.id} (Page ${f.pageId})` : `RAM ${f.id} (Free)`;
    UI.ramContainer.appendChild(div);
  });
}

function renderSwapFrames() {
  UI.swapContainer.innerHTML = '';
  STATE.swapFrames.forEach(f => {
    const div = document.createElement('div');
    div.id = `swap-${f.id}`;
    div.className = `page ${f.pageId !== null ? 'allocated-swap' : 'unallocated'}`;
    div.textContent = f.pageId !== null ? `Swap ${f.id} (Page ${f.pageId})` : `Swap ${f.id} (Free)`;
    UI.swapContainer.appendChild(div);
  });
}

function pulseElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('pulse');
    void el.offsetWidth; // trigger reflow
    el.classList.add('pulse');
  }
}

function drawLines() {
  // Clear SVG
  UI.svgLines.innerHTML = '';

  // Don't draw on narrow screens (CSS hides the SVG anyway)
  if (window.innerWidth <= 768) return;

  const svgRect = UI.svgLines.getBoundingClientRect();

  STATE.virtualPages.forEach(p => {
    if (p.status === 'unallocated') return;

    const vEl = document.getElementById(`vp-${p.id}`);
    let targetEl = null;
    let lineClass = '';

    if (p.status === 'ram') {
      targetEl = document.getElementById(`ram-${p.frameIndex}`);
      lineClass = 'to-ram';
    } else if (p.status === 'swap') {
      targetEl = document.getElementById(`swap-${p.frameIndex}`);
      lineClass = 'to-swap';
    }

    if (vEl && targetEl) {
      const vRect = vEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();

      // Start right middle of virtual page
      const startX = vRect.right - svgRect.left;
      const startY = vRect.top + vRect.height / 2 - svgRect.top;

      // End left middle of target page
      const endX = tRect.left - svgRect.left;
      const endY = tRect.top + tRect.height / 2 - svgRect.top;

      // Create bezier curve string
      // Control points depend on horizontal distance
      const distance = Math.abs(endX - startX);
      const cp1X = startX + distance * 0.4;
      const cp1Y = startY;
      const cp2X = endX - distance * 0.4;
      const cp2Y = endY;

      const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      // Create SVG path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', `mapping-line ${lineClass}`);

      // Optional: add hover effect linking them
      vEl.onmouseenter = () => path.classList.add('active');
      vEl.onmouseleave = () => path.classList.remove('active');

      UI.svgLines.appendChild(path);
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
