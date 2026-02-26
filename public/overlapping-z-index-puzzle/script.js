const container = document.getElementById('modal-container');
const introOverlay = document.getElementById('intro-overlay');
const beginBtn = document.getElementById('begin-btn');
const winScreen = document.getElementById('win-screen');
const resetBtn = document.getElementById('reset-btn');
const startBtn = document.getElementById('start-btn');
const clockEl = document.getElementById('clock');

let modals = [];
let nextZIndex = 1;
let gameActive = false;
let spawnInterval;
let startTime;

const THEMES = ['theme-win95', 'theme-mac', 'theme-terminal'];
const MESSAGES = [
    "Error: Operation failed successfully.",
    "Warning: Low disk space.",
    "System Alert: Virus detected.",
    "Update available: install now?",
    "Critical Failure: Kernel Panic.",
    "Connection lost. Reconnecting...",
    "File not found: system32.dll",
    "Illegal operation performed.",
    "Memory leak detected.",
    "Task failed. Retry?",
    "Keyboard not responding.",
    "Mouse trapped in infinite loop.",
    "Blue Screen of Death imminent.",
    "Deleting all files...",
    "Access Denied.",
    "Password incorrect.",
    "User authentication failed.",
    "Network unreachable.",
    "Printing... (0%)",
    "Buffering... 99%"
];

class Modal {
    constructor(id, x, y, theme, message, isLocked = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.theme = theme;
        this.message = message;
        this.isLocked = isLocked;
        this.zIndex = nextZIndex++;
        this.width = 300; // Default width
        this.height = 150; // Default height

        this.element = this.createDOM();
        this.pinnedBy = []; // IDs of modals that must be moved/closed before this one

        modals.push(this);
        this.render();
    }

    createDOM() {
        const el = document.createElement('div');
        el.classList.add('modal', this.theme);
        el.id = `modal-${this.id}`;
        el.style.width = `${this.width}px`;
        el.style.zIndex = this.zIndex;

        // Header
        const header = document.createElement('div');
        header.classList.add('modal-header');
        header.innerText = "System Alert";

        // Body
        const body = document.createElement('div');
        body.classList.add('modal-body');
        body.innerHTML = `<p>${this.message}</p>`;

        // Footer / Buttons
        const footer = document.createElement('div');
        footer.classList.add('modal-footer');

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('modal-btn');
        closeBtn.innerText = this.isLocked ? "LOCKED" : "OK";

        if (this.isLocked) {
            closeBtn.classList.add('locked');
            closeBtn.disabled = true;
        }

        closeBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Prevent drag start
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isLocked) {
                this.close();
            }
        });

        footer.appendChild(closeBtn);
        el.appendChild(header);
        el.appendChild(body);
        el.appendChild(footer);

        container.appendChild(el);

        // Dragging Logic
        el.addEventListener('mousedown', (e) => this.startDrag(e));
        // Touch support
        el.addEventListener('touchstart', (e) => this.startDrag(e));

        return el;
    }

    render() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    startDrag(e) {
        if (!gameActive) return;

        // Bring to front logic (optional, maybe puzzle is harder if you can't?)
        // Let's allow simple z-index swap to top on click?
        // Or strictly strictly strictly strictly strictly strictly strictly stack based.
        // The prompt says "Overlapping Z-Index Puzzle", "stacking order is constrained".
        // Let's implement a rule: You can only drag the TOPMOST modal at that point?
        // Or you can drag any, but it stays at its z-index layer.
        // Let's go with: You can drag, but you can't change z-index easily.

        e.preventDefault(); // Prevent text selection

        // Identify if we are "pinned" by a modal with higher z-index that overlaps us
        if (this.isPinned()) {
            this.shake();
            return;
        }

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const startX = this.x;
        const startY = this.y;
        const mouseStartX = clientX;
        const mouseStartY = clientY;

        const onMove = (moveEvent) => {
            const moveClientX = moveEvent.type.startsWith('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveClientY = moveEvent.type.startsWith('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const dx = moveClientX - mouseStartX;
            const dy = moveClientY - mouseStartY;

            this.x = startX + dx;
            this.y = startY + dy;

            // Boundary checks
            const maxX = window.innerWidth - this.width;
            const maxY = window.innerHeight - this.height - 40; // Taskbar height

            this.x = Math.max(0, Math.min(this.x, maxX));
            this.y = Math.max(0, Math.min(this.y, maxY));

            this.render();
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
            this.element.classList.remove('dragging');
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);

        this.element.classList.add('dragging');
    }

    isPinned() {
        // Check if any modal with a HIGHER z-index overlaps this one
        const myRect = {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };

        for (const other of modals) {
            if (other === this) continue;
            if (other.zIndex > this.zIndex) {
                const otherRect = {
                    left: other.x,
                    right: other.x + other.width,
                    top: other.y,
                    bottom: other.y + other.height
                };

                if (this.rectIntersect(myRect, otherRect)) {
                    return true;
                }
            }
        }
        return false;
    }

    rectIntersect(r1, r2) {
        return !(r2.left > r1.right ||
                 r2.right < r1.left ||
                 r2.top > r1.bottom ||
                 r2.bottom < r1.top);
    }

    shake() {
        this.element.style.transform = "translateX(5px)";
        setTimeout(() => {
            this.element.style.transform = "translateX(-5px)";
            setTimeout(() => {
                this.element.style.transform = "translateX(5px)";
                setTimeout(() => {
                    this.element.style.transform = "none";
                }, 50);
            }, 50);
        }, 50);
    }

    close() {
        this.element.remove();
        modals = modals.filter(m => m !== this);

        // Spawn unlocked modal logic (optional) or just reduce count
        checkWinCondition();
    }
}

function spawnModal() {
    if (!gameActive) return;

    // Center-ish spawn with some randomness
    const x = Math.random() * (window.innerWidth - 320);
    const y = Math.random() * (window.innerHeight - 200);

    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    // Create dependencies: Occasionally create a "key" modal that unlocks another?
    // For now, let's keep it simple: Just visual overlap puzzle.

    new Modal(Date.now() + Math.random(), x, y, theme, msg);
}

function initGame() {
    gameActive = true;
    modals.forEach(m => m.element.remove());
    modals = [];
    nextZIndex = 1;

    introOverlay.classList.add('hidden');
    winScreen.classList.add('hidden');

    // Initial spawn burst
    for(let i=0; i<5; i++) {
        setTimeout(spawnModal, i * 200);
    }

    // Continuous pressure
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (modals.length < 20) { // Cap at 20 to prevent browser death
            spawnModal();
        }
    }, 2000); // New modal every 2 seconds
}

function checkWinCondition() {
    if (modals.length === 0 && gameActive) {
        // You win!
        clearInterval(spawnInterval);
        gameActive = false;
        winScreen.classList.remove('hidden');
    }
}

// Clock
setInterval(() => {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}, 1000);

beginBtn.addEventListener('click', initGame);
resetBtn.addEventListener('click', initGame);

// Start button joke
startBtn.addEventListener('click', () => {
    if (gameActive) {
        // Spawn 3 modals instantly as punishment
        spawnModal();
        spawnModal();
        spawnModal();
    }
});

// Initial resize handler
window.addEventListener('resize', () => {
    // Ideally adjust modal positions to stay on screen
});
