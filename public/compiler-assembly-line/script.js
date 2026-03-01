document.addEventListener('DOMContentLoaded', () => {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const sourceCodeInput = document.getElementById('source-code');
    const belt = document.querySelector('.conveyor-belt');
    const itemsContainer = document.getElementById('items-container');
    const stations = {
        lexer: document.getElementById('station-lexer'),
        parser: document.getElementById('station-parser'),
        generator: document.getElementById('station-generator')
    };

    let isRunning = false;
    let currentPhase = 0; // 0: Raw text, 1: Lexer, 2: Parser, 3: Generator, 4: Done
    let activeItem = null;
    let itemX = -200;
    let animationId = null;
    let targetX = 0;
    let isProcessing = false;

    // --- COMPILER LOGIC ---

    // 1. Lexer
    function lex(input) {
        const tokens = [];
        let cursor = 0;

        while (cursor < input.length) {
            let char = input[cursor];

            // Skip whitespace
            if (/\s/.test(char)) {
                cursor++;
                continue;
            }

            // Keywords & Identifiers
            if (/[a-zA-Z]/.test(char)) {
                let value = '';
                while (cursor < input.length && /[a-zA-Z0-9_]/.test(input[cursor])) {
                    value += input[cursor];
                    cursor++;
                }
                const isKeyword = ['let', 'const', 'var', 'if', 'else', 'function'].includes(value);
                tokens.push({ type: isKeyword ? 'keyword' : 'identifier', value });
                continue;
            }

            // Numbers
            if (/[0-9]/.test(char)) {
                let value = '';
                while (cursor < input.length && /[0-9]/.test(input[cursor])) {
                    value += input[cursor];
                    cursor++;
                }
                tokens.push({ type: 'literal', value });
                continue;
            }

            // Operators & Punctuation
            if (/[\+\-\*\/=]/.test(char)) {
                tokens.push({ type: 'operator', value: char });
                cursor++;
                continue;
            }

            if (char === ';') {
                tokens.push({ type: 'punctuation', value: char });
                cursor++;
                continue;
            }

            // Unknown
            tokens.push({ type: 'unknown', value: char });
            cursor++;
        }
        return tokens;
    }

    // 2. Parser (simplified recursive descent for `let x = a + b;`)
    function parse(tokens) {
        if (tokens.length === 0) return { type: 'Empty' };

        // Very basic parsing for assignment or simple expression
        if (tokens[0].value === 'let' && tokens[1] && tokens[1].type === 'identifier' && tokens[2] && tokens[2].value === '=') {
            const left = { type: 'Identifier', value: tokens[1].value };
            let right = { type: 'Unknown' };

            // Simple binary expression
            if (tokens[3] && tokens[4] && tokens[4].type === 'operator' && tokens[5]) {
                right = {
                    type: 'BinaryExpression',
                    operator: tokens[4].value,
                    left: { type: tokens[3].type === 'literal' ? 'Literal' : 'Identifier', value: tokens[3].value },
                    right: { type: tokens[5].type === 'literal' ? 'Literal' : 'Identifier', value: tokens[5].value }
                };
            } else if (tokens[3]) {
                 right = { type: tokens[3].type === 'literal' ? 'Literal' : 'Identifier', value: tokens[3].value };
            }

            return {
                type: 'VariableDeclaration',
                id: left,
                init: right
            };
        }

        return { type: 'Program', value: 'Unparsed Sequence' };
    }

    // 3. Code Generator
    function generate(ast) {
        const lines = [];
        if (ast.type === 'VariableDeclaration') {
            if (ast.init.type === 'BinaryExpression') {
                lines.push(`LOAD R1, ${ast.init.left.value}`);
                lines.push(`LOAD R2, ${ast.init.right.value}`);
                if (ast.init.operator === '+') lines.push(`ADD R1, R2`);
                if (ast.init.operator === '-') lines.push(`SUB R1, R2`);
                if (ast.init.operator === '*') lines.push(`MUL R1, R2`);
                if (ast.init.operator === '/') lines.push(`DIV R1, R2`);
                lines.push(`STORE ${ast.id.value}, R1`);
            } else {
                 lines.push(`LOAD R1, ${ast.init.value}`);
                 lines.push(`STORE ${ast.id.value}, R1`);
            }
        } else {
            lines.push(`HALT`);
        }
        return lines;
    }

    // --- DOM RENDERING HELPERS ---

    function createRawItem(text) {
        const el = document.createElement('div');
        el.className = 'item raw-text';
        el.textContent = text;
        return el;
    }

    function createTokensItem(tokens) {
        const el = document.createElement('div');
        el.className = 'item tokens-container';
        tokens.forEach(t => {
            const chip = document.createElement('div');
            chip.className = `token ${t.type}`;
            chip.textContent = t.value;
            el.appendChild(chip);
        });
        return el;
    }

    function createASTNode(node) {
        if (!node) return null;
        const wrapper = document.createElement('div');
        wrapper.className = 'ast-tree';

        const content = document.createElement('div');
        content.className = 'ast-node';
        content.textContent = `${node.type} ${node.value ? '('+node.value+')' : ''}`;
        wrapper.appendChild(content);

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'ast-children';

        if (node.id) childrenContainer.appendChild(createASTNode(node.id));
        if (node.init) childrenContainer.appendChild(createASTNode(node.init));
        if (node.operator) {
            const op = document.createElement('div');
            op.className = 'ast-node';
            op.textContent = `Op(${node.operator})`;
            childrenContainer.appendChild(op);
        }
        if (node.left) childrenContainer.appendChild(createASTNode(node.left));
        if (node.right) childrenContainer.appendChild(createASTNode(node.right));

        if (childrenContainer.childNodes.length > 0) {
            wrapper.appendChild(childrenContainer);
        }
        return wrapper;
    }

    function createASTItem(ast) {
        const el = document.createElement('div');
        el.className = 'item';
        el.appendChild(createASTNode(ast));
        return el;
    }

    function createMachineCodeItem(lines) {
        const el = document.createElement('div');
        el.className = 'item machine-code';
        lines.forEach(line => {
            const div = document.createElement('div');
            div.className = 'mc-instruction';
            div.textContent = line;
            el.appendChild(div);
        });
        return el;
    }

    // --- ANIMATION LOGIC ---

    const STAGE_X = {
        0: -200,          // Start
        1: 150,           // Lexer (Approx left: 15%)
        2: 450,           // Parser (Approx left: 50%)
        3: 750,           // Generator (Approx left: 85%)
        4: 1200           // End
    };

    function updatePositions() {
        const floorWidth = document.getElementById('factory-floor').offsetWidth;
        // Dynamically calculate positions based on screen size
        STAGE_X[1] = floorWidth * 0.15;
        STAGE_X[2] = floorWidth * 0.50;
        STAGE_X[3] = floorWidth * 0.85;
        STAGE_X[4] = floorWidth + 200;
    }

    window.addEventListener('resize', updatePositions);
    updatePositions();

    let rawData, tokenData, astData, mcData;

    function initRun() {
        const input = sourceCodeInput.value;
        if (!input.trim()) return;

        itemsContainer.innerHTML = '';
        currentPhase = 0;
        itemX = STAGE_X[0];
        targetX = STAGE_X[1];

        // Pre-compute pipeline data
        rawData = input;
        tokenData = lex(input);
        astData = parse(tokenData);
        mcData = generate(astData);

        activeItem = createRawItem(rawData);
        activeItem.style.left = itemX + 'px';
        itemsContainer.appendChild(activeItem);

        resetMachineStates();
    }

    function resetMachineStates() {
        Object.values(stations).forEach(s => {
            s.classList.remove('processing');
            s.querySelector('.status').textContent = 'Idle';
        });
    }

    function processAtStation(stationName, newElement, nextPhase) {
        isProcessing = true;
        belt.classList.remove('running');
        const station = stations[stationName];
        station.classList.add('processing');
        station.querySelector('.status').textContent = 'Processing...';

        // Simulate processing time
        setTimeout(() => {
            station.classList.remove('processing');
            station.querySelector('.status').textContent = 'Done';

            // Swap visual representation
            itemsContainer.removeChild(activeItem);
            activeItem = newElement;
            activeItem.style.left = itemX + 'px';
            itemsContainer.appendChild(activeItem);

            setTimeout(() => {
                station.querySelector('.status').textContent = 'Idle';
                currentPhase = nextPhase;
                targetX = STAGE_X[currentPhase + 1];
                isProcessing = false;
                if (isRunning) belt.classList.add('running');
            }, 500);

        }, 1500);
    }

    function animate() {
        if (isRunning && !isProcessing) {
            if (itemX < targetX) {
                itemX += 4; // Move speed
                activeItem.style.left = itemX + 'px';
            } else {
                // Arrived at a station
                if (currentPhase === 0) {
                    processAtStation('lexer', createTokensItem(tokenData), 1);
                } else if (currentPhase === 1) {
                    processAtStation('parser', createASTItem(astData), 2);
                } else if (currentPhase === 2) {
                    processAtStation('generator', createMachineCodeItem(mcData), 3);
                } else if (currentPhase === 3) {
                    // Reached the end
                    isRunning = false;
                    belt.classList.remove('running');
                }
            }
        }
        animationId = requestAnimationFrame(animate);
    }

    // --- CONTROLS ---

    btnPlay.addEventListener('click', () => {
        if (!activeItem) initRun();
        if (currentPhase >= 3 && itemX >= STAGE_X[4]) {
            initRun(); // restart if done
        }
        isRunning = true;
        if (!isProcessing) belt.classList.add('running');
        if (!animationId) animate();
    });

    btnPause.addEventListener('click', () => {
        isRunning = false;
        belt.classList.remove('running');
    });

    btnStep.addEventListener('click', () => {
        if (!activeItem) {
            initRun();
            isRunning = true;
            if (!animationId) animate();
        } else if (!isProcessing && !isRunning) {
             isRunning = true;
             belt.classList.add('running');
             if (!animationId) animate();
             // The loop will auto-pause if we wrap the logic, but for simplicity,
             // we'll just let it run to the next station and rely on the user to pause,
             // or we can hack a 'step to next station' flag.
             // Here we implement a proper 'Step': it runs until it hits the next processing phase.

             // Wait for it to hit a station, then pause.
             const checkStep = setInterval(() => {
                 if (isProcessing) {
                     isRunning = false;
                     clearInterval(checkStep);
                 }
                 if (currentPhase >= 3 && itemX >= STAGE_X[4]) {
                     isRunning = false;
                     belt.classList.remove('running');
                     clearInterval(checkStep);
                 }
             }, 100);
        }
    });

    btnReset.addEventListener('click', () => {
        isRunning = false;
        isProcessing = false;
        belt.classList.remove('running');
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
        itemsContainer.innerHTML = '';
        activeItem = null;
        resetMachineStates();
    });
});
