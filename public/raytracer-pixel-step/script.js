/**
 * Vector 2D Class
 */
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(scalar) { return new Vec2(this.x * scalar, this.y * scalar); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm() {
    const m = this.mag();
    return m === 0 ? new Vec2(0, 0) : new Vec2(this.x / m, this.y / m);
  }
  dot(v) { return this.x * v.x + this.y * v.y; }
  dist(v) { return this.sub(v).mag(); }
}

/**
 * Enums and State
 */
const StepState = {
  CAMERA: 0,
  RAY_EMIT: 1,
  INTERSECTION: 2,
  NORMAL: 3,
  SHADOW_RAY: 4,
  SHADOW_CHECK: 5,
  SHADING: 6
};

const StepDetails = [
  { title: "Camera & Ray Origin", desc: "The raytracer starts at the virtual camera's origin, pointing towards a specific pixel on the screen." },
  { title: "Primary Ray Cast", desc: "A mathematical ray is cast from the camera through the virtual pixel into the scene." },
  { title: "Object Intersection", desc: "The ray intersects with the closest object in its path (Target Object)." },
  { title: "Surface Normal", desc: "The surface normal (perpendicular vector) is calculated at the exact point of intersection." },
  { title: "Shadow Ray Cast", desc: "A secondary 'shadow ray' is cast from the intersection point towards the light source." },
  { title: "Occlusion Check", desc: "If the shadow ray hits another object before reaching the light, the point is in shadow." },
  { title: "Final Shading", desc: "The final color of the pixel is calculated based on light visibility and surface angle (Lambertian reflectance)." }
];

let currentState = StepState.CAMERA;

// Scene Objects
let camera = new Vec2(200, 400);
let target = { pos: new Vec2(500, 400), radius: 60, color: '#e74c3c' };
let occluder = { pos: new Vec2(650, 200), radius: 50, color: '#9b59b6' };
let light = { pos: new Vec2(800, 100), radius: 15, color: '#f1c40f' };

// Computed intersection data
let hitData = { hit: false, point: null, normal: null, t: Infinity };
let shadowData = { inShadow: false, point: null };

// Dragging state
let draggedObj = null;

// Animation state
let animProgress = 0; // 0 to 1
let lastTime = 0;

/**
 * Math Logic: Ray-Sphere Intersection
 */
function intersectSphere(rayOrigin, rayDir, spherePos, sphereRadius) {
  const L = spherePos.sub(rayOrigin);
  const tca = L.dot(rayDir);

  if (tca < 0) return null; // Sphere is behind the ray

  const d2 = L.dot(L) - tca * tca;
  const radius2 = sphereRadius * sphereRadius;

  if (d2 > radius2) return null; // Ray misses the sphere

  const thc = Math.sqrt(radius2 - d2);
  const t0 = tca - thc;
  const t1 = tca + thc;

  const t = (t0 < t1 && t0 > 0) ? t0 : t1;

  if (t < 0) return null;

  const p = rayOrigin.add(rayDir.mul(t));
  const normal = p.sub(spherePos).norm();

  return { hit: true, t, point: p, normal };
}

function updateSimulation() {
  const dir = target.pos.sub(camera).norm();
  hitData = intersectSphere(camera, dir, target.pos, target.radius);

  if (hitData) {
    const shadowDir = light.pos.sub(hitData.point).norm();
    // Offset ray origin slightly to avoid self-intersection
    const shadowOrigin = hitData.point.add(hitData.normal.mul(0.1));
    const shadowHit = intersectSphere(shadowOrigin, shadowDir, occluder.pos, occluder.radius);

    if (shadowHit) {
      // Check if occluder is actually between intersection point and light
      const distToLight = light.pos.dist(hitData.point);
      if (shadowHit.t < distToLight) {
        shadowData = { inShadow: true, point: shadowHit.point };
      } else {
        shadowData = { inShadow: false, point: null };
      }
    } else {
      shadowData = { inShadow: false, point: null };
    }
  }
}

/**
 * Event Listeners & State Management
 */
function initEvents(canvas) {
  const btnNext = document.getElementById('next-step-btn');
  const btnPrev = document.getElementById('prev-step-btn');
  const btnReset = document.getElementById('reset-scene-btn');

  btnNext.addEventListener('click', () => {
    if (currentState < StepState.SHADING) {
      currentState++;
      animProgress = 0; // Reset animation for new step
      updateUI();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentState > StepState.CAMERA) {
      currentState--;
      animProgress = 1; // Animation is complete going backward
      updateUI();
    }
  });

  btnReset.addEventListener('click', () => {
    currentState = StepState.CAMERA;
    animProgress = 0;

    // Reset positions
    camera = new Vec2(200, 400);
    target.pos = new Vec2(500, 400);
    occluder.pos = new Vec2(650, 200);
    light.pos = new Vec2(800, 100);

    updateSimulation();
    updateUI();
  });

  // Canvas pointer events for dragging
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return new Vec2(
      clientX - rect.left,
      clientY - rect.top
    );
  }

  const hitTest = (p, objPos, radius) => p.dist(objPos) <= radius + 15; // +15 padding for easier touch

  function handlePointerDown(e) {
    const p = getPointerPos(e);

    if (hitTest(p, camera, 20)) draggedObj = { type: 'camera' };
    else if (hitTest(p, target.pos, target.radius)) draggedObj = { type: 'target' };
    else if (hitTest(p, occluder.pos, occluder.radius)) draggedObj = { type: 'occluder' };
    else if (hitTest(p, light.pos, light.radius)) draggedObj = { type: 'light' };

    if (draggedObj) {
      e.preventDefault();
      canvas.style.cursor = 'grabbing';
    }
  }

  function handlePointerMove(e) {
    if (!draggedObj) return;
    e.preventDefault();
    const p = getPointerPos(e);

    if (draggedObj.type === 'camera') camera = p;
    else if (draggedObj.type === 'target') target.pos = p;
    else if (draggedObj.type === 'occluder') occluder.pos = p;
    else if (draggedObj.type === 'light') light.pos = p;

    updateSimulation();
  }

  function handlePointerUp() {
    draggedObj = null;
    canvas.style.cursor = 'grab';
  }

  canvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
  window.addEventListener('touchmove', handlePointerMove, { passive: false });
  window.addEventListener('touchend', handlePointerUp);
}

function updateUI() {
  const btnNext = document.getElementById('next-step-btn');
  const btnPrev = document.getElementById('prev-step-btn');

  btnPrev.disabled = currentState === StepState.CAMERA;
  btnNext.disabled = currentState === StepState.SHADING;

  document.getElementById('step-label').textContent = `Step ${currentState + 1}/${StepDetails.length}`;
  document.getElementById('step-title').textContent = StepDetails[currentState].title;
  document.getElementById('step-description').textContent = StepDetails[currentState].desc;
}

/**
 * Rendering Logic
 */
function drawCircle(ctx, pos, radius, color, glow = false) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;

  if (glow) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  }

  ctx.fill();
  ctx.shadowBlur = 0; // Reset
}

function drawLine(ctx, start, end, color, dashed = false) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([10, 10]);
  else ctx.setLineDash([]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLabel(ctx, text, pos, offset) {
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, pos.x + offset.x, pos.y + offset.y);
}

function render(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // Advance animation
  if (animProgress < 1) {
    animProgress += dt * 2; // Animation speed
    if (animProgress > 1) animProgress = 1;
  }

  const canvas = document.getElementById('raytracer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Handle resize
  const container = canvas.parentElement;
  if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw basic objects
  drawCircle(ctx, occluder.pos, occluder.radius, occluder.color);
  drawLabel(ctx, "Occluder", occluder.pos, new Vec2(0, occluder.radius + 20));

  drawCircle(ctx, target.pos, target.radius, target.color);
  drawLabel(ctx, "Target", target.pos, new Vec2(0, target.radius + 20));

  drawCircle(ctx, light.pos, light.radius, light.color, true);
  drawLabel(ctx, "Light", light.pos, new Vec2(0, -25));

  // Camera representation
  ctx.fillStyle = '#4a90e2';
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y - 15);
  ctx.lineTo(camera.x + 25, camera.y);
  ctx.lineTo(camera.x, camera.y + 15);
  ctx.fill();
  drawLabel(ctx, "Camera", camera, new Vec2(0, 35));

  // --- Step Rendering Logic ---
  const rayColor = '#3498db';
  const normalColor = '#2ecc71';
  const shadowColor = '#e67e22';

  // 1. RAY_EMIT
  if (currentState >= StepState.RAY_EMIT) {
    if (hitData) {
      const endPoint = hitData.point;
      if (currentState === StepState.RAY_EMIT && animProgress < 1) {
        // Animate ray shooting
        const dir = endPoint.sub(camera);
        const currentEnd = camera.add(dir.mul(animProgress));
        drawLine(ctx, camera, currentEnd, rayColor);
      } else {
        drawLine(ctx, camera, endPoint, rayColor);
      }
    } else {
      // Misses everything, shoot into infinity
      const dir = target.pos.sub(camera).norm();
      drawLine(ctx, camera, camera.add(dir.mul(2000)), rayColor);
    }
  }

  // 2. INTERSECTION
  if (currentState >= StepState.INTERSECTION && hitData) {
    drawCircle(ctx, hitData.point, 5, '#fff', true);
    drawLabel(ctx, "Hit", hitData.point, new Vec2(-15, -15));
  }

  // 3. NORMAL
  if (currentState >= StepState.NORMAL && hitData) {
    const normalEnd = hitData.point.add(hitData.normal.mul(50));
    if (currentState === StepState.NORMAL && animProgress < 1) {
      const currentEnd = hitData.point.add(hitData.normal.mul(50 * animProgress));
      drawLine(ctx, hitData.point, currentEnd, normalColor);
    } else {
      drawLine(ctx, hitData.point, normalEnd, normalColor);
    }
  }

  // 4. SHADOW_RAY
  if (currentState >= StepState.SHADOW_RAY && hitData) {
    const endPoint = shadowData.inShadow ? shadowData.point : light.pos;
    if (currentState === StepState.SHADOW_RAY && animProgress < 1) {
      const dir = endPoint.sub(hitData.point);
      const currentEnd = hitData.point.add(dir.mul(animProgress));
      drawLine(ctx, hitData.point, currentEnd, shadowColor, true);
    } else {
      drawLine(ctx, hitData.point, endPoint, shadowColor, true);
    }
  }

  // 5. SHADOW_CHECK
  if (currentState >= StepState.SHADOW_CHECK && hitData && shadowData.inShadow) {
    drawCircle(ctx, shadowData.point, 5, '#e74c3c', true);
    // Draw blocked line faintly
    drawLine(ctx, shadowData.point, light.pos, '#555', true);
  }

  // 6. SHADING
  if (currentState >= StepState.SHADING && hitData) {
    // Determine color based on Lambertian reflectance
    let finalColor = '#111'; // ambient/shadow
    if (!shadowData.inShadow) {
      const lightDir = light.pos.sub(hitData.point).norm();
      const dot = Math.max(0, hitData.normal.dot(lightDir));
      // Simple shading mix
      const r = Math.floor(231 * dot);
      const g = Math.floor(76 * dot);
      const b = Math.floor(60 * dot);
      finalColor = `rgb(${r},${g},${b})`;
    }

    // Draw a "pixel" representation
    ctx.fillStyle = finalColor;
    ctx.fillRect(camera.x + 40, camera.y - 15, 30, 30);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(camera.x + 40, camera.y - 15, 30, 30);
    drawLabel(ctx, "Final Pixel", new Vec2(camera.x + 55, camera.y + 35), new Vec2(0,0));
  }

  requestAnimationFrame(render);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('raytracer-canvas');
  initEvents(canvas);
  updateSimulation();
  updateUI();
  requestAnimationFrame(render);
});
