// State initialization
let inputA = 0 >>> 0; // Ensure 32-bit unsigned
let inputB = 0 >>> 0;

// Set initial arbitrary values for demonstration
inputA = 2863311530 >>> 0; // 1010...1010
inputB = 1431655765 >>> 0; // 0101...0101

// Configuration
const BITS = 32;

// Elements
const domRegisters = {
    inputA: document.getElementById('inputA-register'),
    inputB: document.getElementById('inputB-register'),
    and: document.getElementById('out-and-register'),
    or: document.getElementById('out-or-register'),
    xor: document.getElementById('out-xor-register'),
    not: document.getElementById('out-not-register'),
    lshift: document.getElementById('out-lshift-register'),
    rshift: document.getElementById('out-rshift-register'),
    urshift: document.getElementById('out-urshift-register'),
};

const domDecimals = {
    inputA: document.getElementById('inputA-dec'),
    inputB: document.getElementById('inputB-dec'),
    and: document.getElementById('out-and-dec'),
    or: document.getElementById('out-or-dec'),
    xor: document.getElementById('out-xor-dec'),
    not: document.getElementById('out-not-dec'),
    lshift: document.getElementById('out-lshift-dec'),
    rshift: document.getElementById('out-rshift-dec'),
    urshift: document.getElementById('out-urshift-dec'),
};

// Initialize UI
function initialize() {
    createBits(domRegisters.inputA, 'A', true);
    createBits(domRegisters.inputB, 'B', true);
    createBits(domRegisters.and, 'AND', false);
    createBits(domRegisters.or, 'OR', false);
    createBits(domRegisters.xor, 'XOR', false);
    createBits(domRegisters.not, 'NOT', false);
    createBits(domRegisters.lshift, 'LSHIFT', false);
    createBits(domRegisters.rshift, 'RSHIFT', false);
    createBits(domRegisters.urshift, 'URSHIFT', false);

    updateAll();
}

// Create bit elements
function createBits(container, prefix, interactive) {
    container.innerHTML = '';
    for (let i = BITS - 1; i >= 0; i--) {
        const bit = document.createElement('div');
        bit.classList.add('bit');
        bit.dataset.index = i;

        if (i % 8 === 0 && i !== 0) {
            // Optional: add visual separation for bytes here if desired by tweaking css
        }

        // Add index label for every 4th bit
        if (i % 4 === 0) {
            const label = document.createElement('div');
            label.classList.add('bit-label');
            label.textContent = i;
            bit.appendChild(label);
        }

        if (interactive) {
            bit.addEventListener('click', () => toggleBit(prefix, i, bit));
        }

        container.appendChild(bit);
    }
}

// Toggle a specific bit
function toggleBit(inputName, bitIndex, element) {
    if (inputName === 'A') {
        inputA ^= (1 << bitIndex);
        inputA = inputA >>> 0; // force unsigned
    } else if (inputName === 'B') {
        inputB ^= (1 << bitIndex);
        inputB = inputB >>> 0; // force unsigned
    }

    // Add interaction animation
    element.classList.remove('changed');
    void element.offsetWidth; // trigger reflow
    element.classList.add('changed');

    updateAll();
}

// Update all logic gates and visual representations
function updateAll() {
    // Computations
    const resAnd = (inputA & inputB) >>> 0;
    const resOr = (inputA | inputB) >>> 0;
    const resXor = (inputA ^ inputB) >>> 0;
    const resNot = (~inputA) >>> 0;

    // JS bitwise shift operators treat operands as 32-bit signed ints
    // Left shift
    const shiftAmt = inputB & 0x1F; // lower 5 bits
    const resLshift = (inputA << shiftAmt) >>> 0;

    // Signed right shift
    const resRshift = (inputA >> shiftAmt); // Keeps sign bit, might not be purely unsigned logic, but standard JS behavior. Convert to uint for display consistency if desired, but signed right shift implies signedness. We'll leave it as is but parse bits correctly.

    // Unsigned right shift
    const resUrshift = (inputA >>> shiftAmt) >>> 0;

    // Update Decimals
    domDecimals.inputA.textContent = inputA;
    domDecimals.inputB.textContent = inputB;
    domDecimals.and.textContent = resAnd;
    domDecimals.or.textContent = resOr;
    domDecimals.xor.textContent = resXor;
    domDecimals.not.textContent = resNot;
    domDecimals.lshift.textContent = resLshift;
    domDecimals.rshift.textContent = resRshift;
    domDecimals.urshift.textContent = resUrshift;

    // Update bit visuals
    renderBits(domRegisters.inputA, inputA);
    renderBits(domRegisters.inputB, inputB);
    renderBits(domRegisters.and, resAnd);
    renderBits(domRegisters.or, resOr);
    renderBits(domRegisters.xor, resXor);
    renderBits(domRegisters.not, resNot);
    renderBits(domRegisters.lshift, resLshift);
    renderBits(domRegisters.rshift, resRshift);
    renderBits(domRegisters.urshift, resUrshift);
}

// Visually update the DOM nodes for a specific 32-bit number
function renderBits(container, value) {
    const bits = container.children;
    for (let i = 0; i < BITS; i++) {
        // children are ordered from MSB to LSB (index 31 down to 0)
        const bitIndex = BITS - 1 - i;
        const bitElement = bits[i];

        // Extract the bit value
        // Note: For signed right shift result, value might be negative,
        // using >>> 1 to walk through bits avoids sign extension issues during extraction
        const isSet = ((value >>> bitIndex) & 1) === 1;

        if (isSet) {
            bitElement.classList.add('active');
        } else {
            bitElement.classList.remove('active');
        }
    }
}

// Start
initialize();
