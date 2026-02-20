// AST Node Classes
class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

class Variable extends ASTNode {
  constructor(name) {
    super('Variable');
    this.name = name;
  }

  toString() {
    return this.name;
  }

  clone() {
    return new Variable(this.name);
  }
}

class Abstraction extends ASTNode {
  constructor(param, body) {
    super('Abstraction');
    this.param = param; // string
    this.body = body;   // ASTNode
  }

  toString() {
    return `(λ${this.param}.${this.body.toString()})`;
  }

  clone() {
    return new Abstraction(this.param, this.body.clone());
  }
}

class Application extends ASTNode {
  constructor(func, arg) {
    super('Application');
    this.func = func; // ASTNode
    this.arg = arg;   // ASTNode
  }

  toString() {
    return `(${this.func.toString()} ${this.arg.toString()})`;
  }

  clone() {
    return new Application(this.func.clone(), this.arg.clone());
  }
}

// Parser
class Parser {
  constructor(input) {
    this.input = input;
    this.pos = 0;
  }

  parse() {
    const result = this.parseExpression();
    this.skipWhitespace();
    if (this.pos < this.input.length) {
      throw new Error(`Unexpected character at ${this.pos}: ${this.input[this.pos]}`);
    }
    return result;
  }

  parseExpression() {
    return this.parseApplication();
  }

  parseApplication() {
    let left = this.parseAtom();

    while (true) {
        this.skipWhitespace();
        if (this.pos >= this.input.length || this.input[this.pos] === ')' || this.input[this.pos] === '.') {
            break;
        }
        // If we see a lambda or another atom, it's an application
        const right = this.parseAtom();
        left = new Application(left, right);
    }
    return left;
  }

  parseAtom() {
    this.skipWhitespace();
    if (this.pos >= this.input.length) {
      throw new Error('Unexpected end of input');
    }

    const char = this.input[this.pos];

    if (char === '(') {
      this.pos++;
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (this.input[this.pos] !== ')') {
        throw new Error("Expected ')'");
      }
      this.pos++;
      return expr;
    } else if (char === 'λ' || char === '\\') {
      return this.parseAbstraction();
    } else if (this.isAlphaNumeric(char)) {
      return this.parseVariable();
    } else {
        throw new Error(`Unexpected character: ${char}`);
    }
  }

  parseAbstraction() {
    this.pos++; // Skip lambda or backslash
    this.skipWhitespace();
    const param = this.parseVariableToken();
    this.skipWhitespace();
    if (this.input[this.pos] !== '.') {
      throw new Error("Expected '.' in abstraction");
    }
    this.pos++; // Skip dot
    const body = this.parseExpression();
    return new Abstraction(param, body);
  }

  parseVariable() {
    const name = this.parseVariableToken();
    return new Variable(name);
  }

  parseVariableToken() {
    let name = '';
    while (this.pos < this.input.length && this.isAlphaNumeric(this.input[this.pos])) {
      name += this.input[this.pos];
      this.pos++;
    }
    return name;
  }

  skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  isAlphaNumeric(char) {
    return /[a-zA-Z0-9]/.test(char);
  }
}

// Logic

// Get free variables of a term
function getFreeVariables(term) {
  if (term.type === 'Variable') {
    return new Set([term.name]);
  } else if (term.type === 'Abstraction') {
    const freeVars = getFreeVariables(term.body);
    freeVars.delete(term.param);
    return freeVars;
  } else if (term.type === 'Application') {
    const leftFree = getFreeVariables(term.func);
    const rightFree = getFreeVariables(term.arg);
    return new Set([...leftFree, ...rightFree]);
  }
  return new Set();
}

// Generate a fresh variable name
function freshVariable(varName, usedVars) {
  let newName = varName;
  let counter = 1;
  while (usedVars.has(newName)) {
    newName = varName + counter;
    counter++;
  }
  return newName;
}

// Substitution: [x := replacement]target
function substitute(target, x, replacement) {
  if (target.type === 'Variable') {
    if (target.name === x) {
      return replacement.clone();
    } else {
      return target;
    }
  } else if (target.type === 'Application') {
    return new Application(
      substitute(target.func, x, replacement),
      substitute(target.arg, x, replacement)
    );
  } else if (target.type === 'Abstraction') {
    if (target.param === x) {
      // Bound variable is x, so no substitution inside
      return target;
    } else {
      const freeInReplacement = getFreeVariables(replacement);
      if (freeInReplacement.has(target.param)) {
        // Capture avoidance needed
        const usedVars = new Set([...getFreeVariables(target.body), ...freeInReplacement]);
        const newParam = freshVariable(target.param, usedVars);
        const newBody = substitute(target.body, target.param, new Variable(newParam));
        return new Abstraction(newParam, substitute(newBody, x, replacement));
      } else {
        return new Abstraction(target.param, substitute(target.body, x, replacement));
      }
    }
  }
}

// Alpha conversion (rename bound variable)
function alphaConvert(abstraction, newName) {
    if (abstraction.type !== 'Abstraction') {
        throw new Error("Alpha conversion only applies to abstractions");
    }
    const newBody = substitute(abstraction.body, abstraction.param, new Variable(newName));
    return new Abstraction(newName, newBody);
}

// Normal Order Reduction (Leftmost Outermost)
// Returns { expr: ASTNode, reduced: boolean, message: string }
function reduceStep(term) {
    if (term.type === 'Variable') {
        return { expr: term, reduced: false };
    } else if (term.type === 'Abstraction') {
        const result = reduceStep(term.body);
        if (result.reduced) {
            return { expr: new Abstraction(term.param, result.expr), reduced: true, message: result.message };
        }
        return { expr: term, reduced: false };
    } else if (term.type === 'Application') {
        if (term.func.type === 'Abstraction') {
            // Beta reduction!
            const reducedExpr = substitute(term.func.body, term.func.param, term.arg);
            return { expr: reducedExpr, reduced: true, message: `Beta reduction: substituted ${term.arg.toString()} for ${term.func.param}` };
        } else {
            // Try to reduce the function part first (Normal Order)
            const funcResult = reduceStep(term.func);
            if (funcResult.reduced) {
                return { expr: new Application(funcResult.expr, term.arg), reduced: true, message: funcResult.message };
            }
            // If function part is normal, try reducing argument
            const argResult = reduceStep(term.arg);
            if (argResult.reduced) {
                return { expr: new Application(term.func, argResult.expr), reduced: true, message: argResult.message };
            }
        }
    }
    return { expr: term, reduced: false };
}

// Helper to parse string
function parseLambda(str) {
    const parser = new Parser(str);
    return parser.parse();
}

// Visualization Logic

function renderAST(node, parentElement) {
    const nodeEl = document.createElement('div');
    nodeEl.classList.add('ast-node');
    nodeEl.classList.add('fade-in');

    // Add reference to AST node for easy access (optional, but helpful for debugging/interaction)
    nodeEl.dataset.type = node.type;

    if (node.type === 'Variable') {
        nodeEl.classList.add('variable');
        nodeEl.textContent = node.name;
        nodeEl.dataset.name = node.name;

        // Highlight logic: on mouseover, if this is a bound variable, find the binder
        nodeEl.addEventListener('mouseover', (e) => {
            e.stopPropagation();
            highlightBinder(nodeEl, node.name);
        });
        nodeEl.addEventListener('mouseout', (e) => {
            e.stopPropagation();
            clearHighlights();
        });

    } else if (node.type === 'Abstraction') {
        nodeEl.classList.add('abstraction');

        const header = document.createElement('div');
        header.classList.add('abstraction-header');
        header.textContent = `λ${node.param}.`;
        nodeEl.appendChild(header);

        nodeEl.dataset.param = node.param;

        // Highlight logic: on mouseover, highlight all bound variables in body
        header.addEventListener('mouseover', (e) => {
             e.stopPropagation();
             highlightBoundVariables(nodeEl, node.param);
        });
        header.addEventListener('mouseout', (e) => {
             e.stopPropagation();
             clearHighlights();
        });

        const bodyContainer = document.createElement('div');
        bodyContainer.classList.add('ast-body');
        renderAST(node.body, bodyContainer);
        nodeEl.appendChild(bodyContainer);

    } else if (node.type === 'Application') {
        nodeEl.classList.add('application');

        const funcContainer = document.createElement('div');
        funcContainer.classList.add('app-func');
        renderAST(node.func, funcContainer);
        nodeEl.appendChild(funcContainer);

        const argContainer = document.createElement('div');
        argContainer.classList.add('app-arg');
        renderAST(node.arg, argContainer);
        nodeEl.appendChild(argContainer);
    }

    parentElement.appendChild(nodeEl);
    return nodeEl;
}

function highlightBoundVariables(abstractionEl, paramName) {
    abstractionEl.classList.add('highlight-binder');
    const variables = abstractionEl.querySelectorAll('.variable');
    variables.forEach(v => {
        if (v.dataset.name === paramName && isBoundBy(v, abstractionEl)) {
            v.classList.add('highlight-bound');
        }
    });
}

function isBoundBy(varEl, abstractionEl) {
    let current = varEl.parentElement;
    while (current && current !== abstractionEl) {
        if (current.classList.contains('abstraction') && current.dataset.param === varEl.dataset.name) {
            // It's bound by an inner abstraction (shadowing)
            return false;
        }
        current = current.parentElement;
    }
    return true;
}

function highlightBinder(varEl, varName) {
    let current = varEl.parentElement;
    while (current) {
        if (current.classList.contains('abstraction') && current.dataset.param === varName) {
            current.classList.add('highlight-binder');
            varEl.classList.add('highlight-bound');
            return; // Found the nearest binder
        }
        current = current.parentElement;
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight-binder').forEach(el => el.classList.remove('highlight-binder'));
    document.querySelectorAll('.highlight-bound').forEach(el => el.classList.remove('highlight-bound'));
}

// State
let currentAST = null;
let history = [];

// UI Interaction elements
// We check if document is available to allow running in node/bun for tests
if (typeof document !== 'undefined') {
    const inputEl = document.getElementById('expression-input');
    const parseBtn = document.getElementById('parse-btn');
    const stepBtn = document.getElementById('step-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearBtn = document.getElementById('clear-btn');
    const exampleSelect = document.getElementById('example-select');
    const statusMsg = document.getElementById('status-message');
    const visualizationDiv = document.getElementById('visualization');

    function setStatus(msg, type = 'info') {
        statusMsg.textContent = msg;
        statusMsg.style.color = type === 'error' ? '#ff4081' : '#aaa';
    }

    function updateUI() {
        visualizationDiv.innerHTML = '';
        if (currentAST) {
            renderAST(currentAST, visualizationDiv);
            stepBtn.disabled = false;
            resetBtn.disabled = false;

            // Highlight next redex
            const redex = findLeftmostRedex(visualizationDiv);
            if (redex) {
                redex.classList.add('redex');
                setStatus("Ready to step.");
            } else {
                stepBtn.disabled = true;
                setStatus("Normal form reached.");
            }
        } else {
            stepBtn.disabled = true;
            resetBtn.disabled = true;
        }
    }

    function findLeftmostRedex(container) {
        const apps = container.querySelectorAll('.application');
        for (let app of apps) {
            const funcContainer = app.querySelector('.app-func');
            // The funcContainer might contain wrapper divs, need to find the child .ast-node
            // .app-func > .ast-node
            const funcNode = funcContainer.children[0];

            if (funcNode && funcNode.classList.contains('abstraction')) {
                return app;
            }
        }
        return null;
    }

    parseBtn.addEventListener('click', () => {
        const code = inputEl.value.trim();
        if (!code) return;
        try {
            currentAST = parseLambda(code);
            history = []; // Clear history on new parse
            setStatus("Parsed successfully.");
            updateUI();
        } catch (e) {
            setStatus(e.message, 'error');
        }
    });

    stepBtn.addEventListener('click', () => {
        if (!currentAST) return;

        history.push(currentAST.clone());

        const result = reduceStep(currentAST);
        if (result.reduced) {
            currentAST = result.expr;
            setStatus(result.message);
            updateUI();
        } else {
            setStatus("Already in normal form.");
            stepBtn.disabled = true;
        }
    });

    resetBtn.addEventListener('click', () => {
        if (history.length > 0) {
            currentAST = history[0];
            history = [];
            setStatus("Reset to initial state.");
            updateUI();
        }
    });

    clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        currentAST = null;
        history = [];
        visualizationDiv.innerHTML = '';
        setStatus("Ready");
        stepBtn.disabled = true;
        resetBtn.disabled = true;
    });

    exampleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
            inputEl.value = val;
            parseBtn.click();
        }
    });

    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            parseBtn.click();
        }
    });
}

// Export for testing (will be removed or wrapped for browser later if needed, but for now `bun` can run this if we export)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Variable, Abstraction, Application, Parser, parseLambda, reduceStep, substitute, alphaConvert
    };
}
