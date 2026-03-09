/**
 * Raytracer Pixel Stepper - 2D Sandbox
 */

// --- Vector Math ---
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vec2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  norm() {
    const m = this.mag();
    return m === 0 ? new Vec2(0, 0) : new Vec2(this.x / m, this.y / m);
  }
}

// --- Scene Setup ---
const canvas = document.getElementById('render-canvas');
const ctx = canvas.getContext('2d');
const logEl = document.getElementById('readout-log');
const finalPixelEl = document.getElementById('final-pixel');
const stepBtn = document.getElementById('step-btn');

let cw, ch;

// Scene entities
const camera = { pos: new Vec2(100, 300) };
const pixel = { pos: new Vec2(150, 300), size: 20 };
const light = { pos: new Vec2(600, 100), radius: 10, color: '#ffff00', isDragging: false };
const sphere = { pos: new Vec2(400, 300), radius: 60, color: '#aa3333', isDragging: false };

// Animation state
const STATES = {
  IDLE: 'IDLE',
  SHOOTING_RAY: 'SHOOTING_RAY',
  CALCULATING_NORMAL: 'CALCULATING_NORMAL',
  SHOOTING_SHADOW: 'SHOOTING_SHADOW',
  SHADING: 'SHADING'
};

let currentState = STATES.IDLE;
let animProgress = 0; // 0 to 1
let animSpeed = 0.02;

// Raytracing working data
let primaryRayDir = null;
let tHit = Infinity;
let hitPoint = null;
let hitNormal = null;
let shadowRayDir = null;
let tShadowHit = Infinity;
let pixelColorStr = '#000000';

// Colors based on CSS variables
const cCyan = '#00ffcc';
const cMagenta = '#ff00ff';
const cYellow = '#ffff00';
const cRed = '#ff3333';
const cGreen = '#00ff00';
const cGrid = '#1a2a40';

function resize() {
  const container = canvas.parentElement;
  cw = container.clientWidth;
  ch = container.clientHeight;
  canvas.width = cw;
  canvas.height = ch;

  // Recenter things on first load or resize if needed, but we keep absolute coords for simplicity
  if (camera.pos.y > ch || camera.pos.x > cw) {
     camera.pos.y = ch/2;
     pixel.pos.y = ch/2;
     sphere.pos.y = ch/2;
  }
  render();
}
window.addEventListener('resize', resize);
resize();

// --- Logic Helpers ---

function logMsg(msg, type = 'system') {
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.textContent = msg;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = '<div class="log-entry system">Reset. Awaiting Primary Ray.</div>';
  finalPixelEl.style.backgroundColor = '#000';
}

// Ray-Sphere Intersection
function intersectSphere(rayOrigin, rayDir, sphPos, sphRadius) {
  const oc = rayOrigin.sub(sphPos);
  const a = rayDir.dot(rayDir);
  const b = 2.0 * oc.dot(rayDir);
  const c = oc.dot(oc) - sphRadius * sphRadius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return Infinity; // Miss
  } else {
    // Return nearest positive hit
    const t1 = (-b - Math.sqrt(discriminant)) / (2.0 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2.0 * a);
    if (t1 > 0.001) return t1;
    if (t2 > 0.001) return t2;
    return Infinity;
  }
}

// Float to hex 2 digit
function f2hex(f) {
  const h = Math.max(0, Math.min(255, Math.floor(f * 255))).toString(16);
  return h.length === 1 ? '0' + h : h;
}

function resetState() {
  currentState = STATES.IDLE;
  animProgress = 0;
  tHit = Infinity;
  hitPoint = null;
  hitNormal = null;
  tShadowHit = Infinity;
  shadowRayDir = null;
  stepBtn.textContent = 'Step: Primary Ray';
  stepBtn.disabled = false;
  clearLog();
  render();
}

// --- State Machine ---

function nextStep() {
  if (animProgress < 1 && currentState !== STATES.IDLE) return; // Wait for anim
  animProgress = 0;

  switch (currentState) {
    case STATES.IDLE:
      currentState = STATES.SHOOTING_RAY;
      primaryRayDir = pixel.pos.sub(camera.pos).norm();
      tHit = intersectSphere(camera.pos, primaryRayDir, sphere.pos, sphere.radius);

      logMsg(`1. Primary Ray: origin(${camera.pos.x | 0}, ${camera.pos.y | 0}), dir(${primaryRayDir.x.toFixed(2)}, ${primaryRayDir.y.toFixed(2)})`, 'primary');

      if (tHit === Infinity) {
        logMsg(`   Ray missed sphere. Distance: Infinity`, 'miss');
        stepBtn.textContent = 'Step: Shading (Miss)';
      } else {
        hitPoint = camera.pos.add(primaryRayDir.mul(tHit));
        logMsg(`   Ray hit sphere at distance t=${tHit.toFixed(2)}`, 'intersect');
        logMsg(`   Hit point: (${hitPoint.x.toFixed(1)}, ${hitPoint.y.toFixed(1)})`, 'intersect');
        stepBtn.textContent = 'Step: Normal';
      }
      break;

    case STATES.SHOOTING_RAY:
      if (tHit === Infinity) {
        currentState = STATES.SHADING;
        pixelColorStr = '#0b0f19'; // background
        logMsg(`5. Shading: Ray missed. Pixel is background color.`, 'miss');
        finalPixelEl.style.backgroundColor = pixelColorStr;
        stepBtn.textContent = 'Reset';
      } else {
        currentState = STATES.CALCULATING_NORMAL;
        hitNormal = hitPoint.sub(sphere.pos).norm();
        logMsg(`2. Normal Vector calculated: n=(${hitNormal.x.toFixed(2)}, ${hitNormal.y.toFixed(2)})`, 'normal');
        stepBtn.textContent = 'Step: Shadow Ray';
      }
      break;

    case STATES.CALCULATING_NORMAL:
      currentState = STATES.SHOOTING_SHADOW;
      const lightVec = light.pos.sub(hitPoint);
      const lightDist = lightVec.mag();
      shadowRayDir = lightVec.norm();

      // Check for occlusion
      // We check intersection from hitPoint towards light
      const tOcc = intersectSphere(hitPoint, shadowRayDir, sphere.pos, sphere.radius);

      logMsg(`3. Shadow Ray: cast towards light. dir=(${shadowRayDir.x.toFixed(2)}, ${shadowRayDir.y.toFixed(2)})`, 'shadow');

      // We only consider it occluded if tOcc is between our hit point and the light source.
      // Since our scene only has 1 sphere, and we cast *from* the sphere surface outwards,
      // it shouldn't hit itself again (tOcc should be ~0 or Infinity). But if we had other objects...
      // For this demo with 1 sphere, occlusion happens if the dot product of normal and lightDir is < 0 (self-shadowing).

      const lambert = Math.max(0, hitNormal.dot(shadowRayDir));
      if (lambert <= 0) {
        tShadowHit = 0; // Fake it for visual occlusion (self shadow)
        logMsg(`   Self-occlusion detected (light is behind normal).`, 'miss');
      } else {
         tShadowHit = lightDist; // No other objects to hit
         logMsg(`   Clear path to light source. distance=${lightDist.toFixed(1)}`, 'shadow');
      }

      stepBtn.textContent = 'Step: Shading';
      break;

    case STATES.SHOOTING_SHADOW:
      currentState = STATES.SHADING;
      const lamberDot = hitNormal.dot(shadowRayDir);

      if (tShadowHit < light.pos.sub(hitPoint).mag() || lamberDot <= 0) {
        // In shadow
        logMsg(`4. Shading: In shadow. Intensity = 0.0`, 'miss');
        pixelColorStr = '#111111'; // ambient
      } else {
        // Lit
        const intensity = lamberDot;
        logMsg(`4. Shading: Lit. Lambertian dot(N, L) = ${intensity.toFixed(3)}`, 'shade');

        // Base sphere color is red
        const r = Math.min(1.0, 0.6 + intensity * 0.4);
        const g = intensity * 0.2;
        const b = intensity * 0.2;
        pixelColorStr = `#${f2hex(r)}${f2hex(g)}${f2hex(b)}`;
      }
      finalPixelEl.style.backgroundColor = pixelColorStr;
      logMsg(`   Final Pixel Color: ${pixelColorStr}`, 'shade');
      stepBtn.textContent = 'Reset';
      break;

    case STATES.SHADING:
      resetState();
      break;
  }
}

stepBtn.addEventListener('click', nextStep);


// --- Interaction ---

let dragTarget = null;

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const mouse = new Vec2(x, y);

  if (mouse.sub(light.pos).mag() < light.radius + 10) {
    dragTarget = light;
    light.isDragging = true;
  } else if (mouse.sub(sphere.pos).mag() < sphere.radius) {
    dragTarget = sphere;
    sphere.isDragging = true;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  dragTarget.pos.x = e.clientX - rect.left;
  dragTarget.pos.y = e.clientY - rect.top;

  // If moving, reset state so user has to start over
  if (currentState !== STATES.IDLE) {
    resetState();
  } else {
    render();
  }
});

canvas.addEventListener('pointerup', () => {
  if (dragTarget) dragTarget.isDragging = false;
  dragTarget = null;
});

canvas.addEventListener('pointerleave', () => {
  if (dragTarget) dragTarget.isDragging = false;
  dragTarget = null;
});


// --- Rendering ---

function drawLine(p1, p2, color, width=2, dash=[]) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCircle(pos, r, fill, stroke, width=2) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, cw, ch);

  // Grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = cGrid;
  ctx.beginPath();
  ctx.moveTo(camera.pos.x, 0); ctx.lineTo(camera.pos.x, ch);
  ctx.moveTo(0, camera.pos.y); ctx.lineTo(cw, camera.pos.y);
  ctx.stroke();

  // Camera Eye
  drawCircle(camera.pos, 5, '#fff', null);
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText('Camera', camera.pos.x - 20, camera.pos.y - 15);

  // Image Plane Pixel
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.fillRect(pixel.pos.x - pixel.size/2, pixel.pos.y - pixel.size/2, pixel.size, pixel.size);
  ctx.strokeRect(pixel.pos.x - pixel.size/2, pixel.pos.y - pixel.size/2, pixel.size, pixel.size);
  ctx.fillText('Pixel', pixel.pos.x - 15, pixel.pos.y - 15);

  // Obstacle Sphere
  drawCircle(sphere.pos, sphere.radius, sphere.isDragging ? 'rgba(170, 51, 51, 0.7)' : sphere.color, cRed, 2);
  ctx.fillStyle = '#fff';
  ctx.fillText('Obstacle', sphere.pos.x - 25, sphere.pos.y - sphere.radius - 10);

  // Light Source
  drawCircle(light.pos, light.radius, light.color, light.isDragging ? '#fff' : null);
  ctx.shadowColor = light.color;
  ctx.shadowBlur = 15;
  drawCircle(light.pos, light.radius-2, light.color, null);
  ctx.shadowBlur = 0;
  ctx.fillStyle = light.color;
  ctx.fillText('Light', light.pos.x - 15, light.pos.y - 15);

  // --- Animation Layers ---

  if (currentState !== STATES.IDLE) {
    // 1. Primary Ray
    if (primaryRayDir) {
      const dist = (currentState === STATES.SHOOTING_RAY) ?
        (tHit === Infinity ? cw : tHit) * animProgress :
        (tHit === Infinity ? cw : tHit);

      const rayEnd = camera.pos.add(primaryRayDir.mul(dist));
      drawLine(camera.pos, rayEnd, cCyan, 2);
    }

    // 2. Normal Vector
    if (hitPoint && hitNormal && (currentState === STATES.CALCULATING_NORMAL || currentState === STATES.SHOOTING_SHADOW || currentState === STATES.SHADING)) {
      drawCircle(hitPoint, 4, cCyan, null); // hit dot

      let p = 1.0;
      if (currentState === STATES.CALCULATING_NORMAL) p = animProgress;

      const normEnd = hitPoint.add(hitNormal.mul(40 * p));
      drawLine(hitPoint, normEnd, cMagenta, 3);

      if (p === 1.0) {
         ctx.fillStyle = cMagenta;
         ctx.fillText('N', normEnd.x + 5, normEnd.y + 5);
      }
    }

    // 3. Shadow Ray
    if (hitPoint && shadowRayDir && (currentState === STATES.SHOOTING_SHADOW || currentState === STATES.SHADING)) {
       let p = 1.0;
       if (currentState === STATES.SHOOTING_SHADOW) p = animProgress;

       const maxLen = (tShadowHit === 0) ? 10 : Math.min(tShadowHit, hitPoint.sub(light.pos).mag());
       const shadowEnd = hitPoint.add(shadowRayDir.mul(maxLen * p));

       drawLine(hitPoint, shadowEnd, cYellow, 2, [5, 5]);

       if (tShadowHit === 0 && p === 1.0) {
           ctx.fillStyle = cRed;
           ctx.fillText('X (Occluded)', hitPoint.x + 10, hitPoint.y + 20);
       }
    }
  }

}

function loop() {
  if (animProgress < 1 && currentState !== STATES.IDLE) {
    animProgress += animSpeed;
    if (animProgress > 1) animProgress = 1;
    render();
  }
  requestAnimationFrame(loop);
}

// Start
resetState();
loop();
