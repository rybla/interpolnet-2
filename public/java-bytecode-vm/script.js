/**
 * Java Bytecode VM Simulator
 * Implements a basic stack machine execution model and visualizes it.
 */

// --- Presets (Bytecode Programs) ---
const PRESETS = {
    arithmetic: [
        { pc: 0, op: 'bipush', arg: 10, label: 'Push 10 onto stack' },
        { pc: 2, op: 'bipush', arg: 5, label: 'Push 5 onto stack' },
        { pc: 4, op: 'iadd', arg: null, label: 'Pop two values, push their sum' },
        { pc: 5, op: 'bipush', arg: 3, label: 'Push 3 onto stack' },
        { pc: 7, op: 'imul', arg: null, label: 'Pop two values, push their product' },
        { pc: 8, op: 'istore', arg: 0, label: 'Pop value to local variable 0' },
        { pc: 10, op: 'return', arg: null, label: 'End program' }
    ],
    factorial: [
        { pc: 0, op: 'bipush', arg: 5, label: 'n = 5' },
        { pc: 2, op: 'istore', arg: 0, label: 'Store n in local 0' },
        { pc: 4, op: 'bipush', arg: 1, label: 'result = 1' },
        { pc: 6, op: 'istore', arg: 1, label: 'Store result in local 1' },
        // Loop start
        { pc: 8, op: 'iload', arg: 0, label: 'Load n' },
        { pc: 10, op: 'ifeq', arg: 28, label: 'If n == 0, go to end (pc: 28)' },
        { pc: 13, op: 'iload', arg: 1, label: 'Load result' },
        { pc: 15, op: 'iload', arg: 0, label: 'Load n' },
        { pc: 17, op: 'imul', arg: null, label: 'result * n' },
        { pc: 18, op: 'istore', arg: 1, label: 'result = result * n' },
        { pc: 20, op: 'iload', arg: 0, label: 'Load n' },
        { pc: 22, op: 'bipush', arg: 1, label: 'Push 1' },
        { pc: 24, op: 'isub', arg: null, label: 'n - 1' },
        { pc: 25, op: 'istore', arg: 0, label: 'n = n - 1' },
        { pc: 27, op: 'goto', arg: 8, label: 'Loop back' },
        // End
        { pc: 28, op: 'iload', arg: 1, label: 'Load final result to stack' },
        { pc: 30, op: 'return', arg: null, label: 'End program' }
    ],
    fibonacci: [
        // Fib(n) logic iteratively: n in loc 0, a in loc 1, b in loc 2, i in loc 3
        { pc: 0, op: 'bipush', arg: 6, label: 'n = 6' },
        { pc: 2, op: 'istore', arg: 0, label: 'loc 0 = n' },
        { pc: 4, op: 'bipush', arg: 0, label: 'a = 0' },
        { pc: 6, op: 'istore', arg: 1, label: 'loc 1 = a' },
        { pc: 8, op: 'bipush', arg: 1, label: 'b = 1' },
        { pc: 10, op: 'istore', arg: 2, label: 'loc 2 = b' },
        { pc: 12, op: 'bipush', arg: 1, label: 'i = 1' },
        { pc: 14, op: 'istore', arg: 3, label: 'loc 3 = i' },

        // Loop condition (i < n -> i - n < 0)
        { pc: 16, op: 'iload', arg: 3, label: 'load i' },
        { pc: 18, op: 'iload', arg: 0, label: 'load n' },
        { pc: 20, op: 'if_icmpeq', arg: 40, label: 'if i == n, exit loop' },

        // Loop body
        { pc: 23, op: 'iload', arg: 1, label: 'load a' },
        { pc: 25, op: 'iload', arg: 2, label: 'load b' },
        { pc: 27, op: 'iadd', arg: null, label: 'sum = a + b' },
        { pc: 28, op: 'istore', arg: 4, label: 'temp = sum' },

        { pc: 30, op: 'iload', arg: 2, label: 'load b' },
        { pc: 32, op: 'istore', arg: 1, label: 'a = b' },
        { pc: 34, op: 'iload', arg: 4, label: 'load temp' },
        { pc: 36, op: 'istore', arg: 2, label: 'b = temp' },

        { pc: 38, op: 'iinc', arg: 3, label: 'i++' }, // Increment local 3 by 1 (arg holds index)
        { pc: 39, op: 'goto', arg: 16, label: 'continue loop' },

        // End
        { pc: 40, op: 'iload', arg: 2, label: 'load final b (result)' },
        { pc: 42, op: 'return', arg: null, label: 'end' }
    ],
    conditional: [
        { pc: 0, op: 'bipush', arg: 10, label: 'x = 10' },
        { pc: 2, op: 'istore', arg: 0, label: 'Store x in local 0' },
        { pc: 4, op: 'bipush', arg: 20, label: 'y = 20' },
        { pc: 6, op: 'istore', arg: 1, label: 'Store y in local 1' },

        { pc: 8, op: 'iload', arg: 0, label: 'Load x' },
        { pc: 10, op: 'iload', arg: 1, label: 'Load y' },
        { pc: 12, op: 'if_icmpeq', arg: 22, label: 'if x == y goto 22' },

        // Block: x != y
        { pc: 15, op: 'bipush', arg: 0, label: 'Push 0 (false)' },
        { pc: 17, op: 'istore', arg: 2, label: 'result = 0' },
        { pc: 19, op: 'goto', arg: 26, label: 'goto end' },

        // Block: x == y
        { pc: 22, op: 'bipush', arg: 1, label: 'Push 1 (true)' },
        { pc: 24, op: 'istore', arg: 2, label: 'result = 1' },

        { pc: 26, op: 'iload', arg: 2, label: 'Load result' },
        { pc: 28, op: 'return', arg: null, label: 'Return' }
    ]
};

// --- DOM Elements ---
const dom = {
    instructionList: document.getElementById('instruction-list'),
    stackContainer: document.getElementById('stack-container'),
    localsContainer: document.getElementById('locals-container'),
    animLayer: document.getElementById('animation-layer'),

    presetSelect: document.getElementById('preset-select'),
    btnStep: document.getElementById('btn-step'),
    btnPlay: document.getElementById('btn-play'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    speedSlider: document.getElementById('speed-slider')
};

// --- VM State ---
let vm = {
    pc: 0,              // Program Counter
    stack: [],          // Operand Stack
    locals: Array(5).fill(null), // Local Variables
    program: [],        // Loaded Instructions
    isRunning: false,
    timerId: null,
    speed: 1000,        // Execution speed in ms
    isHalted: false,

    instructionMap: new Map() // Map pc -> index in program array for fast lookup
};

// --- Initialization ---
function init() {
    loadPreset(dom.presetSelect.value);

    // Event Listeners
    dom.presetSelect.addEventListener('change', (e) => loadPreset(e.target.value));
    dom.btnStep.addEventListener('click', stepVM);
    dom.btnPlay.addEventListener('click', playVM);
    dom.btnPause.addEventListener('click', pauseVM);
    dom.btnReset.addEventListener('click', resetVM);

    dom.speedSlider.addEventListener('input', (e) => {
        // Invert slider so right = faster (lower ms)
        vm.speed = parseInt(dom.speedSlider.max) - parseInt(e.target.value) + parseInt(dom.speedSlider.min);
        if (vm.isRunning) {
            pauseVM();
            playVM(); // Restart with new speed
        }
    });
}

function loadPreset(key) {
    pauseVM();
    vm.program = PRESETS[key] || PRESETS.arithmetic;
    vm.instructionMap.clear();
    vm.program.forEach((inst, index) => {
        vm.instructionMap.set(inst.pc, index);
    });
    resetVM();
    renderInstructions();
}

function resetVM() {
    pauseVM();
    vm.pc = vm.program[0].pc;
    vm.stack = [];
    vm.locals = Array(5).fill(null);
    vm.isHalted = false;

    dom.btnStep.disabled = false;
    dom.btnPlay.disabled = false;

    renderStack();
    renderLocals();
    updatePCView();
}

// --- Rendering ---
function renderInstructions() {
    dom.instructionList.innerHTML = '';
    vm.program.forEach(inst => {
        const li = document.createElement('li');
        li.className = 'instruction-line';
        li.id = `inst-${inst.pc}`;

        const pcSpan = document.createElement('span');
        pcSpan.className = 'pc-col';
        pcSpan.textContent = inst.pc;

        const opSpan = document.createElement('span');
        opSpan.className = 'opcode-col';
        opSpan.textContent = inst.op;

        const argSpan = document.createElement('span');
        argSpan.className = 'operand-col';
        argSpan.textContent = inst.arg !== null ? inst.arg : '';

        li.appendChild(pcSpan);
        li.appendChild(opSpan);
        li.appendChild(argSpan);

        // Add hover title for explanation
        li.title = inst.label;

        dom.instructionList.appendChild(li);
    });
}

function updatePCView() {
    // Remove active class from all
    document.querySelectorAll('.instruction-line.active').forEach(el => {
        el.classList.remove('active');
    });

    if (vm.isHalted) return;

    const activeEl = document.getElementById(`inst-${vm.pc}`);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function renderStack() {
    // We only visually render existing stack, new pushes/pops are handled with animations
    dom.stackContainer.innerHTML = '';
    // Reverse order because flex-direction is column-reverse
    vm.stack.slice().reverse().forEach((val, i) => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.textContent = val;
        div.id = `stack-item-${vm.stack.length - 1 - i}`; // Give ID based on logical index
        dom.stackContainer.appendChild(div);
    });
}

function renderLocals() {
    dom.localsContainer.innerHTML = '';
    vm.locals.forEach((val, index) => {
        const div = document.createElement('div');
        div.className = `local-var ${val === null ? 'empty' : ''}`;
        div.id = `local-var-${index}`;

        const idxDiv = document.createElement('div');
        idxDiv.className = 'var-index';
        idxDiv.textContent = index;

        const valDiv = document.createElement('div');
        valDiv.className = 'var-value';
        valDiv.textContent = val !== null ? val : '-';

        div.appendChild(idxDiv);
        div.appendChild(valDiv);
        dom.localsContainer.appendChild(div);
    });
}

// --- Visual Animations ---
function pushStackVisual(value, sourceRect = null) {
    const div = document.createElement('div');
    div.className = 'stack-item entering';
    div.textContent = value;
    div.id = `stack-item-${vm.stack.length - 1}`;

    dom.stackContainer.insertBefore(div, dom.stackContainer.firstChild);

    // Trigger reflow
    void div.offsetWidth;

    // If sourceRect is provided, animate from there
    if (sourceRect) {
        const targetRect = div.getBoundingClientRect();

        // Use animation layer for flying value
        const flyVal = document.createElement('div');
        flyVal.className = 'flying-value';
        flyVal.textContent = value;
        flyVal.style.top = `${sourceRect.top}px`;
        flyVal.style.left = `${sourceRect.left}px`;
        flyVal.style.transitionDuration = `${vm.speed * 0.5}ms`;

        dom.animLayer.appendChild(flyVal);

        // Animate next frame
        requestAnimationFrame(() => {
            flyVal.style.top = `${targetRect.top}px`;
            flyVal.style.left = `${targetRect.left}px`;

            setTimeout(() => {
                if (flyVal.parentNode) flyVal.remove();
                div.classList.remove('entering');
            }, vm.speed * 0.5);
        });
    } else {
        div.classList.remove('entering');
    }
}

function popStackVisual(count = 1, targetRect = null) {
    for (let i = 0; i < count; i++) {
        // The topmost visual item is the first child (due to column-reverse)
        const childIndex = i; // Pop top N elements
        const el = dom.stackContainer.children[childIndex];
        if (el) {
            const val = el.textContent;
            el.classList.add('popping');

            if (targetRect) {
                const sourceRect = el.getBoundingClientRect();
                const flyVal = document.createElement('div');
                flyVal.className = 'flying-value';
                flyVal.textContent = val;
                flyVal.style.top = `${sourceRect.top}px`;
                flyVal.style.left = `${sourceRect.left}px`;
                flyVal.style.transitionDuration = `${vm.speed * 0.5}ms`;

                dom.animLayer.appendChild(flyVal);

                requestAnimationFrame(() => {
                    flyVal.style.top = `${targetRect.top}px`;
                    flyVal.style.left = `${targetRect.left}px`;

                    setTimeout(() => {
                        if (flyVal.parentNode) flyVal.remove();
                    }, vm.speed * 0.5);
                });
            }

            setTimeout(() => {
                if (el.parentNode) el.remove();
            }, 300); // Wait for CSS animation
        }
    }
}

function updateLocalVisual(index, value) {
    const el = document.getElementById(`local-var-${index}`);
    if (el) {
        const valDiv = el.querySelector('.var-value');
        valDiv.textContent = value;
        el.classList.remove('empty');

        // Active highlight animation
        el.classList.remove('highlight-write');
        void el.offsetWidth;
        el.classList.add('highlight-write');
    }
}

function highlightLocalRead(index) {
    const el = document.getElementById(`local-var-${index}`);
    if (el) {
        el.classList.remove('highlight-read');
        void el.offsetWidth;
        el.classList.add('highlight-read');
        return el.getBoundingClientRect();
    }
    return null;
}

// --- Execution Logic ---
function playVM() {
    if (vm.isHalted) return;
    vm.isRunning = true;
    dom.btnPlay.disabled = true;
    dom.btnStep.disabled = true;
    dom.btnPause.disabled = false;

    vm.timerId = setInterval(stepVM, vm.speed);
}

function pauseVM() {
    vm.isRunning = false;
    if (vm.timerId) {
        clearInterval(vm.timerId);
        vm.timerId = null;
    }

    if (!vm.isHalted) {
        dom.btnPlay.disabled = false;
        dom.btnStep.disabled = false;
    }
    dom.btnPause.disabled = true;
}

function stepVM() {
    if (vm.isHalted) return;

    const idx = vm.instructionMap.get(vm.pc);
    if (idx === undefined) {
        console.error("Invalid PC:", vm.pc);
        haltVM();
        return;
    }

    const inst = vm.program[idx];
    const instRect = document.getElementById(`inst-${vm.pc}`)?.getBoundingClientRect();

    let nextPc = inst.pc + (inst.op === 'return' ? 0 : 2); // default increment
    if (inst.op === 'iinc' || inst.op === 'goto' || inst.op.startsWith('if')) {
        nextPc = inst.pc + 3; // roughly correct for bytecode length logic simplification
    }

    let handledNextPc = false;

    // Execute Opcode
    try {
        switch (inst.op) {
            case 'bipush':
                vm.stack.push(inst.arg);
                pushStackVisual(inst.arg, instRect);
                break;

            case 'iload':
                const val = vm.locals[inst.arg];
                if (val === null) throw new Error(`Uninitialized local ${inst.arg}`);
                vm.stack.push(val);
                const localRect = highlightLocalRead(inst.arg);
                pushStackVisual(val, localRect || instRect);
                break;

            case 'istore':
                if (vm.stack.length === 0) throw new Error("Stack underflow");
                const storeVal = vm.stack.pop();
                vm.locals[inst.arg] = storeVal;

                const targetLocalRect = document.getElementById(`local-var-${inst.arg}`)?.getBoundingClientRect();
                popStackVisual(1, targetLocalRect);

                // Delay local update visually to match flying animation
                setTimeout(() => {
                    updateLocalVisual(inst.arg, storeVal);
                }, vm.speed * 0.4);
                break;

            case 'iadd':
            case 'isub':
            case 'imul':
                if (vm.stack.length < 2) throw new Error("Stack underflow");
                const v2 = vm.stack.pop();
                const v1 = vm.stack.pop();
                popStackVisual(2, instRect);

                let res = 0;
                if (inst.op === 'iadd') res = v1 + v2;
                if (inst.op === 'isub') res = v1 - v2;
                if (inst.op === 'imul') res = v1 * v2;

                vm.stack.push(res);
                setTimeout(() => {
                    pushStackVisual(res, instRect);
                }, vm.speed * 0.5); // Push result after pop finishes
                break;

            case 'ifeq':
                if (vm.stack.length === 0) throw new Error("Stack underflow");
                const condVal = vm.stack.pop();
                popStackVisual(1, instRect);
                if (condVal === 0) {
                    nextPc = inst.arg;
                    handledNextPc = true;
                }
                break;

            case 'if_icmpeq':
                if (vm.stack.length < 2) throw new Error("Stack underflow");
                const cv2 = vm.stack.pop();
                const cv1 = vm.stack.pop();
                popStackVisual(2, instRect);
                if (cv1 === cv2) {
                    nextPc = inst.arg;
                    handledNextPc = true;
                }
                break;

            case 'goto':
                nextPc = inst.arg;
                handledNextPc = true;
                break;

            case 'iinc':
                // arg is index, hardcoded +1 for demo simplicity
                vm.locals[inst.arg] += 1;
                updateLocalVisual(inst.arg, vm.locals[inst.arg]);
                break;

            case 'return':
                haltVM();
                handledNextPc = true;
                break;

            default:
                throw new Error(`Unknown opcode ${inst.op}`);
        }

        if (!vm.isHalted) {
            // Find next valid instruction if we didn't explicitly set it via goto/branch
            if (!handledNextPc) {
                // Just find the next instruction in the array
                if (idx + 1 < vm.program.length) {
                    vm.pc = vm.program[idx + 1].pc;
                } else {
                    haltVM();
                }
            } else {
                vm.pc = nextPc;
            }
            updatePCView();
        }

    } catch (e) {
        console.error("VM Error:", e);
        haltVM();
        alert("VM Error: " + e.message);
    }
}

function haltVM() {
    vm.isHalted = true;
    pauseVM();
    dom.btnStep.disabled = true;
    dom.btnPlay.disabled = true;

    // Optional: Flash success
    const activeEl = document.getElementById(`inst-${vm.pc}`);
    if (activeEl) {
        activeEl.style.backgroundColor = 'rgba(76, 175, 80, 0.4)'; // Green finish
        activeEl.style.borderLeftColor = '#4caf50';
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);