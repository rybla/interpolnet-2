document.addEventListener('DOMContentLoaded', () => {
    const inputN = document.getElementById('input-n');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');

    const standardStackDiv = document.getElementById('standard-stack');
    const standardStatus = document.getElementById('standard-status');
    const tcoStackDiv = document.getElementById('tco-stack');
    const tcoStatus = document.getElementById('tco-status');

    let isRunning = false;
    let standardInterval = null;
    let tcoInterval = null;

    const ANIMATION_DELAY = 600;

    startBtn.addEventListener('click', startSimulation);
    resetBtn.addEventListener('click', resetSimulation);

    function startSimulation() {
        if (isRunning) return;

        let n = parseInt(inputN.value);
        if (isNaN(n) || n < 1) {
            n = 5;
            inputN.value = 5;
        }

        if (n > 15) {
            alert("Please use a smaller number for visual clarity (max 15).");
            inputN.value = 15;
            n = 15;
        }

        resetSimulation();
        isRunning = true;
        startBtn.disabled = true;
        inputN.disabled = true;

        runStandardSimulation(n);
        runTCOSimulation(n);
    }

    function resetSimulation() {
        clearInterval(standardInterval);
        clearInterval(tcoInterval);
        isRunning = false;
        startBtn.disabled = false;
        inputN.disabled = false;

        standardStackDiv.innerHTML = '';
        standardStatus.textContent = 'Status: Waiting';

        tcoStackDiv.innerHTML = '';
        tcoStatus.textContent = 'Status: Waiting';
    }

    function createFrameElement(contentHtml, className) {
        const frame = document.createElement('div');
        frame.className = `frame ${className}`;
        frame.innerHTML = `<div class="frame-content">${contentHtml}</div>`;
        return frame;
    }

    function runStandardSimulation(n) {
        let currentN = n;
        let state = 'pushing'; // 'pushing', 'returning'
        let frames = [];
        let returnValue = 1;

        standardStatus.textContent = 'Status: Pushing Frames';

        standardInterval = setInterval(() => {
            if (state === 'pushing') {
                if (currentN > 1) {
                    const html = `<span>factorial(${currentN})</span><span class="frame-return">return ${currentN} * factorial(${currentN - 1})</span>`;
                    const frame = createFrameElement(html, 'standard-frame');
                    frames.push({ n: currentN, element: frame });
                    standardStackDiv.appendChild(frame);
                    currentN--;
                } else {
                    const html = `<span>factorial(1)</span><span class="frame-return">return 1</span>`;
                    const frame = createFrameElement(html, 'standard-frame returning');
                    frames.push({ n: 1, element: frame });
                    standardStackDiv.appendChild(frame);
                    state = 'returning';
                    standardStatus.textContent = 'Status: Popping Frames (Returning)';
                }
            } else if (state === 'returning') {
                if (frames.length > 0) {
                    const currentFrame = frames.pop();

                    if (currentFrame.n === 1) {
                        returnValue = 1;
                        currentFrame.element.classList.add('popping');
                        setTimeout(() => currentFrame.element.remove(), ANIMATION_DELAY - 100);
                    } else {
                        returnValue = currentFrame.n * returnValue;
                        // Update visually before popping
                        currentFrame.element.classList.add('returning');
                        currentFrame.element.querySelector('.frame-return').textContent = `return ${returnValue}`;

                        setTimeout(() => {
                            currentFrame.element.classList.add('popping');
                            setTimeout(() => currentFrame.element.remove(), ANIMATION_DELAY - 100);
                        }, ANIMATION_DELAY / 2);
                    }
                } else {
                    clearInterval(standardInterval);
                    standardStatus.textContent = `Status: Complete (Result: ${returnValue})`;
                }
            }
        }, ANIMATION_DELAY);
    }

    function runTCOSimulation(n) {
        let currentN = n;
        let acc = 1;
        let frameElement = null;

        tcoStatus.textContent = 'Status: Updating Single Frame';

        tcoInterval = setInterval(() => {
            if (currentN >= 1) {
                const html = `<span>factorial(${currentN}, ${acc})</span><span class="frame-return">return factorial(${currentN - 1}, ${currentN * acc})</span>`;

                if (!frameElement) {
                    frameElement = createFrameElement(html, 'tco-frame');
                    tcoStackDiv.appendChild(frameElement);
                } else {
                    frameElement.querySelector('.frame-content').innerHTML = html;
                    // Trigger reflow to restart animation
                    frameElement.classList.remove('updating');
                    void frameElement.offsetWidth;
                    frameElement.classList.add('updating');
                }

                acc = acc * currentN;
                currentN--;
            } else {
                clearInterval(tcoInterval);
                if (frameElement) {
                    frameElement.classList.add('returning');
                    frameElement.querySelector('.frame-content').innerHTML = `<span>factorial(0, ${acc})</span><span class="frame-return">return ${acc}</span>`;
                }
                tcoStatus.textContent = `Status: Complete (Result: ${acc})`;
                checkBothComplete();
            }
        }, ANIMATION_DELAY);
    }

    function checkBothComplete() {
        if (standardStatus.textContent.includes('Complete') && tcoStatus.textContent.includes('Complete')) {
            isRunning = false;
            startBtn.disabled = false;
            inputN.disabled = false;
        }
    }

    // Periodically check if both have completed to re-enable UI correctly
    setInterval(checkBothComplete, 500);
});
