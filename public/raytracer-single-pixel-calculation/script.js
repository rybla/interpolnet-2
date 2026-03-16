// Vector Math
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }
  mul(s) {
    return new Vec2(this.x * s, this.y * s);
  }
  magSq() {
    return this.x * this.x + this.y * this.y;
  }
  mag() {
    return Math.sqrt(this.magSq());
  }
  norm() {
    const m = this.mag();
    if (m === 0) return new Vec2(0, 0);
    return new Vec2(this.x / m, this.y / m);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  copy() {
    return new Vec2(this.x, this.y);
  }
  dist(v) {
    return this.sub(v).mag();
  }
}

// Core Calculation Logic
function intersectRaySphere(ray, sphere) {
  const oc = ray.origin.sub(sphere.center);
  const a = ray.dir.dot(ray.dir); // Always 1 if normalized
  const b = 2.0 * oc.dot(ray.dir);
  const c = oc.dot(oc) - sphere.radius * sphere.radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return -1; // No intersection
  } else {
    // Return the closest hit
    return (-b - Math.sqrt(discriminant)) / (2.0 * a);
  }
}

function getNormalAtPoint(point, sphere) {
  return point.sub(sphere.center).norm();
}

// Scene Objects
class Camera {
  constructor(pos) {
    this.pos = pos;
  }
}

class Sphere {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }
}

class Light {
  constructor(pos) {
    this.pos = pos;
  }
}

class Ray {
  constructor(origin, dir) {
    this.origin = origin;
    this.dir = dir.norm();
  }
  pointAt(t) {
    return this.origin.add(this.dir.mul(t));
  }
}

// Animation State Machine
const STATES = {
  INIT: 0,
  PRIMARY_RAY: 1,
  INTERSECTION: 2,
  NORMAL: 3,
  SHADOW_RAY: 4,
  RESULT: 5
};

let currentState = STATES.INIT;
let animationTime = 0;
let lastTime = 0;

// Render Data
let primaryRay, intersectionPoint, normalVec, shadowRay;
let hitT = -1;
let shadowHitT = -1;
let pixelPos = new Vec2(-200, 20); // The "pixel" on the image plane

// Global State Variables
let canvas, ctx, annotationDiv;
let width, height;
let camera, sphere, light;
let sceneScale = 1;
let sceneOffset = new Vec2(0, 0);

// Colors from CSS
const getCSSColor = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

// Initialization
function init() {
  canvas = document.getElementById('raytracer-canvas');
  ctx = canvas.getContext('2d');
  annotationDiv = document.getElementById('annotation');

  resize();
  window.addEventListener('resize', resize);

  // Set up scene
  setupScene();

  // Interactions
  canvas.addEventListener('click', nextState);

  // Start animation loop
  requestAnimationFrame(draw);
}

function nextState() {
  if (currentState < STATES.RESULT) {
    currentState++;
    animationTime = 0;
    updateAnnotation();
  } else {
    // Reset
    currentState = STATES.INIT;
    animationTime = 0;
    updateAnnotation();
  }
}

function updateAnnotation() {
  annotationDiv.classList.remove('visible');
  setTimeout(() => {
    switch (currentState) {
      case STATES.INIT:
        annotationDiv.innerText = "Click to begin: Raytracer Single Pixel Calculation";
        break;
      case STATES.PRIMARY_RAY:
        annotationDiv.innerText = "1. Tracing Primary Ray through Image Plane";
        break;
      case STATES.INTERSECTION:
        annotationDiv.innerText = "2. Calculating Ray-Sphere Intersection";
        break;
      case STATES.NORMAL:
        annotationDiv.innerText = "3. Finding Surface Normal at Intersection";
        break;
      case STATES.SHADOW_RAY:
        annotationDiv.innerText = "4. Casting Shadow Ray towards Light Source";
        break;
      case STATES.RESULT:
        annotationDiv.innerText = shadowHitT > 0 && shadowHitT < intersectionPoint.dist(light.pos)
          ? "5. Result: Point is in Shadow (Black Pixel)"
          : "5. Result: Point is Illuminated (Lit Pixel)";
        break;
    }
    annotationDiv.classList.add('visible');
  }, 300); // Wait for fade out
}

function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;

  // Calculate view transform to fit the scene
  sceneOffset = new Vec2(width / 2, height / 2);
  const minDim = Math.min(width, height);
  sceneScale = minDim / 1000; // base scene on 1000x1000 logical units
}

function setupScene() {
  camera = new Camera(new Vec2(-400, 0));
  sphere = new Sphere(new Vec2(100, 50), 150);
  light = new Light(new Vec2(300, -300));

  // Pre-calculate to know max distance for rays
  primaryRay = new Ray(camera.pos, pixelPos.sub(camera.pos));
  hitT = intersectRaySphere(primaryRay, sphere);
  if (hitT > 0) {
    intersectionPoint = primaryRay.pointAt(hitT);
    normalVec = getNormalAtPoint(intersectionPoint, sphere);

    // Slight offset to prevent self-shadowing
    shadowRay = new Ray(intersectionPoint.add(normalVec.mul(0.1)), light.pos.sub(intersectionPoint));
    // Check shadow hit
    shadowHitT = intersectRaySphere(shadowRay, sphere);
  }

  updateAnnotation();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color) {
  const headlen = 15;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function draw(time) {
  const dt = time - lastTime;
  lastTime = time;

  if (currentState > STATES.INIT) {
    animationTime += dt;
  }

  // Clear canvas
  ctx.fillStyle = getCSSColor('--color-bg');
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(sceneOffset.x, sceneOffset.y);
  ctx.scale(sceneScale, sceneScale);

  // Draw Light
  ctx.beginPath();
  ctx.arc(light.pos.x, light.pos.y, 15, 0, Math.PI * 2);
  ctx.fillStyle = getCSSColor('--color-light');
  ctx.fill();

  // Light rays
  ctx.strokeStyle = getCSSColor('--color-light');
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    let angle = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(light.pos.x + Math.cos(angle) * 20, light.pos.y + Math.sin(angle) * 20);
    ctx.lineTo(light.pos.x + Math.cos(angle) * 30, light.pos.y + Math.sin(angle) * 30);
    ctx.stroke();
  }

  // Draw Sphere
  ctx.beginPath();
  ctx.arc(sphere.center.x, sphere.center.y, sphere.radius, 0, Math.PI * 2);
  ctx.fillStyle = getCSSColor('--color-sphere');
  ctx.fill();

  // Draw Camera
  ctx.beginPath();
  ctx.arc(camera.pos.x, camera.pos.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = getCSSColor('--color-camera');
  ctx.fill();

  // Draw Image Plane Line
  ctx.beginPath();
  ctx.moveTo(-200, -100);
  ctx.lineTo(-200, 100);
  ctx.strokeStyle = getCSSColor('--color-pixel-plane');
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw Pixel (Grid cell on image plane)
  ctx.beginPath();
  ctx.rect(-200 - 5, pixelPos.y - 15, 10, 30);
  ctx.fillStyle = getCSSColor('--color-bg');
  ctx.fill();
  ctx.strokeStyle = getCSSColor('--color-pixel-plane');
  ctx.stroke();

  // Fill pixel with result if in result state
  if (currentState >= STATES.RESULT) {
    let inShadow = shadowHitT > 0 && shadowHitT < intersectionPoint.dist(light.pos);
    ctx.fillStyle = inShadow ? "#000" : getCSSColor('--color-light');
    ctx.fill();
  }

  // Draw Animation based on State
  let animProg = Math.min(animationTime / 1000, 1.0); // 1 second per animation

  if (currentState >= STATES.PRIMARY_RAY) {
    let maxDist = (currentState === STATES.PRIMARY_RAY) ? animProg * 1000 : hitT;
    let endPos = primaryRay.pointAt(Math.min(maxDist, hitT));
    drawArrow(ctx, camera.pos.x, camera.pos.y, endPos.x, endPos.y, getCSSColor('--color-ray-primary'));
  }

  if (currentState >= STATES.INTERSECTION) {
    ctx.beginPath();
    let pointSize = (currentState === STATES.INTERSECTION) ? Math.sin(animProg * Math.PI) * 10 + 5 : 5;
    ctx.arc(intersectionPoint.x, intersectionPoint.y, pointSize, 0, Math.PI * 2);
    ctx.fillStyle = getCSSColor('--color-highlight');
    ctx.fill();
  }

  if (currentState >= STATES.NORMAL) {
    let len = (currentState === STATES.NORMAL) ? animProg * 50 : 50;
    let endPos = intersectionPoint.add(normalVec.mul(len));
    drawArrow(ctx, intersectionPoint.x, intersectionPoint.y, endPos.x, endPos.y, getCSSColor('--color-normal'));
  }

  if (currentState >= STATES.SHADOW_RAY) {
    let distToLight = intersectionPoint.dist(light.pos);
    let maxDist = distToLight;
    if (shadowHitT > 0 && shadowHitT < distToLight) {
        maxDist = shadowHitT;
    }

    let drawDist = (currentState === STATES.SHADOW_RAY) ? animProg * 1000 : maxDist;
    let endPos = shadowRay.pointAt(Math.min(drawDist, maxDist));
    drawArrow(ctx, shadowRay.origin.x, shadowRay.origin.y, endPos.x, endPos.y, getCSSColor('--color-ray-shadow'));
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

document.addEventListener('DOMContentLoaded', init);
