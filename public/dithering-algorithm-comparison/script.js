const canvas = document.getElementById('dither-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const slider = document.getElementById('split-slider');
const form = document.getElementById('algorithm-form');
const descriptionBox = document.querySelector('#alg-description p');

const WIDTH = 800;
const HEIGHT = 600;

// Algorithm descriptions
const descriptions = {
  threshold: "Threshold dithering simply rounds each pixel to the nearest black or white value based on a fixed threshold (e.g., 128). It is fast but produces harsh results with strong banding and loss of detail.",
  random: "Random dithering adds white noise to each pixel before applying a threshold. This breaks up the banding seen in simple thresholding but results in a very grainy, 'sandy' appearance.",
  bayer: "Bayer (Ordered) dithering uses a fixed matrix of thresholds applied in a repeating pattern across the image. It produces a distinct crosshatch or checkerboard pattern and is historically common in early graphics systems.",
  floyd: "Floyd-Steinberg is an error-diffusion algorithm. When a pixel is quantized, the quantization error is distributed to neighboring pixels (right, down-left, down, down-right) using specific weights. It produces smooth gradients and high perceived detail.",
  atkinson: "Atkinson dithering is a variation of error-diffusion developed by Bill Atkinson at Apple for the original Macintosh. It only diffuses 3/4 of the error, reducing contrast slightly but keeping details sharp and producing less 'worm-like' artifacts than Floyd-Steinberg."
};

// State
let originalImageData = null;
let ditheredImageData = null;
let currentAlgorithm = 'threshold';
let splitPosition = 0.5;

// Generate a procedural test image
function generateProceduralImage() {
  const offscreen = document.createElement('canvas');
  offscreen.width = WIDTH;
  offscreen.height = HEIGHT;
  const octx = offscreen.getContext('2d');

  // Background gradient
  const grad1 = octx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad1.addColorStop(0, '#000000');
  grad1.addColorStop(1, '#ffffff');
  octx.fillStyle = grad1;
  octx.fillRect(0, 0, WIDTH, HEIGHT);

  // Smooth radial gradient in the center
  const radial = octx.createRadialGradient(WIDTH/2, HEIGHT/2, 10, WIDTH/2, HEIGHT/2, 250);
  radial.addColorStop(0, '#ffffff');
  radial.addColorStop(0.5, '#777777');
  radial.addColorStop(1, '#000000');
  octx.fillStyle = radial;
  octx.beginPath();
  octx.arc(WIDTH/2, HEIGHT/2, 250, 0, Math.PI*2);
  octx.fill();

  // Add some geometric shapes with different shades
  octx.fillStyle = '#333333';
  octx.fillRect(50, 50, 100, 100);

  octx.fillStyle = '#cccccc';
  octx.beginPath();
  octx.arc(100, HEIGHT - 100, 50, 0, Math.PI*2);
  octx.fill();

  octx.fillStyle = '#888888';
  octx.beginPath();
  octx.moveTo(WIDTH - 50, 50);
  octx.lineTo(WIDTH - 150, 150);
  octx.lineTo(WIDTH - 50, 150);
  octx.fill();

  // Add some text
  octx.fillStyle = '#ffffff';
  octx.font = 'bold 48px sans-serif';
  octx.textAlign = 'center';
  octx.fillText('DITHERING TEST', WIDTH/2, HEIGHT/2 - 20);

  octx.fillStyle = '#000000';
  octx.font = '24px sans-serif';
  octx.fillText('Smooth Gradients', WIDTH/2, HEIGHT/2 + 30);

  return octx.getImageData(0, 0, WIDTH, HEIGHT);
}

// Helper to convert RGB to Grayscale
function getGrayscaleData(imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

// Dithering Algorithms
function applyThreshold(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const color = data[i] < 128 ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = color;
  }
  return imageData;
}

function applyRandom(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() * 255);
    const color = data[i] < noise ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = color;
  }
  return imageData;
}

function applyBayer(imageData) {
  const bayerMatrix = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5]
  ];
  const matrixSize = 4;
  const factor = 255 / 16;
  const width = imageData.width;
  const data = imageData.data;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const threshold = bayerMatrix[y % matrixSize][x % matrixSize] * factor;
      const color = data[idx] < threshold ? 0 : 255;
      data[idx] = data[idx+1] = data[idx+2] = color;
    }
  }
  return imageData;
}

function applyErrorDiffusion(imageData, algorithm) {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Float32Array(imageData.data); // Use float array to avoid clamping during math
  const output = new Uint8ClampedArray(imageData.data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldPixel = data[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;

      output[idx] = output[idx+1] = output[idx+2] = newPixel;
      output[idx+3] = 255; // Alpha

      const quantError = oldPixel - newPixel;

      // Distribute error
      if (algorithm === 'floyd') {
        if (x + 1 < width) data[idx + 4] += quantError * 7 / 16;
        if (y + 1 < height) {
          if (x - 1 >= 0) data[idx + width * 4 - 4] += quantError * 3 / 16;
          data[idx + width * 4] += quantError * 5 / 16;
          if (x + 1 < width) data[idx + width * 4 + 4] += quantError * 1 / 16;
        }
      } else if (algorithm === 'atkinson') {
        const err8 = quantError / 8;
        if (x + 1 < width) data[idx + 4] += err8;
        if (x + 2 < width) data[idx + 8] += err8;
        if (y + 1 < height) {
          if (x - 1 >= 0) data[idx + width * 4 - 4] += err8;
          data[idx + width * 4] += err8;
          if (x + 1 < width) data[idx + width * 4 + 4] += err8;
        }
        if (y + 2 < height) {
          data[idx + width * 8] += err8;
        }
      }
    }
  }
  return new ImageData(output, width, height);
}

// Processing
function processImage() {
  // Clone the original grayscale image for processing
  const imgDataCopy = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    originalImageData.width,
    originalImageData.height
  );

  switch (currentAlgorithm) {
    case 'threshold':
      ditheredImageData = applyThreshold(imgDataCopy);
      break;
    case 'random':
      ditheredImageData = applyRandom(imgDataCopy);
      break;
    case 'bayer':
      ditheredImageData = applyBayer(imgDataCopy);
      break;
    case 'floyd':
    case 'atkinson':
      ditheredImageData = applyErrorDiffusion(imgDataCopy, currentAlgorithm);
      break;
  }
  render();
}

// Render the split view
function render() {
  if (!originalImageData || !ditheredImageData) return;

  const splitX = Math.floor(splitPosition * WIDTH);

  // Draw Dithered on the right (and underneath)
  ctx.putImageData(ditheredImageData, 0, 0);

  // Draw Original on the left using the dirty rectangle parameters
  // putImageData(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
  if (splitX > 0) {
    ctx.putImageData(originalImageData, 0, 0, 0, 0, splitX, HEIGHT);
  }
}

// Event Listeners
slider.addEventListener('input', (e) => {
  splitPosition = e.target.value / 100;
  render();
});

form.addEventListener('change', (e) => {
  currentAlgorithm = e.target.value;
  descriptionBox.textContent = descriptions[currentAlgorithm];
  processImage();
});

// Init
function init() {
  const colorData = generateProceduralImage();
  originalImageData = getGrayscaleData(colorData);
  processImage();
}

init();
