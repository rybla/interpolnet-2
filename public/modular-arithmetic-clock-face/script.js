document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("clock-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const container = document.getElementById("canvas-container");

  // Controls
  const modulusInput = document.getElementById("modulus-input");
  const modulusVal = document.getElementById("modulus-val");
  const valueInput = document.getElementById("value-input");
  const valueVal = document.getElementById("value-val");
  const stepInput = document.getElementById("step-input");
  const opAdd = document.getElementById("op-add");
  const opMult = document.getElementById("op-mult");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnReset = document.getElementById("btn-reset");
  const equationDisplay = document.getElementById("equation-display");

  // State
  let config = {
    modulus: parseInt(modulusInput.value),
    value: parseInt(valueInput.value),
    operation: document.querySelector('input[name="operation"]:checked').value,
    stepCount: parseFloat(stepInput.value),
    isPlaying: false
  };

  let animationId;
  let lastTime = 0;
  let cx, cy, radius;
  let lastRenderedConfig = JSON.stringify(config);

  // Resize handling
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    cx = rect.width / 2;
    cy = rect.height / 2;
    radius = Math.min(cx, cy) * 0.75;

    // Force re-render without animation progression if paused
    if (!config.isPlaying) draw(performance.now());
  }

  window.addEventListener("resize", resizeCanvas);

  // Helper function to calculate angle for a given number on the clock
  function getAngle(num) {
    // 0 is at top (-Math.PI / 2), progressing clockwise
    return (num / config.modulus) * Math.PI * 2 - Math.PI / 2;
  }

  // Draw the background grid and clock dial
  function drawBackground(time) {
    // Fill background
    ctx.fillStyle = "#0b0c10"; // Match --bg-color
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Subtle pulsating radial gradient
    const pulse = (Math.sin(time / 1000) + 1) / 2;
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5 + pulse * 20);
    gradient.addColorStop(0, "rgba(31, 40, 51, 0.8)"); // --panel-bg
    gradient.addColorStop(1, "rgba(11, 12, 16, 0.1)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw main clock circle
    ctx.strokeStyle = "#45a29e"; // --secondary-teal
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw nodes and labels
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 16px 'Courier New', monospace";

    for (let i = 0; i < config.modulus; i++) {
      const angle = getAngle(i);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      // Node
      ctx.fillStyle = "#66fcf1"; // --primary-cyan
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      const labelDist = radius + 25;
      const lx = cx + Math.cos(angle) * labelDist;
      const ly = cy + Math.sin(angle) * labelDist;

      // Highlight current base node
      const isBaseNode = i === 0 && config.operation === "add" || (config.operation === "mult" && i === 1 && config.stepCount === 0);

      ctx.fillStyle = isBaseNode ? "#ff007f" : "#c5c6c7"; // --accent-magenta or --text-color
      if (isBaseNode) {
        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 10;
        ctx.font = "bold 20px 'Courier New', monospace";
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.font = "bold 14px 'Courier New', monospace";
      }

      ctx.fillText(i.toString(), lx, ly);
    }
    ctx.shadowBlur = 0;
  }

  // Draw the addition animation
  function drawAddition(time) {
    const currentTotal = config.stepCount * config.value;
    const currentMod = currentTotal % config.modulus;

    equationDisplay.innerHTML = `0 + ${(currentTotal).toFixed(1)} &equiv; ${currentMod.toFixed(1)} (mod ${config.modulus})`;

    // Draw the active arc
    const startAngle = getAngle(0);
    const endAngle = getAngle(currentTotal);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = "#ff007f"; // --accent-magenta
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.shadowColor = "#ff007f";
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Draw active moving node
    const activeX = cx + Math.cos(endAngle) * radius;
    const activeY = cy + Math.sin(endAngle) * radius;

    ctx.beginPath();
    ctx.arc(activeX, activeY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#f2e30f"; // --accent-yellow
    ctx.shadowColor = "#f2e30f";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw the multiplication animation
  function drawMultiplication(time) {
    const steps = Math.floor(config.stepCount);
    const fraction = config.stepCount - steps;

    const currentTotal = config.stepCount * config.value;
    const currentMod = currentTotal % config.modulus;

    equationDisplay.innerHTML = `${(config.stepCount).toFixed(1)} &times; ${config.value} &equiv; ${currentMod.toFixed(1)} (mod ${config.modulus})`;

    ctx.strokeStyle = "rgba(102, 252, 241, 0.5)"; // --primary-cyan with alpha
    ctx.lineWidth = 2;

    // Draw completed lines
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const val = (i * config.value) % config.modulus;
      const angle = getAngle(val);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw the active animated segment
    if (fraction > 0) {
      const prevVal = (steps * config.value) % config.modulus;
      const nextVal = ((steps + 1) * config.value) % config.modulus;

      const prevAngle = getAngle(prevVal);
      const nextAngle = getAngle(nextVal);

      const pX = cx + Math.cos(prevAngle) * radius;
      const pY = cy + Math.sin(prevAngle) * radius;

      const nX = cx + Math.cos(nextAngle) * radius;
      const nY = cy + Math.sin(nextAngle) * radius;

      // Interpolate
      const currX = pX + (nX - pX) * fraction;
      const currY = pY + (nY - pY) * fraction;

      ctx.beginPath();
      ctx.moveTo(pX, pY);
      ctx.lineTo(currX, currY);
      ctx.strokeStyle = "#f2e30f"; // --accent-yellow
      ctx.lineWidth = 4;
      ctx.shadowColor = "#f2e30f";
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Draw active moving node
      ctx.beginPath();
      ctx.arc(currX, currY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ff007f"; // --accent-magenta
      ctx.shadowColor = "#ff007f";
      ctx.shadowBlur = 15;
      ctx.fill();
    } else {
        // Draw active moving node at integer steps
        const prevVal = (steps * config.value) % config.modulus;
        const prevAngle = getAngle(prevVal);
        const pX = cx + Math.cos(prevAngle) * radius;
        const pY = cy + Math.sin(prevAngle) * radius;

        ctx.beginPath();
        ctx.arc(pX, pY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff007f"; // --accent-magenta
        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 15;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Main render loop
  function draw(time) {
    const deltaTime = time - lastTime;
    lastTime = time;

    // Update state if playing
    if (config.isPlaying) {
      config.stepCount += deltaTime / 1000; // 1 step per second
      if (config.stepCount > 100) config.stepCount = 0;
      stepInput.value = config.stepCount;
    }

    drawBackground(time);

    if (config.operation === "add") {
      drawAddition(time);
    } else {
      drawMultiplication(time);
    }

    if (config.isPlaying) {
      animationId = requestAnimationFrame(draw);
    } else {
        // Continue drawing passively even when paused to keep pulse alive, unless dragging slider which triggers draws directly.
        animationId = requestAnimationFrame(draw);
    }
  }

  // Update inputs
  function updateConfig() {
    config.modulus = parseInt(modulusInput.value);
    modulusVal.textContent = config.modulus;

    config.value = parseInt(valueInput.value);
    valueVal.textContent = config.value;

    const selectedOp = document.querySelector('input[name="operation"]:checked').value;
    if (config.operation !== selectedOp) {
        config.operation = selectedOp;
        config.stepCount = 0;
        stepInput.value = 0;
    }

    // If user dragged step slider, update config.
    if (!config.isPlaying) {
        config.stepCount = parseFloat(stepInput.value);
    }

    // Force a draw frame if not playing
    if (!config.isPlaying) {
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(draw);
    }
  }

  // Event Listeners
  modulusInput.addEventListener("input", updateConfig);
  valueInput.addEventListener("input", updateConfig);
  opAdd.addEventListener("change", updateConfig);
  opMult.addEventListener("change", updateConfig);
  stepInput.addEventListener("input", () => {
    config.isPlaying = false;
    btnPlayPause.textContent = "Play";
    updateConfig();
  });

  btnPlayPause.addEventListener("click", () => {
    config.isPlaying = !config.isPlaying;
    btnPlayPause.textContent = config.isPlaying ? "Pause" : "Play";
    if (config.isPlaying) {
      lastTime = performance.now();
    }
  });

  btnReset.addEventListener("click", () => {
    config.stepCount = 0;
    stepInput.value = 0;
    config.isPlaying = false;
    btnPlayPause.textContent = "Play";
    updateConfig();
  });

  // Init
  resizeCanvas();
  lastTime = performance.now();
  animationId = requestAnimationFrame(draw);
});
