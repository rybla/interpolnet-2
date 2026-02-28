const State = {
  isCurried: false,
  args: { x: '', y: '', z: '' },
  isEvaluating: false
};

const UI = {
  stage: null,
  toggle: null,
  label: null,
  resetBtn: null,
  evalBtn: null,
  codeSnippet: null
};

function init() {
  if (typeof window === 'undefined') return;

  UI.stage = document.getElementById('stage');
  UI.toggle = document.getElementById('curry-toggle');
  UI.label = document.getElementById('curry-label');
  UI.resetBtn = document.getElementById('reset-btn');
  UI.evalBtn = document.getElementById('evaluate-btn');
  UI.codeSnippet = document.getElementById('code-snippet');

  UI.toggle.addEventListener('change', handleToggle);
  UI.resetBtn.addEventListener('click', resetState);
  UI.evalBtn.addEventListener('click', evaluate);

  renderStage();
  updateCodeDisplay();
}

function handleToggle(e) {
  State.isCurried = e.target.checked;
  UI.label.textContent = State.isCurried ? 'Curried' : 'Uncurried';

  // Clear inputs on toggle
  State.args = { x: '', y: '', z: '' };

  animateTransition();
}

function animateTransition() {
  UI.stage.classList.remove('state-uncurried', 'state-curried', 'animating-split', 'animating-join');

  const targetClass = State.isCurried ? 'state-curried' : 'state-uncurried';
  const animClass = State.isCurried ? 'animating-split' : 'animating-join';

  UI.stage.classList.add(targetClass, animClass);
  renderStage();
  updateCodeDisplay();
  clearResult();

  setTimeout(() => {
    UI.stage.classList.remove(animClass);
  }, 500);
}

function handleInput(e) {
  const { name, value } = e.target;
  State.args[name] = value;
  updateCodeDisplay();
}

function resetState() {
  State.args = { x: '', y: '', z: '' };
  State.isEvaluating = false;
  UI.evalBtn.disabled = false;
  clearResult();

  // Re-render inputs
  const inputs = UI.stage.querySelectorAll('.arg-input');
  inputs.forEach(input => input.value = '');

  updateCodeDisplay();
}

function clearResult() {
  const existingResult = UI.stage.querySelector('.result-display');
  if (existingResult) {
    existingResult.remove();
  }
}

function createArgSlot(name, value) {
  const slot = document.createElement('div');
  slot.className = 'arg-slot';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'arg-input';
  input.name = name;
  input.value = value;
  input.placeholder = '?';
  input.maxLength = 3;
  input.addEventListener('input', handleInput);

  const label = document.createElement('span');
  label.className = 'arg-label';
  label.textContent = name;

  slot.appendChild(input);
  slot.appendChild(label);
  return slot;
}

function renderStage() {
  UI.stage.innerHTML = '';
  UI.stage.className = `visualization-stage ${State.isCurried ? 'state-curried' : 'state-uncurried'}`;

  const container = document.createElement('div');
  container.className = 'function-container';

  if (!State.isCurried) {
    // Uncurried: Single block
    const block = document.createElement('div');
    block.className = 'function-block';

    const title = document.createElement('div');
    title.className = 'function-name';
    title.textContent = 'add(x, y, z)';

    const argsContainer = document.createElement('div');
    argsContainer.className = 'args-container';
    argsContainer.appendChild(createArgSlot('x', State.args.x));
    argsContainer.appendChild(createArgSlot('y', State.args.y));
    argsContainer.appendChild(createArgSlot('z', State.args.z));

    block.appendChild(title);
    block.appendChild(argsContainer);
    container.appendChild(block);

  } else {
    // Curried: Chained blocks
    const params = ['x', 'y', 'z'];
    params.forEach((param, index) => {
      const block = document.createElement('div');
      block.className = 'function-block';

      const title = document.createElement('div');
      title.className = 'function-name';
      title.textContent = index === 0 ? 'add(x)' : `(return)(${param})`;

      const argsContainer = document.createElement('div');
      argsContainer.className = 'args-container';
      argsContainer.appendChild(createArgSlot(param, State.args[param]));

      block.appendChild(title);
      block.appendChild(argsContainer);
      container.appendChild(block);

      if (index < params.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'chain-arrow';
        arrow.textContent = '→';
        container.appendChild(arrow);
      }
    });
  }

  UI.stage.appendChild(container);
}

function updateCodeDisplay() {
  const { x, y, z } = State.args;
  const vx = x || 'x';
  const vy = y || 'y';
  const vz = z || 'z';

  let codeHtml = '';

  if (!State.isCurried) {
    codeHtml = `const add = (x, y, z) => x + y + z;\n\n`;
    codeHtml += `add(<span class="code-highlight">${vx}</span>, <span class="code-highlight">${vy}</span>, <span class="code-highlight">${vz}</span>);`;
  } else {
    codeHtml = `const add = x => y => z => x + y + z;\n\n`;
    codeHtml += `add(<span class="code-highlight">${vx}</span>)(<span class="code-highlight">${vy}</span>)(<span class="code-highlight">${vz}</span>);`;
  }

  UI.codeSnippet.innerHTML = codeHtml;
}

function evaluate() {
  if (State.isEvaluating) return;

  const nx = parseFloat(State.args.x);
  const ny = parseFloat(State.args.y);
  const nz = parseFloat(State.args.z);

  if (isNaN(nx) || isNaN(ny) || isNaN(nz)) {
    alert("Please enter valid numbers in all slots to evaluate.");
    return;
  }

  State.isEvaluating = true;
  UI.evalBtn.disabled = true;
  clearResult();

  const blocks = Array.from(UI.stage.querySelectorAll('.function-block'));
  const sum = nx + ny + nz;

  // Simple animation sequence
  blocks.forEach((block, index) => {
    setTimeout(() => {
      block.style.transform = 'scale(1.1)';
      block.style.boxShadow = '0 0 20px var(--primary)';

      setTimeout(() => {
        block.style.transform = '';
        block.style.boxShadow = '';
      }, 300);

    }, index * 400);
  });

  const totalTime = blocks.length * 400;

  setTimeout(() => {
    showResult(sum);
    State.isEvaluating = false;
    UI.evalBtn.disabled = false;
  }, totalTime + 200);
}

function showResult(value) {
  const resultDiv = document.createElement('div');
  resultDiv.className = 'result-display';
  resultDiv.textContent = `= ${value}`;
  UI.stage.appendChild(resultDiv);

  // Trigger reflow
  void resultDiv.offsetWidth;
  resultDiv.classList.add('show');
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { State, init, handleToggle, resetState, evaluate };
}
