
// Token types
const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF'
};

const KEYWORDS = [
  'function', 'return', 'if', 'else', 'while', 'var', 'let', 'const'
];

class Tokenizer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        this.readIdentifier();
        continue;
      }

      if (/[0-9]/.test(char)) {
        this.readNumber();
        continue;
      }

      if (char === '"' || char === "'") {
        this.readString(char);
        continue;
      }

      if (this.isOperator(char)) {
         this.readOperator();
         continue;
      }

      if (this.isPunctuation(char)) {
        this.tokens.push({
          type: TokenType.PUNCTUATION,
          value: char,
          start: this.pos,
          end: this.pos + 1
        });
        this.pos++;
        continue;
      }

      // Unknown character, skip
      this.pos++;
    }

    this.tokens.push({ type: TokenType.EOF, start: this.pos, end: this.pos });
    return this.tokens;
  }

  readIdentifier() {
    const start = this.pos;
    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const value = this.input.slice(start, this.pos);
    const type = KEYWORDS.includes(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
    this.tokens.push({ type, value, start, end: this.pos });
  }

  readNumber() {
    const start = this.pos;
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const value = this.input.slice(start, this.pos);
    this.tokens.push({ type: TokenType.NUMBER, value, start, end: this.pos });
  }

  readString(quote) {
    const start = this.pos;
    this.pos++; // Skip opening quote
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      this.pos++;
    }
    this.pos++; // Skip closing quote
    const value = this.input.slice(start, this.pos);
    this.tokens.push({ type: TokenType.STRING, value, start, end: this.pos });
  }

  isOperator(char) {
      return ['+', '-', '*', '/', '=', '!', '<', '>', '&', '|'].includes(char);
  }

  readOperator() {
      const start = this.pos;
      // Handle two-char operators like <=, >=, ==, !=, &&, ||
      if (this.pos + 1 < this.input.length) {
          const twoChars = this.input.slice(this.pos, this.pos + 2);
          if (['<=', '>=', '==', '!=', '&&', '||'].includes(twoChars)) {
              this.tokens.push({ type: TokenType.OPERATOR, value: twoChars, start, end: this.pos + 2 });
              this.pos += 2;
              return;
          }
      }
      this.tokens.push({ type: TokenType.OPERATOR, value: this.input[this.pos], start, end: this.pos + 1 });
      this.pos++;
  }

  isPunctuation(char) {
      return ['(', ')', '{', '}', '[', ']', ',', ';'].includes(char);
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse() {
    return this.parseProgram();
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume() {
    return this.tokens[this.pos++];
  }

  match(type, value = null) {
    const token = this.peek();
    if (token.type === type && (value === null || token.value === value)) {
      return this.consume();
    }
    return null;
  }

  expect(type, value = null) {
    const token = this.match(type, value);
    if (!token) {
      throw new Error(`Expected ${type} ${value || ''} but found ${this.peek().type} ${this.peek().value}`);
    }
    return token;
  }

  parseProgram() {
    const body = [];
    while (this.peek().type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body, start: 0, end: this.tokens[this.tokens.length - 1].end };
  }

  parseStatement() {
    const token = this.peek();
    if (token.type === TokenType.KEYWORD) {
      if (token.value === 'function') return this.parseFunctionDeclaration();
      if (token.value === 'var' || token.value === 'let' || token.value === 'const') return this.parseVariableDeclaration();
      if (token.value === 'if') return this.parseIfStatement();
      if (token.value === 'while') return this.parseWhileStatement();
      if (token.value === 'return') return this.parseReturnStatement();
    }
    if (token.type === TokenType.PUNCTUATION && token.value === '{') {
      return this.parseBlockStatement();
    }
    const expr = this.parseExpression();
    this.match(TokenType.PUNCTUATION, ';');
    return {
        type: 'ExpressionStatement',
        expression: expr,
        start: expr.start,
        end: expr.end // Should include semicolon but simplified
    };
  }

  parseFunctionDeclaration() {
    const startToken = this.expect(TokenType.KEYWORD, 'function');
    const id = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.PUNCTUATION, '(');
    const params = [];
    if (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== ')') {
      do {
        params.push({ type: 'Identifier', value: this.expect(TokenType.IDENTIFIER).value });
      } while (this.match(TokenType.PUNCTUATION, ','));
    }
    this.expect(TokenType.PUNCTUATION, ')');
    const body = this.parseBlockStatement();
    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', value: id.value },
      params,
      body,
      start: startToken.start,
      end: body.end
    };
  }

  parseVariableDeclaration() {
    const startToken = this.consume(); // var/let/const
    const id = this.expect(TokenType.IDENTIFIER);
    let init = null;
    if (this.match(TokenType.OPERATOR, '=')) {
      init = this.parseExpression();
    }
    this.match(TokenType.PUNCTUATION, ';');
    return {
      type: 'VariableDeclaration',
      kind: startToken.value,
      declarations: [{
        type: 'VariableDeclarator',
        id: { type: 'Identifier', value: id.value },
        init
      }],
      start: startToken.start,
      end: init ? init.end : id.end
    };
  }

  parseIfStatement() {
    const startToken = this.expect(TokenType.KEYWORD, 'if');
    this.expect(TokenType.PUNCTUATION, '(');
    const test = this.parseExpression();
    this.expect(TokenType.PUNCTUATION, ')');
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.match(TokenType.KEYWORD, 'else')) {
      alternate = this.parseStatement();
    }
    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
      start: startToken.start,
      end: alternate ? alternate.end : consequent.end
    };
  }

  parseWhileStatement() {
    const startToken = this.expect(TokenType.KEYWORD, 'while');
    this.expect(TokenType.PUNCTUATION, '(');
    const test = this.parseExpression();
    this.expect(TokenType.PUNCTUATION, ')');
    const body = this.parseStatement();
    return {
      type: 'WhileStatement',
      test,
      body,
      start: startToken.start,
      end: body.end
    };
  }

  parseReturnStatement() {
    const startToken = this.expect(TokenType.KEYWORD, 'return');
    let argument = null;
    if (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== ';') {
        argument = this.parseExpression();
    }
    this.match(TokenType.PUNCTUATION, ';');
    return {
      type: 'ReturnStatement',
      argument,
      start: startToken.start,
      end: argument ? argument.end : startToken.end
    };
  }

  parseBlockStatement() {
    const startToken = this.expect(TokenType.PUNCTUATION, '{');
    const body = [];
    while (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== '}') {
        if (this.peek().type === TokenType.EOF) {
            throw new Error('Unexpected EOF in block statement');
        }
        body.push(this.parseStatement());
    }
    const endToken = this.expect(TokenType.PUNCTUATION, '}');
    return {
      type: 'BlockStatement',
      body,
      start: startToken.start,
      end: endToken.end
    };
  }

  parseExpression() {
    return this.parseAssignmentExpression();
  }

  parseAssignmentExpression() {
      let left = this.parseBinaryExpression();
      if (this.match(TokenType.OPERATOR, '=')) {
          const right = this.parseAssignmentExpression();
          return {
              type: 'AssignmentExpression',
              operator: '=',
              left,
              right,
              start: left.start,
              end: right.end
          }
      }
      return left;
  }

  parseBinaryExpression(precedence = 0) {
      let left = this.parseCallExpression();

      while (true) {
          const token = this.peek();
          if (token.type !== TokenType.OPERATOR) break;

          const newPrecedence = this.getPrecedence(token.value);
          if (newPrecedence < precedence) break;

          this.consume(); // consume operator
          const right = this.parseBinaryExpression(newPrecedence + 1);
          left = {
              type: 'BinaryExpression',
              operator: token.value,
              left,
              right,
              start: left.start,
              end: right.end
          };
      }
      return left;
  }

  getPrecedence(op) {
      if (op === '||') return 1;
      if (op === '&&') return 2;
      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) return 3;
      if (['+', '-'].includes(op)) return 4;
      if (['*', '/'].includes(op)) return 5;
      return 0;
  }

  parseCallExpression() {
      let expr = this.parsePrimaryExpression();

      while (this.match(TokenType.PUNCTUATION, '(')) {
          const args = [];
          if (this.peek().type !== TokenType.PUNCTUATION || this.peek().value !== ')') {
              do {
                  args.push(this.parseExpression());
              } while (this.match(TokenType.PUNCTUATION, ','));
          }
          const endToken = this.expect(TokenType.PUNCTUATION, ')');
          expr = {
              type: 'CallExpression',
              callee: expr,
              arguments: args,
              start: expr.start,
              end: endToken.end
          };
      }
      return expr;
  }

  parsePrimaryExpression() {
    const token = this.peek();
    if (token.type === TokenType.NUMBER) {
      this.consume();
      return { type: 'Literal', value: Number(token.value), start: token.start, end: token.end };
    }
    if (token.type === TokenType.STRING) {
      this.consume();
      return { type: 'Literal', value: token.value, start: token.start, end: token.end };
    }
    if (token.type === TokenType.IDENTIFIER) {
      this.consume();
      return { type: 'Identifier', value: token.value, start: token.start, end: token.end };
    }
    if (this.match(TokenType.PUNCTUATION, '(')) {
        const expr = this.parseExpression();
        this.expect(TokenType.PUNCTUATION, ')');
        return expr;
    }
    throw new Error(`Unexpected token: ${token.type} ${token.value} at pos ${token.start}`);
  }
}

// Layout constants
const NODE_SIZE = 40;
const LEVEL_HEIGHT = 80;
const SIBLING_GAP = 20;

function calculateLayout(ast) {
  // Convert AST to a tree structure suitable for layout
  const root = buildTree(ast);

  // First pass: Calculate size of each subtree
  calculateSubtreeWidth(root);

  // Second pass: Assign coordinates
  assignCoordinates(root, 0, 0);

  return root;
}

function buildTree(node) {
  if (!node) return null;

  const treeNode = {
    astNode: node,
    children: [],
    width: 0,
    x: 0,
    y: 0,
    id: Math.random().toString(36).substr(2, 9) // Unique ID for diffing/animations
  };

  // Helper to add children based on node type
  const add = (child, label) => {
    if (child) {
        // If child is array
        if (Array.isArray(child)) {
            child.forEach((c, i) => {
               const childNode = buildTree(c);
               if (childNode) {
                   childNode.label = label ? `${label}[${i}]` : '';
                   treeNode.children.push(childNode);
               }
            });
        } else {
            const childNode = buildTree(child);
            if (childNode) {
                childNode.label = label || '';
                treeNode.children.push(childNode);
            }
        }
    }
  };

  switch (node.type) {
    case 'Program':
      add(node.body);
      break;
    case 'FunctionDeclaration':
      add(node.id, 'id');
      add(node.params, 'params');
      add(node.body, 'body');
      break;
    case 'VariableDeclaration':
      add(node.declarations);
      break;
    case 'VariableDeclarator':
      add(node.id, 'id');
      add(node.init, 'init');
      break;
    case 'IfStatement':
      add(node.test, 'test');
      add(node.consequent, 'then');
      add(node.alternate, 'else');
      break;
    case 'WhileStatement':
      add(node.test, 'test');
      add(node.body, 'body');
      break;
    case 'BlockStatement':
      add(node.body);
      break;
    case 'ReturnStatement':
      add(node.argument);
      break;
    case 'ExpressionStatement':
      add(node.expression);
      break;
    case 'BinaryExpression':
    case 'AssignmentExpression':
      add(node.left, 'left');
      add(node.right, 'right');
      break;
    case 'CallExpression':
      add(node.callee, 'callee');
      add(node.arguments, 'args');
      break;
    case 'Identifier':
    case 'Literal':
      // No children
      break;
    default:
        console.warn('Unhandled node type:', node.type);
  }

  return treeNode;
}

function calculateSubtreeWidth(node) {
  if (!node) return 0;

  if (node.children.length === 0) {
    node.width = NODE_SIZE;
  } else {
    let width = 0;
    node.children.forEach(child => {
      width += calculateSubtreeWidth(child);
    });
    width += (node.children.length - 1) * SIBLING_GAP;
    node.width = Math.max(NODE_SIZE, width);
  }
  return node.width;
}

function assignCoordinates(node, x, y) {
  if (!node) return;

  node.x = x + node.width / 2;
  node.y = y;

  let currentX = x;
  node.children.forEach(child => {
    assignCoordinates(child, currentX, y + LEVEL_HEIGHT);
    currentX += child.width + SIBLING_GAP;
  });
}

// Renderer
let svg;
let zoomGroup;

let codeInput;
let isPanning = false;
let startX = 0, startY = 0;
let translateX = 0;
let translateY = 0;
let scale = 1;

if (typeof window !== 'undefined') {
  svg = document.getElementById('ast-svg');
  zoomGroup = document.getElementById('zoom-group');
  codeInput = document.getElementById('code-input');

  if (codeInput) {
      codeInput.addEventListener('input', debounce(update, 300));
      // Initial render
      update();
  }

  if (svg) {
    svg.addEventListener('mousedown', (e) => {
        if (e.target === svg) { // Only pan if clicking on background
            isPanning = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            svg.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        }
    });

    window.addEventListener('mouseup', () => {
        isPanning = false;
        if (svg) svg.style.cursor = 'grab';
    });

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 4);
        scale = newScale;
        updateTransform();
    });
  }

  const resetBtn = document.getElementById('reset-zoom');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
         translateX = 0;
         translateY = 0;
         scale = 1;
         updateTransform();
    });
  }
}

function updateTransform() {
    if (zoomGroup) {
        zoomGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function update() {
    if (!codeInput) return;
    const code = codeInput.value;
    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    try {
        const ast = parser.parse();
        const layoutRoot = calculateLayout(ast);
        render(layoutRoot);
    } catch (e) {
        console.warn('Parse error:', e.message);
        // We keep the old tree if parsing fails
    }
}

function render(layoutRoot) {
  if (!zoomGroup) return;
  // Clear previous render
  zoomGroup.innerHTML = '';

  if (!layoutRoot) return;

  // Create edges
  renderEdges(layoutRoot);

  // Create nodes
  renderNodes(layoutRoot);
}

function renderEdges(node) {
  if (!node) return;

  node.children.forEach(child => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('class', 'edge');

    // Curved line
    const startX = node.x;
    const startY = node.y + NODE_SIZE/2;
    const endX = child.x;
    const endY = child.y - NODE_SIZE/2;

    const midY = (startY + endY) / 2;

    const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

    line.setAttribute('d', d);
    zoomGroup.appendChild(line);

    renderEdges(child);
  });
}

function renderNodes(node) {
  if (!node) return;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'node');
  g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
  g.dataset.id = node.id;

  // Attach AST data for interaction
  g.dataset.start = node.astNode.start;
  g.dataset.end = node.astNode.end;
  g.dataset.type = node.astNode.type;

  const type = node.astNode.type;
  let label = type;
  if (type === 'Identifier') label = node.astNode.value;
  if (type === 'Literal') label = String(node.astNode.value);
  if (type === 'BinaryExpression') label = node.astNode.operator;

  // Simplify labels for common types
  if (type === 'FunctionDeclaration') label = 'Function';
  if (type === 'VariableDeclaration') label = node.astNode.kind;
  if (type === 'ReturnStatement') label = 'Return';
  if (type === 'IfStatement') label = 'If';
  if (type === 'WhileStatement') label = 'While';
  if (type === 'BlockStatement') label = '{}';
  if (type === 'Program') label = 'Program';

  // Append child index/label if exists
  if (node.label) {
      // label = `${node.label}: ${label}`;
  }

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', -NODE_SIZE);
  rect.setAttribute('y', -NODE_SIZE/2);
  rect.setAttribute('height', NODE_SIZE);
  rect.setAttribute('rx', 5);
  rect.setAttribute('ry', 5);

  // Check if it's a "leaf" in AST terms or value node
  if (['Identifier', 'Literal'].includes(type)) {
      rect.style.stroke = '#f472b6'; // Pink for values
  }

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.textContent = label;
  text.setAttribute('dy', 5);

  // Dynamic width based on text length estimation
  const textLength = label.length * 8;
  const width = Math.max(NODE_SIZE * 2, textLength + 20);
  rect.setAttribute('width', width);
  rect.setAttribute('x', -width / 2);

  g.addEventListener('mouseover', (e) => {
     e.stopPropagation();
     highlightCode(node.astNode.start, node.astNode.end);
     g.classList.add('highlighted');
  });

  g.addEventListener('mouseout', (e) => {
     e.stopPropagation();
     g.classList.remove('highlighted');
  });

  g.appendChild(rect);
  g.appendChild(text);

  zoomGroup.appendChild(g);

  node.children.forEach(child => renderNodes(child));
}

function highlightCode(start, end) {
    if (!codeInput) return;
    codeInput.focus();
    codeInput.setSelectionRange(start, end);
}

// Module export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tokenizer, Parser, TokenType, calculateLayout };
}
