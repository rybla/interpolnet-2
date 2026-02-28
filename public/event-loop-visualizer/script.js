// Utility to generate a unique ID
function uuid() {
    return Math.random().toString(36).substr(2, 9);
}

// Configuration
const CONFIG = {
    baseTickInterval: 1000,   // Base time in ms for an event loop tick
    syncProcessTime: 500,     // Time it takes to "process" a task on the stack
    apiDelayTime: 1500,       // Base time a task spends in Web API
    animationDuration: 300    // CSS animation duration matching .anim-enter/.anim-leave
};

// Represents a single unit of work
class Task {
    constructor(type, label) {
        this.id = uuid();
        this.type = type; // 'sync', 'macrotask', 'microtask'
        this.label = label;
        this.element = this.createElement();
    }

    createElement() {
        const el = document.createElement('div');
        el.className = `task task-${this.type === 'macrotask' ? 'macro' : this.type === 'microtask' ? 'micro' : 'sync'} anim-enter`;
        el.textContent = this.label;
        el.id = this.id;
        return el;
    }
}

class EventLoopManager {
    constructor() {
        // Data Structures (Logical state)
        this.callStack = [];     // Array functioning as a stack (push/pop)
        this.webApis = new Map(); // Map to hold currently "waiting" tasks
        this.microtaskQueue = []; // Array functioning as a queue (push/shift)
        this.taskQueue = [];      // Array functioning as a queue (push/shift)

        // DOM Elements
        this.domStack = document.getElementById('call-stack');
        this.domApis = document.getElementById('web-apis');
        this.domMicro = document.getElementById('microtask-queue');
        this.domMacro = document.getElementById('task-queue');

        // Speed Control
        this.speedMultiplier = 1;
        this.isProcessing = false; // Flag to prevent concurrent stack processing

        this.initEventListeners();
        this.startLoop();
    }

    initEventListeners() {
        // Controls
        document.getElementById('btn-sync').addEventListener('click', () => this.addSyncTask());
        document.getElementById('btn-macrotask').addEventListener('click', () => this.addMacrotask());
        document.getElementById('btn-microtask').addEventListener('click', () => this.addMicrotask());

        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');

        speedSlider.addEventListener('input', (e) => {
            this.speedMultiplier = parseFloat(e.target.value);
            speedDisplay.textContent = `${this.speedMultiplier.toFixed(1)}x`;
        });
    }

    // --- Task Addition Methods ---

    addSyncTask() {
        const task = new Task('sync', 'console.log()');
        this.pushToStack(task);
    }

    addMacrotask() {
        const setupTask = new Task('sync', 'setTimeout()');
        this.pushToStack(setupTask);

        // Simulate moving the callback to Web API after setTimeout is called
        setTimeout(() => {
            const apiTask = new Task('macrotask', 'Timer Callback');
            apiTask.element.classList.add('api-waiting');
            this.moveToWebApi(apiTask);

            // Simulate timer completing
            setTimeout(() => {
                this.moveToTaskQueue(apiTask);
            }, (CONFIG.apiDelayTime) / this.speedMultiplier);

        }, (CONFIG.syncProcessTime + 50) / this.speedMultiplier);
    }

    addMicrotask() {
        const setupTask = new Task('sync', 'Promise.resolve()');
        this.pushToStack(setupTask);

        // Simulate adding to microtask queue after Promise resolves
        setTimeout(() => {
            const microTask = new Task('microtask', 'Promise .then()');
            this.moveToMicrotaskQueue(microTask);
        }, (CONFIG.syncProcessTime + 50) / this.speedMultiplier);
    }

    // --- State & DOM Manipulation Methods ---

    pushToStack(task) {
        this.callStack.push(task);
        // Prepend because flex-direction: column-reverse handles visual stacking bottom-up
        this.domStack.prepend(task.element);
    }

    moveToWebApi(task) {
        this.webApis.set(task.id, task);
        this.domApis.appendChild(task.element);
    }

    moveToTaskQueue(task) {
        if(this.webApis.has(task.id)) {
            this.webApis.delete(task.id);
            task.element.classList.remove('api-waiting');
        }
        this.taskQueue.push(task);
        this.domMacro.appendChild(task.element);
    }

    moveToMicrotaskQueue(task) {
        this.microtaskQueue.push(task);
        this.domMicro.appendChild(task.element);
    }

    // --- The Core Event Loop Logic ---

    startLoop() {
        const tick = () => {
            if (!this.isProcessing) {
                this.processNext();
            }

            // Re-schedule tick based on current speed
            setTimeout(tick, CONFIG.baseTickInterval / this.speedMultiplier);
        };
        tick();
    }

    processNext() {
        // 1. Check Call Stack
        if (this.callStack.length > 0) {
            this.executeTopStackItem();
            return;
        }

        // 2. If Call Stack is empty, check Microtask Queue
        if (this.microtaskQueue.length > 0) {
            const task = this.microtaskQueue.shift();
            // Move from Microtask Queue to Stack
            if (task.element.parentNode === this.domMicro) {
                this.domMicro.removeChild(task.element);
            }
            this.pushToStack(task);
            this.executeTopStackItem();
            return;
        }

        // 3. If Call Stack AND Microtask Queue are empty, check Task Queue (Macrotasks)
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
             // Move from Task Queue to Stack
             if (task.element.parentNode === this.domMacro) {
                this.domMacro.removeChild(task.element);
            }
            this.pushToStack(task);
            this.executeTopStackItem();
            return;
        }
    }

    executeTopStackItem() {
        if (this.callStack.length === 0) return;
        this.isProcessing = true;

        const task = this.callStack.pop(); // Pop immediately from logical state

        // Simulate execution time
        setTimeout(() => {
            // Remove from DOM with animation
            task.element.classList.remove('anim-enter');
            task.element.classList.add('anim-leave');

            setTimeout(() => {
                // Actually remove from state and DOM after animation
                if (task.element.parentNode) {
                    task.element.parentNode.removeChild(task.element);
                }
                this.isProcessing = false;

                // Immediately try to process next item (drains stack quickly if needed)
                this.processNext();

            }, CONFIG.animationDuration);

        }, CONFIG.syncProcessTime / this.speedMultiplier);
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.eventLoopManager = new EventLoopManager();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventLoopManager, Task };
}