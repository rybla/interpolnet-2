const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stepTitle = document.getElementById('step-title');
const stepDesc = document.getElementById('step-desc');

let width, height;

const STATE = {
  READY: 0,
  RAY_EMIT: 1,
  INTERSECTION: 2,
  NORMAL_CALC: 3,
  SHADOW_RAY: 4,
  RESULT: 5
};

let currentState = STATE.READY;

const colors = {
  bg: '#0f172a',
  camera: '#38bdf8',
  ray: '#fbbf24',
  hit: '#f43f5e',
  normal: '#34d399',
  shadowRay: '#818cf8',
  light: '#fef08a',
  sphere1: '#475569',
  sphere2: '#64748b'
};

const scene = {
  camera: { x: 100, y: 0 },
  pixelPlane: {
    p1: { x: 250, y: -100 },
    p2: { x: 250, y: 100 },
    pixel: { x: 250, y: 0 }
  },
  light: { x: 800, y: -300, radius: 15, isDragging: false },
  sphere1: { x: 500, y: 0, radius: 80, isDragging: false }, // Target sphere
  sphere2: { x: 650, y: -150, radius: 60, isDragging: false }, // Occluder sphere
  hitPoint: null,
  normalVec: null,
  isShadowed: false,
  initialized: false
};

function resize() {
  if (!canvas.parentElement) return;
  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;
  canvas.width = width;
  canvas.height = height;

  // Initialize positions on first load relative to center
  if (!scene.initialized) {
    const cx = width / 2;
    const cy = height / 2;
    scene.camera.x = cx - 300;
    scene.camera.y = cy;
    scene.pixelPlane.p1 = { x: cx - 150, y: cy - 100 };
    scene.pixelPlane.p2 = { x: cx - 150, y: cy + 100 };
    scene.pixelPlane.pixel = { x: cx - 150, y: cy };
    scene.sphere1.x = cx + 100;
    scene.sphere1.y = cy;
    scene.sphere2.x = cx + 250;
    scene.sphere2.y = cy - 150;
    scene.light.x = cx + 300;
    scene.light.y = cy - 300;
    scene.initialized = true;
  }
}

window.addEventListener('resize', () => {
  resize();
  draw();
});

function drawCircle(x, y, radius, fillStyle, strokeStyle = null, lineWidth = 2) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

function drawLine(p1, p2, strokeStyle, lineWidth = 2, dashed = false) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  if (dashed) {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawArrow(p1, p2, strokeStyle, lineWidth = 2, dashed = false) {
  drawLine(p1, p2, strokeStyle, lineWidth, dashed);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headLen = 10;
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(p2.x, p2.y);
  ctx.fillStyle = strokeStyle;
  ctx.fill();
}

// Vector Math
function sub(v1, v2) {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return { x: v.x / len, y: v.y / len };
}

function raySphereIntersect(ro, rd, sCenter, sRadius) {
  const oc = sub(ro, sCenter);
  const a = dot(rd, rd);
  const b = 2.0 * dot(oc, rd);
  const c = dot(oc, oc) - sRadius * sRadius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return null;
  }

  const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
  if (t < 0) {
    return null; // intersection is behind ray origin
  }

  return {
    t: t,
    point: { x: ro.x + rd.x * t, y: ro.y + rd.y * t }
  };
}

function updateLogic() {
  const rayDir = normalize(sub(scene.pixelPlane.pixel, scene.camera));

  // Find closest intersection
  const hit1 = raySphereIntersect(scene.camera, rayDir, scene.sphere1, scene.sphere1.radius);
  const hit2 = raySphereIntersect(scene.camera, rayDir, scene.sphere2, scene.sphere2.radius);

  let closestHit = null;
  let closestSphere = null;

  if (hit1 && hit2) {
    if (hit1.t < hit2.t) {
      closestHit = hit1;
      closestSphere = scene.sphere1;
    } else {
      closestHit = hit2;
      closestSphere = scene.sphere2;
    }
  } else if (hit1) {
    closestHit = hit1;
    closestSphere = scene.sphere1;
  } else if (hit2) {
    closestHit = hit2;
    closestSphere = scene.sphere2;
  }

  if (closestHit) {
    scene.hitPoint = closestHit.point;
    scene.normalVec = normalize(sub(closestHit.point, closestSphere));

    // Check shadow
    const shadowRayDir = normalize(sub(scene.light, scene.hitPoint));
    const distToLight = Math.sqrt((scene.light.x - scene.hitPoint.x)**2 + (scene.light.y - scene.hitPoint.y)**2);
    // Offset hit point slightly along normal to avoid self-intersection
    const shadowRayOrigin = {
      x: scene.hitPoint.x + scene.normalVec.x * 0.1,
      y: scene.hitPoint.y + scene.normalVec.y * 0.1
    };

    const shadowHit1 = raySphereIntersect(shadowRayOrigin, shadowRayDir, scene.sphere1, scene.sphere1.radius);
    const shadowHit2 = raySphereIntersect(shadowRayOrigin, shadowRayDir, scene.sphere2, scene.sphere2.radius);

    scene.isShadowed = (shadowHit1 && shadowHit1.t < distToLight) || (shadowHit2 && shadowHit2.t < distToLight);

  } else {
    scene.hitPoint = null;
    scene.normalVec = null;
    scene.isShadowed = false;
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw Camera
  drawCircle(scene.camera.x, scene.camera.y, 10, colors.camera);
  ctx.fillStyle = colors.camera;
  ctx.font = '12px sans-serif';
  ctx.fillText('Camera', scene.camera.x - 20, scene.camera.y - 20);

  // Draw Pixel Plane
  drawLine(scene.pixelPlane.p1, scene.pixelPlane.p2, '#475569', 3);
  drawCircle(scene.pixelPlane.pixel.x, scene.pixelPlane.pixel.y, 4, colors.camera);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Screen', scene.pixelPlane.p1.x - 20, scene.pixelPlane.p1.y - 10);

  // Draw Spheres
  drawCircle(scene.sphere1.x, scene.sphere1.y, scene.sphere1.radius, colors.sphere1, '#94a3b8');
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Target Sphere', scene.sphere1.x - 35, scene.sphere1.y - scene.sphere1.radius - 10);

  drawCircle(scene.sphere2.x, scene.sphere2.y, scene.sphere2.radius, colors.sphere2, '#94a3b8');
  ctx.fillText('Occluder', scene.sphere2.x - 25, scene.sphere2.y - scene.sphere2.radius - 10);

  // Draw Light
  drawCircle(scene.light.x, scene.light.y, scene.light.radius, colors.light);
  ctx.fillStyle = colors.light;
  ctx.fillText('Light', scene.light.x - 15, scene.light.y - 25);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = scene.light.x + Math.cos(angle) * (scene.light.radius + 5);
    const py = scene.light.y + Math.sin(angle) * (scene.light.radius + 5);
    const p2x = scene.light.x + Math.cos(angle) * (scene.light.radius + 15);
    const p2y = scene.light.y + Math.sin(angle) * (scene.light.radius + 15);
    drawLine({x: px, y: py}, {x: p2x, y: p2y}, colors.light, 2);
  }

  // Draw logic based on state
  if (currentState >= STATE.RAY_EMIT) {
    let endPoint = scene.hitPoint ? scene.hitPoint : { x: scene.camera.x + 2000 * (scene.pixelPlane.pixel.x - scene.camera.x), y: scene.camera.y + 2000 * (scene.pixelPlane.pixel.y - scene.camera.y) };
    drawArrow(scene.camera, endPoint, colors.ray);
  }

  if (currentState >= STATE.INTERSECTION && scene.hitPoint) {
    drawCircle(scene.hitPoint.x, scene.hitPoint.y, 5, colors.hit);
  }

  if (currentState >= STATE.NORMAL_CALC && scene.hitPoint && scene.normalVec) {
    const normalEnd = {
      x: scene.hitPoint.x + scene.normalVec.x * 50,
      y: scene.hitPoint.y + scene.normalVec.y * 50
    };
    drawArrow(scene.hitPoint, normalEnd, colors.normal);
  }

  if (currentState >= STATE.SHADOW_RAY && scene.hitPoint) {
    drawArrow(scene.hitPoint, scene.light, colors.shadowRay, 2, true);
  }

  if (currentState === STATE.RESULT && scene.hitPoint) {
    if (scene.isShadowed) {
      drawCircle(scene.hitPoint.x, scene.hitPoint.y, 8, '#000000', colors.shadowRay, 2);
    } else {
      drawCircle(scene.hitPoint.x, scene.hitPoint.y, 8, colors.light, colors.ray, 2);
    }
  }
}

function handleStateAdvance() {
  currentState++;
  if (currentState > STATE.RESULT) {
    currentState = STATE.READY;
  }

  switch(currentState) {
    case STATE.READY:
      stepTitle.textContent = "Step 0: Ready";
      stepTitle.style.color = colors.camera;
      stepDesc.textContent = "Click the canvas to emit the primary ray from the camera.";
      break;
    case STATE.RAY_EMIT:
      stepTitle.textContent = "Step 1: Ray Emit";
      stepTitle.style.color = colors.ray;
      stepDesc.textContent = "A primary ray is emitted from the camera through the pixel on the screen plane.";
      break;
    case STATE.INTERSECTION:
      stepTitle.textContent = "Step 2: Intersection Test";
      stepTitle.style.color = colors.hit;
      if (scene.hitPoint) {
        stepDesc.textContent = "The ray mathematically intersects with a sphere in the scene.";
      } else {
        stepDesc.textContent = "The ray misses all geometry. Click to reset.";
        currentState = STATE.RESULT; // Skip to end if missed
      }
      break;
    case STATE.NORMAL_CALC:
      stepTitle.textContent = "Step 3: Surface Normal";
      stepTitle.style.color = colors.normal;
      stepDesc.textContent = "Calculate the surface normal vector at the intersection point, which points directly away from the sphere's center.";
      break;
    case STATE.SHADOW_RAY:
      stepTitle.textContent = "Step 4: Shadow Ray";
      stepTitle.style.color = colors.shadowRay;
      stepDesc.textContent = "Cast a secondary ray from the hit point towards the light source to check for occlusion.";
      break;
    case STATE.RESULT:
      stepTitle.textContent = "Step 5: Shading Result";
      stepTitle.style.color = '#cbd5e1';
      if (!scene.hitPoint) {
        stepDesc.textContent = "Missed. The pixel is colored with the background color.";
      } else if (scene.isShadowed) {
        stepDesc.textContent = "The shadow ray is blocked by geometry. The pixel is in shadow.";
      } else {
        stepDesc.textContent = "The shadow ray reaches the light. The pixel is illuminated based on the angle between the normal and the light.";
      }
      break;
  }
}

// Interaction
let draggingItem = null;

function getDistance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  return { x, y };
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
window.addEventListener('mouseup', endDrag);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); drag(e); }, { passive: false });
window.addEventListener('touchend', endDrag);

function startDrag(e) {
  const pos = getPointerPos(e);

  if (getDistance(pos, scene.light) < scene.light.radius + 10) {
    draggingItem = scene.light;
  } else if (getDistance(pos, scene.sphere1) < scene.sphere1.radius) {
    draggingItem = scene.sphere1;
  } else if (getDistance(pos, scene.sphere2) < scene.sphere2.radius) {
    draggingItem = scene.sphere2;
  } else if (getDistance(pos, scene.pixelPlane.pixel) < 15) {
     draggingItem = scene.pixelPlane.pixel;
  }

  if (draggingItem) {
    draggingItem.isDragging = true;
  } else {
    handleStateAdvance(); // Only advance if not clicking on an object
  }
  updateLogic();
  draw();
}

function drag(e) {
  if (draggingItem) {
    const pos = getPointerPos(e);
    draggingItem.x = pos.x;
    draggingItem.y = pos.y;

    // Constraint pixel to the plane line (roughly) for simplicity just move the whole plane y
    if(draggingItem === scene.pixelPlane.pixel) {
       draggingItem.x = scene.pixelPlane.p1.x; // Lock x
       // Limit y to within plane
       draggingItem.y = Math.max(scene.pixelPlane.p1.y, Math.min(scene.pixelPlane.p2.y, pos.y));
    }

    updateLogic();
    draw();
  } else {
    // Hover effects
    const pos = getPointerPos(e);
    if (getDistance(pos, scene.light) < scene.light.radius + 10 ||
        getDistance(pos, scene.sphere1) < scene.sphere1.radius ||
        getDistance(pos, scene.sphere2) < scene.sphere2.radius ||
        getDistance(pos, scene.pixelPlane.pixel) < 15) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
}

function endDrag() {
  if (draggingItem) {
    draggingItem.isDragging = false;
    draggingItem = null;
    canvas.style.cursor = 'crosshair';
  }
}

function animate() {
  requestAnimationFrame(animate);
  // draw() is mostly event driven to save battery, but we can call it here if needed for continuous effects
}

resize();
updateLogic();
draw();
