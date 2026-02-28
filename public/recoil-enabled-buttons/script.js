class RecoilManager {
  constructor() {
    this.container = document.getElementById('recoil-container');
    this.buttons = document.querySelectorAll('button');

    if (this.container && this.buttons.length > 0) {
      this.init();
    }
  }

  init() {
    this.buttons.forEach(button => {
      button.addEventListener('click', (e) => this.handleRecoil(e));
    });

    // Remove recovering class when transition ends
    this.container.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform') {
        this.container.classList.remove('recovering');
      }
    });
  }

  handleRecoil(event) {
    if (this.container.classList.contains('cooldown')) return;

    const button = event.currentTarget;
    const forceStr = button.getAttribute('data-recoil-force') || '10';
    let baseForce = parseFloat(forceStr);

    // If there's a yield-payload slider, grab its value to multiply the force
    const payloadInput = document.getElementById('yield-payload');
    if (payloadInput) {
        const multiplier = parseFloat(payloadInput.value) / 50; // Normalize around 50
        baseForce *= (multiplier > 0 ? multiplier : 0.1);
    }

    // Determine kickback parameters
    // We want the window to push backwards (-Z), tilt up (+X), and slightly tilt sideways
    const tz = -baseForce * 15; // Z translation
    const rx = baseForce * 1.5; // X rotation (tilt up)

    // Randomize side-to-side rotation (-1 to 1)
    const randomSide = (Math.random() - 0.5) * 2;
    const ry = baseForce * randomSide * 0.5;

    // Apply instantaneous transform (remove recovery transition)
    this.container.classList.remove('recovering');
    this.container.style.transform = `translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    this.container.classList.add('cooldown');

    // Trigger visual/audio feedback (if any)
    // Could add screen shake to body here if desired

    // Schedule recovery phase
    // Wait a brief moment at max recoil before springing back
    const holdTime = 50 + (baseForce * 2);

    setTimeout(() => {
      this.recover();
    }, holdTime);

    // Calculate total cooldown time based on force
    const cooldownTime = 600 + (baseForce * 20);

    setTimeout(() => {
      this.container.classList.remove('cooldown');
    }, cooldownTime);
  }

  recover() {
    // Add transitioning class and reset transform to 0
    this.container.classList.add('recovering');
    this.container.style.transform = `translateZ(0) rotateX(0) rotateY(0)`;
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new RecoilManager();
  });
}

// Export for potential unit testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RecoilManager };
}
