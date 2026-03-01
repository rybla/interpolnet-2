/**
 * AST Nodes for Lambda Calculus
 */

class ASTNode {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.domElement = null; // Reference to the rendered DOM element
  }

  clone() {
    throw new Error("clone() must be implemented by subclasses");
  }

  replaceVar(name, replacement) {
    throw new Error("replaceVar() must be implemented by subclasses");
  }
}

class Variable extends ASTNode {
  constructor(name) {
    super();
    this.name = name;
  }

  clone() {
    return new Variable(this.name);
  }

  replaceVar(name, replacement) {
    if (this.name === name) {
      return replacement.clone();
    }
    return this;
  }
}

class Abstraction extends ASTNode {
  constructor(param, body) {
    super();
    this.param = param; // string name of the variable
    this.body = body;   // ASTNode
  }

  clone() {
    return new Abstraction(this.param, this.body.clone());
  }

  replaceVar(name, replacement) {
    // If the abstraction binds the variable we are trying to replace,
    // it shadows the outer variable. Do not substitute inside.
    // (Ignoring alpha-conversion needs for this visualizer for simplicity,
    // assuming well-named examples)
    if (this.param === name) {
      return this;
    }
    this.body = this.body.replaceVar(name, replacement);
    return this;
  }
}

class Application extends ASTNode {
  constructor(func, arg) {
    super();
    this.func = func; // ASTNode
    this.arg = arg;   // ASTNode
  }

  clone() {
    return new Application(this.func.clone(), this.arg.clone());
  }

  replaceVar(name, replacement) {
    this.func = this.func.replaceVar(name, replacement);
    this.arg = this.arg.replaceVar(name, replacement);
    return this;
  }
}

// Color palette for variables
const COLORS = {
  'x': '#ffadad', // Pastel Red
  'y': '#ffd6a5', // Pastel Orange
  'z': '#fdffb6', // Pastel Yellow
  'a': '#caffbf', // Pastel Green
  'b': '#9bf6ff', // Pastel Cyan
  'c': '#a0c4ff', // Pastel Blue
  'f': '#bdb2ff', // Pastel Purple
  'g': '#ffc6ff', // Pastel Pink
};

function getColorForVar(name) {
  return COLORS[name] || '#e0e0e0';
}

/**
 * Examples Factory
 */
const Examples = {
  identity: () => {
    // (λx.x) y
    return new Application(
      new Abstraction('x', new Variable('x')),
      new Variable('y')
    );
  },
  mockingbird: () => {
    // (λx.x x) (λy.y y)
    return new Application(
      new Abstraction('x', new Application(new Variable('x'), new Variable('x'))),
      new Abstraction('y', new Application(new Variable('y'), new Variable('y')))
    );
  },
  kestrel: () => {
    // (λx.λy.x) a b
    // Application(Application(Abs(x, Abs(y, x)), a), b)
    return new Application(
      new Application(
        new Abstraction('x', new Abstraction('y', new Variable('x'))),
        new Variable('a')
      ),
      new Variable('b')
    );
  },
  kite: () => {
    // (λx.λy.y) a b
    return new Application(
      new Application(
        new Abstraction('x', new Abstraction('y', new Variable('y'))),
        new Variable('a')
      ),
      new Variable('b')
    );
  },
  omega: () => {
    // (λx.x x) (λx.x x)
    return new Application(
      new Abstraction('x', new Application(new Variable('x'), new Variable('x'))),
      new Abstraction('x', new Application(new Variable('x'), new Variable('x')))
    );
  }
};

/**
 * Global State
 */
let currentAst = null;
let isAnimating = false;
let reductionQueue = [];

/**
 * Layout and Rendering Engine
 */
function renderAST(astNode) {
  const container = document.createElement('div');
  container.className = 'node-container';
  astNode.domElement = container;

  if (astNode instanceof Variable) {
    const el = document.createElement('div');
    el.className = 'variable';
    el.textContent = astNode.name;
    el.style.backgroundColor = getColorForVar(astNode.name);
    el.dataset.varName = astNode.name;
    container.appendChild(el);

  } else if (astNode instanceof Abstraction) {
    const el = document.createElement('div');
    el.className = 'abstraction';

    // Head part
    const head = document.createElement('div');
    head.className = 'abs-head';

    const lambda = document.createElement('span');
    lambda.className = 'lambda-symbol';
    lambda.textContent = 'λ';

    const param = document.createElement('div');
    param.className = 'variable';
    param.textContent = astNode.param;
    param.style.backgroundColor = getColorForVar(astNode.param);

    head.appendChild(lambda);
    head.appendChild(param);

    // Body part
    const body = document.createElement('div');
    body.className = 'abs-body';
    body.appendChild(renderAST(astNode.body));

    el.appendChild(head);
    el.appendChild(body);
    container.appendChild(el);

  } else if (astNode instanceof Application) {
    const el = document.createElement('div');
    el.className = 'application';

    // An application is a redex if the left child is an abstraction
    if (astNode.func instanceof Abstraction) {
      el.classList.add('redex');
      el.dataset.appId = astNode.id; // Mark it
    }

    el.appendChild(renderAST(astNode.func));
    el.appendChild(renderAST(astNode.arg));
    container.appendChild(el);
  }

  return container;
}

function updateDOM() {
  const container = document.getElementById('ast-container');
  container.innerHTML = '';
  if (currentAst) {
    container.appendChild(renderAST(currentAst));
    attachEventListeners();
  }
}

/**
 * Reduction Logic and Animation
 */
function findLeftmostOutermostRedex(node) {
  if (!node) return null;

  if (node instanceof Application) {
    // Is this node a redex?
    if (node.func instanceof Abstraction) {
      return node;
    }
    // Otherwise check left child, then right child
    const leftRes = findLeftmostOutermostRedex(node.func);
    if (leftRes) return leftRes;

    return findLeftmostOutermostRedex(node.arg);
  }

  if (node instanceof Abstraction) {
    return findLeftmostOutermostRedex(node.body);
  }

  return null; // Variable
}

// Find AST node containing a specific Application ID to replace it
function replaceNodeInAST(root, oldNodeId, newNode) {
  if (!root) return root;
  if (root.id === oldNodeId) return newNode;

  if (root instanceof Application) {
    root.func = replaceNodeInAST(root.func, oldNodeId, newNode);
    root.arg = replaceNodeInAST(root.arg, oldNodeId, newNode);
  } else if (root instanceof Abstraction) {
    root.body = replaceNodeInAST(root.body, oldNodeId, newNode);
  }

  return root;
}

function findVariableNodesInDOM(rootDOM, varName) {
  const vars = [];
  const walk = (el) => {
    if (el.classList && el.classList.contains('variable') && el.dataset.varName === varName) {
      // Don't pick up the parameter declaration, only usage
      if (!el.parentElement.classList.contains('abs-head')) {
        vars.push(el);
      }
    }
    for (const child of el.children || []) {
      walk(child);
    }
  };
  walk(rootDOM);
  return vars;
}

async function performReduction(appNode) {
  if (isAnimating) return;
  isAnimating = true;

  document.getElementById('step-btn').disabled = true;
  document.getElementById('message-text').textContent = 'Reducing...';

  const abstraction = appNode.func;
  const argument = appNode.arg;
  const paramName = abstraction.param;

  const appEl = appNode.domElement.children[0]; // .application
  const absEl = appEl.children[0]; // .node-container of func
  const argEl = appEl.children[1]; // .node-container of arg

  // 1. Highlight the argument
  appEl.classList.add('active');
  await new Promise(r => setTimeout(r, 600));

  // 2. Find all instances of the parameter in the body
  const bodyContainer = absEl.querySelector('.abs-body');
  const targetVars = findVariableNodesInDOM(bodyContainer, paramName);

  // 3. Create clones and fly them
  const clones = [];
  const argRect = argEl.getBoundingClientRect();

  targetVars.forEach(target => {
    target.classList.add('highlight-target');

    // Create clone of argument tree
    const clone = argEl.cloneNode(true);
    clone.classList.add('clone');

    // Initial position matching original argument
    clone.style.left = `${argRect.left}px`;
    clone.style.top = `${argRect.top}px`;
    clone.style.width = `${argRect.width}px`;
    clone.style.height = `${argRect.height}px`;
    clone.style.transformOrigin = 'top left';

    document.body.appendChild(clone);
    clones.push({ clone, target });
  });

  // Small delay to allow initial positions to render
  await new Promise(r => setTimeout(r, 50));

  // Move clones to targets
  clones.forEach(({ clone, target }) => {
    const targetRect = target.getBoundingClientRect();

    // To center the scaled clone inside the target's center:
    // Scale factor
    const scale = targetRect.width / argRect.width;

    // The top-left of the clone needs to move from argRect.left to targetRect.left
    // Since transformOrigin is top left, translation is straightforward
    const tx = targetRect.left - argRect.left;
    const ty = targetRect.top - argRect.top;

    // But we might want it to match the height or width? Width is fine.
    // If target height and scaled height differ, it might look slightly off-center vertically.
    // Let's adjust to perfectly center it:
    const scaledHeight = argRect.height * scale;
    const offsetY = (targetRect.height - scaledHeight) / 2;

    clone.style.transform = `translate(${tx}px, ${ty + offsetY}px) scale(${scale})`;
  });

  // Wait for fly animation
  if (clones.length > 0) {
    await new Promise(r => setTimeout(r, 600));
  } else {
    // If no variables match, still wait a bit
    await new Promise(r => setTimeout(r, 400));
  }

  // 4. Fade out original abstraction head, envelope, and original argument
  const absHead = absEl.querySelector('.abs-head');
  absHead.classList.add('fade-out');
  argEl.classList.add('fade-out');

  // Fade out clones and targets
  clones.forEach(({ clone, target }) => {
    clone.classList.add('fade-out');
    target.classList.add('fade-out');
  });

  await new Promise(r => setTimeout(r, 600));

  // Clean up clones
  clones.forEach(({ clone }) => clone.remove());

  // 5. Update AST and re-render
  // Compute substituted body
  const newBody = abstraction.body.replaceVar(paramName, argument);

  // Replace the Application node with the new body
  if (currentAst.id === appNode.id) {
    currentAst = newBody;
  } else {
    currentAst = replaceNodeInAST(currentAst, appNode.id, newBody);
  }

  updateDOM();

  isAnimating = false;
  document.getElementById('step-btn').disabled = false;

  // Check if fully reduced
  if (!findLeftmostOutermostRedex(currentAst)) {
    document.getElementById('message-text').textContent = 'Normal form reached.';
    document.getElementById('step-btn').disabled = true;
  } else {
    document.getElementById('message-text').textContent = 'Step complete. Click "Step" for next reduction.';
  }
}

/**
 * Event Listeners
 */
function attachEventListeners() {
  const redexes = document.querySelectorAll('.application.redex');
  redexes.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent firing on parent applications
      if (isAnimating) return;

      const appId = el.dataset.appId;
      // Find the node
      const findNode = (node) => {
        if (!node) return null;
        if (node.id === appId) return node;
        if (node instanceof Application) return findNode(node.func) || findNode(node.arg);
        if (node instanceof Abstraction) return findNode(node.body);
        return null;
      };

      const nodeToReduce = findNode(currentAst);
      if (nodeToReduce) {
        performReduction(nodeToReduce);
      }
    });
  });
}

document.getElementById('step-btn').addEventListener('click', () => {
  const redex = findLeftmostOutermostRedex(currentAst);
  if (redex) {
    performReduction(redex);
  }
});

document.getElementById('reset-btn').addEventListener('click', initExample);

document.getElementById('example-select').addEventListener('change', initExample);

function initExample() {
  const select = document.getElementById('example-select');
  const exampleKey = select.value;

  currentAst = Examples[exampleKey]();
  isAnimating = false;
  document.getElementById('step-btn').disabled = false;
  document.getElementById('message-text').textContent = 'Select an example and click "Step" or click a valid application directly.';

  updateDOM();
}

// Initial render
window.addEventListener('DOMContentLoaded', initExample);
