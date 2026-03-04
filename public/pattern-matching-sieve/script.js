document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const sieves = Array.from(document.querySelectorAll('.sieve'));

    const shapes = ['circle', 'square', 'triangle'];
    const colors = ['red', 'blue', 'yellow', 'green', 'purple'];

    let blockCounter = 0;

    // Pattern matching logic
    function isMatch(data, pattern) {
        if (typeof pattern !== 'object' || pattern === null) {
            return data === pattern;
        }
        for (const key in pattern) {
            if (!(key in data)) return false;
            if (typeof pattern[key] === 'object' && pattern[key] !== null) {
                if (!isMatch(data[key], pattern[key])) return false;
            } else if (pattern[key] !== '_' && data[key] !== pattern[key]) {
                return false; // '_' acts as a wildcard, though we might not explicitly define it in JSON
            }
        }
        return true;
    }

    function createDataBlock(data) {
        blockCounter++;
        const el = document.createElement('div');
        el.className = `data-block shape-${data.type} color-${data.color}`;
        el.id = `block-${blockCounter}`;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'data-value';
        valueSpan.textContent = data.value || '';
        el.appendChild(valueSpan);

        // Store data on element for logic
        el.dataset.info = JSON.stringify(data);

        return el;
    }

    function spawnBlock(data) {
        const blockEl = createDataBlock(data);
        dropZone.appendChild(blockEl);

        // Initial position above screen
        blockEl.style.top = '-50px';

        // Start animation sequence
        requestAnimationFrame(() => {
            processBlock(blockEl, data, 0);
        });
    }

    function processBlock(blockEl, data, sieveIndex) {
        if (sieveIndex >= sieves.length) {
            // Fell through everything (shouldn't happen with catch-all, but safe fallback)
            blockEl.remove();
            return;
        }

        const sieveEl = sieves[sieveIndex];
        const pattern = JSON.parse(sieveEl.dataset.pattern || '{}');
        const binEl = sieveEl.nextElementSibling.querySelector('.bin-items');

        // Calculate target Y position to align with sieve hole
        const sieveHole = sieveEl.querySelector('.sieve-hole');
        const holeRect = sieveHole.getBoundingClientRect();
        const dropZoneRect = dropZone.getBoundingClientRect();

        // The Y position relative to the drop zone
        const targetY = holeRect.top - dropZoneRect.top + (holeRect.height / 2) - 20; // 20 is half block height

        // Animate falling to current sieve
        blockEl.style.transform = `translateY(${targetY + 50}px)`; // +50 compensates for initial -50px top

        // Wait for fall animation
        setTimeout(() => {
            // Scanning effect
            sieveEl.classList.add('scanning');

            setTimeout(() => {
                sieveEl.classList.remove('scanning');

                if (isMatch(data, pattern) || Object.keys(pattern).length === 0) {
                    // Match!
                    sieveEl.classList.add('match');
                    blockEl.classList.add('matched');

                    setTimeout(() => {
                        sieveEl.classList.remove('match');
                        // Move to bin visually
                        // We do this by removing it from dropZone and appending to bin
                        blockEl.classList.add('in-bin');
                        binEl.appendChild(blockEl);
                    }, 500);

                } else {
                    // Reject!
                    sieveEl.classList.add('reject');
                    blockEl.classList.add('rejected');

                    setTimeout(() => {
                        sieveEl.classList.remove('reject');
                        blockEl.classList.remove('rejected');
                        // Proceed to next sieve
                        processBlock(blockEl, data, sieveIndex + 1);
                    }, 400); // Wait for shake animation
                }
            }, 500); // Scanning duration
        }, 500); // Fall duration
    }

    // Event Listeners for controls
    document.getElementById('spawn-circle-red').addEventListener('click', () => {
        spawnBlock({ type: 'circle', color: 'red', value: 'A' });
    });

    document.getElementById('spawn-square-blue').addEventListener('click', () => {
        spawnBlock({ type: 'square', color: 'blue', value: 'B' });
    });

    document.getElementById('spawn-triangle-yellow').addEventListener('click', () => {
        spawnBlock({ type: 'triangle', color: 'yellow', value: 'C' });
    });

    document.getElementById('spawn-random').addEventListener('click', () => {
        const type = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const value = Math.floor(Math.random() * 99);
        spawnBlock({ type, color, value });
    });
});