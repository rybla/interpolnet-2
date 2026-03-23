document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('dither-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('comparison-slider');
    const sliderLine = document.getElementById('slider-line');
    const sliderHandle = document.getElementById('slider-handle');
    const algorithmSelect = document.getElementById('algorithm-select');
    const ditheredLabel = document.getElementById('dithered-label');
    const loadingIndicator = document.getElementById('loading-indicator');

    let originalImageData = null;
    let ditheredImageData = null;
    let imageWidth = 800;
    let imageHeight = 600;

    // Dithering matrices
    const DITHERING_ALGORITHMS = {
        'floyd-steinberg': [
            { x: 1, y: 0, weight: 7 / 16 },
            { x: -1, y: 1, weight: 3 / 16 },
            { x: 0, y: 1, weight: 5 / 16 },
            { x: 1, y: 1, weight: 1 / 16 }
        ],
        'atkinson': [
            { x: 1, y: 0, weight: 1 / 8 },
            { x: 2, y: 0, weight: 1 / 8 },
            { x: -1, y: 1, weight: 1 / 8 },
            { x: 0, y: 1, weight: 1 / 8 },
            { x: 1, y: 1, weight: 1 / 8 },
            { x: 0, y: 2, weight: 1 / 8 }
        ],
        'jarvis-judice-ninke': [
            { x: 1, y: 0, weight: 7 / 48 },
            { x: 2, y: 0, weight: 5 / 48 },
            { x: -2, y: 1, weight: 3 / 48 },
            { x: -1, y: 1, weight: 5 / 48 },
            { x: 0, y: 1, weight: 7 / 48 },
            { x: 1, y: 1, weight: 5 / 48 },
            { x: 2, y: 1, weight: 3 / 48 },
            { x: -2, y: 2, weight: 1 / 48 },
            { x: -1, y: 2, weight: 3 / 48 },
            { x: 0, y: 2, weight: 5 / 48 },
            { x: 1, y: 2, weight: 3 / 48 },
            { x: 2, y: 2, weight: 1 / 48 }
        ],
        'stucki': [
            { x: 1, y: 0, weight: 8 / 42 },
            { x: 2, y: 0, weight: 4 / 42 },
            { x: -2, y: 1, weight: 2 / 42 },
            { x: -1, y: 1, weight: 4 / 42 },
            { x: 0, y: 1, weight: 8 / 42 },
            { x: 1, y: 1, weight: 4 / 42 },
            { x: 2, y: 1, weight: 2 / 42 },
            { x: -2, y: 2, weight: 1 / 42 },
            { x: -1, y: 2, weight: 2 / 42 },
            { x: 0, y: 2, weight: 4 / 42 },
            { x: 1, y: 2, weight: 2 / 42 },
            { x: 2, y: 2, weight: 1 / 42 }
        ]
    };

    function generateTestImage(width, height) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const offCtx = offscreenCanvas.getContext('2d');

        const gradient = offCtx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#888888');
        gradient.addColorStop(1, '#000000');
        offCtx.fillStyle = gradient;
        offCtx.fillRect(0, 0, width, height);

        offCtx.fillStyle = '#cccccc';
        offCtx.beginPath();
        offCtx.arc(width * 0.25, height * 0.25, Math.min(width, height) * 0.15, 0, Math.PI * 2);
        offCtx.fill();

        offCtx.fillStyle = '#333333';
        offCtx.beginPath();
        offCtx.arc(width * 0.75, height * 0.75, Math.min(width, height) * 0.15, 0, Math.PI * 2);
        offCtx.fill();

        const radialGrad = offCtx.createRadialGradient(
            width * 0.75, height * 0.25, 0,
            width * 0.75, height * 0.25, Math.min(width, height) * 0.2
        );
        radialGrad.addColorStop(0, '#ffffff');
        radialGrad.addColorStop(1, '#000000');
        offCtx.fillStyle = radialGrad;
        offCtx.beginPath();
        offCtx.arc(width * 0.75, height * 0.25, Math.min(width, height) * 0.2, 0, Math.PI * 2);
        offCtx.fill();

        offCtx.fillStyle = '#000000';
        offCtx.font = `bold ${Math.floor(height * 0.1)}px sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText('Error Diffusion', width / 2, height / 2);

        // Make grayscale
        const imgData = offCtx.getImageData(0, 0, width, height);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const r = imgData.data[i];
            const g = imgData.data[i+1];
            const b = imgData.data[i+2];
            // Luminosity formula
            const gray = 0.21 * r + 0.72 * g + 0.07 * b;
            imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = gray;
        }

        return imgData;
    }

    function processAlgorithm(algorithmName) {
        return new Promise((resolve) => {
            // Need a slight delay to allow UI to update to loading state
            setTimeout(() => {
                const matrix = DITHERING_ALGORITHMS[algorithmName];
                if (!matrix) return resolve(originalImageData);

                const sourceData = originalImageData;
                const width = sourceData.width;
                const height = sourceData.height;

                // Copy source data into a Float32Array for accumulation
                const floatData = new Float32Array(width * height);
                for (let i = 0; i < width * height; i++) {
                    floatData[i] = sourceData.data[i * 4];
                }

                // Create a new ImageData to hold the result
                const outData = new ImageData(
                    new Uint8ClampedArray(sourceData.data),
                    width,
                    height
                );

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const index = y * width + x;
                        const oldPixel = floatData[index];

                        // Quantize to 1-bit (0 or 255)
                        const newPixel = oldPixel < 128 ? 0 : 255;

                        // Write the final pixel to the output buffer
                        const outIndex = index * 4;
                        outData.data[outIndex] = newPixel;
                        outData.data[outIndex+1] = newPixel;
                        outData.data[outIndex+2] = newPixel;
                        outData.data[outIndex+3] = 255;

                        // Calculate the quantization error
                        const quantError = oldPixel - newPixel;

                        // Diffuse the error
                        for (let i = 0; i < matrix.length; i++) {
                            const nx = x + matrix[i].x;
                            const ny = y + matrix[i].y;

                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIndex = ny * width + nx;
                                floatData[nIndex] += quantError * matrix[i].weight;
                            }
                        }
                    }
                }

                resolve(outData);
            }, 10);
        });
    }

    function renderComparison() {
        if (!originalImageData || !ditheredImageData) return;

        const sliderValue = slider.value / 100;
        const cutoffX = Math.floor(imageWidth * sliderValue);

        // Create a composite ImageData
        const compositeData = new ImageData(imageWidth, imageHeight);

        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
                const index = (y * imageWidth + x) * 4;

                // Original image on left, dithered on right
                if (x < cutoffX) {
                    compositeData.data[index] = originalImageData.data[index];
                    compositeData.data[index+1] = originalImageData.data[index+1];
                    compositeData.data[index+2] = originalImageData.data[index+2];
                    compositeData.data[index+3] = originalImageData.data[index+3];
                } else {
                    compositeData.data[index] = ditheredImageData.data[index];
                    compositeData.data[index+1] = ditheredImageData.data[index+1];
                    compositeData.data[index+2] = ditheredImageData.data[index+2];
                    compositeData.data[index+3] = ditheredImageData.data[index+3];
                }
            }
        }

        ctx.putImageData(compositeData, 0, 0);

        // Update UI elements
        const sliderPercent = slider.value + '%';
        sliderLine.style.left = sliderPercent;
        sliderHandle.style.left = sliderPercent;
    }

    async function handleAlgorithmChange() {
        loadingIndicator.classList.add('active');
        algorithmSelect.disabled = true;
        slider.disabled = true;

        const selectedAlgorithm = algorithmSelect.value;
        const selectedOption = algorithmSelect.options[algorithmSelect.selectedIndex].text;

        ditheredLabel.textContent = selectedOption;

        ditheredImageData = await processAlgorithm(selectedAlgorithm);

        renderComparison();

        loadingIndicator.classList.remove('active');
        algorithmSelect.disabled = false;
        slider.disabled = false;
    }

    function setupEventListeners() {
        algorithmSelect.addEventListener('change', handleAlgorithmChange);
        slider.addEventListener('input', renderComparison);
    }

    async function init() {
        // Set up the canvas dimensions
        canvas.width = imageWidth;
        canvas.height = imageHeight;

        // Generate and store original image data
        originalImageData = generateTestImage(imageWidth, imageHeight);

        setupEventListeners();

        // Process default dithered image
        await handleAlgorithmChange();
    }

    init();
});
