
class BrainfuckInterpreter {
  constructor() {
    this.memory = new Uint8Array(30000);
    this.pointer = 0;
    this.pc = 0; // Program Counter
    this.code = "";
    this.loopStack = [];
    this.output = "";
    this.finished = false;
    this.bracketMap = {};
  }

  load(code) {
    this.memory.fill(0);
    this.pointer = 0;
    this.pc = 0;
    this.code = code;
    this.loopStack = [];
    this.output = "";
    this.finished = false;
    this.precomputeLoops();
  }

  precomputeLoops() {
    this.bracketMap = {};
    const stack = [];
    for (let i = 0; i < this.code.length; i++) {
      if (this.code[i] === '[') {
        stack.push(i);
      } else if (this.code[i] === ']') {
        if (stack.length > 0) {
          const start = stack.pop();
          this.bracketMap[start] = i;
          this.bracketMap[i] = start;
        }
      }
    }
  }

  step() {
    if (this.pc >= this.code.length) {
      this.finished = true;
      return false;
    }

    const command = this.code[this.pc];

    switch (command) {
      case '>':
        this.pointer++;
        if (this.pointer >= this.memory.length) this.pointer = 0;
        break;
      case '<':
        this.pointer--;
        if (this.pointer < 0) this.pointer = this.memory.length - 1;
        break;
      case '+':
        this.memory[this.pointer]++;
        break;
      case '-':
        this.memory[this.pointer]--;
        break;
      case '.':
        this.output += String.fromCharCode(this.memory[this.pointer]);
        break;
      case ',':
        // Input not supported in this demo
        break;
      case '[':
        if (this.memory[this.pointer] === 0) {
          if (this.bracketMap.hasOwnProperty(this.pc)) {
            this.pc = this.bracketMap[this.pc];
          }
        }
        break;
      case ']':
        if (this.memory[this.pointer] !== 0) {
          if (this.bracketMap.hasOwnProperty(this.pc)) {
            this.pc = this.bracketMap[this.pc];
          }
        }
        break;
    }

    this.pc++;
    return true;
  }
}

class TapeVisualizer {
  constructor(canvas, interpreter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.interpreter = interpreter;
    this.cellSize = 50;
    this.padding = 20;
    this.cols = 0;
    this.rows = 0;
    this.headX = 0;
    this.headY = 0;
    this.targetHeadX = 0;
    this.targetHeadY = 0;
    this.lastPage = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;

        this.cols = Math.floor((this.canvas.width - this.padding * 2) / this.cellSize);
        this.rows = Math.floor((this.canvas.height - this.padding * 2) / this.cellSize);
        // Ensure at least 1x1
        this.cols = Math.max(1, this.cols);
        this.rows = Math.max(1, this.rows);

        this.updateHeadPosition(false);
    }
  }

  getCoordinates(index) {
    const totalCells = this.cols * this.rows;
    const page = Math.floor(index / totalCells);
    const localIndex = index % totalCells;

    const row = Math.floor(localIndex / this.cols);
    let col = localIndex % this.cols;

    if (row % 2 === 1) {
      col = this.cols - 1 - col; // Reverse direction on odd rows (snake)
    }

    const x = this.padding + col * this.cellSize + this.cellSize / 2;
    const y = this.padding + row * this.cellSize + this.cellSize / 2;

    return { x, y, page };
  }

  updateHeadPosition(smooth = true) {
    const coords = this.getCoordinates(this.interpreter.pointer);

    if (this.lastPage !== coords.page) {
        smooth = false;
    }
    this.lastPage = coords.page;

    this.targetHeadX = coords.x;
    this.targetHeadY = coords.y;

    if (!smooth) {
      this.headX = this.targetHeadX;
      this.headY = this.targetHeadY;
    }
  }

  lerp(start, end, t) {
      return start * (1 - t) + end * t;
  }

  draw() {
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const totalCells = this.cols * this.rows;
    const currentPage = Math.floor(this.interpreter.pointer / totalCells);
    const startIdx = currentPage * totalCells;

    // Draw Tape Path (Tracks)
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 10;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();

    for (let i = 0; i < totalCells; i++) {
        const memIdx = startIdx + i;
        if (memIdx >= this.interpreter.memory.length) break;
        const coords = this.getCoordinates(memIdx);
        if (i === 0) this.ctx.moveTo(coords.x, coords.y);
        else this.ctx.lineTo(coords.x, coords.y);
    }
    this.ctx.stroke();

    // Draw Cells
    for (let i = 0; i < totalCells; i++) {
        const memIdx = startIdx + i;
        if (memIdx >= this.interpreter.memory.length) break;

        const coords = this.getCoordinates(memIdx);

        // Plate
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(coords.x, coords.y, this.cellSize / 2 - 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Value
        const val = this.interpreter.memory[memIdx];
        this.ctx.fillStyle = val === 0 ? '#666' : '#f0a500';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(val.toString(), coords.x, coords.y);
    }

    // Animate Head
    this.headX = this.lerp(this.headX, this.targetHeadX, 0.2);
    this.headY = this.lerp(this.headY, this.targetHeadY, 0.2);

    // Draw Head
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';

    // Outer Ring
    this.ctx.strokeStyle = '#f0a500';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(this.headX, this.headY, this.cellSize / 2, 0, Math.PI * 2);
    this.ctx.stroke();

    // Crosshair
    this.ctx.strokeStyle = 'rgba(240, 165, 0, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.headX - 10, this.headY);
    this.ctx.lineTo(this.headX + 10, this.headY);
    this.ctx.moveTo(this.headX, this.headY - 10);
    this.ctx.lineTo(this.headX, this.headY + 10);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    // Page Indicator (if multiple pages)
    if (this.interpreter.memory.length > totalCells) {
        this.ctx.fillStyle = '#555';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Page ${currentPage + 1}`, this.canvas.width - 10, this.canvas.height - 10);
    }
  }
}

if (typeof window !== 'undefined') {
    const codeInput = document.getElementById('code-input');
    const outputDisplay = document.getElementById('output-display');
    const btnPlay = document.getElementById('btn-play-pause');
    const btnStep = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');
    const speedSlider = document.getElementById('speed-slider');
    const canvas = document.getElementById('tape-canvas');

    const interpreter = new BrainfuckInterpreter();
    const visualizer = new TapeVisualizer(canvas, interpreter);

    let isPlaying = false;
    let lastStepTime = 0;

    function updateOutput() {
        outputDisplay.textContent = interpreter.output;
        outputDisplay.scrollTop = outputDisplay.scrollHeight;
    }

    function reset() {
        interpreter.load(codeInput.value);
        outputDisplay.textContent = "";
        visualizer.updateHeadPosition(false);
        isPlaying = false;
        btnPlay.textContent = "▶ Play";
        visualizer.draw();
    }

    function step() {
        if (!interpreter.step()) {
            isPlaying = false;
            btnPlay.textContent = "▶ Play";
            return;
        }
        visualizer.updateHeadPosition();
        updateOutput();
    }

    function loop(timestamp) {
        visualizer.draw();

        if (isPlaying) {
            // Speed mapping:
            // 1 -> 1 step/sec (1000ms)
            // 60 -> 60 step/sec (16ms)
            // Formula: 1000 / value
            const speed = parseInt(speedSlider.value);
            const delay = 1000 / speed;

            if (timestamp - lastStepTime > delay) {
                step();
                lastStepTime = timestamp;
            }
        }

        requestAnimationFrame(loop);
    }

    btnReset.addEventListener('click', reset);

    btnStep.addEventListener('click', () => {
        isPlaying = false;
        btnPlay.textContent = "▶ Play";
        step();
    });

    btnPlay.addEventListener('click', () => {
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? "⏸ Pause" : "▶ Play";
    });

    codeInput.addEventListener('input', () => {
        reset();
    });

    // Initialize
    reset();
    requestAnimationFrame(loop);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrainfuckInterpreter };
}
