// HTML Elements
const canvasOriginal = document.getElementById('canvas-original');
const canvasDithered = document.getElementById('canvas-dithered');
const ctxOriginal = canvasOriginal.getContext('2d', { willReadFrequently: true });
const ctxDithered = canvasDithered.getContext('2d', { willReadFrequently: true });
const algorithmSelect = document.getElementById('algorithm-select');
const splitSlider = document.getElementById('split-slider');
const canvasWrapper = document.getElementById('canvas-wrapper');

// Application State
let image = new Image();
let originalImageData = null;
let currentSliderRatio = 0.5; // 0 to 1
let isDragging = false;
let canvasWidth = 0;
let canvasHeight = 0;
let displayWidth = 0;
let displayHeight = 0;

// Dithering Matrices (Error Diffusion Weights)
// [dx, dy, weight]
const matrices = {
  'floyd-steinberg': {
    divisor: 16,
    weights: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1]
    ]
  },
  'atkinson': {
    divisor: 8,
    weights: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1]
    ]
  },
  'jarvis-judice-ninke': {
    divisor: 48,
    weights: [
      [1, 0, 7],
      [2, 0, 5],
      [-2, 1, 3],
      [-1, 1, 5],
      [0, 1, 7],
      [1, 1, 5],
      [2, 1, 3],
      [-2, 2, 1],
      [-1, 2, 3],
      [0, 2, 5],
      [1, 2, 3],
      [2, 2, 1]
    ]
  }
};

function init() {
  image.crossOrigin = 'Anonymous';
  image.src = 'image.jpg';
  image.onload = () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupInteractions();
    applyDithering();
  };

  algorithmSelect.addEventListener('change', () => {
    applyDithering();
  });
}

init();

function resizeCanvas() {
  const wrapperRect = canvasWrapper.getBoundingClientRect();
  const wrapperWidth = wrapperRect.width;
  const wrapperHeight = wrapperRect.height;

  const imgRatio = image.width / image.height;
  const wrapperRatio = wrapperWidth / wrapperHeight;

  if (wrapperRatio > imgRatio) {
    // Image is taller than wrapper, constrain by height
    displayHeight = wrapperHeight;
    displayWidth = displayHeight * imgRatio;
  } else {
    // Image is wider than wrapper, constrain by width
    displayWidth = wrapperWidth;
    displayHeight = displayWidth / imgRatio;
  }

  // Set internal resolution (high res for dithering algorithm quality)
  // We'll limit internal resolution to prevent massive lag on huge screens
  const maxRes = 1000;
  let scale = 1;
  if (image.width > maxRes || image.height > maxRes) {
      scale = Math.min(maxRes / image.width, maxRes / image.height);
  }

  canvasWidth = Math.floor(image.width * scale);
  canvasHeight = Math.floor(image.height * scale);

  canvasOriginal.width = canvasWidth;
  canvasOriginal.height = canvasHeight;
  canvasDithered.width = canvasWidth;
  canvasDithered.height = canvasHeight;

  // Set CSS display sizes
  canvasOriginal.style.width = `${displayWidth}px`;
  canvasOriginal.style.height = `${displayHeight}px`;
  canvasDithered.style.width = `${displayWidth}px`;
  canvasDithered.style.height = `${displayHeight}px`;

  // Draw original image once
  ctxOriginal.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  originalImageData = ctxOriginal.getImageData(0, 0, canvasWidth, canvasHeight);

  // Initial draw of dithered version
  if (algorithmSelect.value) {
    applyDithering();
  }

  updateSliderPosition();
}

function setupInteractions() {
  const pointerDownHandler = (e) => {
    isDragging = true;
    updateSliderFromEvent(e);
  };

  const pointerMoveHandler = (e) => {
    if (!isDragging) return;
    updateSliderFromEvent(e);
  };

  const pointerUpHandler = () => {
    isDragging = false;
  };

  canvasWrapper.addEventListener('pointerdown', pointerDownHandler);
  window.addEventListener('pointermove', pointerMoveHandler);
  window.addEventListener('pointerup', pointerUpHandler);
}

function updateSliderFromEvent(e) {
  const rect = canvasWrapper.getBoundingClientRect();
  const x = e.clientX - rect.left;

  // Calculate offset relative to the drawn canvas area
  // The canvas is centered in the wrapper
  const leftEdge = (rect.width - displayWidth) / 2;
  const rightEdge = leftEdge + displayWidth;

  // Clamp within the displayed image bounds
  let relativeX = x - leftEdge;
  if (relativeX < 0) relativeX = 0;
  if (relativeX > displayWidth) relativeX = displayWidth;

  currentSliderRatio = relativeX / displayWidth;
  updateSliderPosition();
}

function updateSliderPosition() {
  if (displayWidth === 0) return;

  const rect = canvasWrapper.getBoundingClientRect();
  const leftEdge = (rect.width - displayWidth) / 2;
  const pixelPos = leftEdge + currentSliderRatio * displayWidth;

  splitSlider.style.left = `${pixelPos}px`;
  splitSlider.style.height = `${displayHeight}px`;

  // Apply clip-path to reveal dithered image based on slider position
  // The dithered canvas is positioned absolutely at center
  // Left is dithered, right is original
  // So we clip the right side of the dithered image
  const rightClipPercent = 100 - (currentSliderRatio * 100);
  canvasDithered.style.clipPath = `inset(0 ${rightClipPercent}% 0 0)`;
}

function applyDithering() {
  if (!originalImageData) return;

  const alg = algorithmSelect.value;
  const matrix = matrices[alg];
  if (!matrix) return;

  // Create a copy of the pixel data to work on
  const imgData = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    originalImageData.width,
    originalImageData.height
  );

  const data = imgData.data;
  const w = canvasWidth;
  const h = canvasHeight;

  // Convert to grayscale first for easier 1-bit dithering
  const luma = new Float32Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // standard luminance weights
    luma[i / 4] = r * 0.299 + g * 0.587 + b * 0.114;
  }

  // Error diffusion
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const oldPixel = luma[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      luma[idx] = newPixel;

      const quantError = oldPixel - newPixel;

      // Distribute error
      for (let i = 0; i < matrix.weights.length; i++) {
        const dx = matrix.weights[i][0];
        const dy = matrix.weights[i][1];
        const weight = matrix.weights[i][2];
        const divisor = matrix.divisor;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nIdx = ny * w + nx;
          luma[nIdx] = luma[nIdx] + quantError * (weight / divisor);
        }
      }
    }
  }

  // Write back to RGBA
  for (let i = 0; i < data.length; i += 4) {
    const val = luma[i / 4];
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255; // Fully opaque
  }

  ctxDithered.putImageData(imgData, 0, 0);
}
