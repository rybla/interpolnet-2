const canvas = document.getElementById('render-canvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('interpolation-slider');
const intensityValue = document.getElementById('intensity-value');

// Base 3D geometry data for a simple low-poly face structure
// Y represents vertical, X represents horizontal, Z represents depth
const baseVertices = [
  // Top/Forehead
  {x: 0, y: 120, z: 20}, {x: -60, y: 100, z: -10}, {x: 60, y: 100, z: -10},
  // Eyes line
  {x: -40, y: 40, z: 50}, {x: 40, y: 40, z: 50}, {x: 0, y: 40, z: 40}, // 5 is bridge of nose
  // Cheeks
  {x: -70, y: -20, z: 30}, {x: 70, y: -20, z: 30},
  // Nose tip
  {x: 0, y: -20, z: 80},
  // Mouth area (Neutral: horizontal straight line)
  {x: -30, y: -60, z: 50}, // left corner 9
  {x: 0, y: -60, z: 60},   // center upper 10
  {x: 30, y: -60, z: 50},  // right corner 11
  {x: 0, y: -70, z: 55},   // center lower 12
  // Chin
  {x: 0, y: -110, z: 40}, // 13
  // Jawline
  {x: -50, y: -100, z: 0}, {x: 50, y: -100, z: 0} // 14, 15
];

// Smiling target mesh: The same topology, but mouth corners move up and out,
// cheeks lift slightly.
const smileVertices = JSON.parse(JSON.stringify(baseVertices));
// Move left corner up and out
smileVertices[9] = {x: -45, y: -45, z: 45};
// Move right corner up and out
smileVertices[11] = {x: 45, y: -45, z: 45};
// Slightly lift upper and lower lip centers
smileVertices[10] = {x: 0, y: -55, z: 62};
smileVertices[12] = {x: 0, y: -68, z: 58};
// Cheeks lift up slightly due to smile
smileVertices[6] = {x: -72, y: -10, z: 35};
smileVertices[7] = {x: 72, y: -10, z: 35};
// Eyes slightly squint (move down a bit)
smileVertices[3].y -= 5;
smileVertices[4].y -= 5;

// Define the triangular faces by indexing into the vertex arrays
const faces = [
  // Forehead to eyes
  [0, 1, 3], [0, 3, 5], [0, 5, 4], [0, 4, 2],
  // Eyes to cheeks & nose
  [1, 6, 3], [3, 6, 8], [3, 8, 5], [5, 8, 4], [4, 8, 7], [4, 7, 2],
  // Cheeks to mouth
  [6, 14, 9], [6, 9, 8], [7, 8, 11], [7, 11, 15],
  // Nose to mouth
  [8, 9, 10], [8, 10, 11],
  // Mouth opening (Upper to lower lip)
  [9, 12, 10], [10, 12, 11],
  // Mouth to chin
  [9, 14, 13], [9, 13, 12], [11, 12, 13], [11, 13, 15]
];

let interpolationFactor = 0;
let time = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

slider.addEventListener('input', (e) => {
  interpolationFactor = e.target.value / 100;
  intensityValue.textContent = e.target.value;
});

// Custom 3D projection rendering logic
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Passive animation: slow rotation to appreciate the 3D structure
  time += 0.01;
  const angleY = Math.sin(time) * 0.4;
  const angleX = Math.cos(time * 0.7) * 0.1 - 0.1;

  // 1. Interpolate vertices based on slider
  const currentVertices = baseVertices.map((base, i) => {
    const smile = smileVertices[i];
    return {
      x: base.x + (smile.x - base.x) * interpolationFactor,
      y: base.y + (smile.y - base.y) * interpolationFactor,
      z: base.z + (smile.z - base.z) * interpolationFactor
    };
  });

  // 2. Rotate and project vertices to 2D
  const projectedVertices = currentVertices.map(v => {
    // Rotate Y
    let rx = v.x * Math.cos(angleY) - v.z * Math.sin(angleY);
    let rz = v.x * Math.sin(angleY) + v.z * Math.cos(angleY);

    // Rotate X
    let ry = v.y * Math.cos(angleX) - rz * Math.sin(angleX);
    rz = v.y * Math.sin(angleX) + rz * Math.cos(angleX);

    // Apply simple perspective projection
    const fov = 500;
    const distance = 400; // Camera distance
    const scale = fov / (fov + rz + distance);

    return {
      x: (rx * scale) + (canvas.width / 2),
      y: -(ry * scale) + (canvas.height / 2),
      z: rz,
      orig: { x: rx, y: ry, z: rz } // Keep rotated 3D coords for shading
    };
  });

  // 3. Depth Sorting (Painter's Algorithm)
  const faceData = faces.map((faceIndices, index) => {
    const v1 = projectedVertices[faceIndices[0]];
    const v2 = projectedVertices[faceIndices[1]];
    const v3 = projectedVertices[faceIndices[2]];
    // Average Z for depth
    const zAvg = (v1.z + v2.z + v3.z) / 3;

    // Calculate normal vector for shading
    const p1 = v1.orig;
    const p2 = v2.orig;
    const p3 = v3.orig;

    const u = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

    // Cross product
    let nx = u.y * v.z - u.z * v.y;
    let ny = u.z * v.x - u.x * v.z;
    let nz = u.x * v.y - u.y * v.x;

    // Normalize
    const length = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if (length > 0) {
      nx /= length; ny /= length; nz /= length;
    }

    return { indices: faceIndices, zAvg: zAvg, normal: {x: nx, y: ny, z: nz} };
  });

  // Sort back-to-front
  faceData.sort((a, b) => b.zAvg - a.zAvg);

  // 4. Draw Faces
  // Simple directional light from top-front
  const lightDir = { x: 0, y: 0.5, z: 1 };
  const lightLen = Math.sqrt(lightDir.x*lightDir.x + lightDir.y*lightDir.y + lightDir.z*lightDir.z);
  lightDir.x /= lightLen; lightDir.y /= lightLen; lightDir.z /= lightLen;

  for (const face of faceData) {
    // Backface culling: if normal points away from camera (z < 0), skip drawing
    if (face.normal.z < 0) continue;

    const v1 = projectedVertices[face.indices[0]];
    const v2 = projectedVertices[face.indices[1]];
    const v3 = projectedVertices[face.indices[2]];

    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.lineTo(v3.x, v3.y);
    ctx.closePath();

    // Calculate light intensity via dot product
    const intensity = Math.max(0.1, face.normal.x * lightDir.x + face.normal.y * lightDir.y + face.normal.z * lightDir.z);

    // Base color cyan-ish (e.g. #00ffcc -> 0, 255, 204) modified by lighting
    const r = Math.floor(0 * intensity);
    const g = Math.floor(255 * intensity);
    const b = Math.floor(204 * intensity);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();

    // Draw wireframe overlay to emphasize structure and interpolation
    ctx.strokeStyle = `rgba(0, 255, 204, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw prominent vertices so the interpolation movement is very obvious
    ctx.fillStyle = '#ff00ff';
    for (const v of [v1, v2, v3]) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(render);
}

render();
