document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('pipes-svg');
  const networkContainer = document.getElementById('network-container');
  const valves = document.querySelectorAll('.valve');
  const components = document.querySelectorAll('.component');

  // Track the state of services (flowing or not)
  const serviceState = {
    database: false,
    logger: false,
    auth: false
  };

  // Define connections (from Output Port to Input Port)
  const connections = [
    { from: 'db-out', to: 'db-in-1', service: 'database', colorVar: '--fluid-db' },
    { from: 'db-out', to: 'db-in-2', service: 'database', colorVar: '--fluid-db' },
    { from: 'log-out', to: 'log-in-1', service: 'logger', colorVar: '--fluid-log' },
    { from: 'auth-out', to: 'auth-in-1', service: 'auth', colorVar: '--fluid-auth' }
  ];

  // Store created SVG paths
  const pipePaths = [];

  // Function to calculate SVG path between two elements
  function calculatePath(startEl, endEl) {
    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    const containerRect = svg.getBoundingClientRect();

    // Calculate center points relative to the SVG container
    const startX = startRect.left + startRect.width / 2 - containerRect.left;
    const startY = startRect.top + startRect.height / 2 - containerRect.top;

    // Adjust logic for input ports: if it's mobile, input ports are on top; otherwise left.
    // However, given the layout, we can just take the center of the input port.
    const endX = endRect.left + endRect.width / 2 - containerRect.left;
    const endY = endRect.top + endRect.height / 2 - containerRect.top;

    // Create a smooth cubic bezier curve
    // Control points to create horizontal exit and entry
    const controlPointOffsetX = Math.abs(endX - startX) * 0.5;
    const cp1x = startX + controlPointOffsetX;
    const cp1y = startY;
    const cp2x = endX - controlPointOffsetX;
    const cp2y = endY;

    // If mobile layout (vertical), use vertical control points
    if (window.innerWidth <= 768) {
        const controlPointOffsetY = Math.abs(endY - startY) * 0.5;
        return `M ${startX} ${startY} C ${startX} ${startY + controlPointOffsetY}, ${endX} ${endY - controlPointOffsetY}, ${endX} ${endY}`;
    }

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }

  // Draw pipes initially
  function drawPipes() {
    // Clear existing pipes
    svg.innerHTML = '';
    pipePaths.length = 0;

    connections.forEach(conn => {
      const startEl = document.querySelector(`[data-port="${conn.from}"]`);
      const endEl = document.querySelector(`[data-port="${conn.to}"]`);

      if (!startEl || !endEl) return;

      const pathData = calculatePath(startEl, endEl);

      // 1. Create Base Pipe (Background)
      const basePipe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      basePipe.setAttribute("d", pathData);
      basePipe.setAttribute("class", "pipe-base");
      svg.appendChild(basePipe);

      // 2. Create Fluid Pipe (Animated stroke)
      const fluidPipe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      fluidPipe.setAttribute("d", pathData);
      fluidPipe.setAttribute("class", `pipe-fluid pipe-fluid-${conn.service}`);

      // Get computed color for stroke
      const computedStyle = getComputedStyle(document.documentElement);
      const fluidColor = computedStyle.getPropertyValue(conn.colorVar).trim();
      fluidPipe.setAttribute("stroke", fluidColor);

      svg.appendChild(fluidPipe);

      pipePaths.push({
        fluidPipe: fluidPipe,
        service: conn.service,
        endEl: endEl,
        slotClass: conn.service === 'database' ? 'db-slot' : (conn.service === 'logger' ? 'log-slot' : 'auth-slot')
      });
    });

    // Re-apply flow state
    updatePipesFlow();
  }

  // Redraw pipes on window resize
  window.addEventListener('resize', drawPipes);

  // Update pipe animations based on valve state
  function updatePipesFlow() {
    pipePaths.forEach(pipe => {
      if (serviceState[pipe.service]) {
        pipe.fluidPipe.classList.add('flowing');
        pipe.endEl.classList.add('filled', pipe.slotClass);
      } else {
        pipe.fluidPipe.classList.remove('flowing');
        pipe.endEl.classList.remove('filled', pipe.slotClass);
      }
    });

    checkComponentsReady();
  }

  // Check if components have their dependencies
  function checkComponentsReady() {
    components.forEach(component => {
      const requiresStr = component.getAttribute('data-requires');
      if (!requiresStr) return;

      const requires = requiresStr.split(',');
      let isReady = true;

      requires.forEach(req => {
        if (!serviceState[req]) {
          isReady = false;
        }
      });

      const bodyText = component.querySelector('.component-body p');

      if (isReady) {
        component.classList.add('ready');
        bodyText.textContent = "Dependencies satisfied. Operational.";
      } else {
        component.classList.remove('ready');
        bodyText.textContent = "Waiting for dependencies...";
      }
    });
  }

  // Handle Valve Clicks
  valves.forEach(valve => {
    valve.addEventListener('click', () => {
      const service = valve.getAttribute('data-valve-for');
      const isOpen = valve.classList.toggle('open');

      serviceState[service] = isOpen;

      // Accessibility update
      valve.setAttribute('aria-expanded', isOpen);

      updatePipesFlow();
    });
  });

  // Initial draw
  // Need a slight delay to ensure fonts/layout are fully rendered before calculating coordinates
  setTimeout(drawPipes, 100);
});