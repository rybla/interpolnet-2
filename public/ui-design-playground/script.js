document.addEventListener('DOMContentLoaded', () => {
    // Configuration mapping input IDs to CSS variable names
    const controls = [
        { id: 'color-primary', variable: '--color-primary' },
        { id: 'color-background', variable: '--color-background' },
        { id: 'color-surface', variable: '--color-surface' },
        { id: 'color-text', variable: '--color-text' },
        { id: 'font-size-base', variable: '--font-size-base', unit: 'px', display: true },
        { id: 'font-family', variable: '--font-family' },
        { id: 'spacing-base', variable: '--spacing-base', unit: 'px', display: true },
        { id: 'border-radius', variable: '--border-radius', unit: 'px', display: true },
    ];

    const root = document.documentElement;
    const resetBtn = document.getElementById('reset-btn');

    // Initialize controls
    controls.forEach(config => {
        const input = document.getElementById(config.id);
        if (!input) return;

        // Store default value for reset
        config.defaultValue = input.value;

        // Add event listener
        input.addEventListener('input', (e) => {
            updateVariable(config, e.target.value);
        });
    });

    // Reset button handler
    resetBtn.addEventListener('click', () => {
        controls.forEach(config => {
            const input = document.getElementById(config.id);
            if (!input) return;

            input.value = config.defaultValue;
            updateVariable(config, config.defaultValue);
        });
    });

    function updateVariable(config, value) {
        let cssValue = value;
        if (config.unit) {
            cssValue = `${value}${config.unit}`;
        }

        root.style.setProperty(config.variable, cssValue);

        // Update display value if needed (for range inputs)
        if (config.display) {
            const input = document.getElementById(config.id);
            const displayEl = input.nextElementSibling;
            if (displayEl && displayEl.classList.contains('value-display')) {
                displayEl.textContent = cssValue;
            }
        }
    }
});
