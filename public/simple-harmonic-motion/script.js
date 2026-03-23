const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const amplitudeSlider = document.getElementById('amplitude-slider');
const amplitudeValue = document.getElementById('amplitude-value');
const frequencySlider = document.getElementById('frequency-slider');
const frequencyValue = document.getElementById('frequency-value');
const togglePlayBtn = document.getElementById('toggle-play');

let width, height;
let amplitude = parseInt(amplitudeSlider.value);
let frequency = parseFloat(frequencySlider.value);
let isPlaying = false;
let theta = 0;
let time = 0;
let lastTime = 0;
const yHistory = [];

function resize() {
  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener('resize', resize);
resize();

amplitudeSlider.addEventListener('input', (e) => {
  amplitude = parseInt(e.target.value);
  amplitudeValue.textContent = amplitude;
});

frequencySlider.addEventListener('input', (e) => {
  frequency = parseFloat(e.target.value);
  frequencyValue.textContent = frequency.toFixed(1);
});

togglePlayBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  togglePlayBtn.textContent = isPlaying ? 'Pause' : 'Play';
  togglePlayBtn.classList.toggle('active', isPlaying);
  if (isPlaying) {
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
});

function draw() {
  ctx.clearRect(0, 0, width, height);

  const wheelCenterX = width / 4;
  const centerY = height / 2;
  const graphStartX = width / 2;

  // Wheel
  ctx.beginPath();
  ctx.arc(wheelCenterX, centerY, amplitude, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(wheelCenterX - amplitude - 20, centerY);
  ctx.lineTo(wheelCenterX + amplitude + 20, centerY);
  ctx.moveTo(wheelCenterX, centerY - amplitude - 20);
  ctx.lineTo(wheelCenterX, centerY + amplitude + 20);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Point on wheel
  const pointX = wheelCenterX + amplitude * Math.cos(theta);
  const pointY = centerY - amplitude * Math.sin(theta);

  ctx.beginPath();
  ctx.moveTo(wheelCenterX, centerY);
  ctx.lineTo(pointX, pointY);
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Linking line
  ctx.beginPath();
  ctx.moveTo(pointX, pointY);
  ctx.lineTo(graphStartX, pointY);
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.5)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // Sine wave graph
  // X axis
  ctx.beginPath();
  ctx.moveTo(graphStartX, centerY);
  ctx.lineTo(width - 20, centerY);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wave
  if (yHistory.length > 0) {
    ctx.beginPath();
    ctx.moveTo(graphStartX, centerY - yHistory[0]);
    for (let i = 1; i < yHistory.length; i++) {
      const x = graphStartX + i * 2;
      if (x > width) break;
      ctx.lineTo(x, centerY - yHistory[i]);
    }
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Drawing head
  ctx.beginPath();
  ctx.arc(graphStartX, pointY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ec4899';
  ctx.fill();
}

function loop(timestamp) {
  if (!isPlaying) return;

  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Capped dt to prevent large jumps
  const safeDt = Math.min(dt, 0.1);

  theta += frequency * safeDt;

  // Calculate y relative to center (0)
  const y = amplitude * Math.sin(theta);

  yHistory.unshift(y);

  // Keep memory in check, only need enough history to fill the screen
  const maxHistory = (width - width/2) / 2;
  if (yHistory.length > maxHistory) {
    yHistory.pop();
  }

  draw();
  requestAnimationFrame(loop);
}

// Initial draw
draw();

// Auto-start for validation and general usability
setTimeout(() => {
  togglePlayBtn.click();
}, 100);
