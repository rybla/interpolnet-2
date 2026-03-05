// Lisp Macro Visualizer

// --- AST Types ---
// Node: { type: 'list', children: Node[], isMacro?: boolean, macroName?: string }
// Node: { type: 'token', value: string, kind: 'symbol'|'number'|'string' }

// --- Presets ---
const PRESETS = [
  {
    id: 'unless',
    name: 'unless',
    desc: 'The `unless` macro evaluates its body only if the condition is false. It expands into an `if` form with a negated condition.',
    code: '(unless (connected-p server)\n  (connect server)\n  (log "connected"))'
  },
  {
    id: 'let',
    name: 'let',
    desc: 'The `let` macro binds variables to values within a local scope. It expands into an immediate lambda application.',
    code: '(let ((x 10)\n      (y 20))\n  (+ x y))'
  },
  {
    id: 'incf',
    name: 'incf',
    desc: 'The `incf` macro increments a variable in place. It expands into a `setq` (or `setf`) form.',
    code: '(incf counter 5)'
  },
  {
    id: 'dotimes',
    name: 'dotimes',
    desc: 'The `dotimes` macro executes a body a specific number of times. It expands into a lower-level loop construct.',
    code: '(dotimes (i 3)\n  (print i))'
  }
];

// --- Lisp Parser ---
function tokenize(str) {
  const tokens = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      current += char;
      if (char === '"' && str[i-1] !== '\\') {
        tokens.push(current);
        current = '';
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      if (current) tokens.push(current);
      current = char;
      inString = true;
    } else if (char === '(' || char === ')') {
      if (current) tokens.push(current);
      tokens.push(char);
      current = '';
    } else if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

function parseTokens(tokens) {
  if (tokens.length === 0) return null;

  const token = tokens.shift();

  if (token === '(') {
    const children = [];
    while (tokens[0] !== ')') {
      if (tokens.length === 0) throw new Error("Unexpected EOF");
      children.push(parseTokens(tokens));
    }
    tokens.shift(); // consume ')'
    return { type: 'list', children };
  } else if (token === ')') {
    throw new Error("Unexpected ')'");
  } else {
    let kind = 'symbol';
    if (!isNaN(Number(token))) kind = 'number';
    else if (token.startsWith('"') && token.endsWith('"')) kind = 'string';
    return { type: 'token', value: token, kind };
  }
}

function parse(str) {
  const tokens = tokenize(str);
  return parseTokens(tokens);
}

// --- Macro Expansion Logic ---

const MACROS = {
  'unless': (node) => {
    // (unless cond . body) -> (if (not cond) (progn . body))
    const cond = node.children[1];
    const body = node.children.slice(2);

    return {
      type: 'list',
      children: [
        { type: 'token', value: 'if', kind: 'symbol' },
        {
          type: 'list',
          children: [
            { type: 'token', value: 'not', kind: 'symbol' },
            cond
          ]
        },
        {
          type: 'list',
          children: [
            { type: 'token', value: 'progn', kind: 'symbol' },
            ...body
          ]
        }
      ]
    };
  },
  'let': (node) => {
    // (let ((v1 e1) (v2 e2)) . body) -> ((lambda (v1 v2) . body) e1 e2)
    const bindings = node.children[1].children;
    const body = node.children.slice(2);

    const vars = bindings.map(b => b.children[0]);
    const vals = bindings.map(b => b.children[1]);

    return {
      type: 'list',
      children: [
        {
          type: 'list',
          children: [
            { type: 'token', value: 'lambda', kind: 'symbol' },
            { type: 'list', children: vars },
            ...body
          ]
        },
        ...vals
      ]
    };
  },
  'incf': (node) => {
    // (incf var delta) -> (setq var (+ var delta))
    const v = node.children[1];
    const delta = node.children[2] || { type: 'token', value: '1', kind: 'number' };

    return {
      type: 'list',
      children: [
        { type: 'token', value: 'setq', kind: 'symbol' },
        v,
        {
          type: 'list',
          children: [
            { type: 'token', value: '+', kind: 'symbol' },
            v,
            delta
          ]
        }
      ]
    };
  },
  'dotimes': (node) => {
    // (dotimes (var limit) . body) -> (let ((var 0) (#:limit limit)) (loop ...))
    // Simplified expansion for visualization
    const binding = node.children[1];
    const v = binding.children[0];
    const limit = binding.children[1];
    const body = node.children.slice(2);

    return {
      type: 'list',
      children: [
        { type: 'token', value: 'let', kind: 'symbol' },
        {
          type: 'list',
          children: [
            {
              type: 'list',
              children: [v, { type: 'token', value: '0', kind: 'number' }]
            },
            {
              type: 'list',
              children: [{ type: 'token', value: 'limit-var', kind: 'symbol' }, limit]
            }
          ]
        },
        {
          type: 'list',
          children: [
            { type: 'token', value: 'loop', kind: 'symbol' },
            {
              type: 'list',
              children: [
                { type: 'token', value: 'if', kind: 'symbol' },
                {
                  type: 'list',
                  children: [
                    { type: 'token', value: '>=', kind: 'symbol' },
                    v,
                    { type: 'token', value: 'limit-var', kind: 'symbol' }
                  ]
                },
                { type: 'list', children: [{ type: 'token', value: 'return', kind: 'symbol' }] },
                {
                  type: 'list',
                  children: [
                    { type: 'token', value: 'progn', kind: 'symbol' },
                    ...body,
                    {
                      type: 'list',
                      children: [{ type: 'token', value: 'incf', kind: 'symbol' }, v]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }
};

const SPECIAL_FORMS = ['if', 'let', 'progn', 'lambda', 'setq', 'loop'];

// Identify macros in AST
function tagMacros(node) {
  if (node.type === 'list' && node.children.length > 0 && node.children[0].type === 'token') {
    const sym = node.children[0].value;
    if (MACROS[sym]) {
      node.isMacro = true;
      node.macroName = sym;
    }
  }

  if (node.type === 'list') {
    node.children.forEach(tagMacros);
  }
  return node;
}

// Check if AST has any unexpanded macros
function hasMacros(node) {
  if (node.isMacro) return true;
  if (node.type === 'list') {
    return node.children.some(hasMacros);
  }
  return false;
}

// Expand a single macro node
function expandMacro(node) {
  if (!node.isMacro) return node;

  const expander = MACROS[node.macroName];
  const expanded = expander(node);

  // Tag new nodes in case expansion produced more macros
  tagMacros(expanded);
  return expanded;
}

// --- DOM Rendering ---

function renderNode(node, onMacroClick) {
  if (node.type === 'token') {
    const span = document.createElement('span');
    span.className = `token ${node.kind}`;
    span.textContent = node.value;
    return span;
  }

  if (node.type === 'list') {
    const div = document.createElement('div');
    div.className = 's-expr';

    // Formatting hints
    if (node.children.length > 0 && node.children[0].type === 'token') {
      const head = node.children[0].value;
      if (['let', 'progn', 'if', 'lambda', 'unless', 'dotimes', 'loop'].includes(head)) {
        div.classList.add('vertical');
      }

      if (SPECIAL_FORMS.includes(head)) {
        div.classList.add('special-form');
      } else if (!node.isMacro && head !== 'setq') {
         div.classList.add('func-call');
      }
    }

    if (node.isMacro) {
      div.classList.add('macro-call');
      div.title = `Click to expand macro: ${node.macroName}`;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onMacroClick(node, div);
      });
    }

    node.children.forEach(child => {
      div.appendChild(renderNode(child, onMacroClick));
    });

    return div;
  }
}

// --- Application State ---
let currentAST = null;
let currentPreset = null;

// --- UI Interaction ---

function updateUI() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';

  if (!currentAST) {
    canvas.innerHTML = '<div class="placeholder">Select a preset macro to visualize...</div>';
    document.getElementById('reset-btn').disabled = true;
    document.getElementById('expand-all-btn').disabled = true;
    return;
  }

  const rootDiv = document.createElement('div');
  rootDiv.className = 'ast-root';

  const handleMacroClick = (macroNode, domElement) => {
    // Expand AST
    const expandedAST = expandMacro(macroNode);

    // Replace in parent (requires finding parent, but simple hack is to re-render)
    // For smooth animation, we do a localized replacement
    const newDom = renderNode(expandedAST, handleMacroClick);

    // Animation setup
    newDom.classList.add('expand-enter');

    // Replace
    domElement.replaceWith(newDom);

    // Trigger reflow
    void newDom.offsetWidth;

    // Animate in
    newDom.classList.remove('expand-enter');
    newDom.classList.add('expand-enter-active');
    newDom.classList.add('expand-highlight');

    // Update global state tree (simplistic approach: just reparse full tree if needed,
    // but here we just mutate the DOM. To keep full state sync, we should deep clone and replace.
    // Given the simplicity, we'll rely on DOM state for interactive step-by-step,
    // or we just replace the whole tree if 'Expand All' is clicked.
    checkPhase();
  };

  const domTree = renderNode(currentAST, handleMacroClick);
  rootDiv.appendChild(domTree);
  canvas.appendChild(rootDiv);

  document.getElementById('reset-btn').disabled = false;
  checkPhase();
}

function checkPhase() {
  const canvas = document.getElementById('canvas');
  const hasMacroDOM = canvas.querySelector('.macro-call') !== null;

  const expandBtn = document.getElementById('expand-all-btn');
  const phaseLabel = document.getElementById('phase-label');

  if (hasMacroDOM) {
    expandBtn.disabled = false;
    phaseLabel.textContent = 'MACROEXPAND';
    phaseLabel.className = 'phase-macro';
  } else {
    expandBtn.disabled = true;
    phaseLabel.textContent = 'EVALUATION';
    phaseLabel.className = 'phase-eval';
  }
}

function loadPreset(presetId) {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) return;

  currentPreset = preset;

  // Update info
  document.getElementById('macro-description').innerHTML =
    `<strong>${preset.name}</strong>: ${preset.desc}`;

  // Parse code
  const ast = parse(preset.code);
  currentAST = tagMacros(ast);

  // Update UI
  updateUI();

  // Update buttons
  document.querySelectorAll('.preset-buttons button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === presetId);
  });
}

function init() {
  const btnContainer = document.getElementById('preset-buttons');

  PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.dataset.id = preset.id;
    btn.textContent = `(${preset.name} ...)`;
    btn.addEventListener('click', () => loadPreset(preset.id));
    btnContainer.appendChild(btn);
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (currentPreset) loadPreset(currentPreset.id);
  });

  document.getElementById('expand-all-btn').addEventListener('click', () => {
    // Repeatedly expand all macros in DOM by simulating clicks
    let macros = document.querySelectorAll('.macro-call');
    while(macros.length > 0) {
      macros[0].click();
      macros = document.querySelectorAll('.macro-call');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);