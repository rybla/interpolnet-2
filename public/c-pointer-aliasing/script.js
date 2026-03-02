document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        memoryValue: 0,
        pointers: [] // Array of { id, element, x, y }
    };
    let pointerCounter = 0;

    // --- DOM Elements ---
    const workspace = document.getElementById('workspace');
    const memoryCell = document.getElementById('memory-cell');
    const mainValueDisplay = document.getElementById('main-value');
    const pointersContainer = document.getElementById('pointers-container');
    const arrowOverlay = document.getElementById('arrow-overlay');
    const addPointerBtn = document.getElementById('add-pointer-btn');
    const codeSnippet = document.getElementById('code-snippet');

    // --- Core Logic ---

    // Update memory value from any source
    function updateMemoryValue(newValue, sourcePointerId = null) {
        // Validation (simple integer)
        let parsed = parseInt(newValue, 10);
        if (isNaN(parsed)) parsed = 0;

        state.memoryValue = parsed;

        // Update central display
        mainValueDisplay.textContent = state.memoryValue;

        // Visual feedback on memory cell
        memoryCell.classList.add('highlight');
        setTimeout(() => memoryCell.classList.remove('highlight'), 200);

        // Update all pointer inputs (except the one that triggered the change, if any)
        state.pointers.forEach(p => {
            const input = p.element.querySelector('.pointer-value-input');
            if (input && p.id !== sourcePointerId) {
                input.value = state.memoryValue;

                // Visual feedback on updated pointers
                p.element.classList.add('highlight');
                setTimeout(() => p.element.classList.remove('highlight'), 200);
            }
        });

        updateCodeSnippet();
    }

    // Create a new pointer card
    function createPointer() {
        pointerCounter++;
        const id = `ptr${pointerCounter}`;

        const card = document.createElement('div');
        card.className = 'pointer-card';
        card.id = id;

        // Initial random position within workspace (avoiding center where memory is)
        const wsRect = workspace.getBoundingClientRect();
        const padding = 50;
        let x = Math.random() * (wsRect.width - 150 - padding*2) + padding;
        let y = Math.random() * (wsRect.height - 100 - padding*2) + padding;

        // Push away from center rough bounding box
        const cx = wsRect.width / 2;
        const cy = wsRect.height / 2;
        if (Math.abs(x - cx) < 150 && Math.abs(y - cy) < 100) {
            y = y < cy ? y - 100 : y + 100;
        }

        card.style.left = `${x}px`;
        card.style.top = `${y}px`;

        card.innerHTML = `
            <div class="pointer-name">*${id}</div>
            <input type="number" class="pointer-value-input" value="${state.memoryValue}" />
        `;

        pointersContainer.appendChild(card);

        // Add SVG path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'pointer-path');
        path.id = `path-${id}`;

        // Ensure path stays within SVG bounds without weird clipping if possible
        arrowOverlay.appendChild(path);

        const pointerObj = { id, element: card, x, y };
        state.pointers.push(pointerObj);

        // Event Listeners for this card
        const input = card.querySelector('.pointer-value-input');
        input.addEventListener('input', (e) => {
            updateMemoryValue(e.target.value, id);
        });

        // Prevent dragging when interacting with input
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('touchstart', e => e.stopPropagation());

        makeDraggable(pointerObj);
        updateCodeSnippet();
    }

    // Make pointer card draggable
    function makeDraggable(pointerObj) {
        const el = pointerObj.element;
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const onDown = (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            isDragging = true;

            // Bring to front
            state.pointers.forEach(p => p.element.style.zIndex = '20');
            el.style.zIndex = '21';

            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            initialX = parseFloat(el.style.left) || 0;
            initialY = parseFloat(el.style.top) || 0;

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        };

        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling on touch

            let currentX, currentY;
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

            const dx = currentX - startX;
            const dy = currentY - startY;

            let newX = initialX + dx;
            let newY = initialY + dy;

            // Bounds check
            const wsRect = workspace.getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, wsRect.width - el.offsetWidth));
            newY = Math.max(0, Math.min(newY, wsRect.height - el.offsetHeight));

            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;

            pointerObj.x = newX;
            pointerObj.y = newY;
        };

        const onUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        el.addEventListener('mousedown', onDown);
        el.addEventListener('touchstart', onDown, { passive: false });
    }

    // --- Rendering / Animation Loop ---

    // Draw SVG arrows from pointers to memory cell
    function drawArrows() {
        const memRect = memoryCell.getBoundingClientRect();
        const wsRect = workspace.getBoundingClientRect();

        // To fix filled black triangles in SVG, make sure fill="none" is strongly applied or set it via attribute

        // Center of memory cell relative to workspace
        const mx = memRect.left - wsRect.left + memRect.width / 2;
        const my = memRect.top - wsRect.top + memRect.height / 2;

        state.pointers.forEach(p => {
            const cardRect = p.element.getBoundingClientRect();
            // Center bottom of pointer card relative to workspace
            const px = cardRect.left - wsRect.left + cardRect.width / 2;
            const py = cardRect.top - wsRect.top + cardRect.height / 2;

            // Draw a smooth bezier curve
            const dx = mx - px;
            const dy = my - py;

            // Control points for curve
            const cp1x = px + dx * 0.5;
            const cp1y = py;
            const cp2x = mx - dx * 0.5;
            const cp2y = my;

            const pathEl = document.getElementById(`path-${p.id}`);
            if (pathEl) {
                pathEl.setAttribute('d', `M ${px} ${py} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${mx} ${my}`);
                pathEl.setAttribute('fill', 'none'); // explicit fill fix
            }
        });

        requestAnimationFrame(drawArrows);
    }

    // --- Code Snippet Generation ---
    function updateCodeSnippet() {
        let code = `<span class="code-type">int</span> main() {\n`;
        code += `    <span class="code-type">int</span> value = <span class="code-number">${state.memoryValue}</span>;\n`;

        state.pointers.forEach(p => {
            code += `    <span class="code-type">int*</span> ${p.id} = &amp;value;\n`;
        });

        if (state.pointers.length > 0) {
            code += `\n    <span class="code-comment">// Any change to *ptr modifies 'value'</span>\n`;
            code += `    <span class="code-comment">// e.g., *${state.pointers[0].id} = ${state.memoryValue};</span>\n`;
        }

        code += `    <span class="code-keyword">return</span> <span class="code-number">0</span>;\n}`;
        codeSnippet.innerHTML = code;
    }

    // --- Initialization ---
    addPointerBtn.addEventListener('click', createPointer);

    // Initial state
    updateMemoryValue(0);
    createPointer(); // Start with one pointer
    createPointer(); // And another for instant aliasing demo

    // Start animation loop
    drawArrows();
});
