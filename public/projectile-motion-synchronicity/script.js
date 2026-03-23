document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("simulation-canvas");
  const ctx = canvas.getContext("2d");
  const velocitySlider = document.getElementById("velocity-slider");
  const velocityValue = document.getElementById("velocity-value");
  const gravitySlider = document.getElementById("gravity-slider");
  const gravityValue = document.getElementById("gravity-value");
  const dropBtn = document.getElementById("drop-btn");
  const resetBtn = document.getElementById("reset-btn");

  let animationId = null;
  let isSimulating = false;
  let hasHitGround = false;

  // Simulation physics state
  const state = {
    gravity: parseFloat(gravitySlider.value),
    initialVelocityX: parseFloat(velocitySlider.value),
    floorY: 0,
    ballRadius: 15,
    ball1: { x: 0, y: 0, vx: 0, vy: 0, color: "var(--ball-vertical)", history: [] },
    ball2: { x: 0, y: 0, vx: 0, vy: 0, color: "var(--ball-horizontal)", history: [] },
    lastTime: 0
  };

  // Resize canvas to match display size
  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth - 32; // Account for padding
    canvas.height = parent.clientHeight - 32;
    state.floorY = canvas.height - 40;
    if (!isSimulating && !hasHitGround) {
      resetSimulation();
    } else {
        drawFrame();
    }
  }

  // Calculate CSS variable color
  function getCssColor(varName) {
      const match = varName.match(/var\(([^)]+)\)/);
      if (match) {
          return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
      }
      return varName;
  }

  // Initialize ball starting positions
  function resetSimulation() {
    cancelAnimationFrame(animationId);
    isSimulating = false;
    hasHitGround = false;

    canvas.classList.remove("impact-effect");

    // Start positions
    const startY = 60;
    const startX1 = canvas.width * 0.2;
    const startX2 = canvas.width * 0.2; // Start together

    state.ball1 = {
        x: startX1,
        y: startY,
        vx: 0,
        vy: 0,
        color: getCssColor("var(--ball-vertical)"),
        history: []
    };

    state.ball2 = {
        x: startX2,
        y: startY,
        vx: state.initialVelocityX,
        vy: 0,
        color: getCssColor("var(--ball-horizontal)"),
        history: []
    };

    dropBtn.disabled = false;
    resetBtn.disabled = true;

    drawFrame();
  }

  function startSimulation() {
    if (isSimulating) return;

    isSimulating = true;
    dropBtn.disabled = true;
    resetBtn.disabled = false;
    state.lastTime = performance.now();

    // Set initial horizontal velocity for ball 2 when dropping
    state.ball2.vx = state.initialVelocityX;

    animationLoop(performance.now());
  }

  function animationLoop(currentTime) {
    if (!isSimulating) return;

    // Delta time in seconds (capped to prevent huge jumps if tab inactive)
    let dt = (currentTime - state.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    state.lastTime = currentTime;

    // Physics step: Euler integration
    // Ball 1 (Vertical)
    state.ball1.vy += state.gravity * 100 * dt; // Scale gravity for pixels
    state.ball1.y += state.ball1.vy * dt;

    // Ball 2 (Projectile)
    state.ball2.vy += state.gravity * 100 * dt;
    state.ball2.x += state.ball2.vx * dt;
    state.ball2.y += state.ball2.vy * dt;

    // Record history for trails
    if (currentTime % 2 < 1) { // Throttle history points
        state.ball1.history.push({x: state.ball1.x, y: state.ball1.y});
        state.ball2.history.push({x: state.ball2.x, y: state.ball2.y});
    }

    // Keep history length manageable
    if(state.ball1.history.length > 50) state.ball1.history.shift();
    if(state.ball2.history.length > 50) state.ball2.history.shift();

    // Check collision with floor
    const bottomY = state.floorY - state.ballRadius;
    if (state.ball1.y >= bottomY || state.ball2.y >= bottomY) {
        state.ball1.y = bottomY;
        state.ball2.y = bottomY;

        // Ensure both land at exact same height for visual proof

        isSimulating = false;
        hasHitGround = true;
        canvas.classList.add("impact-effect");

        drawFrame();
        return;
    }

    drawFrame();
    animationId = requestAnimationFrame(animationLoop);
  }

  function drawFrame() {
    // Clear canvas entirely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor
    ctx.fillStyle = getCssColor("var(--floor-color)");
    ctx.fillRect(0, state.floorY, canvas.width, canvas.height - state.floorY);

    // Draw starting platforms
    ctx.fillStyle = "#444c56";
    ctx.fillRect(canvas.width * 0.2 - 25, 55, 50, 5); // Platform

    // Draw Trails
    drawTrail(state.ball1);
    drawTrail(state.ball2);

    // Draw Balls
    drawBall(state.ball1);
    drawBall(state.ball2);
  }

  function drawTrail(ball) {
      if (ball.history.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(ball.history[0].x, ball.history[0].y);
      for(let i=1; i<ball.history.length; i++) {
          ctx.lineTo(ball.history[i].x, ball.history[i].y);
      }

      // Setup gradient for trail fading
      ctx.strokeStyle = ball.color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
  }

  function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, state.ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();

    // Add simple highlight
    ctx.beginPath();
    ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();
    ctx.closePath();
  }

  // Event Listeners
  window.addEventListener("resize", resizeCanvas);

  velocitySlider.addEventListener("input", (e) => {
    state.initialVelocityX = parseFloat(e.target.value);
    velocityValue.textContent = e.target.value;
    if (!isSimulating && !hasHitGround) {
       // Just update reference so trajectory path preview (if added later) works, but not needed now.
    }
  });

  gravitySlider.addEventListener("input", (e) => {
    state.gravity = parseFloat(e.target.value);
    gravityValue.textContent = e.target.value;
  });

  dropBtn.addEventListener("click", startSimulation);
  resetBtn.addEventListener("click", resetSimulation);

  // Initialize
  resizeCanvas();

  // Need a slight delay to ensure CSS variables are applied and canvas is sized correctly
  setTimeout(resizeCanvas, 100);
});
