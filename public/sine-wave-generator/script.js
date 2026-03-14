const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

let width, height;
let cx, cy;
let radius;
let waveStartX;
let waveData = [];
let angle = 0;
let speed = 0.02;

// Resize canvas to fill container
function resize() {
  const container = canvas.parentElement;
  width = container.clientWidth;
  height = container.clientHeight;
  canvas.width = width;
  canvas.height = height;

  // Layout calculations
  const isMobile = width < 768;
  if (isMobile) {
    radius = Math.min(width * 0.3, height * 0.15);
    cx = width / 2;
    cy = height * 0.25;
    waveStartX = 0; // The wave will start from the top and go down
  } else {
    radius = Math.min(width * 0.15, height * 0.3);
    cx = width * 0.25;
    cy = height / 2;
    waveStartX = width * 0.5;
  }
}

window.addEventListener('resize', resize);

// Input handling
speedSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  speedValue.textContent = val.toFixed(1);
  speed = val * 0.02; // Base speed factor
});

function draw() {
  ctx.clearRect(0, 0, width, height);

  const isMobile = width < 768;

  // Calculate current point on the circle
  const px = cx + radius * Math.cos(angle);
  const py = cy + radius * Math.sin(angle);

  // Store wave data
  waveData.unshift(radius * Math.sin(angle));

  // Truncate wave data to fit canvas
  const maxWavePoints = isMobile ? height - cy : width - waveStartX;
  if (waveData.length > maxWavePoints) {
    waveData.pop();
  }

  // --- Draw Circle / Wheel ---

  // Axes
  ctx.beginPath();
  ctx.strokeStyle = '#374151'; // --border-color
  ctx.lineWidth = 1;
  ctx.moveTo(cx - radius - 10, cy);
  ctx.lineTo(cx + radius + 10, cy);
  ctx.moveTo(cx, cy - radius - 10);
  ctx.lineTo(cx, cy + radius + 10);
  ctx.stroke();

  // The Circle
  ctx.beginPath();
  ctx.strokeStyle = '#9ca3af'; // --text-secondary
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Radius Line
  ctx.beginPath();
  ctx.strokeStyle = '#f3f4f6'; // --text-primary
  ctx.lineWidth = 2;
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.stroke();

  // Rotating Point
  ctx.beginPath();
  ctx.fillStyle = '#06b6d4'; // --accent-cyan
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();

  // Highlight the y-component (sine) on the circle
  ctx.beginPath();
  ctx.strokeStyle = '#ec4899'; // --accent-magenta
  ctx.lineWidth = 3;
  ctx.moveTo(px, cy);
  ctx.lineTo(px, py);
  ctx.stroke();


  // --- Draw Wave Graph ---

  // Wave Axis
  ctx.beginPath();
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  if (isMobile) {
    // Vertical axis for mobile
    ctx.moveTo(cx, cy + radius + 20);
    ctx.lineTo(cx, height);
    ctx.stroke();
  } else {
    // Horizontal axis for desktop
    ctx.moveTo(waveStartX, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();
  }

  // The Sine Wave
  ctx.beginPath();
  ctx.strokeStyle = '#ec4899'; // --accent-magenta
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  for (let i = 0; i < waveData.length; i++) {
    const yVal = waveData[i];
    if (isMobile) {
      // Wave propagates downwards
      const waveY = cy + radius + 20 + i;
      const waveX = cx + yVal;
      if (i === 0) ctx.moveTo(waveX, waveY);
      else ctx.lineTo(waveX, waveY);
    } else {
      // Wave propagates rightwards
      const waveX = waveStartX + i;
      const waveY = cy + yVal;
      if (i === 0) ctx.moveTo(waveX, waveY);
      else ctx.lineTo(waveX, waveY);
    }
  }
  ctx.stroke();

  // --- Draw Connecting Link ---
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // --accent-cyan with opacity
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  if (isMobile && waveData.length > 0) {
    // Connect point to the start of the wave (top)
    const startWaveY = cy + radius + 20;
    const startWaveX = cx + waveData[0];
    ctx.moveTo(px, py);
    ctx.lineTo(startWaveX, startWaveY);
  } else if (!isMobile && waveData.length > 0) {
     // Connect point to the start of the wave (left edge of graph)
    const startWaveX = waveStartX;
    const startWaveY = cy + waveData[0];
    ctx.moveTo(px, py);
    ctx.lineTo(startWaveX, startWaveY);
  }
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Leading point on the wave
  if (waveData.length > 0) {
    ctx.beginPath();
    ctx.fillStyle = '#ec4899'; // --accent-magenta
    if (isMobile) {
        ctx.arc(cx + waveData[0], cy + radius + 20, 6, 0, Math.PI * 2);
    } else {
        ctx.arc(waveStartX, cy + waveData[0], 6, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Update logic for next frame
  angle -= speed; // Negative speed so it rotates counter-clockwise naturally mapping to standard Cartesian quadrants if we consider positive Y down on canvas.
  // Actually, standard math is counter-clockwise.
  // Canvas Y is down.
  // If angle increases, it goes clockwise.
  // If angle decreases, it goes counter-clockwise.
  // Let's make it increase so it goes clockwise for now, or decrease for CCW.
  // We'll use negative speed to make it go CCW which looks standard.
  if (angle < -Math.PI * 2) {
      angle += Math.PI * 2;
  }

  requestAnimationFrame(draw);
}

// Initialize
resize();
requestAnimationFrame(draw);
