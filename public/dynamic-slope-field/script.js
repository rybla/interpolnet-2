document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const input = document.getElementById('equation-input');
  const errorMsg = document.getElementById('error-message');

  let width, height;

  // Math space setup: we'll show x in [-xRange, xRange] approximately
  let xRange = 10;
  let yRange = 10;

  let gridPoints = []; // Stores the points where we draw the slope segments
  let particles = [];

  // Colors
  const colors = ['#00ffcc', '#ff00ff', '#ffea00', '#00e5ff'];

  // The current evaluated function
  let currentFunc = (x, y) => Math.sin(x) * y;

  // Resize canvas
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Maintain aspect ratio for coordinates
    const aspect = width / height;
    if (width > height) {
      xRange = 10;
      yRange = 10 / aspect;
    } else {
      yRange = 10;
      xRange = 10 * aspect;
    }

    initGrid();
  }

  // Map screen coordinates to math coordinates
  function toMathX(sx) {
    return (sx / width) * 2 * xRange - xRange;
  }

  function toMathY(sy) {
    return -((sy / height) * 2 * yRange - yRange);
  }

  // Map math coordinates to screen coordinates
  function toScreenX(mx) {
    return ((mx + xRange) / (2 * xRange)) * width;
  }

  function toScreenY(my) {
    return ((-my + yRange) / (2 * yRange)) * height;
  }

  // Compile the user's string into a function safely
  function compileFunction(str) {
    try {
      // Very basic security to prevent arbitrary non-math code
      // We wrap the input to just return the evaluated math expression
      // Expose Math variables for easy typing
      const funcBody = `
        with(Math) {
          return ${str};
        }
      `;
      const fn = new Function('x', 'y', funcBody);
      // Test the function
      fn(1, 1);

      currentFunc = fn;
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
    } catch (e) {
      errorMsg.textContent = 'Invalid equation.';
      errorMsg.classList.add('visible');
    }
  }

  // Initialize the grid points for the slope field
  function initGrid() {
    gridPoints = [];
    // Spacing between grid lines
    const spacing = 40;

    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        gridPoints.push({
          sx: x,
          sy: y,
          mx: toMathX(x),
          my: toMathY(y)
        });
      }
    }
  }

  // Draw the background slope field
  function drawSlopeField() {
    ctx.lineWidth = 1.5;

    const maxSlope = 5; // Used for color mapping

    for (const pt of gridPoints) {
      let slope;
      try {
        slope = currentFunc(pt.mx, pt.my);
      } catch (e) {
        continue; // Skip invalid math like divide by zero
      }

      if (!isFinite(slope)) continue;

      // Calculate length and direction
      // segment length
      const len = 15;

      // direction vector
      const dx = 1;
      const dy = slope;

      const norm = Math.sqrt(dx*dx + dy*dy);

      // normalize and scale to screen pixel length
      // Because y goes down on screen, we invert dy for the drawing
      const sx_dir = (dx / norm) * len;
      const sy_dir = (-dy / norm) * len;

      // Color based on steepness
      const magnitude = Math.abs(slope);
      const intensity = Math.min(magnitude / maxSlope, 1);

      // Interpolate from a dim blue to a brighter cyan/magenta based on slope
      const r = Math.floor(11 + intensity * (0 - 11)); // from #0b to something else
      const g = Math.floor(15 + intensity * (255 - 15));
      const b = Math.floor(25 + intensity * (204 - 25));

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.4})`;

      ctx.beginPath();
      ctx.moveTo(pt.sx - sx_dir/2, pt.sy - sy_dir/2);
      ctx.lineTo(pt.sx + sx_dir/2, pt.sy + sy_dir/2);
      ctx.stroke();
    }
  }

  // Add a new particle at screen coordinates
  function addParticle(sx, sy) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push({
      x: toMathX(sx),
      y: toMathY(sy),
      color: color,
      age: 0,
      maxAge: 300 // Number of steps it will live
    });
  }

  // Handle input events
  input.addEventListener('input', (e) => {
    compileFunction(e.target.value);
    // Let the animation loop handle the redraw to avoid stuttering
  });

  // Handle pointer events
  let isPointerDown = false;
  canvas.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    addParticle(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (isPointerDown) {
      // Don't add too many, space them out or just rely on rate
      if (Math.random() < 0.3) {
        addParticle(e.clientX, e.clientY);
      }
    }
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
  });

  window.addEventListener('resize', resize);

  // Initial setup
  resize();
  compileFunction(input.value);

  let lastTime = performance.now();

  // Simulation loop
  function animate(time) {
    const dtStr = time - lastTime;
    lastTime = time;

    // We want a constant step size for math numerical stability,
    // not strictly tied to frame delta, but for visuals we'll use a small fixed dt
    const math_dt = 0.02;

    // Fade out previous frame slightly for a trail effect
    ctx.fillStyle = 'rgba(11, 15, 25, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Redraw field
    drawSlopeField();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.age++;
      if (p.age > p.maxAge) {
        particles.splice(i, 1);
        continue;
      }

      let slope;
      try {
        slope = currentFunc(p.x, p.y);
      } catch (e) {
        particles.splice(i, 1);
        continue;
      }

      if (!isFinite(slope)) {
        particles.splice(i, 1);
        continue;
      }

      // Euler's method for moving the particle
      const nextX = p.x + math_dt;
      const nextY = p.y + slope * math_dt;

      const screenOldX = toScreenX(p.x);
      const screenOldY = toScreenY(p.y);
      const screenNewX = toScreenX(nextX);
      const screenNewY = toScreenY(nextY);

      // Draw line segment
      ctx.beginPath();
      ctx.moveTo(screenOldX, screenOldY);
      ctx.lineTo(screenNewX, screenNewY);

      // Fade out as it ages
      const opacity = 1 - (p.age / p.maxAge);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      p.x = nextX;
      p.y = nextY;

      // Remove if it goes out of bounds
      if (p.x < -xRange || p.x > xRange || p.y < -yRange || p.y > yRange) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});