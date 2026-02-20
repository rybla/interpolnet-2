// script.js

// --- Constants & Scenarios ---

const SCENARIOS = {
    SB: {
        name: "Store Buffering (SB)",
        description: "T1 and T2 write to different locations, then read the other's location. Can they both read 0?",
        initMem: { x: 0, y: 0 },
        t1: [
            { type: 'STORE', addr: 'x', val: 1 },
            { type: 'LOAD', reg: 'r1', addr: 'y' }
        ],
        t2: [
            { type: 'STORE', addr: 'y', val: 1 },
            { type: 'LOAD', reg: 'r2', addr: 'x' }
        ],
        isAnomaly: (state) => state.t1.regs.r1 === 0 && state.t2.regs.r2 === 0 && state.t1.pc >= 2 && state.t2.pc >= 2
    },
    MP: {
        name: "Message Passing (MP)",
        description: "T1 writes data (x) then flag (y). T2 reads flag (y) then data (x). If T2 sees flag set, can it see old data?",
        initMem: { x: 0, y: 0 },
        t1: [
            { type: 'STORE', addr: 'x', val: 1 },
            { type: 'STORE', addr: 'y', val: 1 }
        ],
        t2: [
            { type: 'LOAD', reg: 'r1', addr: 'y' },
            { type: 'LOAD', reg: 'r2', addr: 'x' }
        ],
        // Anomaly: r1=1 (saw flag), r2=0 (missed data). Impossible in TSO because Store order is preserved.
        isAnomaly: (state) => state.t2.regs.r1 === 1 && state.t2.regs.r2 === 0 && state.t2.pc >= 2
    },
    LB: {
        name: "Load Buffering (LB)",
        description: "T1 reads x then writes y. T2 reads y then writes x. Can they see each other's writes (cyclic dependency)?",
        initMem: { x: 0, y: 0 },
        t1: [
            { type: 'LOAD', reg: 'r1', addr: 'x' },
            { type: 'STORE', addr: 'y', val: 1 }
        ],
        t2: [
            { type: 'LOAD', reg: 'r2', addr: 'y' },
            { type: 'STORE', addr: 'x', val: 1 }
        ],
        // Anomaly: r1=1, r2=1. Impossible in TSO (no Load reordering).
        isAnomaly: (state) => state.t1.regs.r1 === 1 && state.t2.regs.r2 === 1 && state.t1.pc >= 2 && state.t2.pc >= 2
    }
};

// --- State ---

let currentState = null;
let currentScenarioKey = 'SB';

// --- Initialization ---

function init(scenarioKey) {
    currentScenarioKey = scenarioKey;
    const scenario = SCENARIOS[scenarioKey];

    currentState = {
        mem: { ...scenario.initMem },
        t1: {
            pc: 0,
            regs: { r1: 0 },
            buffer: [],
            instructions: [...scenario.t1]
        },
        t2: {
            pc: 0,
            regs: { r2: 0 }, // Adjust if scenario needs different regs
            buffer: [],
            instructions: [...scenario.t2]
        },
        anomalyDetected: false,
        log: []
    };

    // Normalize registers based on instructions used
    // (Simple heuristic: scan instructions for regs)
    const initRegs = (t, prefix) => {
        const regs = {};
        t.instructions.forEach(instr => {
            if (instr.reg) regs[instr.reg] = 0;
        });
        return regs;
    };

    // Only init regs if not empty, otherwise default to r1/r2
    const t1Regs = initRegs(currentState.t1);
    if (Object.keys(t1Regs).length > 0) currentState.t1.regs = t1Regs;

    const t2Regs = initRegs(currentState.t2);
    if (Object.keys(t2Regs).length > 0) currentState.t2.regs = t2Regs;

    render();
}

// --- Logic ---

function stepThread(tid) {
    const thread = currentState[tid];
    if (thread.pc >= thread.instructions.length) return;

    const instr = thread.instructions[thread.pc];
    thread.pc++;

    if (instr.type === 'STORE') {
        // TSO: Stores go to buffer
        thread.buffer.push({ addr: instr.addr, val: instr.val });
        log(`${tid.toUpperCase()}: Buffered STORE ${instr.addr} = ${instr.val}`);
    } else if (instr.type === 'LOAD') {
        // TSO: Loads check buffer (store-to-load forwarding), then memory
        // Search buffer from newest to oldest
        let val = null;
        for (let i = thread.buffer.length - 1; i >= 0; i--) {
            if (thread.buffer[i].addr === instr.addr) {
                val = thread.buffer[i].val;
                log(`${tid.toUpperCase()}: LOAD ${instr.reg} from Buffer (${instr.addr}) -> ${val}`);
                break;
            }
        }

        if (val === null) {
            val = currentState.mem[instr.addr];
            log(`${tid.toUpperCase()}: LOAD ${instr.reg} from Memory (${instr.addr}) -> ${val}`);
        }

        thread.regs[instr.reg] = val;
    }

    checkAnomaly();
    render();
}

function flushBuffer(tid) {
    const thread = currentState[tid];
    if (thread.buffer.length === 0) return;

    const item = thread.buffer.shift(); // FIFO
    currentState.mem[item.addr] = item.val;
    log(`${tid.toUpperCase()}: Flushed STORE ${item.addr} = ${item.val} to Memory`);

    checkAnomaly();
    render();
}

function checkAnomaly() {
    const scenario = SCENARIOS[currentScenarioKey];
    if (scenario.isAnomaly(currentState)) {
        currentState.anomalyDetected = true;
        log("ANOMALY DETECTED!");
    }
}

function log(msg) {
    currentState.log.push(msg);
    // document.getElementById('status-message').innerText = msg; // Simple display
}

// --- Rendering ---

function render() {
    const s = currentState;

    // Status
    const lastMsg = s.log.length > 0 ? s.log[s.log.length - 1] : "Ready.";
    document.getElementById('status-message').innerText = lastMsg;

    const anomalyEl = document.getElementById('anomaly-indicator');
    if (s.anomalyDetected) {
        anomalyEl.classList.remove('hidden');
    } else {
        anomalyEl.classList.add('hidden');
    }

    // Render Thread 1
    renderThread('t1', s.t1);

    // Render Thread 2
    renderThread('t2', s.t2);

    // Render Memory
    const memContainer = document.getElementById('main-memory');
    memContainer.innerHTML = '';
    for (const [key, val] of Object.entries(s.mem)) {
        const div = document.createElement('div');
        div.className = 'memory-cell';
        div.innerHTML = `<span>${key}</span> <span class="val" style="color:var(--memory-color)">${val}</span>`;
        memContainer.appendChild(div);
    }
}

function renderThread(tid, threadState) {
    // Registers
    const regContainer = document.getElementById(`${tid}-regs`);
    regContainer.innerHTML = '';
    for (const [key, val] of Object.entries(threadState.regs)) {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${key}:</strong> ${val}`;
        regContainer.appendChild(div);
    }

    // Instructions
    const instrContainer = document.getElementById(`${tid}-instructions`);
    instrContainer.innerHTML = '';
    threadState.instructions.forEach((instr, idx) => {
        const div = document.createElement('div');
        div.className = `instruction-item ${idx === threadState.pc ? 'current' : ''} ${idx < threadState.pc ? 'executed' : ''}`;
        if (instr.type === 'STORE') {
            div.innerText = `STORE ${instr.addr} <- ${instr.val}`;
        } else {
            div.innerText = `LOAD ${instr.reg} <- ${instr.addr}`;
        }
        instrContainer.appendChild(div);
    });

    // Buffer
    const bufContainer = document.getElementById(`${tid}-buffer`);
    bufContainer.innerHTML = '';
    threadState.buffer.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'buffer-item';
        div.innerHTML = `<span>${item.addr}</span> <span>${item.val}</span>`;
        bufContainer.appendChild(div);
    });

    // Controls
    const stepBtn = document.getElementById(`${tid}-step`);
    stepBtn.disabled = threadState.pc >= threadState.instructions.length;

    const flushBtn = document.getElementById(`${tid}-flush`);
    flushBtn.disabled = threadState.buffer.length === 0;
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('litmus-select');
    select.addEventListener('change', (e) => {
        init(e.target.value);
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        init(select.value);
    });

    document.getElementById('t1-step').addEventListener('click', () => stepThread('t1'));
    document.getElementById('t1-flush').addEventListener('click', () => flushBuffer('t1'));

    document.getElementById('t2-step').addEventListener('click', () => stepThread('t2'));
    document.getElementById('t2-flush').addEventListener('click', () => flushBuffer('t2'));

    // Initial load
    init('SB');
});
