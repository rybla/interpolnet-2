/**
 * Interactive Regex Engine
 *
 * Implements a basic Regex Parser and NFA Compiler using Thomson's Construction.
 */

// --- AST Nodes ---
class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

class CharNode extends ASTNode {
    constructor(char) {
        super('Char');
        this.char = char;
    }
}

class ConcatNode extends ASTNode {
    constructor(left, right) {
        super('Concat');
        this.left = left;
        this.right = right;
    }
}

class UnionNode extends ASTNode {
    constructor(left, right) {
        super('Union');
        this.left = left;
        this.right = right;
    }
}

class StarNode extends ASTNode {
    constructor(child) {
        super('Star');
        this.child = child;
    }
}

// --- Parser ---
class RegexParser {
    constructor(regex) {
        this.regex = regex;
        this.pos = 0;
    }

    peek() {
        return this.pos < this.regex.length ? this.regex[this.pos] : null;
    }

    consume() {
        return this.pos < this.regex.length ? this.regex[this.pos++] : null;
    }

    parse() {
        if (!this.regex) return new CharNode(''); // Empty regex
        this.pos = 0;
        const ast = this.parseUnion();
        if (this.pos < this.regex.length) {
            throw new Error(`Unexpected character at ${this.pos}: ${this.peek()}`);
        }
        return ast;
    }

    parseUnion() {
        let node = this.parseConcat();
        while (this.peek() === '|') {
            this.consume(); // eat '|'
            const right = this.parseConcat();
            node = new UnionNode(node, right);
        }
        return node;
    }

    parseConcat() {
        let node = this.parseFactor();
        while (this.peek() !== null && this.peek() !== '|' && this.peek() !== ')') {
            const right = this.parseFactor();
            node = new ConcatNode(node, right);
        }
        return node;
    }

    parseFactor() {
        let node = this.parseAtom();
        while (this.peek() === '*') {
            this.consume(); // eat '*'
            node = new StarNode(node);
        }
        return node;
    }

    parseAtom() {
        const char = this.peek();
        if (char === '(') {
            this.consume();
            const node = this.parseUnion();
            if (this.consume() !== ')') {
                throw new Error("Expected ')'");
            }
            return node;
        } else if (char === '\\') {
             this.consume();
             const escaped = this.consume();
             return new CharNode(escaped);
        } else if (char && char !== '|' && char !== '*' && char !== ')') {
            this.consume();
            return new CharNode(char);
        } else {
             throw new Error(`Unexpected character: ${char}`);
        }
    }
}

// --- NFA Structure ---
class State {
    constructor(id) {
        this.id = id;
        this.transitions = []; // Array of { char: string|null, to: State }
        this.isAccepting = false;

        // Visualization properties
        this.x = 0;
        this.y = 0;
    }

    addTransition(char, toState) {
        this.transitions.push({ char, to: toState });
    }
}

class NFA {
    constructor(startState, endState, states, width, height) {
        this.startState = startState;
        this.endState = endState;
        this.states = states;
        this.width = width;
        this.height = height;
    }

    static fromAST(ast) {
        let stateIdCounter = 0;
        const newState = () => new State(stateIdCounter++);

        const NODE_RADIUS = 20;
        const H_SPACING = 60; // Horizontal spacing between nodes
        const V_SPACING = 60; // Vertical spacing between branches

        // Helper to shift a fragment
        const shiftFragment = (fragment, dx, dy) => {
            fragment.nodes.forEach(n => {
                n.x += dx;
                n.y += dy;
            });
        };

        const build = (node) => {
            if (node.type === 'Char') {
                const start = newState();
                const end = newState();
                start.addTransition(node.char, end);

                start.x = 0; start.y = 0;
                end.x = H_SPACING; end.y = 0;

                return {
                    start, end, nodes: [start, end],
                    width: H_SPACING, height: 0,
                    centerY: 0
                };
            }
            else if (node.type === 'Concat') {
                const left = build(node.left);
                const right = build(node.right);

                left.end.addTransition(null, right.start);

                // Align right to follow left
                // Shift right horizontally by left width + spacing
                // Align centerY
                shiftFragment(right, left.width + H_SPACING, left.centerY - right.centerY);

                return {
                    start: left.start,
                    end: right.end,
                    nodes: [...left.nodes, ...right.nodes],
                    width: left.width + H_SPACING + right.width,
                    height: Math.max(left.height, right.height),
                    centerY: left.centerY
                };
            }
            else if (node.type === 'Union') {
                const left = build(node.left);
                const right = build(node.right);
                const start = newState();
                const end = newState();

                start.addTransition(null, left.start);
                start.addTransition(null, right.start);
                left.end.addTransition(null, end);
                right.end.addTransition(null, end);

                // Stack vertically: Left on Top, Right on Bottom
                // Total height roughly left.height + right.height + V_SPACING

                // Shift left up
                const leftShiftY = - (V_SPACING/2 + (left.height || 20)/2);
                shiftFragment(left, H_SPACING, leftShiftY - left.centerY);

                // Shift right down
                const rightShiftY = (V_SPACING/2 + (right.height || 20)/2);
                shiftFragment(right, H_SPACING, rightShiftY - right.centerY);

                const newWidth = Math.max(left.width, right.width) + 2 * H_SPACING;

                start.x = 0; start.y = 0;
                end.x = newWidth; end.y = 0;

                return {
                    start,
                    end,
                    nodes: [start, end, ...left.nodes, ...right.nodes],
                    width: newWidth,
                    height: left.height + right.height + V_SPACING,
                    centerY: 0
                };
            }
            else if (node.type === 'Star') {
                const inner = build(node.child);
                const start = newState();
                const end = newState();

                start.addTransition(null, inner.start);
                inner.end.addTransition(null, inner.start);
                inner.end.addTransition(null, end);
                start.addTransition(null, end);

                shiftFragment(inner, H_SPACING, 0);

                start.x = 0; start.y = 0;
                end.x = inner.width + 2 * H_SPACING; end.y = 0;

                return {
                    start,
                    end,
                    nodes: [start, end, ...inner.nodes],
                    width: inner.width + 2 * H_SPACING,
                    height: inner.height + 60,
                    centerY: 0
                };
            }
            // Fallback for empty/unknown
            return {
                start: newState(), end: newState(), nodes: [], width: 0, height: 0, centerY: 0
            };
        };

        const result = build(ast);
        result.end.isAccepting = true;

        // Center in view (roughly)
        shiftFragment(result, 50, 200);

        return new NFA(result.start, result.end, result.nodes, result.width, result.height);
    }
}

// --- Renderer ---
class Renderer {
    constructor(svgElement) {
        this.svg = svgElement;
    }

    clear() {
        const defs = this.svg.querySelector('defs');
        this.svg.innerHTML = '';
        if (defs) this.svg.appendChild(defs);
    }

    draw(nfa, activeStates) {
        this.clear();

        // Draw Edges first so they are behind nodes
        nfa.states.forEach(state => {
            state.transitions.forEach(trans => {
                this.drawEdge(state, trans.to, trans.char, activeStates && activeStates.has(state) && activeStates.has(trans.to));
            });
        });

        // Draw Nodes
        nfa.states.forEach(state => {
            this.drawNode(state, activeStates && activeStates.has(state));
        });
    }

    drawNode(state, isActive) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `node ${state.isAccepting ? 'accept' : ''} ${state === window.nfa?.startState ? 'start' : ''} ${isActive ? 'active' : ''}`);
        g.setAttribute("transform", `translate(${state.x}, ${state.y})`);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "20");
        g.appendChild(circle);

        if (state.isAccepting) {
            const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            inner.setAttribute("r", "16");
            inner.setAttribute("fill", "none");
            inner.setAttribute("stroke", "currentColor");
            g.appendChild(inner);
        }

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.textContent = state.id;
        g.appendChild(text);

        this.svg.appendChild(g);
    }

    drawEdge(from, to, char, isActive) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `edge ${isActive ? 'active' : ''}`);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        let d = "";
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        if (dx < 0) {
            // Backwards loop
            const h = 60;
            d = `M ${from.x} ${from.y - 20} Q ${from.x + dx/2} ${from.y - 20 - h} ${to.x} ${to.y - 20}`;
        } else if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
             // Self loop
             d = `M ${from.x} ${from.y - 20} C ${from.x - 30} ${from.y - 80}, ${from.x + 30} ${from.y - 80}, ${to.x} ${to.y - 20}`;
        } else {
            // Straight(ish) line
            const angle = Math.atan2(dy, dx);
            const x1 = from.x + Math.cos(angle) * 20;
            const y1 = from.y + Math.sin(angle) * 20;
            const x2 = to.x - Math.cos(angle) * 28; // 20 radius + 8 marker
            const y2 = to.y - Math.sin(angle) * 28;

            d = `M ${x1} ${y1} L ${x2} ${y2}`;
        }

        path.setAttribute("d", d);
        path.setAttribute("marker-end", "url(#arrowhead)");
        g.appendChild(path);

        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let labelX, labelY;

        if (dx < 0) {
             labelX = from.x + dx/2;
             labelY = from.y - 50;
        } else if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
             labelX = from.x;
             labelY = from.y - 85;
        } else {
            labelX = (from.x + to.x) / 2;
            labelY = (from.y + to.y) / 2 - 10;
        }

        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);
        text.textContent = char === null ? "ε" : char;
        g.appendChild(text);

        this.svg.appendChild(g);
    }
}

// --- Simulation ---
class Simulator {
    constructor(nfa) {
        this.nfa = nfa;
        this.currentStates = new Set();
        this.reset();
    }

    reset() {
        this.currentStates.clear();
        const closure = this.epsilonClosure([this.nfa.startState]);
        closure.forEach(s => this.currentStates.add(s));
    }

    epsilonClosure(states) {
        const stack = [...states];
        const closure = new Set(states);

        while (stack.length > 0) {
            const state = stack.pop();
            state.transitions.forEach(trans => {
                if (trans.char === null && !closure.has(trans.to)) {
                    closure.add(trans.to);
                    stack.push(trans.to);
                }
            });
        }
        return closure;
    }

    step(char) {
        const nextStates = new Set();
        this.currentStates.forEach(state => {
            state.transitions.forEach(trans => {
                if (trans.char === char) {
                    nextStates.add(trans.to);
                }
            });
        });

        const closure = this.epsilonClosure([...nextStates]);
        this.currentStates = closure;
    }

    isMatch() {
        for (let s of this.currentStates) {
            if (s.isAccepting) return true;
        }
        return false;
    }
}

// --- Main App ---
let nfa = null;
let simulator = null;
let renderer = null;
let inputString = "";
let inputIndex = 0;
let isPlaying = false;
let playInterval = null;

function init() {
    const svg = document.getElementById('nfa-canvas');
    renderer = new Renderer(svg);

    document.getElementById('btn-compile').addEventListener('click', compileRegex);
    document.getElementById('btn-step').addEventListener('click', step);
    document.getElementById('btn-reset').addEventListener('click', reset);
    document.getElementById('btn-play').addEventListener('click', play);

    // Auto-compile on input with debounce
    let debounceTimer;
    document.getElementById('regex-input').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            compileRegex();
        }, 500);
    });

    // Speed slider listener
    document.getElementById('speed-slider').addEventListener('input', () => {
        if (isPlaying) {
            stopPlay();
            play();
        }
    });

    // Initial compile
    compileRegex();
}

function compileRegex() {
    const regexStr = document.getElementById('regex-input').value;
    try {
        const parser = new RegexParser(regexStr);
        const ast = parser.parse();
        nfa = NFA.fromAST(ast);
        window.nfa = nfa;

        simulator = new Simulator(nfa);
        renderer.draw(nfa, simulator.currentStates);

        updateStatus("Compiled successfully.", false);

        // Reset simulation state if we recompile
        inputIndex = 0;
        stopPlay();
    } catch (e) {
        console.error(e);
        updateStatus("Error: " + e.message, true);
    }
}

function updateStatus(msg, isError) {
    const el = document.getElementById('match-status');
    el.textContent = msg;
    el.style.color = isError ? 'var(--highlight-color)' : 'var(--text-color)';

    const list = document.getElementById('active-states-list');
    if (simulator) {
        const ids = [...simulator.currentStates].map(s => s.id).sort((a,b)=>a-b).join(', ');
        list.textContent = `Active States: {${ids}}`;
    }
}

function reset() {
    stopPlay();
    inputIndex = 0;
    if (simulator) {
        simulator.reset();
        renderer.draw(nfa, simulator.currentStates);
        updateStatus("Ready", false);
    }
}

function step() {
    if (!simulator) return;

    inputString = document.getElementById('string-input').value;
    if (inputIndex >= inputString.length) {
        const match = simulator.isMatch();
        updateStatus(match ? "Match!" : "No Match", !match);
        stopPlay();
        return;
    }

    const char = inputString[inputIndex];
    simulator.step(char);
    inputIndex++;

    renderer.draw(nfa, simulator.currentStates);

    updateStatus(`Consumed '${char}'`, false);

    if (inputIndex >= inputString.length) {
         const match = simulator.isMatch();
        updateStatus(match ? "Match!" : "No Match", !match);
        stopPlay();
    }
}

function play() {
    if (!simulator) return;

    if (isPlaying) {
        stopPlay();
        return;
    }

    // Check if already done
    inputString = document.getElementById('string-input').value;
    if (inputIndex >= inputString.length && inputIndex > 0) {
        // Already finished, do reset first? Or just let user click reset.
        // Let's reset automatically for convenience if at end
        reset();
    }

    isPlaying = true;
    document.getElementById('btn-play').textContent = "Pause";

    const speed = document.getElementById('speed-slider').value;
    // Invert speed: slider value is delay in ms.
    // Slider min=100 (fast), max=2000 (slow).
    playInterval = setInterval(step, parseInt(speed));
}

function stopPlay() {
    isPlaying = false;
    document.getElementById('btn-play').textContent = "Play";
    if (playInterval) clearInterval(playInterval);
    playInterval = null;
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', init);
    window.RegexParser = RegexParser;
    window.NFA = NFA;
}

if (typeof module !== 'undefined') {
    module.exports = { RegexParser, NFA, ASTNode, CharNode, ConcatNode, UnionNode, StarNode };
}
