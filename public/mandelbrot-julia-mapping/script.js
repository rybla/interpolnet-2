document.addEventListener("DOMContentLoaded", () => {
    const mandelbrotCanvas = document.getElementById("mandelbrot-canvas");
    const juliaCanvas = document.getElementById("julia-canvas");
    const mandelbrotCtx = mandelbrotCanvas.getContext("2d");
    const juliaCtx = juliaCanvas.getContext("2d");

    const coordDisplay = document.getElementById("mandelbrot-coord");
    const crosshair = document.getElementById("crosshair");
    const clickRipple = document.getElementById("click-ripple");
    const loadingIndicator = document.getElementById("loading-indicator");

    const width = mandelbrotCanvas.width;
    const height = mandelbrotCanvas.height;

    // Complex number logic
    const MAX_ITER = 100;

    // Viewport mappings
    const xMin = -2.5, xMax = 1.0;
    const yMin = -1.5, yMax = 1.5;

    const jXMin = -2.0, jXMax = 2.0;
    const jYMin = -2.0, jYMax = 2.0;

    function mapToComplex(x, y, xMin, xMax, yMin, yMax, w, h) {
        const re = xMin + (x / w) * (xMax - xMin);
        const im = yMin + (y / h) * (yMax - yMin);
        return { re, im };
    }

    // Color mapping
    function getColor(iter, maxIter) {
        if (iter === maxIter) return [0, 0, 0, 255];

        const t = iter / maxIter;

        // Neon Cyan to Deep Purple theme
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);

        // Boost cyan presence
        const adjustedR = Math.min(255, r + t * 50);
        const adjustedG = Math.min(255, g + (1 - t) * 150);
        const adjustedB = Math.min(255, b + (1 - t) * 200 + t * 50);

        return [adjustedR, adjustedG, adjustedB, 255];
    }

    // Render Mandelbrot
    function renderMandelbrot() {
        const imgData = mandelbrotCtx.createImageData(width, height);
        const data = imgData.data;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const c = mapToComplex(x, y, xMin, xMax, yMin, yMax, width, height);
                let zRe = 0, zIm = 0;
                let iter = 0;

                while (zRe * zRe + zIm * zIm <= 4 && iter < MAX_ITER) {
                    const zReNew = zRe * zRe - zIm * zIm + c.re;
                    const zImNew = 2 * zRe * zIm + c.im;
                    zRe = zReNew;
                    zIm = zImNew;
                    iter++;
                }

                const color = getColor(iter, MAX_ITER);
                const p = (y * width + x) * 4;
                data[p] = color[0];
                data[p + 1] = color[1];
                data[p + 2] = color[2];
                data[p + 3] = color[3];
            }
        }

        mandelbrotCtx.putImageData(imgData, 0, 0);
    }

    // Render Julia Set
    function renderJulia(cRe, cIm) {
        loadingIndicator.classList.add("active");

        // Use timeout to allow UI to update loading state
        setTimeout(() => {
            const imgData = juliaCtx.createImageData(width, height);
            const data = imgData.data;

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const z = mapToComplex(x, y, jXMin, jXMax, jYMin, jYMax, width, height);
                    let zRe = z.re, zIm = z.im;
                    let iter = 0;

                    while (zRe * zRe + zIm * zIm <= 4 && iter < MAX_ITER) {
                        const zReNew = zRe * zRe - zIm * zIm + cRe;
                        const zImNew = 2 * zRe * zIm + cIm;
                        zRe = zReNew;
                        zIm = zImNew;
                        iter++;
                    }

                    const color = getColor(iter, MAX_ITER);
                    const p = (y * width + x) * 4;
                    data[p] = color[0];
                    data[p + 1] = color[1];
                    data[p + 2] = color[2];
                    data[p + 3] = color[3];
                }
            }

            juliaCtx.putImageData(imgData, 0, 0);
            loadingIndicator.classList.remove("active");
        }, 10);
    }

    // Interaction logic
    mandelbrotCanvas.parentElement.addEventListener("click", (e) => {
        const rect = mandelbrotCanvas.getBoundingClientRect();

        // Calculate relative coordinates
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ensure click is within canvas bounds
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            // Convert to percentages for responsive positioning
            const pctX = (x / rect.width) * 100;
            const pctY = (y / rect.height) * 100;

            // Ripple animation
            clickRipple.style.left = `${pctX}%`;
            clickRipple.style.top = `${pctY}%`;
            clickRipple.classList.remove("animate-ripple");
            void clickRipple.offsetWidth; // trigger reflow
            clickRipple.classList.add("animate-ripple");

            // Move crosshair
            crosshair.style.left = `${pctX}%`;
            crosshair.style.top = `${pctY}%`;
            crosshair.classList.remove("hidden");

            // Map to complex coordinate (using pixel coordinates scaled to canvas resolution)
            const mappedX = (x / rect.width) * width;
            const mappedY = (y / rect.height) * height;
            const c = mapToComplex(mappedX, mappedY, xMin, xMax, yMin, yMax, width, height);

            // Update UI
            const sign = c.im >= 0 ? '+' : '-';
            coordDisplay.innerHTML = `c = ${c.re.toFixed(3)} ${sign} ${Math.abs(c.im).toFixed(3)}i`;

            // Render corresponding Julia set
            renderJulia(c.re, c.im);
        }
    });

    // Initial render
    renderMandelbrot();

    // Initial Julia set (e.g., standard interesting shape)
    const initialC = { re: -0.7, im: 0.27015 };

    // Initial coordinate calculation to place crosshair
    const pctX = ((initialC.re - xMin) / (xMax - xMin)) * 100;
    const pctY = ((initialC.im - yMin) / (yMax - yMin)) * 100;

    crosshair.style.left = `${pctX}%`;
    crosshair.style.top = `${pctY}%`;
    crosshair.classList.remove("hidden");

    const sign = initialC.im >= 0 ? '+' : '-';
    coordDisplay.innerHTML = `c = ${initialC.re.toFixed(3)} ${sign} ${Math.abs(initialC.im).toFixed(3)}i`;

    renderJulia(initialC.re, initialC.im);
});
