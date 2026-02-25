// Game State
const state = {
  level: 1,
  score: 0,
  isGameOver: false,
  targetElement: null, // The element with the bug in the candidate panel
  mutationDetails: null, // { property, expected, found }
  isFeedbackVisible: false
};

// DOM Elements
const stage = document.getElementById('stage');
const refContainer = document.getElementById('reference-container');
const candContainer = document.getElementById('candidate-container');
const loupe = document.getElementById('loupe');
const loupeView = document.getElementById('loupe-view');
const levelDisplay = document.getElementById('level-display');
const scoreDisplay = document.getElementById('score-display');
const feedbackOverlay = document.getElementById('feedback-overlay');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackMessage = document.getElementById('feedback-message');
const nextLevelBtn = document.getElementById('next-level-btn');

// Constants
const LOUPE_SCALE = 8;
const LOUPE_SIZE = 200; // px, must match CSS

// Component Generators
const generators = {
  card: () => {
    const card = document.createElement('div');
    card.className = 'comp-card';
    card.innerHTML = `
      <div class="comp-card-img"></div>
      <div class="comp-card-body">
        <h3 class="comp-title">Project Alpha</h3>
        <p class="comp-text">A groundbreaking initiative to redefine user experiences through pixel-perfect design.</p>
        <button class="comp-btn">Learn More</button>
      </div>
    `;
    return card;
  },
  list: () => {
    const list = document.createElement('ul');
    list.className = 'comp-card comp-list';
    list.innerHTML = `
      <li class="comp-list-item">
        <div class="comp-avatar" style="background: #ffc107"></div>
        <div class="comp-text">Alice Johnson</div>
      </li>
      <li class="comp-list-item">
        <div class="comp-avatar" style="background: #2196f3"></div>
        <div class="comp-text">Bob Smith</div>
      </li>
      <li class="comp-list-item">
        <div class="comp-avatar" style="background: #4caf50"></div>
        <div class="comp-text">Charlie Brown</div>
      </li>
    `;
    return list;
  },
  nav: () => {
    const nav = document.createElement('nav');
    nav.className = 'comp-nav';
    nav.innerHTML = `
      <a href="#" class="comp-nav-link active">Home</a>
      <a href="#" class="comp-nav-link">Features</a>
      <a href="#" class="comp-nav-link">Pricing</a>
      <a href="#" class="comp-nav-link">About</a>
    `;
    return nav;
  }
};

// Mutation Logic
// Returns { element, property, originalValue, mutatedValue, description }
function applyRandomMutation(rootElement) {
  // Find all mutable elements
  const candidates = Array.from(rootElement.querySelectorAll('.comp-btn, .comp-title, .comp-text, .comp-list-item, .comp-nav-link'));

  if (candidates.length === 0) return null;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const style = window.getComputedStyle(target);

  const mutations = [
    {
      prop: 'padding-left',
      apply: (val) => {
        const num = parseFloat(val);
        return (num + (Math.random() > 0.5 ? 1 : -1)) + 'px';
      },
      desc: 'Padding mismatch'
    },
    {
      prop: 'margin-bottom',
      apply: (val) => {
        const num = parseFloat(val);
        return (num + (Math.random() > 0.5 ? 2 : -2)) + 'px';
      },
      desc: 'Margin spacing error'
    },
    {
      prop: 'font-size',
      apply: (val) => {
        const num = parseFloat(val);
        return (num + (Math.random() > 0.5 ? 1 : -1)) + 'px';
      },
      desc: 'Font size inconsistency'
    },
    {
      prop: 'border-radius',
      apply: (val) => {
        const num = parseFloat(val);
        return (num + (Math.random() > 0.5 ? 2 : -2)) + 'px';
      },
      desc: 'Border radius error'
    },
    {
      prop: 'opacity',
      apply: (val) => {
        return '0.9';
      },
      desc: 'Opacity mismatch'
    }
    // Color mutations are harder because getComputedStyle returns rgb() but we might want hex.
    // Let's stick to layout/geometry for now as "pixel peeping".
  ];

  const mutationType = mutations[Math.floor(Math.random() * mutations.length)];
  const originalValue = style.getPropertyValue(mutationType.prop);
  const newValue = mutationType.apply(originalValue);

  target.style[mutationType.prop] = newValue;

  // Mark the target for click detection
  target.dataset.isBug = 'true';

  return {
    element: target,
    property: mutationType.prop,
    originalValue: originalValue,
    mutatedValue: newValue,
    description: mutationType.desc
  };
}

function generateLevel() {
  // 1. Clear containers
  refContainer.innerHTML = '';
  candContainer.innerHTML = '';

  // 2. Select Component Type
  const keys = Object.keys(generators);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const compRef = generators[type]();
  const compCand = compRef.cloneNode(true); // Deep clone

  // 3. Render Reference
  refContainer.appendChild(compRef);

  // 4. Render Candidate (needs to be in DOM to compute styles for mutation)
  candContainer.appendChild(compCand);

  // 5. Apply Mutation to Candidate
  const mutation = applyRandomMutation(compCand);
  state.targetElement = mutation.element;
  state.mutationDetails = mutation;

  console.log(`Level ${state.level}: Mutated ${mutation.property} on`, mutation.element);

  // 6. Update Loupe View
  updateLoupeContent();
}

function updateLoupeContent() {
  // Clone the entire stage into the loupe view
  loupeView.innerHTML = '';

  const stageRect = stage.getBoundingClientRect();
  const stageClone = stage.cloneNode(true);

  // Remove IDs from clone to avoid duplicates
  stageClone.removeAttribute('id');
  stageClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

  // Position clone exactly where the original is
  stageClone.style.position = 'absolute';
  stageClone.style.left = stageRect.left + 'px';
  stageClone.style.top = stageRect.top + 'px';
  stageClone.style.margin = '0';
  stageClone.style.transform = 'none'; // Reset any potential transform on stage itself

  loupeView.appendChild(stageClone);
}

// Loupe Movement
function handleMouseMove(e) {
  if (state.isFeedbackVisible) return;

  const x = e.clientX;
  const y = e.clientY;

  // Show loupe
  loupe.style.display = 'block';
  loupe.style.left = (x - LOUPE_SIZE / 2) + 'px';
  loupe.style.top = (y - LOUPE_SIZE / 2) + 'px';

  // Calculate transform for inner content
  // We want the point (x, y) on the screen to be at the center of the loupe (LOUPE_SIZE/2, LOUPE_SIZE/2)
  // relative to the loupe container.
  // Transform origin is 0 0.
  // Content needs to be shifted so that (x, y) moves to (LOUPE_SIZE/2, LOUPE_SIZE/2).
  // Formula: translate = Center - Mouse * Scale

  const tx = (LOUPE_SIZE / 2) - x * LOUPE_SCALE;
  const ty = (LOUPE_SIZE / 2) - y * LOUPE_SCALE;

  loupeView.style.transform = `translate(${tx}px, ${ty}px) scale(${LOUPE_SCALE})`;
}

// Click Handling
function handleStageClick(e) {
  if (state.isFeedbackVisible) return;

  // Check if clicked element is the bug
  let target = e.target;
  let isBug = false;

  // Traverse up to find if we clicked inside the buggy element
  while (target && target !== candContainer) {
    if (target.dataset.isBug === 'true') {
      isBug = true;
      break;
    }
    target = target.parentElement;
  }

  if (isBug) {
    handleWin(e.clientX, e.clientY);
  } else {
    handleMiss(e.clientX, e.clientY);
  }
}

function handleWin(x, y) {
  state.score += 100 * state.level;
  scoreDisplay.textContent = state.score;
  state.isFeedbackVisible = true;

  // Highlight error
  state.targetElement.style.outline = '2px solid red';
  state.targetElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';

  // Show confetti
  if (window.fireConfetti) {
    window.fireConfetti(x, y);
  }

  // Show feedback
  feedbackTitle.textContent = 'Spot On!';
  feedbackTitle.style.color = 'var(--accent-color)';
  feedbackMessage.innerHTML = `
    <strong>${state.mutationDetails.description}</strong><br>
    Property: <code>${state.mutationDetails.property}</code><br>
    Expected: <code>${state.mutationDetails.originalValue}</code><br>
    Found: <code>${state.mutationDetails.mutatedValue}</code>
  `;
  feedbackOverlay.classList.remove('hidden');
  feedbackOverlay.classList.add('visible');
}

function handleMiss(x, y) {
  // Penalty
  state.score = Math.max(0, state.score - 50);
  scoreDisplay.textContent = state.score;

  // Shake effect on game area
  document.body.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(0)' }
  ], {
    duration: 200,
    iterations: 2
  });
}

function nextLevel() {
  state.level++;
  levelDisplay.textContent = state.level;
  state.isFeedbackVisible = false;
  feedbackOverlay.classList.remove('visible');
  feedbackOverlay.classList.add('hidden');
  generateLevel();
}

// Init
window.addEventListener('mousemove', handleMouseMove);
candContainer.addEventListener('click', handleStageClick); // Only clicks on candidate count
nextLevelBtn.addEventListener('click', nextLevel);

// Start Game
generateLevel();

window.addEventListener('resize', () => {
  // Debounce or just update
  updateLoupeContent();
});
