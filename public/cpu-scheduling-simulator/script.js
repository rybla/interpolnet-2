const UI = {
  algorithmSelect: document.getElementById('algorithm-select'),
  quantumInput: document.getElementById('quantum-input'),
  quantumValue: document.getElementById('quantum-value'),
  speedInput: document.getElementById('speed-input'),
  speedValue: document.getElementById('speed-value'),
  addProcessBtn: document.getElementById('add-process-btn'),
  resetBtn: document.getElementById('reset-btn'),
  processQueue: document.getElementById('process-queue'),
  cpuTimeline: document.getElementById('cpu-timeline'),
  currentTimeDisplay: document.getElementById('current-time'),
  quantumLabel: document.getElementById('quantum-label'),
};

let queue = [];
let timeline = [];
let processCounter = 1;
let activeProcess = null;
let activeProcessTimeSpent = 0;
let simulationTime = 0;
let lastTimestamp = 0;
let simulationAccumulator = 0;

const COLORS = [
  'var(--p-color-1)',
  'var(--p-color-2)',
  'var(--p-color-3)',
  'var(--p-color-4)',
  'var(--p-color-5)',
  'var(--p-color-6)',
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function init() {
  // We initialize the simulation logic and requestAnimationFrame in init.
  // We defer the initial processes and UI updates to happen immediately
  // before the first animation frame, or we can just rely on the existing
  // global queue array initialization which happens in resetSimulation().
  resetSimulation();
  requestAnimationFrame(simulationLoop);
}

function scheduleNextProcess() {
  if (activeProcess !== null) {
    return; // Currently executing
  }

  if (queue.length === 0) {
    return; // Nothing to schedule
  }

  const algorithm = UI.algorithmSelect.value;

  if (algorithm === 'sjf') {
    // Shortest Job First (Non-preemptive)
    // Find process with shortest remaining burst time
    let shortestIndex = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].remainingBurst < queue[shortestIndex].remainingBurst) {
        shortestIndex = i;
      }
    }

    // Remove from queue and set as active
    activeProcess = queue.splice(shortestIndex, 1)[0];
  } else if (algorithm === 'rr') {
    // Round Robin
    // Take the first process from the queue
    activeProcess = queue.shift();
  }

  activeProcessTimeSpent = 0;

  // Create a new timeline entry
  const newTimelineEntry = {
    id: activeProcess.id,
    color: activeProcess.color,
    burst: 0,
    startTime: simulationTime
  };
  timeline.push(newTimelineEntry);

  updateQueueUI();
}

function processStep() {
  if (activeProcess === null) {
    scheduleNextProcess();
    return;
  }

  // Increment time spent on current process
  activeProcessTimeSpent++;
  activeProcess.remainingBurst--;

  // Update timeline entry burst length
  const currentTimelineEntry = timeline[timeline.length - 1];
  currentTimelineEntry.burst++;

  const algorithm = UI.algorithmSelect.value;
  const quantum = parseInt(UI.quantumInput.value, 10);

  let processFinished = false;
  let quantumExpired = false;

  if (activeProcess.remainingBurst <= 0) {
    processFinished = true;
  } else if (algorithm === 'rr' && activeProcessTimeSpent >= quantum) {
    quantumExpired = true;
  }

  if (processFinished) {
    activeProcess = null;
  } else if (quantumExpired) {
    queue.push(activeProcess);
    activeProcess = null;
    updateQueueUI();
  }
}

function updateQueueUI() {
  UI.processQueue.innerHTML = '';
  queue.forEach(process => {
    const el = document.createElement('div');
    el.className = 'process-block';
    el.style.backgroundColor = process.color;

    // Width based on original burst time to give visual context
    el.style.width = `${process.burst * 15}px`;

    el.innerHTML = `
      <span class="pid">P${process.id}</span>
      <span class="burst">${process.remainingBurst}</span>
    `;
    UI.processQueue.appendChild(el);
  });
}

function updateTimelineUI() {
  UI.cpuTimeline.innerHTML = '';
  timeline.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'timeline-block';
    el.style.backgroundColor = entry.color;

    // Adjust width dynamically based on burst completed
    el.style.width = `${entry.burst * 15}px`;

    // Set fixed height to fill container
    el.style.height = '100%';

    if (entry.burst > 0) {
      el.innerHTML = `P${entry.id}`;
    }

    UI.cpuTimeline.appendChild(el);
  });

  // Auto-scroll timeline to the right
  UI.cpuTimeline.scrollLeft = UI.cpuTimeline.scrollWidth;
}

function simulationLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  const speed = parseFloat(UI.speedInput.value);
  // Base time per tick is 1 second (1000ms), scaled by speed
  // A tick represents 1 unit of burst time
  const msPerTick = 1000 / speed;

  simulationAccumulator += deltaTime;

  while (simulationAccumulator >= msPerTick) {
    simulationAccumulator -= msPerTick;
    simulationTime++;

    UI.currentTimeDisplay.textContent = simulationTime;

    // Process logic
    if (activeProcess === null && queue.length > 0) {
      scheduleNextProcess();
    } else if (activeProcess !== null) {
      processStep();
      if (activeProcess === null && queue.length > 0) {
         // After process finishes or quantum expires, attempt to schedule the next process in the same tick
         // so there is no gap
         scheduleNextProcess();
      }
    }

    updateTimelineUI();
  }

  // Smoothly update current executing block width for animation purposes
  if (activeProcess !== null && timeline.length > 0) {
    const currentEntry = timeline[timeline.length - 1];
    const partialTick = simulationAccumulator / msPerTick;
    const visualBurst = currentEntry.burst + partialTick;

    const timelineBlocks = UI.cpuTimeline.children;
    if (timelineBlocks.length > 0) {
      const activeBlockEl = timelineBlocks[timelineBlocks.length - 1];
      activeBlockEl.style.width = `${visualBurst * 15}px`;
      UI.cpuTimeline.scrollLeft = UI.cpuTimeline.scrollWidth;
    }
  }

  requestAnimationFrame(simulationLoop);
}

function addRandomProcess() {
  const burst = Math.floor(Math.random() * 8) + 2; // Burst time between 2 and 9
  const newProcess = {
    id: processCounter++,
    burst: burst,
    remainingBurst: burst,
    color: getRandomColor()
  };
  queue.push(newProcess);
  updateQueueUI();
}

// Ensure the UI updates when algorithm changes (hide/show quantum)
UI.algorithmSelect.addEventListener('change', () => {
  if (UI.algorithmSelect.value === 'sjf') {
    UI.quantumInput.style.display = 'none';
    UI.quantumValue.style.display = 'none';
    UI.quantumLabel.style.display = 'none';
  } else {
    UI.quantumInput.style.display = 'inline-block';
    UI.quantumValue.style.display = 'inline-block';
    UI.quantumLabel.style.display = 'inline-block';
  }
  resetSimulation();
});

UI.quantumInput.addEventListener('input', () => {
  UI.quantumValue.textContent = UI.quantumInput.value;
});

UI.speedInput.addEventListener('input', () => {
  UI.speedValue.textContent = `${UI.speedInput.value}x`;
});

UI.addProcessBtn.addEventListener('click', addRandomProcess);

function resetSimulation() {
  queue = [];
  timeline = [];
  processCounter = 1;
  activeProcess = null;
  activeProcessTimeSpent = 0;
  simulationTime = 0;
  lastTimestamp = 0;
  simulationAccumulator = 0;

  UI.currentTimeDisplay.textContent = '0';

  addRandomProcess();
  addRandomProcess();
  addRandomProcess();

  updateQueueUI();
  updateTimelineUI();
}

UI.resetBtn.addEventListener('click', resetSimulation);

// Start the simulation when the script loads
init();
