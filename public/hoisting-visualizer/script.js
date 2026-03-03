document.addEventListener('DOMContentLoaded', () => {
    const codeContainer = document.getElementById('code-container');
    const btnAnimate = document.getElementById('btn-animate');
    const btnReset = document.getElementById('btn-reset');
    const template = document.getElementById('line-template');

    // The raw source code to visualize
    const initialCode = [
        "console.log('Running code...');",
        "",
        "var message = 'Hello, World!';",
        "",
        "function sayHello() {",
        "    console.log(message);",
        "}",
        "",
        "sayHello();",
        "",
        "var counter = 0;",
        "",
        "function increment() {",
        "    counter++;",
        "}"
    ];

    let lines = [];
    let isHoisted = false;

    // Helper to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Very naive parser for syntax highlighting and identifying hoistable blocks
    function parseLine(text, index) {
        const lineData = {
            raw: text,
            index: index,
            elements: [],
            isDeclaration: false,
            hoistType: null, // 'var' or 'function'
            hoistContent: '',
            remainContent: ''
        };

        if (text.startsWith('var ')) {
            lineData.isDeclaration = true;
            lineData.hoistType = 'var';

            // e.g. "var message = 'Hello';" -> hoisted: "var message;", remain: "message = 'Hello';"
            const match = text.match(/^var\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(=\s*(.*))?;$/);
            if (match) {
                const identifier = match[1];
                const assignment = match[2] || '';

                lineData.hoistContent = `<span class="keyword">var</span> <span class="identifier">${identifier}</span><span class="punctuation">;</span>`;
                if (assignment) {
                    lineData.remainContent = `<span class="identifier">${identifier}</span> ${escapeHtml(assignment)}<span class="punctuation">;</span>`;
                } else {
                    lineData.remainContent = '';
                }
            } else {
                 lineData.isDeclaration = false;
                 lineData.elements.push({ type: 'raw', content: text });
            }
        } else if (text.startsWith('function ')) {
            lineData.isDeclaration = true;
            lineData.hoistType = 'function';

            // for simplicity, we hoist the entire function signature line
            // realistically, the whole body hoists, but visually we'll lift the signature
            const match = text.match(/^function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\((.*?)\)\s*\{$/);
            if (match) {
                const identifier = match[1];
                const args = match[2];
                lineData.hoistContent = `<span class="keyword">function</span> <span class="function">${identifier}</span><span class="punctuation">(</span>${escapeHtml(args)}<span class="punctuation">) { ... }</span>`;
                lineData.remainContent = `<span class="keyword">function</span> <span class="function">${identifier}</span><span class="punctuation">(</span>${escapeHtml(args)}<span class="punctuation">) {</span>`;
            } else {
                 lineData.isDeclaration = false;
                 lineData.elements.push({ type: 'raw', content: text });
            }
        } else {
            // Basic syntax highlighting for non-declarations
            let highlighted = text;
            highlighted = highlighted.replace(/console\.log/g, '<span class="function">console.log</span>');
            highlighted = highlighted.replace(/'(.*?)'/g, '<span class="string">\'$1\'</span>');
            lineData.elements.push({ type: 'raw', content: highlighted });
        }

        return lineData;
    }

    function renderCode() {
        codeContainer.innerHTML = '';
        lines = initialCode.map((text, i) => parseLine(text, i));

        lines.forEach(line => {
            const node = template.content.cloneNode(true);
            const lineEl = node.querySelector('.code-line');
            const numEl = node.querySelector('.line-number');
            const contentEl = node.querySelector('.code-content');

            numEl.textContent = line.index + 1;
            lineEl.dataset.index = line.index;

            if (line.isDeclaration) {
                // Create a block that will physically move
                const block = document.createElement('div');
                block.className = 'code-block hoistable';
                block.innerHTML = line.remainContent ?
                    `<span style="opacity:0.5;">// will become: ${line.remainContent}</span><br>${line.hoistContent}` :
                    line.hoistContent;

                // Store the parsed HTML for later
                block.dataset.hoistHtml = line.hoistContent;
                block.dataset.remainHtml = line.remainContent;

                contentEl.appendChild(block);
                line.element = block;
                line.lineElement = lineEl;
            } else {
                contentEl.innerHTML = line.elements.map(e => e.content).join('');
            }

            codeContainer.appendChild(node);
        });
    }

    function animateHoisting() {
        if (isHoisted) return;
        isHoisted = true;
        btnAnimate.disabled = true;

        const containerRect = codeContainer.getBoundingClientRect();
        let currentHoistY = 0; // The Y offset from the top of the container where the next hoisted item will land

        // 1. Identify all hoistable blocks
        const declarations = lines.filter(l => l.isDeclaration);

        // Split into vars and functions (functions hoist first in JS, but for visual simplicity we can just hoist in order, or group them)
        // Let's hoist functions first, then vars to be more accurate
        const funcs = declarations.filter(d => d.hoistType === 'function');
        const vars = declarations.filter(d => d.hoistType === 'var');
        const hoistOrder = [...funcs, ...vars];

        // 2. Prepare the container space at the top
        // We need to create physical space at the top of the container.
        // We'll do this by pushing all existing lines down via a transform,
        // or by actually inserting placeholders at the top.
        // Inserting placeholders is cleaner for layout flow.

        const placeholders = [];
        let totalHoistHeight = 0;

        hoistOrder.forEach(decl => {
            const block = decl.element;
            const rect = block.getBoundingClientRect();

            // Create a placeholder at the top
            const ph = document.createElement('div');
            ph.className = 'code-line fade-in';
            ph.style.height = `${rect.height}px`;
            ph.style.padding = '0.25rem 1rem';

            const num = document.createElement('span');
            num.className = 'line-number';
            num.textContent = ' '; // Hoisted lines don't get original line numbers

            const content = document.createElement('div');
            content.className = 'code-content';

            ph.appendChild(num);
            ph.appendChild(content);

            codeContainer.insertBefore(ph, codeContainer.firstChild);
            placeholders.push({ placeholderContent: content, decl: decl });

            totalHoistHeight += rect.height;
        });

        // 3. Calculate transforms and apply
        placeholders.reverse().forEach((item, index) => {
            const block = item.decl.element;
            const targetContent = item.placeholderContent;

            // Get original position
            const startRect = block.getBoundingClientRect();

            // Get target position (the placeholder we just inserted)
            const targetRect = targetContent.getBoundingClientRect();

            // Calculate differences
            const deltaX = targetRect.left - startRect.left;
            const deltaY = targetRect.top - startRect.top;

            // Apply visual styling to show it's selected
            block.classList.add('hoist-target');

            // Update the block's content to the hoisted version
            block.innerHTML = block.dataset.hoistHtml;

            // Trigger reflow
            void block.offsetWidth;

            // Apply transform
            // We use a slight stagger based on index
            setTimeout(() => {
                block.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            }, index * 200);

            // Cleanup after animation completes
            setTimeout(() => {
                // Remove the transform
                block.style.transform = '';
                block.classList.remove('hoist-target');
                block.classList.remove('hoistable');

                // Move the actual DOM element into the placeholder
                targetContent.appendChild(block);

                // Leave behind the remainder (assignment or original signature)
                if (item.decl.remainHtml) {
                    const remainSpan = document.createElement('span');
                    remainSpan.innerHTML = item.decl.remainHtml;
                    remainSpan.className = 'fade-in';
                    item.decl.lineElement.querySelector('.code-content').appendChild(remainSpan);
                } else {
                    // Empty line if it was just `var x;`
                    const emptySpan = document.createElement('span');
                    emptySpan.className = 'punctuation fade-in';
                    emptySpan.textContent = '// hoisted';
                    emptySpan.style.opacity = '0.5';
                    item.decl.lineElement.querySelector('.code-content').appendChild(emptySpan);
                }

            }, (index * 200) + 1000); // 1s transition + delay
        });
    }

    function reset() {
        renderCode();
        isHoisted = false;
        btnAnimate.disabled = false;
    }

    btnAnimate.addEventListener('click', animateHoisting);
    btnReset.addEventListener('click', reset);

    // Initial render
    renderCode();
});
