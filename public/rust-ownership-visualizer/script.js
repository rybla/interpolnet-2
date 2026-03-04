document.addEventListener('DOMContentLoaded', () => {
    // Select essential DOM elements
    const scopes = document.querySelectorAll('.scope-box');
    const mainContainer = document.querySelector('.scopes-container');
    const resetBtn = document.getElementById('reset-btn');
    const cloneBtn = document.getElementById('clone-btn');

    // State management for dragging
    let draggedToken = null;
    let draggedTokenDataId = null;
    let sourceScope = null;
    let offsetX = 0;
    let offsetY = 0;

    // Ghost tracking: which scope holds the original "ghost" when a variable moves
    // Map: tokenId -> Set of scopeIds that have ghosts for it
    const ghostMap = new Map();

    let cloneCounter = 1;

    // Initialization
    function init() {
        attachDragEvents();
        setupDropZones();
        setupControls();
        clearMessages();
    }

    // Controls
    function setupControls() {
        resetBtn.addEventListener('click', resetDemo);
        cloneBtn.addEventListener('click', cloneVariable);
    }

    // Attach Pointer Events to tokens
    function attachDragEvents() {
        // Find all active tokens (not ghosts)
        const tokens = document.querySelectorAll('.variable-token:not(.moved)');
        tokens.forEach(token => {
            // Remove old listeners to avoid duplicates when re-attaching
            token.removeEventListener('pointerdown', handlePointerDown);
            // Re-attach
            token.addEventListener('pointerdown', handlePointerDown);
            // Ensure cursor styling
            token.style.cursor = 'grab';
        });

        // Attach listeners for ghosts to show error on click
        const ghosts = document.querySelectorAll('.variable-token.moved');
        ghosts.forEach(ghost => {
            ghost.removeEventListener('pointerdown', handleGhostClick);
            ghost.addEventListener('pointerdown', handleGhostClick);
        });
    }

    // Setup Scopes as drop zones
    function setupDropZones() {
        // We use pointermove and pointerup on the document to track the dragging element,
        // but we need to know which scope we are currently over.
        scopes.forEach(scope => {
            // Highlight scopes when dragged over
            scope.addEventListener('pointerenter', (e) => {
                if (draggedToken && sourceScope !== scope) {
                    scope.classList.add('drag-over');
                }
            });

            scope.addEventListener('pointerleave', (e) => {
                if (draggedToken) {
                    scope.classList.remove('drag-over');
                }
            });
        });

        // Global listeners for dragging
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        // Prevent default touch actions (like scrolling) while dragging
        document.addEventListener('touchmove', (e) => {
             if (draggedToken) e.preventDefault();
        }, { passive: false });
    }

    // Drag Handlers
    function handlePointerDown(e) {
        if (e.target.closest('.variable-token.moved')) return; // Ignore ghosts

        const token = e.target.closest('.variable-token');
        if (!token) return;

        e.preventDefault(); // Prevent text selection

        draggedToken = token;
        draggedTokenDataId = token.getAttribute('data-token-id');
        sourceScope = token.closest('.scope-box');

        // Calculate offset so the token doesn't snap to pointer center
        const rect = token.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Visual setup for dragging
        token.classList.add('dragging');
        token.style.position = 'fixed';
        token.style.width = `${rect.width}px`; // Maintain width
        token.style.zIndex = 1000;

        // Move to initial position
        moveTokenTo(e.clientX, e.clientY);

        // Clear previous messages
        clearMessages();
    }

    function handlePointerMove(e) {
        if (!draggedToken) return;
        e.preventDefault();
        moveTokenTo(e.clientX, e.clientY);
    }

    function handlePointerUp(e) {
        if (!draggedToken) return;

        // Find which scope we dropped into
        // Temporarily hide the dragged token so document.elementFromPoint can see underneath
        draggedToken.style.display = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        draggedToken.style.display = 'flex'; // Restore display

        const targetScope = elementBelow ? elementBelow.closest('.scope-box') : null;

        // Cleanup drag visuals
        draggedToken.classList.remove('dragging');
        draggedToken.style.position = 'static';
        draggedToken.style.left = 'auto';
        draggedToken.style.top = 'auto';
        draggedToken.style.width = 'auto';
        draggedToken.style.zIndex = '';

        // Remove drag-over highlights
        scopes.forEach(s => s.classList.remove('drag-over'));

        if (targetScope && targetScope !== sourceScope) {
            // Valid move: Transfer Ownership
            transferOwnership(draggedToken, sourceScope, targetScope);
        } else {
            // Invalid move or dropped in same scope: Revert
            sourceScope.querySelector('.token-container').appendChild(draggedToken);
        }

        // Reset drag state
        draggedToken = null;
        draggedTokenDataId = null;
        sourceScope = null;
    }

    function moveTokenTo(x, y) {
        draggedToken.style.left = `${x - offsetX}px`;
        draggedToken.style.top = `${y - offsetY}px`;
    }

    // Ownership Logic
    function transferOwnership(token, fromScope, toScope) {
        const tokenId = token.getAttribute('data-token-id');
        const tokenName = token.querySelector('.var-name').textContent;
        const fromScopeName = fromScope.getAttribute('data-scope-id');
        const toScopeName = toScope.getAttribute('data-scope-id');

        // 1. Move the actual token to the new scope container
        toScope.querySelector('.token-container').appendChild(token);

        // 2. Create a "ghost" token in the old scope to represent the moved variable
        createGhost(tokenId, fromScope);

        // 3. Display success message
        showMessage(toScope, `Ownership of '${tokenName}' transferred to ${toScopeName}().`, 'success');
        showMessage(fromScope, `'${tokenName}' moved to ${toScopeName}().`, 'success');

        // Re-attach events (especially important if we manipulated DOM heavily)
        attachDragEvents();
    }

    function createGhost(tokenId, scope) {
        // Clone the original token's visual state to make a ghost
        // We find the active token first
        const activeToken = document.querySelector(`.variable-token[data-token-id="${tokenId}"]:not(.moved)`);
        if (!activeToken) return;

        const ghost = activeToken.cloneNode(true);
        // Modify ghost properties
        ghost.removeAttribute('id'); // Ensure unique IDs
        ghost.classList.add('moved');
        ghost.setAttribute('draggable', 'false');

        // Append to the scope that lost ownership
        scope.querySelector('.token-container').appendChild(ghost);

        // Update tracking map
        if (!ghostMap.has(tokenId)) {
            ghostMap.set(tokenId, new Set());
        }
        ghostMap.get(tokenId).add(scope.getAttribute('data-scope-id'));
    }

    // Handle clicking on a ghost (moved variable)
    function handleGhostClick(e) {
        const ghost = e.currentTarget;
        const name = ghost.querySelector('.var-name').textContent;
        const scope = ghost.closest('.scope-box');

        showMessage(scope, `Error: Use of moved value '${name}'. Ownership was transferred.`, 'error');

        // Add a visual shake to the ghost
        ghost.style.animation = 'shake 0.4s';
        setTimeout(() => {
             ghost.style.animation = 'none';
        }, 400);
    }

    // Utility: Messaging
    function showMessage(scope, text, type) {
        const msgDiv = scope.querySelector('.status-msg');
        msgDiv.textContent = text;
        msgDiv.className = `status-msg ${type}`;

        // Clear message after a delay
        setTimeout(() => {
            if (msgDiv.textContent === text) {
                msgDiv.textContent = '';
                msgDiv.className = 'status-msg';
            }
        }, 4000);
    }

    function clearMessages() {
        scopes.forEach(scope => {
            const msgDiv = scope.querySelector('.status-msg');
            msgDiv.textContent = '';
            msgDiv.className = 'status-msg';
        });
    }

    // Features: Reset and Clone
    function resetDemo() {
        // Clear all containers
        scopes.forEach(scope => {
            scope.querySelector('.token-container').innerHTML = '';
        });

        // Re-create initial state in main
        const mainScope = document.getElementById('scope-main');
        const container = mainScope.querySelector('.token-container');

        container.innerHTML = `
            <div class="variable-token" id="token-s1" data-token-id="s1">
                <span class="var-type">String</span>
                <span class="var-name">s1</span>
                <span class="var-value">"hello"</span>
            </div>
            <div class="variable-token" id="token-v" data-token-id="v">
                <span class="var-type">Vec&lt;i32&gt;</span>
                <span class="var-name">v</span>
                <span class="var-value">[1, 2, 3]</span>
            </div>
        `;

        ghostMap.clear();
        cloneCounter = 1;
        clearMessages();
        attachDragEvents();
    }

    function cloneVariable() {
        // Find an active variable in main to clone (or any scope)
        // For simplicity, we'll clone 's1' if it exists, or the first active one we find
        const activeTokens = document.querySelectorAll('.variable-token:not(.moved)');
        if (activeTokens.length === 0) {
            alert("No active variables to clone!");
            return;
        }

        // Pick the first active token
        const sourceToken = activeTokens[0];
        const sourceScope = sourceToken.closest('.scope-box');

        const newId = `clone_${cloneCounter++}`;
        const baseName = sourceToken.querySelector('.var-name').textContent;
        const newName = `${baseName}_clone`;

        const clone = sourceToken.cloneNode(true);
        clone.id = `token-${newId}`;
        clone.setAttribute('data-token-id', newId);
        clone.querySelector('.var-name').textContent = newName;

        // Add to the same scope
        sourceScope.querySelector('.token-container').appendChild(clone);

        showMessage(sourceScope, `Cloned '${baseName}' into new independent variable '${newName}'.`, 'success');

        attachDragEvents();
    }

    // Start
    init();
});