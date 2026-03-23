// Vector 2D Class
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vec2(this.x * s, this.y * s); }
  div(s) { return new Vec2(this.x / s, this.y / s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  norm() {
    const m = this.mag();
    return m === 0 ? new Vec2(0, 0) : this.div(m);
  }
  copy() { return new Vec2(this.x, this.y); }
}

// Scene Objects
class Sphere {
  constructor(center, radius, color, isLight = false, isRough = false) {
    this.center = center;
    this.radius = radius;
    this.color = color;
    this.isLight = isLight;
    this.isRough = isRough;
  }

  intersect(rayOrigin, rayDir) {
    const oc = rayOrigin.sub(this.center);
    const a = rayDir.dot(rayDir);
    const b = 2.0 * oc.dot(rayDir);
    const c = oc.dot(oc) - this.radius * this.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return { hit: false };

    let t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
    if (t < 0.001) {
      t = (-b + Math.sqrt(discriminant)) / (2.0 * a);
      if (t < 0.001) return { hit: false };
    }

    const point = rayOrigin.add(rayDir.mul(t));
    const normal = point.sub(this.center).norm();

    return { hit: true, t, point, normal, object: this };
  }
}

// Global State
const state = {
  mode: 'ray', // 'ray' or 'path'
  raysPerPixel: 1,
  maxBounces: 3,
  width: 0,
  height: 0,
  raysCast: 0,
  intersections: 0,
  isAnimating: false,
  activeRays: [],
  accumulationBuffer: null,
  accumulatedFrames: 0,
  targetPoint: null
};

// Scene
const scene = {
  camera: new Vec2(0, 0),
  light: new Sphere(new Vec2(0, 0), 20, '#ffffff', true),
  objects: []
};

// DOM Elements
let renderCanvas, renderCtx;
let overlayCanvas, overlayCtx;

function init() {
  renderCanvas = document.getElementById('render-canvas');
  renderCtx = renderCanvas.getContext('2d', { willReadFrequently: true });

  overlayCanvas = document.getElementById('overlay-canvas');
  overlayCtx = overlayCanvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  setupScene();
  setupUI();

  // Initial draw
  drawScene();
}

function resize() {
  const container = document.getElementById('canvas-container');
  state.width = container.clientWidth;
  state.height = container.clientHeight;

  renderCanvas.width = state.width;
  renderCanvas.height = state.height;
  overlayCanvas.width = state.width;
  overlayCanvas.height = state.height;

  state.accumulationBuffer = new Float32Array(state.width * state.height * 3);
  state.accumulatedFrames = 0;

  scene.camera = new Vec2(state.width / 2, state.height - 50);

  if (scene.objects.length > 0) {
    drawScene();
  }
}

function setupScene() {
  const cx = state.width / 2;
  const cy = state.height / 2;

  scene.light.center = new Vec2(cx, 100);

  scene.objects = [
    new Sphere(new Vec2(cx - 150, cy + 50), 60, '#ff0055'),
    new Sphere(new Vec2(cx + 150, cy), 80, '#00f0ff'),
    new Sphere(new Vec2(cx, cy + 150), 50, '#ffff00'),
    new Sphere(new Vec2(cx, state.height + 1000), 1000, '#334155', false, true) // Floor
  ];

  state.targetPoint = new Vec2(cx, cy);
}

function setupUI() {
  const radios = document.querySelectorAll('input[name="render-mode"]');
  const pathControls = document.getElementById('path-tracing-controls');
  const modeDesc = document.getElementById('mode-description');

  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.mode = e.target.value;
      if (state.mode === 'path') {
        pathControls.style.display = 'flex';
        modeDesc.textContent = "Stochastic path tracing: hundreds of bouncing rays per pixel. Accumulates over time for soft shadows and global illumination.";
      } else {
        pathControls.style.display = 'none';
        modeDesc.textContent = "Standard deterministic ray tracing: one primary ray, one shadow ray to the light. Produces hard shadows and no global illumination.";
      }
      clearVisualization();
    });
  });

  document.getElementById('rays-per-pixel').addEventListener('input', (e) => {
    state.raysPerPixel = parseInt(e.target.value);
    document.getElementById('rpp-value').textContent = state.raysPerPixel;
  });

  document.getElementById('max-bounces').addEventListener('input', (e) => {
    state.maxBounces = parseInt(e.target.value);
    document.getElementById('bounces-value').textContent = state.maxBounces;
  });

  document.getElementById('btn-fire-rays').addEventListener('click', () => {
    state.targetPoint = new Vec2(state.width / 2, state.height / 2);
    fireRays();
  });

  document.getElementById('btn-clear').addEventListener('click', clearVisualization);

  // Interactive scene and ray targeting
  let isDragging = null;

  renderCanvas.addEventListener('pointerdown', (e) => {
    const rect = renderCanvas.getBoundingClientRect();
    const mousePos = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

    // Check if dragging light
    if (mousePos.sub(scene.light.center).mag() < scene.light.radius + 10) {
      isDragging = scene.light;
      return;
    }

    // Check objects
    for (const obj of scene.objects) {
      if (obj === scene.objects[scene.objects.length - 1]) continue; // Ignore floor
      if (mousePos.sub(obj.center).mag() < obj.radius) {
        isDragging = obj;
        return;
      }
    }

    // Target ray
    state.targetPoint = mousePos;
    fireRays();
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const rect = renderCanvas.getBoundingClientRect();
    isDragging.center = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

    drawScene();
    if (state.activeRays.length > 0) {
      fireRays(); // Refire if rays are active to see interactive lighting changes
    }
  });

  window.addEventListener('pointerup', () => {
    isDragging = null;
  });
}

function clearVisualization() {
  state.activeRays = [];
  state.isAnimating = false;
  state.raysCast = 0;
  state.intersections = 0;
  updateStats();
  drawScene();
  overlayCtx.clearRect(0, 0, state.width, state.height);
}

function updateStats() {
  document.getElementById('stat-rays-cast').textContent = state.raysCast;
  document.getElementById('stat-intersections').textContent = state.intersections;
}

function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

function intersectScene(rayOrigin, rayDir) {
  state.intersections++;
  let closest = null;
  let minT = Infinity;

  // Check objects
  for (const obj of scene.objects) {
    const hit = obj.intersect(rayOrigin, rayDir);
    if (hit.hit && hit.t < minT) {
      minT = hit.t;
      closest = hit;
    }
  }

  // Check light
  const lightHit = scene.light.intersect(rayOrigin, rayDir);
  if (lightHit.hit && lightHit.t < minT) {
    minT = lightHit.t;
    closest = lightHit;
  }

  return closest;
}

function fireRays() {
  state.activeRays = [];
  state.raysCast = 0;
  state.intersections = 0;

  const origin = scene.camera;
  const targetDir = state.targetPoint.sub(origin).norm();

  if (state.mode === 'ray') {
    // Deterministic Ray Tracing
    const ray = {
      points: [origin],
      color: '#00f0ff',
      alpha: 1,
      type: 'primary'
    };
    state.raysCast++;

    const hit = intersectScene(origin, targetDir);

    if (hit) {
      ray.points.push(hit.point);

      // If we hit an object, cast a shadow ray to the light
      if (!hit.object.isLight) {
        const lightDir = scene.light.center.sub(hit.point).norm();
        const shadowRay = {
          points: [hit.point],
          color: '#ffff00',
          alpha: 0.8,
          type: 'shadow'
        };
        state.raysCast++;

        const shadowHit = intersectScene(hit.point.add(lightDir.mul(0.1)), lightDir);
        if (shadowHit) {
           shadowRay.points.push(shadowHit.point);
        } else {
           // Should hit light but just in case
           shadowRay.points.push(hit.point.add(lightDir.mul(1000)));
        }

        state.activeRays.push(shadowRay);
      }
    } else {
      ray.points.push(origin.add(targetDir.mul(1500)));
    }

    state.activeRays.push(ray);

  } else {
    // Stochastic Path Tracing
    const count = state.mode === 'path' ? state.raysPerPixel : 1;

    for (let i = 0; i < count; i++) {
      let currentOrigin = origin;
      // Small jitter for anti-aliasing / soft targeting
      const jitter = new Vec2((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
      let currentDir = state.targetPoint.add(jitter).sub(origin).norm();

      const ray = {
        points: [currentOrigin],
        color: '#ff0055',
        alpha: Math.max(0.05, 2.0 / count),
        type: 'path'
      };

      for (let bounce = 0; bounce < state.maxBounces; bounce++) {
        state.raysCast++;
        const hit = intersectScene(currentOrigin, currentDir);

        if (hit) {
          ray.points.push(hit.point);
          if (hit.object.isLight) {
            ray.color = '#ffff00'; // Found light
            break;
          }

          // Bounce
          currentOrigin = hit.point.add(hit.normal.mul(0.1));

          if (hit.object.isRough) {
            // Diffuse bounce (cosine weighted hemisphere)
            // 2D equivalent: random angle within 90 deg of normal
            const angle = Math.atan2(hit.normal.y, hit.normal.x) + (Math.random() - 0.5) * Math.PI;
            currentDir = new Vec2(Math.cos(angle), Math.sin(angle));
          } else {
            // Perfectly specular bounce (reflection)
            const dot = currentDir.dot(hit.normal);
            currentDir = currentDir.sub(hit.normal.mul(2 * dot));

            // Add tiny roughness
            const rAngle = Math.atan2(currentDir.y, currentDir.x) + (Math.random() - 0.5) * 0.1;
            currentDir = new Vec2(Math.cos(rAngle), Math.sin(rAngle));
          }

        } else {
          ray.points.push(currentOrigin.add(currentDir.mul(1500)));
          break; // Hit sky
        }
      }
      state.activeRays.push(ray);
    }
  }

  updateStats();

  if (!state.isAnimating) {
    state.isAnimating = true;
    animateRays(0);
  } else {
    // Reset animation progress
    state.activeRays.forEach(r => r.progress = 0);
  }
}

function animateRays(timestamp) {
  if (!state.isAnimating) return;

  overlayCtx.clearRect(0, 0, state.width, state.height);

  let allDone = true;
  const speed = state.mode === 'ray' ? 0.05 : 0.15;

  for (const ray of state.activeRays) {
    if (ray.progress === undefined) ray.progress = 0;
    if (ray.progress < 1) {
      ray.progress += speed;
      allDone = false;
    }
    if (ray.progress > 1) ray.progress = 1;

    const numSegments = ray.points.length - 1;
    const totalLength = ray.progress * numSegments;
    const currentSegment = Math.floor(totalLength);
    const segmentProgress = totalLength - currentSegment;

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = ray.color;
    overlayCtx.globalAlpha = ray.alpha;
    overlayCtx.lineWidth = state.mode === 'ray' ? 2 : 1;

    overlayCtx.moveTo(ray.points[0].x, ray.points[0].y);

    for (let i = 0; i < currentSegment; i++) {
      overlayCtx.lineTo(ray.points[i+1].x, ray.points[i+1].y);
    }

    if (currentSegment < numSegments) {
      const p1 = ray.points[currentSegment];
      const p2 = ray.points[currentSegment + 1];
      const cx = p1.x + (p2.x - p1.x) * segmentProgress;
      const cy = p1.y + (p2.y - p1.y) * segmentProgress;
      overlayCtx.lineTo(cx, cy);

      // Draw leading point
      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.globalAlpha = 1;
      overlayCtx.beginPath();
      overlayCtx.arc(cx, cy, 2, 0, Math.PI * 2);
      overlayCtx.fill();
    } else {
       // Draw endpoints for finished rays
       overlayCtx.fillStyle = ray.color;
       overlayCtx.beginPath();
       overlayCtx.arc(ray.points[ray.points.length-1].x, ray.points[ray.points.length-1].y, 3, 0, Math.PI * 2);
       overlayCtx.fill();
    }

    overlayCtx.stroke();
  }

  // Draw camera indicator
  overlayCtx.globalAlpha = 1;
  overlayCtx.fillStyle = '#e2e8f0';
  overlayCtx.beginPath();
  overlayCtx.arc(scene.camera.x, scene.camera.y, 8, 0, Math.PI * 2);
  overlayCtx.fill();
  overlayCtx.fillStyle = '#0b1120';
  overlayCtx.beginPath();
  overlayCtx.arc(scene.camera.x, scene.camera.y, 4, 0, Math.PI * 2);
  overlayCtx.fill();

  if (allDone) {
    state.isAnimating = false;
  } else {
    requestAnimationFrame(animateRays);
  }
}

function drawScene() {
  renderCtx.fillStyle = '#0b1120';
  renderCtx.fillRect(0, 0, state.width, state.height);

  // Draw Floor
  const floor = scene.objects[scene.objects.length - 1];
  renderCtx.fillStyle = floor.color;
  renderCtx.beginPath();
  renderCtx.arc(floor.center.x, floor.center.y, floor.radius, 0, Math.PI * 2);
  renderCtx.fill();

  // Draw Objects
  for (let i = 0; i < scene.objects.length - 1; i++) {
    const obj = scene.objects[i];
    renderCtx.fillStyle = obj.color;
    renderCtx.beginPath();
    renderCtx.arc(obj.center.x, obj.center.y, obj.radius, 0, Math.PI * 2);
    renderCtx.fill();

    // Add subtle inner shadow to objects for 2D depth
    const grad = renderCtx.createRadialGradient(
      obj.center.x - obj.radius * 0.3, obj.center.y - obj.radius * 0.3, obj.radius * 0.1,
      obj.center.x, obj.center.y, obj.radius
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    renderCtx.fillStyle = grad;
    renderCtx.fill();

    renderCtx.strokeStyle = '#e2e8f0';
    renderCtx.lineWidth = 1;
    renderCtx.stroke();
  }

  // Draw Light
  renderCtx.fillStyle = scene.light.color;
  renderCtx.beginPath();
  renderCtx.arc(scene.light.center.x, scene.light.center.y, scene.light.radius, 0, Math.PI * 2);
  renderCtx.fill();

  // Light Glow
  const glow = renderCtx.createRadialGradient(
    scene.light.center.x, scene.light.center.y, scene.light.radius,
    scene.light.center.x, scene.light.center.y, scene.light.radius * 4
  );
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  renderCtx.fillStyle = glow;
  renderCtx.beginPath();
  renderCtx.arc(scene.light.center.x, scene.light.center.y, scene.light.radius * 4, 0, Math.PI * 2);
  renderCtx.fill();
}

window.addEventListener('load', init);
