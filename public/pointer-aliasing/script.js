document.addEventListener('DOMContentLoaded', () => {
    const memoryCell = document.getElementById('memory-cell');
    const cellValueDisplay = document.getElementById('cell-value');
    const inputs = document.querySelectorAll('.pointer-input');
    const svgContainer = document.getElementById('connections');

    // State
    let targetValue = 42;
    let isAnimating = false;

    // Draw SVG Connections
    function drawConnections() {
        svgContainer.innerHTML = ''; // Clear existing
        const containerRect = svgContainer.getBoundingClientRect();
        const memRect = memoryCell.getBoundingClientRect();

        // Calculate center bottom of memory cell relative to SVG container
        const memX = memRect.left + memRect.width / 2 - containerRect.left;
        const memY = memRect.bottom - containerRect.top;

        const blocks = document.querySelectorAll('.pointer-block');
        blocks.forEach((block, index) => {
            const blockRect = block.getBoundingClientRect();

            // Calculate center top of pointer block relative to SVG container
            const pX = blockRect.left + blockRect.width / 2 - containerRect.left;
            const pY = blockRect.top - containerRect.top;

            // Create path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            // Draw a curved line from memory cell bottom to pointer block top
            // Control points pull down and out to create a nice curve
            const curve = `M ${memX} ${memY} C ${memX} ${(memY + pY)/2}, ${pX} ${(memY + pY)/2}, ${pX} ${pY}`;

            path.setAttribute('d', curve);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('id', `path-${index}`);

            svgContainer.appendChild(path);
        });
    }

    // Initial setup
    function setup() {
        // Wait a frame for layout to settle before drawing lines
        requestAnimationFrame(() => {
            drawConnections();
        });

        // Redraw lines on resize
        window.addEventListener('resize', drawConnections);

        // Add listeners to inputs
        inputs.forEach((input, index) => {
            input.addEventListener('change', (e) => {
                handlePointerUpdate(e.target.value, index);
            });

            // Add keydown listener to trigger on Enter
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur(); // Blur triggers change
                }
            });
        });
    }

    function handlePointerUpdate(newValue, sourceIndex) {
        if (isAnimating) return;
        isAnimating = true;

        const parsedValue = parseInt(newValue, 10);

        // Validate input
        if (isNaN(parsedValue)) {
            // Revert back to original value if invalid
            inputs[sourceIndex].value = targetValue;
            isAnimating = false;
            return;
        }

        // 1. Animate data flowing from pointer to memory cell
        const path = document.getElementById(`path-${sourceIndex}`);
        if (path) {
            path.classList.add('line-active');

            // Reverse direction for flow (up to cell)
            path.style.animationDirection = 'reverse';
        }

        // Wait for flow animation to finish (approx 500ms)
        setTimeout(() => {
            // Update actual state
            targetValue = parsedValue;

            // 2. Update memory cell DOM and pulse
            cellValueDisplay.textContent = targetValue;

            memoryCell.classList.remove('active-pulse');
            // Trigger reflow
            void memoryCell.offsetWidth;
            memoryCell.classList.add('active-pulse');

            if (path) {
                path.classList.remove('line-active');
                path.style.animationDirection = '';
            }

            // 3. Update all OTHER pointers and pulse them
            setTimeout(() => {
                const pointerBlocks = document.querySelectorAll('.pointer-block');

                inputs.forEach((input, i) => {
                    input.value = targetValue;

                    // Pulse everyone (including the source to show confirmation)
                    const block = pointerBlocks[i];
                    block.classList.remove('active-pulse');
                    void block.offsetWidth;
                    block.classList.add('active-pulse');

                    // Briefly flash connection line outwards
                    const outPath = document.getElementById(`path-${i}`);
                    if (outPath) {
                        outPath.classList.add('line-active');
                        setTimeout(() => outPath.classList.remove('line-active'), 500);
                    }
                });

                // Allow new interactions
                setTimeout(() => {
                    isAnimating = false;
                }, 500);

            }, 200); // Small delay after memory cell updates

        }, 600); // Delay representing travel time to memory cell
    }

    setup();

    // In order to continuously update lines during float animation, we need a render loop
    function loop() {
        drawConnections();
        requestAnimationFrame(loop);
    }
    loop();
});