document.addEventListener('DOMContentLoaded', () => {
    let instanceIdCounter = 1;
    let isDispatching = false;

    // DOM Elements
    const btnCreateAnimal = document.getElementById('btn-create-animal');
    const btnCreateDog = document.getElementById('btn-create-dog');
    const btnCreateCat = document.getElementById('btn-create-cat');
    const instancesList = document.getElementById('instances-list');
    const logContainer = document.getElementById('log');
    const svgOverlay = document.getElementById('svg-overlay');

    // Event Listeners for instantiation
    btnCreateAnimal.addEventListener('click', () => createInstance('Animal'));
    btnCreateDog.addEventListener('click', () => createInstance('Dog'));
    btnCreateCat.addEventListener('click', () => createInstance('Cat'));

    // Resize observer to clear SVG lines on window resize to prevent misalignment
    window.addEventListener('resize', clearSvgOverlay);

    function createInstance(className) {
        if (isDispatching) return;

        const id = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()}`;

        const instanceCard = document.createElement('div');
        instanceCard.classList.add('instance-card');
        instanceCard.setAttribute('data-type', className);
        instanceCard.id = `inst-${id}`;

        // Define vptr target id based on class name
        const vtableTargetId = `vtable-${className.toLowerCase()}`;

        instanceCard.innerHTML = `
            <div class="instance-header">
                <span class="instance-type">${className} Object</span>
                <span class="instance-id">@${id}</span>
            </div>
            <div class="vptr-field" id="vptr-${id}">vptr -> &${className}::vtable</div>
            <div class="instance-methods">
                <button class="method-btn btn-speak" data-method="speak" data-inst-id="${id}" data-type="${className}">speak()</button>
                <button class="method-btn btn-move" data-method="move" data-inst-id="${id}" data-type="${className}">move()</button>
            </div>
        `;

        instancesList.prepend(instanceCard); // Add to top for visibility

        logMessage(`system`, `Allocated new ${className} instance at ${id}`);

        // Attach listeners to new buttons
        const btnSpeak = instanceCard.querySelector('.btn-speak');
        const btnMove = instanceCard.querySelector('.btn-move');

        btnSpeak.addEventListener('click', (e) => handleMethodCall(e, id, className, 'speak'));
        btnMove.addEventListener('click', (e) => handleMethodCall(e, id, className, 'move'));
    }

    async function handleMethodCall(e, id, className, methodName) {
        if (isDispatching) return;
        isDispatching = true;
        disableAllButtons();

        const btn = e.target;
        const vptrId = `vptr-${id}`;

        // Determine the ID of the vtable and the specific method row in the vtable
        const classLower = className.toLowerCase();
        const vtableId = `vtable-${classLower}`;
        const vtableRowId = `impl-${classLower}-${methodName}`;

        logMessage('system', `> Instance @${id} calls ${methodName}()`);

        try {
            // Step 1: Highlight Button & Draw path from Button to VPTR
            btn.classList.add('active');
            await wait(300);

            // Step 2: Draw path from VPTR to the Class VTable
            logMessage('system', `  1. Dereferencing vptr...`);
            const path1 = drawConnection(vptrId, vtableId);
            await wait(800);

            // Step 3: Highlight the specific VTable row
            logMessage('system', `  2. Looking up ${methodName}() offset in ${className} vtable...`);
            const vtableRow = document.getElementById(vtableRowId);
            vtableRow.classList.add('highlight');

            // Adjust path to point specifically to the row
            path1.remove(); // Remove generic vtable path
            const path2 = drawConnection(vptrId, vtableRowId);
            await wait(1000);

            // Step 4: Execute the resolved method
            const resolvedImpl = vtableRow.querySelector('.method-impl').textContent;
            logMessage('system', `  3. Dispatching call to ${resolvedImpl}`);
            await wait(500);

            // The actual output based on the resolved implementation
            let outputClass = 'animal';
            if (resolvedImpl.startsWith('Dog')) outputClass = 'dog';
            if (resolvedImpl.startsWith('Cat')) outputClass = 'cat';

            const resultMsg = executeMethod(resolvedImpl);
            logMessage(outputClass, `[Output]: ${resultMsg}`);

            await wait(1500); // Hold the visual for a moment

            // Cleanup visuals
            btn.classList.remove('active');
            vtableRow.classList.remove('highlight');
            clearSvgOverlay();

        } catch (err) {
            console.error(err);
        } finally {
            isDispatching = false;
            enableAllButtons();
        }
    }

    function executeMethod(implSignature) {
        switch(implSignature) {
            case 'Animal::speak': return "*generic animal sound*";
            case 'Animal::move':  return "*moves generally*";
            case 'Dog::speak':    return "Woof! Bark!";
            case 'Cat::speak':    return "Meow~ Purr...";
            default: return "???";
        }
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function disableAllButtons() {
        document.querySelectorAll('button').forEach(b => b.disabled = true);
    }

    function enableAllButtons() {
        document.querySelectorAll('button').forEach(b => b.disabled = false);
    }

    function logMessage(type, message) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function drawConnection(fromId, toId) {
        const fromEl = document.getElementById(fromId);
        const toEl = document.getElementById(toId);

        if (!fromEl || !toEl) return null;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        // Compensate for scroll position
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Start point: right center of the 'from' element
        const startX = fromRect.right + scrollX;
        const startY = fromRect.top + fromRect.height / 2 + scrollY;

        // End point: left center of the 'to' element
        const endX = toRect.left + scrollX;
        const endY = toRect.top + toRect.height / 2 + scrollY;

        // Create SVG Path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        // Draw a bezier curve connecting them
        const controlPointX1 = startX + (endX - startX) * 0.5;
        const controlPointY1 = startY;
        const controlPointX2 = endX - (endX - startX) * 0.5;
        const controlPointY2 = endY;

        const d = `M ${startX} ${startY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${endX} ${endY}`;

        path.setAttribute('d', d);
        path.setAttribute('class', 'dispatch-path path-animated');

        // Add a circle at the start and end
        const circleStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleStart.setAttribute('cx', startX);
        circleStart.setAttribute('cy', startY);
        circleStart.setAttribute('r', '4');
        circleStart.setAttribute('class', 'dispatch-circle');

        const circleEnd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleEnd.setAttribute('cx', endX);
        circleEnd.setAttribute('cy', endY);
        circleEnd.setAttribute('r', '4');
        circleEnd.setAttribute('class', 'dispatch-circle');

        // Group them
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.appendChild(path);
        g.appendChild(circleStart);
        g.appendChild(circleEnd);

        svgOverlay.appendChild(g);

        return g; // Return so we can remove it later
    }

    function clearSvgOverlay() {
        while (svgOverlay.firstChild) {
            svgOverlay.removeChild(svgOverlay.firstChild);
        }
    }
});
