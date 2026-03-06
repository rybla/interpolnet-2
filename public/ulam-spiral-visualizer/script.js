document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('spiral-canvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const coeffAInput = document.getElementById('coeff-a');
    const coeffBInput = document.getElementById('coeff-b');
    const coeffCInput = document.getElementById('coeff-c');
    const zoomSlider = document.getElementById('zoom-slider');

    const valADisplay = document.getElementById('val-a');
    const valBDisplay = document.getElementById('val-b');
    const valCDisplay = document.getElementById('val-c');

    const displayA = document.getElementById('display-a');
    const displayB = document.getElementById('display-b');
    const displayC = document.getElementById('display-c');

    const rangeDisplay = document.getElementById('range-display');
    const matchDisplay = document.getElementById('prime-match-display');

    // State
    let width, height;
    let centerX, centerY;

    // Config
    const BASE_CELL_SIZE = 20; // Size of a cell at zoom level 1
    let zoomLevel = parseFloat(zoomSlider.value);

    // Current equation coefficients
    let a = parseInt(coeffAInput.value);
    let b = parseInt(coeffBInput.value);
    let c = parseInt(coeffCInput.value);

    // Memoization and caching
    const primeCache = new Map();
    // Pre-seed some common values
    primeCache.set(1, false);
    primeCache.set(2, true);
    primeCache.set(3, true);

    // Optimized prime checker
    function isPrime(n) {
        if (n <= 1) return false;
        if (primeCache.has(n)) return primeCache.get(n);
        if (n % 2 === 0) {
            primeCache.set(n, n === 2);
            return n === 2;
        }
        if (n % 3 === 0) {
            primeCache.set(n, n === 3);
            return n === 3;
        }

        const limit = Math.sqrt(n);
        for (let i = 5; i <= limit; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) {
                primeCache.set(n, false);
                return false;
            }
        }
        primeCache.set(n, true);
        return true;
    }

    // Mathematical coordinate mapping
    // Converts an integer n (>=1) into (x,y) spiral coordinates
    // Origin (0,0) is at n=1
    function getSpiralCoords(n) {
        if (n === 1) return { x: 0, y: 0 };

        // Find the "ring" or layer k
        // The k-th layer ends at (2k+1)^2
        const k = Math.ceil((Math.sqrt(n) - 1) / 2);

        // Number of elements in this ring
        // The ring goes from (2k-1)^2 + 1 to (2k+1)^2
        // Length of a side is 2k

        let t = 2 * k;
        let m = (t + 1) * (t + 1); // max value in this ring (bottom right)

        if (n >= m - t) {
            // Bottom edge
            return { x: k - (m - n), y: k };
        }

        m -= t;
        if (n >= m - t) {
            // Left edge
            return { x: -k, y: k - (m - n) };
        }

        m -= t;
        if (n >= m - t) {
            // Top edge
            return { x: -k + (m - n), y: -k };
        }

        // Right edge
        return { x: k, y: -k + (m - t - n) };
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        centerX = width / 2;
        centerY = height / 2;
        render();
    }

    window.addEventListener('resize', resizeCanvas);

    function updateEquationDisplays() {
        valADisplay.textContent = a;
        valBDisplay.textContent = b;
        valCDisplay.textContent = c;

        displayA.textContent = a;
        displayB.textContent = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        displayC.textContent = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    }

    // UI Event Listeners
    coeffAInput.addEventListener('input', (e) => { a = parseInt(e.target.value); updateEquationDisplays(); requestAnimationFrame(render); });
    coeffBInput.addEventListener('input', (e) => { b = parseInt(e.target.value); updateEquationDisplays(); requestAnimationFrame(render); });
    coeffCInput.addEventListener('input', (e) => { c = parseInt(e.target.value); updateEquationDisplays(); requestAnimationFrame(render); });
    zoomSlider.addEventListener('input', (e) => {
        // Inverse logarithmic scale for zooming out effectively
        const raw = parseFloat(e.target.value);
        // Map 0.1 - 100 to a usable scale.
        // High slider value = zoom OUT (smaller cells)
        // Let's invert the slider visually for better UX if needed, but currently:
        // lower value = closer (bigger), higher = further (smaller)
        zoomLevel = raw;
        requestAnimationFrame(render);
    });


    // Interactive panning (optional, adding basic support)
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX, lastY;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        offsetX += e.clientX - lastX;
        offsetY += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        requestAnimationFrame(render);
    });

    // Touch support for panning
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        offsetX += e.touches[0].clientX - lastX;
        offsetY += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        requestAnimationFrame(render);
    });

    // Zooming with mouse wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        // Adjust zoom level. If zooming out, increase slider value.
        let newZoom = zoomLevel * (1 + delta * 0.1);
        newZoom = Math.max(0.1, Math.min(newZoom, 1000));
        zoomLevel = newZoom;
        zoomSlider.value = newZoom;
        requestAnimationFrame(render);
    }, { passive: false });


    function render() {
        ctx.fillStyle = '#0b0f19'; // bg-color
        ctx.fillRect(0, 0, width, height);

        const cellSize = BASE_CELL_SIZE / zoomLevel;

        // Calculate the maximum number of rings visible based on screen size and zoom
        // Max distance from center to corner
        const maxDistScreen = Math.sqrt(Math.pow(width/2 + Math.abs(offsetX), 2) + Math.pow(height/2 + Math.abs(offsetY), 2));
        const maxRings = Math.ceil(maxDistScreen / cellSize);

        // The highest number visible is approximately (2*maxRings + 1)^2
        const maxN = Math.pow(2 * maxRings + 1, 2);

        // Optimize: don't render millions if zoomed way out, cap it or render differently
        const renderLimit = Math.min(maxN, 50000); // Cap for performance, can increase if optimized

        rangeDisplay.textContent = `1 to ${renderLimit.toLocaleString()}`;

        // Pre-calculate equation outputs to highlight
        const equationOutputs = new Set();
        let highlightedPrimesCount = 0;

        // We only need to calculate n for the equation such that output <= renderLimit
        // A rough heuristic: loop n up to a reasonable bound
        const equationDomainLimit = Math.ceil(Math.sqrt(renderLimit)) * 2 + 100;

        for (let n = 1; n < equationDomainLimit; n++) {
            const val = a * n * n + b * n + c;
            if (val > 0 && val <= renderLimit) {
                equationOutputs.add(val);
                if (isPrime(val)) {
                    highlightedPrimesCount++;
                }
            }
        }

        matchDisplay.textContent = highlightedPrimesCount.toLocaleString();

        ctx.save();
        ctx.translate(centerX + offsetX, centerY + offsetY);

        // Determine rendering style based on zoom level
        const showText = cellSize > 15;
        const dotSize = Math.max(1, cellSize * 0.8);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.floor(cellSize * 0.4)}px 'Fira Code', monospace`;

        // Draw spiral
        for (let n = 1; n <= renderLimit; n++) {
            const coords = getSpiralCoords(n);
            const x = coords.x * cellSize;
            const y = coords.y * cellSize;

            // Culling: check if point is inside viewport
            const screenX = centerX + offsetX + x;
            const screenY = centerY + offsetY + y;
            if (screenX < -cellSize || screenX > width + cellSize ||
                screenY < -cellSize || screenY > height + cellSize) {
                continue;
            }

            const isP = isPrime(n);
            const isEqOut = equationOutputs.has(n);

            if (isP || isEqOut) {
                if (isEqOut && isP) {
                    // Highlighted Prime
                    ctx.fillStyle = '#fcd34d'; // highlight-prime-color
                    ctx.shadowColor = '#fcd34d';
                    ctx.shadowBlur = 8;
                } else if (isEqOut) {
                    // Just equation output
                    ctx.fillStyle = '#ff00ff'; // highlight-color
                    ctx.shadowColor = '#ff00ff';
                    ctx.shadowBlur = 8;
                } else {
                    // Just prime
                    ctx.fillStyle = '#00ffcc'; // prime-color
                    ctx.shadowColor = 'transparent'; // Remove blur for normal primes for performance
                    if (cellSize > 5) {
                         ctx.shadowColor = 'rgba(0, 255, 204, 0.5)';
                         ctx.shadowBlur = 4;
                    }
                }

                if (showText) {
                    ctx.fillText(n, x, y);
                } else {
                    ctx.beginPath();
                    ctx.arc(x, y, dotSize/2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Reset shadow for next draw to avoid compounding performance hits
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            } else if (showText) {
                // Composite numbers, only show if zoomed in
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillText(n, x, y);
            }
        }

        ctx.restore();
    }

    // Initial setup
    updateEquationDisplays();
    resizeCanvas();
});
