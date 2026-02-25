// Audio Reactive Interface Logic

class AudioController {
    constructor() {
        this.ctx = null;
        this.analyser = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.bpm = 120;
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25;
        this.timerID = null;
        this.beatCount = 0;

        // Sequencer patterns
        this.kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
        this.bassPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
        this.hatPattern  = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
    }

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
    }

    start() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.nextNoteTime = this.ctx.currentTime;
            this.timerID = setInterval(() => this.scheduler(), this.lookahead);
        }
    }

    stop() {
        this.isPlaying = false;
        clearInterval(this.timerID);
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
        }
    }

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.beatCount, this.nextNoteTime);
            this.nextStep();
        }
    }

    nextStep() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.beatCount = (this.beatCount + 1) % 16;
    }

    scheduleNote(beatNumber, time) {
        if (this.kickPattern[beatNumber]) {
            this.triggerKick(time);
        }
        if (this.bassPattern[beatNumber]) {
            this.triggerBass(time, 110); // A2
        }
        if (this.hatPattern[beatNumber]) {
            this.triggerHat(time);
        }
    }

    triggerKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    triggerBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.linearRampToValueAtTime(freq / 2, time + 0.1);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    triggerHat(time) {
        // Simple white noise buffer or high freq osc
        const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = this.ctx.createGain();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.start(time);
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getTimeDomainData() {
        if (!this.analyser) return new Uint8Array(0);
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }
}

class Renderer {
    constructor(canvasId, audio) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audio = audio;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // UI Element State
        this.playBtn = { x: 0, y: 0, size: 80, currentPath: new Path2D() };
        this.volumeBar = { x: 0, y: 0, width: 40, height: 300, level: 0.5, currentPath: new Path2D() };
        this.timeline = { x: 0, y: 0, width: 0, height: 4, currentPath: new Path2D() };

        this.resize();

        // Shake offset
        this.shakeX = 0;
        this.shakeY = 0;

        window.addEventListener('resize', () => this.resize());

        // Draw initial state
        requestAnimationFrame(() => this.draw());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Reposition elements
        this.playBtn.x = this.width / 2;
        this.playBtn.y = this.height / 2;

        this.volumeBar.x = this.width * 0.85;
        this.volumeBar.y = this.height / 2 - 150;

        this.timeline.x = this.width * 0.1;
        this.timeline.y = this.height * 0.8;
        this.timeline.width = this.width * 0.8;
    }

    startLoop() {
        const loop = () => {
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const freqData = this.audio.getFrequencyData();
        const timeData = this.audio.getTimeDomainData();

        // Calculate Bass Impact (0-50Hz approx)
        let bassEnergy = 0;
        if (freqData.length > 0) {
            for (let i = 0; i < 10; i++) {
                bassEnergy += freqData[i];
            }
            bassEnergy /= 10;
        }

        // Global Shake
        const shakeIntensity = Math.pow(bassEnergy / 255, 3) * 30; // Exponential shake
        this.shakeX = (Math.random() - 0.5) * shakeIntensity;
        this.shakeY = (Math.random() - 0.5) * shakeIntensity;

        this.ctx.save();
        this.ctx.translate(this.shakeX, this.shakeY);

        this.drawPlayButton(freqData, bassEnergy);
        this.drawTimeline(timeData, bassEnergy);
        this.drawVolume(freqData, bassEnergy);

        this.ctx.restore();
    }

    drawPlayButton(freqData, energy) {
        const { x, y, size } = this.playBtn;
        const half = size / 2;

        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#0f0';

        const path = new Path2D();

        if (this.audio.isPlaying) {
            // Draw Pause Bars
            const barWidth = size / 3;
            const separation = 10 + (energy / 10); // Separation breathes with bass

            // Left Bar
            // We'll create a "wobbly" rectangle
            this.drawWobblyRect(path, x - half, y - half, barWidth, size, freqData);
            // Right Bar
            this.drawWobblyRect(path, x - half + barWidth + separation, y - half, barWidth, size, freqData);

        } else {
            // Draw Play Triangle
            // Vertices
            const p1 = { x: x - half, y: y - half };
            const p2 = { x: x + half, y: y };
            const p3 = { x: x - half, y: y + half };

            // Distort vertices based on freq
            // Low freq affects P1, Mid P2, High P3
            const d1 = this.getDistortion(freqData, 0);
            const d2 = this.getDistortion(freqData, 20);
            const d3 = this.getDistortion(freqData, 40);

            path.moveTo(p1.x + d1.x, p1.y + d1.y);
            path.lineTo(p2.x + d2.x, p2.y + d2.y);
            path.lineTo(p3.x + d3.x, p3.y + d3.y);
            path.closePath();
        }

        this.playBtn.currentPath = path; // Save for hit testing (relative to shake)
        this.ctx.stroke(path);
    }

    drawWobblyRect(path, x, y, w, h, freqData) {
        // Draw a rectangle but with jagged lines
        const segments = 5;
        path.moveTo(x, y);

        // Top edge
        for(let i=1; i<=segments; i++) {
             const d = this.getDistortion(freqData, i*2);
             path.lineTo(x + (w/segments)*i, y + d.y);
        }
        // Right edge
        for(let i=1; i<=segments; i++) {
             const d = this.getDistortion(freqData, i*3 + 10);
             path.lineTo(x + w + d.x, y + (h/segments)*i);
        }
        // Bottom edge
        for(let i=1; i<=segments; i++) {
             const d = this.getDistortion(freqData, i*4 + 20);
             path.lineTo(x + w - (w/segments)*i, y + h + d.y);
        }
        // Left edge
        for(let i=1; i<=segments; i++) {
             const d = this.getDistortion(freqData, i*5 + 30);
             path.lineTo(x + d.x, y + h - (h/segments)*i);
        }
        path.closePath();
    }

    drawTimeline(timeData, energy) {
        const { x, y, width } = this.timeline;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#0ff'; // Cyan
        this.ctx.shadowColor = '#0ff';

        // Determine number of points based on width
        const points = width / 5;

        this.ctx.moveTo(x, y);

        // Draw waveform
        for(let i = 0; i < points; i++) {
            // Map i to timeData index
            let v = 0;
            if (timeData.length > 0) {
                const dataIndex = Math.floor(i / points * timeData.length);
                v = (timeData[dataIndex] / 128.0) - 1.0; // -1 to 1
            }

            // Amplitude scales with energy
            const amp = 50 * (energy / 255 + 0.1);

            this.ctx.lineTo(x + i * 5, y + v * amp);
        }

        const path = new Path2D();
        path.addPath(this.ctx.currentPath); // Not supported in all contexts but let's try manual path storage if needed
        // Actually, for timeline hit detection, we treat it as a box around the line

        this.ctx.stroke();

        // Draw Playhead
        // In this loop-based demo, playhead moves 0-100% every 4 bars?
        // Let's just oscillate it or base on beatCount
        const progress = (this.audio.ctx ? (this.audio.ctx.currentTime % 2) / 2 : 0); // 2 second loop visual
        const playheadX = x + width * progress;

        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(playheadX, y, 10 + (energy/10), 0, Math.PI * 2);
        this.ctx.fill();

        // Define hit area for timeline
        const hitPath = new Path2D();
        hitPath.rect(x, y - 50, width, 100);
        this.timeline.currentPath = hitPath;
    }

    drawVolume(freqData, energy) {
        const { x, y, width, height, level } = this.volumeBar;

        this.ctx.strokeStyle = '#f0f'; // Magenta
        this.ctx.shadowColor = '#f0f';

        // Draw container
        const path = new Path2D();
        this.drawWobblyRect(path, x, y, width, height, freqData);
        this.ctx.stroke(path);

        // Draw Fill
        const fillHeight = height * this.audio.volume;
        const fillY = y + height - fillHeight;

        this.ctx.fillStyle = '#f0f';
        // Fill rect with some shake
        const shake = (Math.random() - 0.5) * (energy / 5);
        this.ctx.fillRect(x + 5, fillY + shake, width - 10, fillHeight);

        // Hit path
        const hitPath = new Path2D();
        hitPath.rect(x - 20, y - 20, width + 40, height + 40); // Generous hit area
        this.volumeBar.currentPath = hitPath;
    }

    getDistortion(freqData, offsetIndex) {
        if (!freqData || freqData.length === 0) return { x: 0, y: 0 };
        const idx = offsetIndex % freqData.length;
        const val = freqData[idx];
        const shift = (val / 255) * 20; // Max 20px shift
        return {
            x: (Math.random() - 0.5) * shift,
            y: (Math.random() - 0.5) * shift
        };
    }
}

// Logic wiring
if (typeof window !== 'undefined') {
    const audio = new AudioController();
    const renderer = new Renderer('waveform-canvas', audio);

    // Start Interaction
    const overlay = document.getElementById('overlay');
    overlay.addEventListener('click', () => {
        if (audio.ctx && audio.ctx.state === 'running') {
            // Already running, maybe user wants to play/pause via overlay?
            // Actually, we usually hide overlay.
        } else {
            audio.start();
            renderer.startLoop();
            overlay.classList.add('hidden');
        }
    });

    // Interaction on Canvas
    const canvas = document.getElementById('waveform-canvas');
    canvas.addEventListener('mousedown', (e) => {
        // We need to check intersection with the *shifted* paths
        // The context was translated by renderer.shakeX, renderer.shakeY
        // So we translate the mouse click inversely

        const mouseX = e.clientX - renderer.shakeX;
        const mouseY = e.clientY - renderer.shakeY;

        // Check Play Button
        if (renderer.ctx.isPointInPath(renderer.playBtn.currentPath, mouseX, mouseY)) {
            audio.toggle();
            return;
        }

        // Check Volume
        if (renderer.ctx.isPointInPath(renderer.volumeBar.currentPath, mouseX, mouseY)) {
            // Calculate new volume
            // y goes from top to bottom
            // volume 1 is at y, volume 0 is at y + height
            const relativeY = mouseY - renderer.volumeBar.y;
            const vol = 1.0 - (relativeY / renderer.volumeBar.height);
            audio.setVolume(vol);
            return;
        }

        // Check Timeline (simple restart for now)
        if (renderer.ctx.isPointInPath(renderer.timeline.currentPath, mouseX, mouseY)) {
            // Just random glitch effect or reset loop
             audio.beatCount = 0;
             audio.nextNoteTime = audio.ctx.currentTime;
        }
    });

    // Dragging for volume
    let isDraggingVol = false;
    canvas.addEventListener('mousedown', (e) => {
         const mouseX = e.clientX - renderer.shakeX;
         const mouseY = e.clientY - renderer.shakeY;
         if (renderer.ctx.isPointInPath(renderer.volumeBar.currentPath, mouseX, mouseY)) {
             isDraggingVol = true;
         }
    });
    window.addEventListener('mousemove', (e) => {
        if (isDraggingVol) {
             const mouseY = e.clientY - renderer.shakeY;
             const relativeY = mouseY - renderer.volumeBar.y;
             const vol = 1.0 - (relativeY / renderer.volumeBar.height);
             audio.setVolume(vol);
        }
    });
    window.addEventListener('mouseup', () => {
        isDraggingVol = false;
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioController, Renderer };
}
