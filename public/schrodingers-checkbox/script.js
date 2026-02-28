class QuantumCheckbox {
  constructor(element) {
    this.element = element;
    this.state = 'superposition'; // 'superposition', 'true', or 'false'
    this.boundCollapse = this.collapse.bind(this);

    // Set initial ARIA state
    this.element.setAttribute('aria-checked', 'mixed');

    // Attach observation event listeners
    this.attachListeners();
  }

  attachListeners() {
    this.element.addEventListener('mouseenter', this.boundCollapse);
    this.element.addEventListener('focus', this.boundCollapse);
    this.element.addEventListener('touchstart', this.boundCollapse, { passive: true });
  }

  removeListeners() {
    this.element.removeEventListener('mouseenter', this.boundCollapse);
    this.element.removeEventListener('focus', this.boundCollapse);
    this.element.removeEventListener('touchstart', this.boundCollapse);
  }

  collapse() {
    if (this.state !== 'superposition') return;

    // Remove event listeners to lock the state
    this.removeListeners();

    // Randomly determine the outcome (50% true, 50% false)
    const outcome = Math.random() >= 0.5;
    this.state = outcome ? 'true' : 'false';

    // Update the DOM to reflect the collapsed state
    this.element.classList.remove('superposition');
    this.element.classList.add(`collapsed-${this.state}`);

    // Update ARIA state
    this.element.setAttribute('aria-checked', this.state);

    // Optional: Add a sound effect or haptic feedback here if desired
    // (Omitted for this implementation as it requires extra assets)

    // Optional: Allow re-entanglement by clicking again?
    // The spec says "until the user specifically focuses their cursor on them, at which point the state collapses randomly into a definitive boolean value."
    // It doesn't specify if it stays collapsed forever or can be toggled.
    // Usually checkboxes can be toggled. Let's make it toggleable after collapse for better UX.
    this.element.addEventListener('click', () => {
       if (this.state === 'superposition') return;

       this.state = this.state === 'true' ? 'false' : 'true';
       this.element.classList.remove('collapsed-true', 'collapsed-false');
       this.element.classList.add(`collapsed-${this.state}`);
       this.element.setAttribute('aria-checked', this.state);
    });
  }
}

// Initialization Logic
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const checkboxElements = document.querySelectorAll('.quantum-checkbox');
    const quantumCheckboxes = [];

    checkboxElements.forEach(element => {
      quantumCheckboxes.push(new QuantumCheckbox(element));
    });
  });
}

// Conditional export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuantumCheckbox };
}
