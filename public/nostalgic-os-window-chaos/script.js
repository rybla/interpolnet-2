// Nostalgic OS Window Chaos - Main Logic

// --- Canvas Logic for Infinite Trails ---
const canvas = document.getElementById('trail-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawWindowToCanvas(x, y, width, height, title, type) {
    // Colors from CSS variables (hardcoded here for performance/simplicity in canvas)
    const cSilver = '#c0c0c0';
    const cGray = '#808080';
    const cWhite = '#ffffff';
    const cBlack = '#000000';
    const cNavy = '#000080';
    const cTeal = '#008080';

    // Window Body
    ctx.fillStyle = cSilver;
    ctx.fillRect(x, y, width, height);

    // 3D Borders (Outset)
    // Top & Left (Light)
    ctx.fillStyle = '#dfdfdf'; // lighter silver
    ctx.fillRect(x, y, width, 2);
    ctx.fillRect(x, y, 2, height);
    // Bottom & Right (Dark)
    ctx.fillStyle = cBlack;
    ctx.fillRect(x, y + height - 2, width, 2);
    ctx.fillRect(x + width - 2, y, 2, height);
    // Inner Shadow (Bottom Right inner)
    ctx.fillStyle = cGray;
    ctx.fillRect(x + width - 4, y + 2, 2, height - 4);
    ctx.fillRect(x + 2, y + height - 4, width - 4, 2);


    // Title Bar
    const titleBarHeight = 20; // Approx
    ctx.fillStyle = cNavy;
    ctx.fillRect(x + 4, y + 4, width - 8, titleBarHeight);

    // Title Text
    ctx.fillStyle = cWhite;
    ctx.font = 'bold 12px "Segoe UI", Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + 6, y + 4 + titleBarHeight / 2);

    // Content Area
    const contentY = y + 4 + titleBarHeight + 2;
    const contentHeight = height - (contentY - y) - 6;
    const contentWidth = width - 8;

    if (type === 'notepad') {
        ctx.fillStyle = cWhite;
        ctx.fillRect(x + 4, contentY, contentWidth, contentHeight);
        // Inset Border for content
        ctx.fillStyle = cGray;
        ctx.fillRect(x + 4, contentY, contentWidth, 2);
        ctx.fillRect(x + 4, contentY, 2, contentHeight);
    } else if (type === 'image') {
        ctx.fillStyle = cBlack;
        ctx.fillRect(x + 4, contentY, contentWidth, contentHeight);
    } else {
        // Default gray body
    }
}


// --- Window Manager Logic ---
class WindowManager {
    constructor() {
        this.desktop = document.getElementById('desktop-ui');
        this.taskbarWindows = document.getElementById('taskbar-windows');
        this.windows = [];
        this.zIndexCounter = 100;
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };

        // Bind global events
        window.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Start Menu Logic
        this.startMenu = document.getElementById('start-menu');
        this.startButton = document.getElementById('start-button');

        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Clock
        this.updateClock();
        setInterval(this.updateClock.bind(this), 1000);

        // Initial Windows
        this.spawnWindow('notepad');
    }

    toggleStartMenu() {
        const isHidden = this.startMenu.classList.contains('hidden');
        if (isHidden) {
            this.startMenu.classList.remove('hidden');
            this.startButton.classList.add('active');
        } else {
            this.startMenu.classList.add('hidden');
            this.startButton.classList.remove('active');
        }
    }

    closeStartMenu() {
        this.startMenu.classList.add('hidden');
        this.startButton.classList.remove('active');
    }

    updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
    }

    spawnWindow(type) {
        this.closeStartMenu();
        const id = 'win-' + Date.now();
        const win = document.createElement('div');
        win.classList.add('window', type);
        win.id = id;
        win.style.zIndex = ++this.zIndexCounter;

        // Random Position
        const x = 50 + Math.random() * (window.innerWidth - 400);
        const y = 50 + Math.random() * (window.innerHeight - 300);
        win.style.left = `${x}px`;
        win.style.top = `${y}px`;

        let title = 'Application';
        let content = '';

        if (type === 'notepad') {
            title = 'Untitled - Notepad';
            content = `<div class="window-body" contenteditable="true">I love the smell of CRT monitors in the morning...</div>`;
        } else if (type === 'error') {
            title = 'Critical Error';
            content = `
                <div class="window-body">
                    <div class="error-icon-lg">!</div>
                    <div>
                        <p>This program has performed an illegal operation.</p>
                        <button onclick="windowManager.closeWindow('${id}')" style="margin-top:10px;">Close</button>
                    </div>
                </div>`;
        } else if (type === 'image') {
            title = 'My Picture.bmp';
            content = `<div class="window-body" style="color:white;">[IMAGE PLACEHOLDER]</div>`;
        }

        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <div class="window-button min">_</div>
                    <div class="window-button max">□</div>
                    <div class="window-button close" onclick="windowManager.closeWindow('${id}')">X</div>
                </div>
            </div>
            ${content}
        `;

        this.desktop.appendChild(win);
        this.windows.push({ id, element: win, type, title });
        this.createTaskbarItem(id, title);
    }

    closeWindow(id) {
        const winIndex = this.windows.findIndex(w => w.id === id);
        if (winIndex > -1) {
            const win = this.windows[winIndex];
            win.element.remove();
            this.windows.splice(winIndex, 1);

            // Remove taskbar item
            const tbItem = document.getElementById(`tb-${id}`);
            if (tbItem) tbItem.remove();
        }
    }

    createTaskbarItem(id, title) {
        const item = document.createElement('div');
        item.id = `tb-${id}`;
        item.classList.add('taskbar-item', 'active');
        item.textContent = title;
        item.onclick = () => this.focusWindow(id);
        this.taskbarWindows.appendChild(item);
    }

    focusWindow(id) {
        const win = this.windows.find(w => w.id === id);
        if (win) {
            win.element.style.zIndex = ++this.zIndexCounter;
            // Update active state in taskbar
            document.querySelectorAll('.taskbar-item').forEach(el => el.classList.remove('active'));
            const tbItem = document.getElementById(`tb-${id}`);
            if (tbItem) tbItem.classList.add('active');

            // Visual active state for title bar (optional: toggle .inactive class on others)
            document.querySelectorAll('.title-bar').forEach(el => el.classList.add('inactive'));
            win.element.querySelector('.title-bar').classList.remove('inactive');
        }
    }

    handleMouseDown(e) {
        // Click outside start menu closes it
        if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
            this.closeStartMenu();
        }

        const titleBar = e.target.closest('.title-bar');
        if (titleBar) {
            const winEl = titleBar.closest('.window');
            if (winEl) {
                this.isDragging = true;
                this.dragTarget = winEl;

                // Focus the window
                this.focusWindow(winEl.id);

                const rect = winEl.getBoundingClientRect();
                this.dragOffset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && this.dragTarget) {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.dragTarget.style.left = `${x}px`;
            this.dragTarget.style.top = `${y}px`;

            // --- TRAIL EFFECT ---
            // Draw the stamp of the window onto the canvas
            const rect = this.dragTarget.getBoundingClientRect();
            const winObj = this.windows.find(w => w.id === this.dragTarget.id);

            if (winObj) {
                drawWindowToCanvas(x, y, rect.width, rect.height, winObj.title, winObj.type);
            }
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.dragTarget = null;
    }

    triggerBSOD() {
        this.closeStartMenu();
        const bsod = document.getElementById('bsod-overlay');
        bsod.classList.remove('hidden');

        // Wait for keypress to reset
        const resetHandler = (e) => {
            // Any key resets
            window.removeEventListener('keydown', resetHandler);
            bsod.classList.add('hidden');
            this.resetSystem();
        };

        // Small delay so the enter key from menu doesn't trigger it immediately if using keyboard
        setTimeout(() => {
            window.addEventListener('keydown', resetHandler);
            window.addEventListener('mousedown', resetHandler);
        }, 500);
    }

    resetSystem() {
        // Clear Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Close all windows
        [...this.windows].forEach(w => this.closeWindow(w.id));

        // Spawn default
        this.spawnWindow('notepad');
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.windowManager = new WindowManager();
}

// Export for verification if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WindowManager, drawWindowToCanvas };
}
