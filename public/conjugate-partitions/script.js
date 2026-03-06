document.addEventListener('DOMContentLoaded', () => {
    const partitionInput = document.getElementById('partition-input');
    const renderBtn = document.getElementById('render-btn');
    const conjugateBtn = document.getElementById('conjugate-btn');
    const errorMsg = document.getElementById('error-message');
    const gridContainer = document.getElementById('ferrers-grid');

    let currentPartition = [];
    let isConjugated = false;
    let dots = []; // Store references to dot elements

    // Get CSS variables for dynamic sizing
    const getDotSize = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dot-size'));
    const getGridGap = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap'));

    function parseInput(inputStr) {
        // Parse comma-separated numbers
        const parts = inputStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (parts.length === 0) {
            throw new Error("Please enter a partition sequence.");
        }

        const nums = parts.map(p => {
            const num = parseInt(p, 10);
            if (isNaN(num) || num <= 0) {
                throw new Error("Only positive integers are allowed.");
            }
            return num;
        });

        // Check non-increasing
        for (let i = 1; i < nums.length; i++) {
            if (nums[i] > nums[i - 1]) {
                throw new Error("Sequence must be non-increasing.");
            }
        }

        return nums;
    }

    function calculateConjugate(partition) {
        if (!partition || partition.length === 0) return [];

        const conjugate = [];
        const maxVal = partition[0]; // Since it's non-increasing, first is max

        for (let i = 0; i < maxVal; i++) {
            let count = 0;
            for (let j = 0; j < partition.length; j++) {
                if (partition[j] > i) {
                    count++;
                }
            }
            conjugate.push(count);
        }

        return conjugate;
    }

    function renderDiagram(partition) {
        gridContainer.innerHTML = '';
        dots = [];
        isConjugated = false;

        const dotSize = getDotSize();
        const gap = getGridGap();
        const step = dotSize + gap;

        // Calculate container size
        const rows = partition.length;
        const cols = partition.length > 0 ? partition[0] : 0;

        const width = cols * step - gap;
        const height = rows * step - gap;

        gridContainer.style.width = `${width}px`;
        gridContainer.style.height = `${height}px`;

        // Create dots
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < partition[r]; c++) {
                const dot = document.createElement('div');
                dot.className = 'dot';

                // Store base coordinates for animation
                const x = c * step;
                const y = r * step;

                dot.dataset.baseX = x;
                dot.dataset.baseY = y;

                dot.style.transform = `translate(${x}px, ${y}px)`;

                gridContainer.appendChild(dot);
                dots.push({ el: dot, r, c });
            }
        }
    }

    function animateConjugation() {
        if (dots.length === 0) return;

        const dotSize = getDotSize();
        const gap = getGridGap();
        const step = dotSize + gap;

        // Add a pulse effect to the whole grid container
        gridContainer.classList.remove('is-conjugating');
        void gridContainer.offsetWidth; // Trigger reflow
        gridContainer.classList.add('is-conjugating');

        isConjugated = !isConjugated;

        dots.forEach(dotObj => {
            const dot = dotObj.el;
            let targetX, targetY;

            if (isConjugated) {
                // Reflect across main diagonal (swap row and col)
                targetX = dotObj.r * step;
                targetY = dotObj.c * step;
            } else {
                // Return to base
                targetX = parseFloat(dot.dataset.baseX);
                targetY = parseFloat(dot.dataset.baseY);
            }

            // Using transform for smooth transition defined in CSS
            dot.style.transform = `translate(${targetX}px, ${targetY}px)`;
        });

        // Update container bounds to fit the new shape
        const currentPart = isConjugated ? calculateConjugate(currentPartition) : currentPartition;
        const rows = currentPart.length;
        const cols = currentPart.length > 0 ? currentPart[0] : 0;

        const width = cols * step - gap;
        const height = rows * step - gap;

        // Slightly delay container resize so dots don't clip while animating out
        setTimeout(() => {
            gridContainer.style.width = `${width}px`;
            gridContainer.style.height = `${height}px`;
        }, 300); // Halfway through the 0.8s transition
    }

    function handleRender() {
        errorMsg.textContent = '';
        try {
            const inputVal = partitionInput.value;
            currentPartition = parseInput(inputVal);
            renderDiagram(currentPartition);
        } catch (e) {
            errorMsg.textContent = e.message;
        }
    }

    // Event Listeners
    renderBtn.addEventListener('click', handleRender);

    partitionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRender();
        }
    });

    conjugateBtn.addEventListener('click', () => {
        if (currentPartition.length > 0) {
            animateConjugation();
        } else {
            errorMsg.textContent = "Render a partition first.";
        }
    });

    // Handle resize to recalculate dot sizes properly
    window.addEventListener('resize', () => {
        if (currentPartition.length > 0) {
            // Re-render to snap to new responsive variables
            renderDiagram(currentPartition);
            if (isConjugated) {
                // Instantly re-apply conjugation state without animation
                isConjugated = false; // toggle back temporarily
                gridContainer.style.transition = 'none';
                dots.forEach(d => d.el.style.transition = 'none');
                animateConjugation();

                // Restore transitions
                setTimeout(() => {
                    gridContainer.style.transition = '';
                    dots.forEach(d => d.el.style.transition = '');
                }, 50);
            }
        }
    });

    // Initial render
    handleRender();
});
