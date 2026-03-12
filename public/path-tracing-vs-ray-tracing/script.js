const canvas = document.getElementById("render-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const totalSamplesEl = document.getElementById("total-samples");
const resetBtn = document.getElementById("reset-btn");

// Canvas size
const width = 640;
const height = 480;
canvas.width = width;
canvas.height = height;

// Accumulation buffer
let accumulationBuffer = new Float32Array(width * height * 3);
let totalSamples = 0;
let isPathTracing = false;
let animationFrameId = null;

// Settings
const settings = {
  mode: "ray", // 'ray' or 'path'
  lightSize: parseInt(document.getElementById("light-size").value),
  maxBounces: parseInt(document.getElementById("bounces").value),
  samplesPerFrame: parseInt(document.getElementById("samples-per-frame").value),
};

// Scene Geometry
// Use simple shapes: circles and planes
const scene = {
  spheres: [
    { center: { x: 320, y: 240 }, radius: 80, color: { r: 1.0, g: 0.2, b: 0.2 }, material: "diffuse" },
    { center: { x: 150, y: 300 }, radius: 60, color: { r: 0.2, g: 0.8, b: 0.2 }, material: "reflective" },
    { center: { x: 490, y: 300 }, radius: 60, color: { r: 0.2, g: 0.2, b: 1.0 }, material: "diffuse" }
  ],
  planes: [
    { normal: { x: 0, y: -1 }, d: 450, color: { r: 0.8, g: 0.8, b: 0.8 }, material: "diffuse" }, // Floor
    { normal: { x: 0, y: 1 }, d: -50, color: { r: 0.8, g: 0.8, b: 0.8 }, material: "diffuse" }, // Ceiling
    { normal: { x: 1, y: 0 }, d: -50, color: { r: 0.8, g: 0.2, b: 0.2 }, material: "diffuse" }, // Left wall
    { normal: { x: -1, y: 0 }, d: 590, color: { r: 0.2, g: 0.8, b: 0.2 }, material: "diffuse" }, // Right wall
    { normal: { x: 0, y: 0 }, d: 500, color: { r: 0.8, g: 0.8, b: 0.8 }, material: "diffuse" } // Back wall
  ],
  light: {
    center: { x: 320, y: 80 },
    emission: { r: 5.0, g: 5.0, b: 5.0 }
  }
};

// Vector math utilities
const vec2 = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (v, s) => ({ x: v.x * s, y: v.y * s }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  len: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  norm: (v) => {
    const l = vec2.len(v);
    return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
  },
  dist: (a, b) => vec2.len(vec2.sub(a, b)),
  reflect: (v, n) => vec2.sub(v, vec2.mul(n, 2 * vec2.dot(v, n)))
};

// Intersections
function intersectSphere(ray, sphere) {
  const oc = vec2.sub(ray.origin, sphere.center);
  const b = vec2.dot(oc, ray.dir);
  const c = vec2.dot(oc, oc) - sphere.radius * sphere.radius;
  const discriminant = b * b - c;

  if (discriminant > 0) {
    let t = -b - Math.sqrt(discriminant);
    if (t > 0.001) return t;
    t = -b + Math.sqrt(discriminant);
    if (t > 0.001) return t;
  }
  return Infinity;
}

function intersectPlane(ray, plane) {
  const denom = vec2.dot(plane.normal, ray.dir);
  if (Math.abs(denom) > 0.0001) {
    const t = -(vec2.dot(plane.normal, ray.origin) + plane.d) / denom;
    if (t > 0.001) return t;
  }
  return Infinity;
}

function intersectScene(ray) {
  let hit = { t: Infinity, obj: null, type: null };

  for (const sphere of scene.spheres) {
    const t = intersectSphere(ray, sphere);
    if (t < hit.t) {
      hit.t = t;
      hit.obj = sphere;
      hit.type = "sphere";
    }
  }

  for (const plane of scene.planes) {
    const t = intersectPlane(ray, plane);
    if (t < hit.t) {
      hit.t = t;
      hit.obj = plane;
      hit.type = "plane";
    }
  }

  // Intersect light source
  const oc = vec2.sub(ray.origin, scene.light.center);
  const b = vec2.dot(oc, ray.dir);
  const c = vec2.dot(oc, oc) - settings.lightSize * settings.lightSize;
  const discriminant = b * b - c;
  if (discriminant > 0) {
    let t = -b - Math.sqrt(discriminant);
    if (t > 0.001 && t < hit.t) {
      hit.t = t;
      hit.obj = scene.light;
      hit.type = "light";
    }
  }

  return hit;
}

function getNormal(hit, p) {
  if (hit.type === "sphere") {
    return vec2.norm(vec2.sub(p, hit.obj.center));
  } else if (hit.type === "plane") {
    return hit.obj.normal;
  }
  return { x: 0, y: -1 }; // Light normal (approx)
}

// Random utilities
function randomFloat() {
  return Math.random();
}

function randomDirectionInHemisphere(normal) {
  // Simple rejection sampling for 2D half-circle
  while (true) {
    const dir = { x: randomFloat() * 2 - 1, y: randomFloat() * 2 - 1 };
    if (vec2.dot(dir, dir) <= 1.0) {
      const nDir = vec2.norm(dir);
      if (vec2.dot(nDir, normal) > 0) {
        return nDir;
      }
    }
  }
}

// Ray tracing (Deterministic)
function traceRay(ray) {
  const hit = intersectScene(ray);

  if (hit.t === Infinity) {
    return { r: 0, g: 0, b: 0 };
  }

  if (hit.type === "light") {
    return scene.light.emission;
  }

  const p = vec2.add(ray.origin, vec2.mul(ray.dir, hit.t));
  const n = getNormal(hit, p);

  let color = { r: 0, g: 0, b: 0 };

  if (hit.obj.material === "reflective") {
    const refDir = vec2.reflect(ray.dir, n);
    const refRay = { origin: p, dir: refDir };
    const refHit = intersectScene(refRay);
    if (refHit.t !== Infinity && refHit.type !== "light") {
      color = hit.obj.color;
    }
  } else {
    // Diffuse material
    // Hard shadow: cast ray to light center
    const lightDir = vec2.norm(vec2.sub(scene.light.center, p));
    const shadowRay = { origin: p, dir: lightDir };
    const shadowHit = intersectScene(shadowRay);

    // If we hit the light, we are in illumination
    if (shadowHit.type === "light") {
      const ndotl = Math.max(0, vec2.dot(n, lightDir));
      const dist = vec2.dist(scene.light.center, p);
      const attenuation = 1.0 / (1.0 + 0.0005 * dist * dist);

      color.r = hit.obj.color.r * scene.light.emission.r * ndotl * attenuation;
      color.g = hit.obj.color.g * scene.light.emission.g * ndotl * attenuation;
      color.b = hit.obj.color.b * scene.light.emission.b * ndotl * attenuation;
    } else {
      // Ambient light hack for standard ray tracing
      color.r = hit.obj.color.r * 0.1;
      color.g = hit.obj.color.g * 0.1;
      color.b = hit.obj.color.b * 0.1;
    }
  }

  return color;
}

// Path tracing (Stochastic)
function tracePath(ray, depth) {
  if (depth > settings.maxBounces) {
    return { r: 0, g: 0, b: 0 };
  }

  const hit = intersectScene(ray);

  if (hit.t === Infinity) {
    return { r: 0, g: 0, b: 0 };
  }

  if (hit.type === "light") {
    return scene.light.emission;
  }

  const p = vec2.add(ray.origin, vec2.mul(ray.dir, hit.t));
  const n = getNormal(hit, p);

  let newDir;
  if (hit.obj.material === "reflective") {
    newDir = vec2.reflect(ray.dir, n);
    // Add a tiny bit of roughness
    newDir = vec2.add(newDir, { x: (randomFloat() - 0.5) * 0.1, y: (randomFloat() - 0.5) * 0.1 });
    newDir = vec2.norm(newDir);
  } else {
    // Diffuse scattering
    newDir = randomDirectionInHemisphere(n);
  }

  const newRay = { origin: p, dir: newDir };
  const incoming = tracePath(newRay, depth + 1);

  // Russian roulette or simple attenuation based on cosine
  const cosTheta = Math.max(0, vec2.dot(n, newDir));

  // Multiply incoming light by material color and cosine term
  return {
    r: hit.obj.color.r * incoming.r * cosTheta * 2.0, // Multiplier to boost brightness
    g: hit.obj.color.g * incoming.g * cosTheta * 2.0,
    b: hit.obj.color.b * incoming.b * cosTheta * 2.0
  };
}

// Rendering
function renderFrame() {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const samplesToTake = isPathTracing ? settings.samplesPerFrame : 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 3;
      const dataIndex = (y * width + x) * 4;

      let pixelColor = { r: 0, g: 0, b: 0 };

      for (let s = 0; s < samplesToTake; s++) {
        // Orthographic projection for simplicity, jitter for anti-aliasing in path tracing
        const jitterX = isPathTracing ? randomFloat() - 0.5 : 0;
        const jitterY = isPathTracing ? randomFloat() - 0.5 : 0;

        const ray = {
          origin: { x: x + jitterX, y: y + jitterY },
          dir: { x: 0, y: 1 } // Looking straight into the scene along Z (but it's 2D, so we look along Y? No, it's a top-down view!)
        };

        // Wait, 2D raytracing top-down:
        // Actually we should cast rays from the pixel itself if we want a 2D slice, or we simulate a camera.
        // Let's do a camera.
        const aspect = width / height;
        const camU = (x + jitterX) / width * 2 - 1;
        const camV = 1 - (y + jitterY) / height * 2;

        // Let's just do a simple mapping: the canvas IS the scene plane.
        // Rays originate from the pixel's position, pointing in random directions? No, that's for GI mapping.
        // Let's treat it as a camera looking into a 3D scene that's squashed to 2D.
        // Camera at origin (320, 600) looking up (0, -1)
        const camPos = { x: 320, y: 550 };
        const sensorPos = { x: 320 + camU * 320, y: 550 };

        const rayDir = vec2.norm(vec2.sub({ x: 320 + camU * 320, y: 240 }, camPos));

        const r = { origin: camPos, dir: vec2.norm(vec2.sub({x: x + jitterX, y: height/2}, camPos)) };
        // Actually it's simpler to just make it a pure 2D scene, but we need 1 ray per pixel!
        // So ray origin is the camera, ray direction goes through the pixel on a virtual screen.

        const dir = vec2.norm({
           x: (x + jitterX - width / 2),
           y: (y + jitterY - height / 2) - 400
        });
        const r2 = { origin: { x: width / 2, y: height + 100 }, dir: dir };

        // For a cooler 2D top down view, let's just trace from the pixel straight into the scene? No, that's orthographic.
        // Let's use camera

        let sampleColor;
        if (isPathTracing) {
          sampleColor = tracePath(r2, 0);
        } else {
          sampleColor = traceRay(r2);
        }

        pixelColor.r += sampleColor.r;
        pixelColor.g += sampleColor.g;
        pixelColor.b += sampleColor.b;
      }

      if (isPathTracing) {
        accumulationBuffer[pixelIndex] += pixelColor.r;
        accumulationBuffer[pixelIndex + 1] += pixelColor.g;
        accumulationBuffer[pixelIndex + 2] += pixelColor.b;

        // Tone mapping & Gamma correction
        const scale = 1.0 / totalSamples;
        const r = Math.min(1.0, Math.pow(accumulationBuffer[pixelIndex] * scale, 1.0 / 2.2));
        const g = Math.min(1.0, Math.pow(accumulationBuffer[pixelIndex + 1] * scale, 1.0 / 2.2));
        const b = Math.min(1.0, Math.pow(accumulationBuffer[pixelIndex + 2] * scale, 1.0 / 2.2));

        data[dataIndex] = r * 255;
        data[dataIndex + 1] = g * 255;
        data[dataIndex + 2] = b * 255;
        data[dataIndex + 3] = 255;
      } else {
        // Standard Ray Tracing
        const r = Math.min(1.0, Math.pow(pixelColor.r, 1.0 / 2.2));
        const g = Math.min(1.0, Math.pow(pixelColor.g, 1.0 / 2.2));
        const b = Math.min(1.0, Math.pow(pixelColor.b, 1.0 / 2.2));

        data[dataIndex] = r * 255;
        data[dataIndex + 1] = g * 255;
        data[dataIndex + 2] = b * 255;
        data[dataIndex + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (isPathTracing) {
    totalSamplesEl.innerText = totalSamples;
    animationFrameId = requestAnimationFrame(renderLoop);
  } else {
    totalSamplesEl.innerText = "1 (Deterministic)";
  }
}

function renderLoop() {
  totalSamples += settings.samplesPerFrame;
  renderFrame();
}

function resetRenderer() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  totalSamples = 0;
  accumulationBuffer.fill(0);

  if (settings.mode === "path") {
    isPathTracing = true;
    totalSamples = settings.samplesPerFrame;
    renderFrame();
    animationFrameId = requestAnimationFrame(renderLoop);
  } else {
    isPathTracing = false;
    renderFrame();
  }
}

// Event Listeners
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    settings.mode = e.target.value;
    resetRenderer();
  });
});

document.getElementById('light-size').addEventListener('input', (e) => {
  settings.lightSize = parseInt(e.target.value);
  document.getElementById('light-size-val').innerText = settings.lightSize;
  resetRenderer();
});

document.getElementById('bounces').addEventListener('input', (e) => {
  settings.maxBounces = parseInt(e.target.value);
  document.getElementById('bounces-val').innerText = settings.maxBounces;
  resetRenderer();
});

document.getElementById('samples-per-frame').addEventListener('input', (e) => {
  settings.samplesPerFrame = parseInt(e.target.value);
  document.getElementById('samples-per-frame-val').innerText = settings.samplesPerFrame;
});

resetBtn.addEventListener('click', resetRenderer);

// Initial render
resetRenderer();