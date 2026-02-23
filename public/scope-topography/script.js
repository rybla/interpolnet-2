// Scope Topography Demo Script

// --- Parser Logic ---

/**
 * Tokenizes the input code into a list of tokens.
 */
function tokenize(code) {
    const tokens = [];
    // Regex to match:
    // 1. Comments (//... or /*...*/) - match these first to skip them
    // 2. Keywords (function, var, let, const)
    // 3. Identifiers (variable names)
    // 4. Block delimiters ({, })

    const regex = /(\/\/.*)|(\/\*[\s\S]*?\*\/)|\b(function|var|let|const)\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[{}]/g;

    let match;
    while ((match = regex.exec(code)) !== null) {
        if (match[1] || match[2]) {
            // It's a comment, skip it
            continue;
        }
        tokens.push({
            type: match[0], // Simplified type
            value: match[0],
            index: match.index
        });
    }
    return tokens;
}

/**
 * Parses tokens into a Scope Tree.
 */
function parse(tokens, codeLength) {
    // Root Global Scope
    const root = {
        id: 'global',
        type: 'global',
        range: [0, codeLength],
        variables: [],
        children: [],
        depth: 0,
        parent: null
    };

    let currentScope = root;
    let nextScopeId = 1;
    let nextBlockIsFunction = false;

    // Helper to add variable
    function addVariable(name, type, range) {
        let targetScope = currentScope;

        // 'var' is function-scoped (or global)
        if (type === 'var') {
            let s = currentScope;
            while (s.parent && s.type !== 'function') {
                s = s.parent;
            }
            targetScope = s;
        }

        // check for duplicate
        const existing = targetScope.variables.find(v => v.name === name);
        if (!existing) {
            targetScope.variables.push({
                name: name,
                type: type,
                range: range
            });
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.value === 'function') {
            nextBlockIsFunction = true;

            // Function Declaration Name: function foo()
            // Check if next token is identifier
            if (i + 1 < tokens.length && isIdentifier(tokens[i+1])) {
                const funcName = tokens[i+1].value;
                // Function name is declared in the *current* scope (outer)
                addVariable(funcName, 'function', [tokens[i+1].index, tokens[i+1].index + funcName.length]);
                i++; // Skip name
            }
        } else if (token.value === 'var' || token.value === 'let' || token.value === 'const') {
            if (i + 1 < tokens.length && isIdentifier(tokens[i+1])) {
                const varName = tokens[i+1].value;
                addVariable(varName, token.value, [tokens[i+1].index, tokens[i+1].index + varName.length]);
                i++; // Skip name
            }
        } else if (token.value === '{') {
            const type = nextBlockIsFunction ? 'function' : 'block';
            nextBlockIsFunction = false; // Reset

            const newScope = {
                id: nextScopeId++,
                type: type,
                range: [token.index, null], // End unknown yet
                variables: [],
                children: [],
                depth: currentScope.depth + 1,
                parent: currentScope
            };

            currentScope.children.push(newScope);
            currentScope = newScope;

        } else if (token.value === '}') {
            if (currentScope.parent) {
                currentScope.range[1] = token.index + 1;
                currentScope = currentScope.parent;
            }
        }
    }

    return root;
}

function isIdentifier(token) {
    return !['function', 'var', 'let', 'const', '{', '}'].includes(token.value);
}

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = { tokenize, parse };
}

// --- Layout Engine ---

function calculateLayout(scope, x, y, w, h) {
    const PADDING = 20; // Padding inside the scope box
    const HEADER_HEIGHT = 40; // Space for variables/label at top
    const GAP = 10; // Gap between sibling scopes

    scope.layout = { x, y, w, h };

    // Layout Variables
    // Place them in a row/grid at the top of the scope
    const varCount = scope.variables.length;
    scope.variableLayouts = [];
    if (varCount > 0) {
        // Simple row for now
        const slotW = (w - PADDING * 2) / varCount;
        scope.variables.forEach((v, i) => {
            scope.variableLayouts.push({
                x: x + PADDING + i * slotW + slotW / 2, // Center of slot
                y: y + PADDING + HEADER_HEIGHT / 2,
                variable: v
            });
        });
    }

    if (scope.children.length === 0) return;

    // Available space for children
    const availX = x + PADDING;
    const availY = y + PADDING + HEADER_HEIGHT + GAP;
    const availW = w - PADDING * 2;
    const availH = h - (availY - y) - PADDING;

    if (availW < 10 || availH < 10) return; // Too small

    // We will stack children vertically based on their code length ratio
    let totalLen = 0;
    scope.children.forEach(child => {
        let len = (child.range[1] || child.range[0] + 50) - child.range[0];
        if (len < 10) len = 10; // Min length
        child._len = len;
        totalLen += len;
    });

    let currentY = availY;
    // We need to account for gaps in the total height availability
    const totalGaps = (scope.children.length - 1) * GAP;
    const heightForScopes = availH - totalGaps;

    scope.children.forEach(child => {
        let ratio = child._len / totalLen;
        let childH = heightForScopes * ratio;
        // Ensure min height
        if (childH < 40) childH = 40;

        // If we overflow, we just overflow (clip) or shrink?
        // For this demo, let's just let it be.

        calculateLayout(child, availX, currentY, availW, childH);
        currentY += childH + GAP;
    });
}


// --- Renderer ---

function getScopeColor(depth, isHovered) {
    const baseColors = [
        '#4CAF50', // Level 0: Global (Green)
        '#8BC34A', // Level 1 (Light Green)
        '#FFC107', // Level 2 (Amber)
        '#FF9800', // Level 3 (Orange)
        '#FF5722', // Level 4 (Deep Orange)
        '#795548', // Level 5 (Brown)
    ];
    const color = baseColors[depth % baseColors.length];
    return isHovered ? lighten(color, 20) : color;
}

function lighten(color, percent) {
    // Simple lighten function (assuming hex)
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function drawTerrain(ctx, scope, viewMode, hoveredScopeId) {
    if (!scope.layout) return;

    const { x, y, w, h } = scope.layout;
    const z = scope.depth * 20;
    const isHovered = scope.id === hoveredScopeId;
    const color = getScopeColor(scope.depth, isHovered);

    if (viewMode === 'top-down') {
        // Simple Rectangle
        ctx.fillStyle = color;
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText(scope.type, x + 5, y + 15);

    } else {
        // Isometric Slabs
        // Center the layout for iso projection
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 3; // Start somewhat top

        // Convert (x, y) logic to iso
        // We can treat (x, y) layout as (x, z) or (x, y) on ground plane.
        // Let's map layout x -> iso x, layout y -> iso y.

        // Helper to project
        const toIso = (lx, ly, lz) => {
            // Scale down layout coordinates
            const scale = 0.6;
            const sx = (lx - ctx.canvas.width/2) * scale;
            const sy = (ly - ctx.canvas.height/2) * scale;

            // Iso projection
            return {
                x: centerX + (sx - sy),
                y: centerY + (sx + sy) / 2 - lz
            };
        };

        const p1 = toIso(x, y, z);
        const p2 = toIso(x + w, y, z);
        const p3 = toIso(x + w, y + h, z);
        const p4 = toIso(x, y + h, z);

        const thickness = 10;
        const p1_top = toIso(x, y, z + thickness);
        const p2_top = toIso(x + w, y, z + thickness);
        const p3_top = toIso(x + w, y + h, z + thickness);
        const p4_top = toIso(x, y + h, z + thickness);

        // Draw Sides (only if needed? Painters algo handles obscuration by drawing top last)
        // Right Side (p2, p3)
        ctx.fillStyle = darken(color, 20);
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p3_top.x, p3_top.y);
        ctx.lineTo(p2_top.x, p2_top.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Side (p3, p4)
        ctx.fillStyle = darken(color, 10);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.lineTo(p4_top.x, p4_top.y);
        ctx.lineTo(p3_top.x, p3_top.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top Face
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(p1_top.x, p1_top.y);
        ctx.lineTo(p2_top.x, p2_top.y);
        ctx.lineTo(p3_top.x, p3_top.y);
        ctx.lineTo(p4_top.x, p4_top.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Draw Variables
    if (scope.variableLayouts) {
        scope.variableLayouts.forEach(vLayout => {
            drawVariable(ctx, vLayout, scope.depth, viewMode);
        });
    }

    // Children
    scope.children.forEach(child => drawTerrain(ctx, child, viewMode, hoveredScopeId));
}

function darken(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function drawVariable(ctx, vLayout, depth, viewMode) {
    const { x, y, variable } = vLayout;

    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';

    if (viewMode === 'top-down') {
        // Draw Circle
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Text
        ctx.fillStyle = '#000';
        ctx.fillText(variable.name, x - 10, y + 15);
    } else {
        // Isometric Flag
        const z = depth * 20 + 10; // On top of slab
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 3;
        const scale = 0.6;

        const toIso = (lx, ly, lz) => {
            const sx = (lx - ctx.canvas.width/2) * scale;
            const sy = (ly - ctx.canvas.height/2) * scale;
            return {
                x: centerX + (sx - sy),
                y: centerY + (sx + sy) / 2 - lz
            };
        };

        const base = toIso(x, y, z);

        // Draw Pole
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(base.x, base.y - 20);
        ctx.stroke();

        // Draw Flag
        ctx.fillStyle = '#E91E63'; // Pink flag
        ctx.beginPath();
        ctx.moveTo(base.x, base.y - 20);
        ctx.lineTo(base.x + 10, base.y - 15);
        ctx.lineTo(base.x, base.y - 10);
        ctx.fill();

        // Text
        ctx.fillStyle = '#fff';
        ctx.fillText(variable.name, base.x + 5, base.y - 25);
    }
}


// --- Main Demo Logic (Browser Only) ---
if (typeof window !== 'undefined') {
    const editor = document.getElementById('code-editor');
    const canvas = document.getElementById('terrain-canvas');
    const ctx = canvas.getContext('2d');
    const btnTopDown = document.getElementById('view-top-down');
    const btnIso = document.getElementById('view-isometric');

    let viewMode = 'top-down';
    let rootScope = null;
    let hoveredScopeId = null;

    // Resize Canvas
    function resize() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        update();
    }
    window.addEventListener('resize', resize);

    // Update Loop
    function update() {
        const code = editor.value;
        const tokens = tokenize(code);
        rootScope = parse(tokens, code.length);

        // Layout
        calculateLayout(rootScope, 0, 0, canvas.width, canvas.height);

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        if (viewMode === 'isometric') {
            // Draw a base plane?
        }

        drawTerrain(ctx, rootScope, viewMode, hoveredScopeId);
    }

    // Interaction
    editor.addEventListener('input', update);

    // Highlight based on cursor position in code
    editor.addEventListener('mousemove', (e) => {
        // We can't easily get character index from mousemove on textarea without complex logic.
        // Instead, let's use 'selectionchange' or 'keyup'/'click' to track cursor position?
        // But the requirement says "Hovering code highlights".
        // That implies mouseover code.
        // Textarea doesn't support hover-over-character events easily.
        // Alternative: Use `selectionStart` on `keyup`/`click`/`mousemove` (if dragging).
        // Let's settle for "Cursor Position" highlighting.
    });

    editor.addEventListener('keyup', () => {
        const cursor = editor.selectionStart;
        if (rootScope) {
            // Find deepest scope containing cursor
            let bestScope = rootScope;

            function findScope(scope) {
                if (cursor >= scope.range[0] && (scope.range[1] === null || cursor <= scope.range[1])) {
                    bestScope = scope;
                    scope.children.forEach(findScope);
                }
            }
            findScope(rootScope);

            if (bestScope.id !== hoveredScopeId) {
                hoveredScopeId = bestScope.id;
                // Re-draw
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawTerrain(ctx, rootScope, viewMode, hoveredScopeId);
            }
        }
    });

    editor.addEventListener('click', () => {
        // Same logic as keyup
        const event = new Event('keyup');
        editor.dispatchEvent(event);
    });

    // Canvas Interaction
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Find scope under mouse
        let foundScopeId = null;

        // Helper to check point in polygon (for isometric) or rect (top-down)
        function checkHit(scope) {
            if (!scope.layout) return;
            const { x, y, w, h } = scope.layout;
            const z = scope.depth * 20;

            if (viewMode === 'top-down') {
                if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
                    foundScopeId = scope.id;
                    // Check children (they are on top)
                    scope.children.forEach(checkHit);
                }
            } else {
                // Isometric Hit Test
                // Top face is the interaction zone
                const thickness = 10;
                // Reuse projection logic (need to expose it or duplicate)
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 3; // Adjusted center
                const scale = 0.6;
                const toIso = (lx, ly, lz) => {
                    const sx = (lx - canvas.width/2) * scale;
                    const sy = (ly - canvas.height/2) * scale;
                    return {
                        x: centerX + (sx - sy),
                        y: centerY + (sx + sy) / 2 - lz
                    };
                };

                const zTop = z + thickness;
                const p1 = toIso(x, y, zTop);
                const p2 = toIso(x + w, y, zTop);
                const p3 = toIso(x + w, y + h, zTop);
                const p4 = toIso(x, y + h, zTop);

                // Check point in quad p1-p2-p3-p4
                // Simple algorithm: sum of angles or ray casting.
                // Or since it's a parallelogram, convert mouse to layout coords?
                // Inverse projection:
                // isoX = C + (sx - sy)
                // isoY = C + (sx + sy)/2 - lz
                // sx - sy = isoX - C
                // sx + sy = 2 * (isoY - C + lz)
                // 2sx = (isoX - C) + 2(isoY - C + lz)
                // sx = ...

                const isoX = mx - centerX;
                const isoY = my - centerY + zTop; // adjusting for elevation

                // sx - sy = isoX
                // sx + sy = 2 * isoY
                const sx = (isoX + 2 * isoY) / 2;
                const sy = (2 * isoY - isoX) / 2;

                // Convert back to layout
                const lx = sx / scale + canvas.width/2;
                const ly = sy / scale + canvas.height/2;

                if (lx >= x && lx <= x + w && ly >= y && ly <= y + h) {
                    foundScopeId = scope.id;
                    scope.children.forEach(checkHit);
                }
            }
        }

        if (rootScope) checkHit(rootScope);

        if (foundScopeId !== hoveredScopeId) {
            hoveredScopeId = foundScopeId;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawTerrain(ctx, rootScope, viewMode, hoveredScopeId);
        }
    });

    btnTopDown.addEventListener('click', () => {
        viewMode = 'top-down';
        btnTopDown.classList.add('active');
        btnIso.classList.remove('active');
        update();
    });

    btnIso.addEventListener('click', () => {
        viewMode = 'isometric';
        btnIso.classList.add('active');
        btnTopDown.classList.remove('active');
        update();
    });

    // Initial
    resize();
}
