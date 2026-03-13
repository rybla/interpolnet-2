const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let imageData, data;

const config = {
  frequency: 1,
  amplitude: 50,
  separation: 100,
  time: 0,
  speed: 0.1,
  resolution: 2, // Decrease resolution for better performance, increase for sharper look
};

const sources = [
  { x: 0, y: 0, active: true },
  { x: 0, y: 0, active: true }
];

let isDragging = false;
let draggedSource = null;

// UI Elements
const freqInput = document.getElementById('frequency');
const ampInput = document.getElementById('amplitude');
const sepInput = document.getElementById('separation');

const freqVal = document.getElementById('frequency-val');
const ampVal = document.getElementById('amplitude-val');
const sepVal = document.getElementById('separation-val');

function updateUI() {
  freqVal.textContent = config.frequency.toFixed(1);
  ampVal.textContent = config.amplitude.toString();
  sepVal.textContent = config.separation.toString();
}

function updateSourcesFromSeparation() {
  if (isDragging) return; // Don't override manual drags

  const cx = width / 2;
  const cy = height / 2;
  sources[0].x = cx - config.separation;
  sources[0].y = cy;
  sources[1].x = cx + config.separation;
  sources[1].y = cy;
}

freqInput.addEventListener('input', (e) => {
  config.frequency = parseFloat(e.target.value);
  updateUI();
});

ampInput.addEventListener('input', (e) => {
  config.amplitude = parseFloat(e.target.value);
  updateUI();
});

sepInput.addEventListener('input', (e) => {
  config.separation = parseFloat(e.target.value);
  updateSourcesFromSeparation();
  updateUI();
});

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Re-create ImageData on resize
  // We use a lower resolution buffer for performance and scale it up
  const resW = Math.ceil(width / config.resolution);
  const resH = Math.ceil(height / config.resolution);

  // If we change resolution, we need to handle it properly, but here we just keep it simple
  imageData = ctx.createImageData(resW, resH);
  data = imageData.data;

  updateSourcesFromSeparation();
}

window.addEventListener('resize', resize);
resize();


// Interaction
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Find closest source
  let closestDist = Infinity;
  let closestIdx = -1;

  sources.forEach((s, idx) => {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < 40 && d < closestDist) { // 40px hit radius
      closestDist = d;
      closestIdx = idx;
    }
  });

  if (closestIdx !== -1) {
    isDragging = true;
    draggedSource = sources[closestIdx];
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDragging && draggedSource) {
    draggedSource.x = x;
    draggedSource.y = y;

    // Update separation slider based on manual distance
    const d = Math.hypot(sources[0].x - sources[1].x, sources[0].y - sources[1].y);
    config.separation = Math.round(d / 2);
    sepInput.value = config.separation;
    updateUI();
  } else {
    // Hover effect
    let hovering = false;
    sources.forEach(s => {
      if (Math.hypot(s.x - x, s.y - y) < 40) hovering = true;
    });
    canvas.style.cursor = hovering ? 'grab' : 'default';
  }
});

canvas.addEventListener('pointerup', () => {
  isDragging = false;
  draggedSource = null;
  canvas.style.cursor = 'default';
});

// Main render loop
function render() {
  config.time += config.speed * config.frequency;

  const resW = imageData.width;
  const resH = imageData.height;
  const res = config.resolution;

  const s0x = sources[0].x / res;
  const s0y = sources[0].y / res;
  const s1x = sources[1].x / res;
  const s1y = sources[1].y / res;

  const k = 0.1; // wavenumber
  const w = config.time; // angular freq * time

  let i = 0;
  for (let y = 0; y < resH; y++) {
    for (let x = 0; x < resW; x++) {

      let h = 0;

      // Calculate interference directly
      const d1 = Math.hypot(x - s0x, y - s0y);
      h += Math.sin(k * d1 - w);

      const d2 = Math.hypot(x - s1x, y - s1y);
      h += Math.sin(k * d2 - w);

      // Normalize to roughly -1 to 1 (max is roughly 2, so div by 2)
      h = h / 2;

      // Calculate color
      // Map -1 to 1 to color

      // Base color: #0b0f19 (rgb 11, 15, 25)
      // Peak color: #00ffff (rgb 0, 255, 255)
      // Trough color: #000000 (rgb 0, 0, 0)

      let r, g, b;

      if (h > 0) {
        // Constructive peak (light blue/cyan)
        r = 11 + (0 - 11) * h * (config.amplitude / 100);
        g = 15 + (255 - 15) * h * (config.amplitude / 100);
        b = 25 + (255 - 25) * h * (config.amplitude / 100);
      } else {
        // Destructive trough (dark)
        h = Math.abs(h);
        r = 11 - 11 * h * (config.amplitude / 100);
        g = 15 - 15 * h * (config.amplitude / 100);
        b = 25 - 25 * h * (config.amplitude / 100);
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
      data[i+3] = 255; // Alpha

      i += 4;
    }
  }

  // Draw the image data scaled up to full canvas size
  // Create a temporary canvas to hold the image data and scale it
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = resW;
  tempCanvas.height = resH;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);

  ctx.save();
  // Disable smoothing for sharp pixels if desired, but smoothing looks more like water
  // ctx.imageSmoothingEnabled = false;
  ctx.scale(res, res);
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  // Draw markers for sources
  sources.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  requestAnimationFrame(render);
}

// Start loop
render();
