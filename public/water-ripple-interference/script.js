const canvas = document.getElementById('simulation');
const ctx = canvas.getContext('2d');

let width, height;
let imageData, data;

const sources = [
  { x: 0, y: 0, frequency: 0.1, amplitude: 50, phase: 0 },
  { x: 0, y: 0, frequency: 0.1, amplitude: 50, phase: 0 },
];

let time = 0;
let isDragging = false;
let draggedSource = null;

const DRAG_RADIUS = 30;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  // Use a lower resolution for the interference calculation to maintain 60fps
  const renderWidth = Math.ceil(width / 2);
  const renderHeight = Math.ceil(height / 2);

  // Create offscreen canvas for rendering
  if (!window.offscreenCanvas) {
    window.offscreenCanvas = document.createElement('canvas');
  }
  window.offscreenCanvas.width = renderWidth;
  window.offscreenCanvas.height = renderHeight;
  window.offscreenCtx = window.offscreenCanvas.getContext('2d');

  imageData = window.offscreenCtx.createImageData(renderWidth, renderHeight);
  data = imageData.data;

  // Initialize sources to center if they haven't been moved
  if (sources[0].x === 0 && sources[0].y === 0) {
    sources[0].x = width / 2 - 100;
    sources[0].y = height / 2;
    sources[1].x = width / 2 + 100;
    sources[1].y = height / 2;
  }
}

window.addEventListener('resize', resize);
resize();

function animate() {
  time += 1;
  const renderWidth = window.offscreenCanvas.width;
  const renderHeight = window.offscreenCanvas.height;

  // Speed of the wave
  const speed = 2.0;
  // Wavelength factor
  const k = 0.05;

  for (let y = 0; y < renderHeight; y++) {
    for (let x = 0; x < renderWidth; x++) {
      let totalDisplacement = 0;

      // Calculate real coordinates based on scale
      const realX = x * 2;
      const realY = y * 2;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const dx = realX - source.x;
        const dy = realY - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simple sine wave: A * sin(k * r - omega * t)
        // Add distance attenuation to make it look a bit more realistic
        const attenuation = 1 / (1 + distance * 0.005);
        totalDisplacement += source.amplitude * attenuation * Math.sin(k * distance - source.frequency * speed * time + source.phase);
      }

      // Map displacement to a color
      // Normalize to 0-1 roughly
      const normalized = (totalDisplacement + 100) / 200;
      const clamped = Math.max(0, Math.min(1, normalized));

      // Color mapping: deep blue to bright cyan/white
      const r = Math.floor(clamped * 0); // 0
      const g = Math.floor(clamped * 255);
      const b = Math.floor(clamped * 255 + (1 - clamped) * 100);

      const index = (y * renderWidth + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255; // Alpha
    }
  }

  window.offscreenCtx.putImageData(imageData, 0, 0);

  // Draw the offscreen canvas to the main canvas, scaling it up
  ctx.drawImage(window.offscreenCanvas, 0, 0, width, height);

  // Draw source indicators
  for (const source of sources) {
    ctx.beginPath();
    ctx.arc(source.x, source.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw a pulsing outer ring
    ctx.beginPath();
    const pulseRadius = 15 + Math.sin(time * 0.1) * 5;
    ctx.arc(source.x, source.y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
    ctx.stroke();
  }

  requestAnimationFrame(animate);
}

animate();

// Interaction
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const pos = getPointerPos(e);
  for (const source of sources) {
    const dx = pos.x - source.x;
    const dy = pos.y - source.y;
    if (Math.sqrt(dx * dx + dy * dy) < DRAG_RADIUS) {
      isDragging = true;
      draggedSource = source;
      canvas.setPointerCapture(e.pointerId);
      break;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (isDragging && draggedSource) {
    const pos = getPointerPos(e);
    draggedSource.x = pos.x;
    draggedSource.y = pos.y;
  }
});

canvas.addEventListener('pointerup', (e) => {
  isDragging = false;
  draggedSource = null;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener('pointercancel', (e) => {
  isDragging = false;
  draggedSource = null;
  canvas.releasePointerCapture(e.pointerId);
});
