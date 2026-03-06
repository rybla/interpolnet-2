document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('math-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('container');

    // UI Elements
    const p1Display = document.getElementById('p1-display');
    const p2Display = document.getElementById('p2-display');
    const slopeDisplay = document.getElementById('slope-display');
    const equationDisplay = document.getElementById('equation-display');
    const slopeLabel = document.getElementById('slope-label');
    const equationLabel = document.getElementById('equation-label');

    // Canvas settings
    let width, height;
    let originX, originY;
    let scale = 100; // pixels per unit
    let isDraggingP1 = false;
    let isDraggingP2 = false;

    // Mathematical Function
    // f(x) = x³ - 3x
    const f = (x) => Math.pow(x, 3) - 3 * x;
    // f'(x) = 3x² - 3
    const df = (x) => 3 * Math.pow(x, 2) - 3;

    // Anchor points (in math coordinates)
    const points = {
        p1: { x: -0.5, y: f(-0.5) },
        p2: { x: 1.5, y: f(1.5) }
    };

    const pointRadius = 6;
    const snapThreshold = 0.05; // math units

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        // Mobile layout adjustments
        if (width < 600) {
            // Push origin down so it's not hidden behind the larger UI
            originX = width / 2;
            originY = height * 0.7;
            scale = 60;
        } else {
            // Desktop layout: origin slightly to the right to clear UI panel
            originX = width / 2 + 100;
            originY = height / 2;
            scale = 100;
        }

        draw();
    }

    // Coordinate Transformations
    function mathToScreen(x, y) {
        return {
            x: originX + x * scale,
            y: originY - y * scale // Invert Y axis
        };
    }

    function screenToMath(x, y) {
        return {
            x: (x - originX) / scale,
            y: -(y - originY) / scale
        };
    }

    // Drawing Functions
    function drawGrid() {
        ctx.strokeStyle = 'rgba(139, 155, 180, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = originX % scale; x < width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = originY % scale; y < height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(139, 155, 180, 0.4)';
        ctx.lineWidth = 2;

        // X axis
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();

        // Ticks
        ctx.fillStyle = 'rgba(139, 155, 180, 0.7)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let x = Math.ceil(-originX/scale); x <= (width-originX)/scale; x++) {
            if (x === 0) continue;
            const sx = originX + x * scale;
            ctx.beginPath();
            ctx.moveTo(sx, originY - 4);
            ctx.lineTo(sx, originY + 4);
            ctx.stroke();
            ctx.fillText(x.toString(), sx, originY + 8);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = Math.ceil(-originY/scale); y <= (height-originY)/scale; y++) {
            if (y === 0) continue;
            const sy = originY + y * scale;
            ctx.beginPath();
            ctx.moveTo(originX - 4, sy);
            ctx.lineTo(originX + 4, sy);
            ctx.stroke();
            ctx.fillText((-y).toString(), originX - 8, sy);
        }
    }

    function drawFunction() {
        ctx.strokeStyle = '#00ffcc'; // Cyan
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        let started = false;

        // Draw across visible screen
        const startX = -originX / scale;
        const endX = (width - originX) / scale;
        const step = (endX - startX) / 200; // Resolution

        for (let x = startX; x <= endX; x += step) {
            const y = f(x);
            const screenPoint = mathToScreen(x, y);

            if (!started) {
                ctx.moveTo(screenPoint.x, screenPoint.y);
                started = true;
            } else {
                ctx.lineTo(screenPoint.x, screenPoint.y);
            }
        }
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    function drawLineAndPoints() {
        const p1Screen = mathToScreen(points.p1.x, points.p1.y);
        const p2Screen = mathToScreen(points.p2.x, points.p2.y);

        const dx = points.p2.x - points.p1.x;
        const isTangent = Math.abs(dx) < snapThreshold;

        let m, b, labelType;

        if (isTangent) {
            // Tangent Line
            container.classList.add('is-tangent');

            // Set points to exact same for math
            const targetX = (points.p1.x + points.p2.x) / 2;
            const targetY = f(targetX);

            m = df(targetX);
            b = targetY - m * targetX;
            labelType = 'Tangent';

            ctx.strokeStyle = '#f2e205'; // Yellow
            ctx.shadowColor = '#f2e205';
            ctx.shadowBlur = 15;

            // Draw single merged point
            const targetScreen = mathToScreen(targetX, targetY);
            ctx.fillStyle = '#f2e205';
            ctx.beginPath();
            ctx.arc(targetScreen.x, targetScreen.y, pointRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Draw tangent line across screen
            const xLeft = -originX / scale;
            const yLeft = m * xLeft + b;
            const screenLeft = mathToScreen(xLeft, yLeft);

            const xRight = (width - originX) / scale;
            const yRight = m * xRight + b;
            const screenRight = mathToScreen(xRight, yRight);

            ctx.beginPath();
            ctx.moveTo(screenLeft.x, screenLeft.y);
            ctx.lineTo(screenRight.x, screenRight.y);
            ctx.stroke();

            // Update UI
            p1Display.textContent = `(${targetX.toFixed(2)}, ${targetY.toFixed(2)})`;
            p2Display.textContent = `(${targetX.toFixed(2)}, ${targetY.toFixed(2)})`;
            slopeLabel.textContent = `Tangent Slope (m):`;
            equationLabel.textContent = `Tangent Equation:`;
            slopeDisplay.textContent = m.toFixed(2);
            equationDisplay.textContent = `y = ${m.toFixed(2)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(2)}`;

        } else {
            // Secant Line
            container.classList.remove('is-tangent');

            m = (points.p2.y - points.p1.y) / dx;
            b = points.p1.y - m * points.p1.x;
            labelType = 'Secant';

            ctx.strokeStyle = '#ff00ff'; // Magenta
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;

            // Draw secant line across screen
            const xLeft = -originX / scale;
            const yLeft = m * xLeft + b;
            const screenLeft = mathToScreen(xLeft, yLeft);

            const xRight = (width - originX) / scale;
            const yRight = m * xRight + b;
            const screenRight = mathToScreen(xRight, yRight);

            ctx.beginPath();
            ctx.moveTo(screenLeft.x, screenLeft.y);
            ctx.lineTo(screenRight.x, screenRight.y);
            ctx.stroke();

            // Draw points
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ffcc';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;

            [p1Screen, p2Screen].forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            // Update UI
            p1Display.textContent = `(${points.p1.x.toFixed(2)}, ${points.p1.y.toFixed(2)})`;
            p2Display.textContent = `(${points.p2.x.toFixed(2)}, ${points.p2.y.toFixed(2)})`;
            slopeLabel.textContent = `Secant Slope (m):`;
            equationLabel.textContent = `Secant Equation:`;
            slopeDisplay.textContent = m.toFixed(2);
            equationDisplay.textContent = `y = ${m.toFixed(2)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(2)}`;
        }

        ctx.shadowBlur = 0;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        drawGrid();
        drawFunction();
        drawLineAndPoints();
    }

    // Interaction Handling
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function isPointHovered(mouseScreenCoords, mathPoint) {
        const pointScreen = mathToScreen(mathPoint.x, mathPoint.y);
        const dx = mouseScreenCoords.x - pointScreen.x;
        const dy = mouseScreenCoords.y - pointScreen.y;
        return Math.sqrt(dx*dx + dy*dy) < pointRadius * 3; // Generous hit area
    }

    function handlePointerDown(e) {
        e.preventDefault(); // Prevent scrolling on touch
        const pos = getPointerPos(e);

        // If they are snapped (tangent mode), touching the merged point splits them
        const dx = points.p2.x - points.p1.x;
        const isTangent = Math.abs(dx) < snapThreshold;

        if (isTangent) {
            const targetX = (points.p1.x + points.p2.x) / 2;
            const targetY = f(targetX);
            if (isPointHovered(pos, {x: targetX, y: targetY})) {
                // Determine which way to drag based on pointer position relative to center
                const mathPos = screenToMath(pos.x, pos.y);
                if (mathPos.x < targetX) {
                    isDraggingP1 = true;
                    // Nudge it slightly so it breaks snap immediately
                    points.p1.x = targetX - snapThreshold * 1.5;
                    points.p1.y = f(points.p1.x);
                } else {
                    isDraggingP2 = true;
                    points.p2.x = targetX + snapThreshold * 1.5;
                    points.p2.y = f(points.p2.x);
                }
                draw();
                return;
            }
        } else {
            if (isPointHovered(pos, points.p1)) {
                isDraggingP1 = true;
                return;
            }
            if (isPointHovered(pos, points.p2)) {
                isDraggingP2 = true;
                return;
            }
        }
    }

    function handlePointerMove(e) {
        if (!isDraggingP1 && !isDraggingP2) {
            // Update cursor style
            const pos = getPointerPos(e);
            let hovering = false;

            const dx = points.p2.x - points.p1.x;
            const isTangent = Math.abs(dx) < snapThreshold;

            if (isTangent) {
                 const targetX = (points.p1.x + points.p2.x) / 2;
                 const targetY = f(targetX);
                 hovering = isPointHovered(pos, {x: targetX, y: targetY});
            } else {
                 hovering = isPointHovered(pos, points.p1) || isPointHovered(pos, points.p2);
            }

            canvas.style.cursor = hovering ? 'grab' : 'default';
            return;
        }

        e.preventDefault();
        canvas.style.cursor = 'grabbing';

        const pos = getPointerPos(e);
        const mathPos = screenToMath(pos.x, pos.y);

        if (isDraggingP1) {
            points.p1.x = mathPos.x;
            points.p1.y = f(points.p1.x);
        } else if (isDraggingP2) {
            points.p2.x = mathPos.x;
            points.p2.y = f(points.p2.x);
        }

        draw();
    }

    function handlePointerUp() {
        isDraggingP1 = false;
        isDraggingP2 = false;
        canvas.style.cursor = 'default';
    }

    // Event Listeners
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
    window.addEventListener('touchmove', handlePointerMove, {passive: false});
    window.addEventListener('touchend', handlePointerUp);

    // Initial setup
    resize();
});