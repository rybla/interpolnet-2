document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("paintCanvas");
  const ctx = canvas.getContext("2d");
  const viewPanel = document.getElementById("viewPanel");

  // Canvas size and drawing settings
  const SIZE = 512;
  const CELL = SIZE / 4; // 4x3 grid for unfolded cube
  const paintColor = "#00ffcc"; // Neon cyan
  const brushSize = 10;
  let isPainting = false;
  let lastPos = null;

  // Initialize canvas background and UV layout guide
  function initCanvas() {
    ctx.fillStyle = "#2c3e50"; // Dark blue-gray background
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Draw grid lines to indicate the unfolded cube (cross pattern)
    // Layout:
    //      [Top]
    // [Left][Front][Right][Back]
    //      [Bottom]
    // The dimensions of the cross fit in a 4x3 grid.

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Top face
    ctx.rect(CELL, 0, CELL, CELL);
    // Left face
    ctx.rect(0, CELL, CELL, CELL);
    // Front face
    ctx.rect(CELL, CELL, CELL, CELL);
    // Right face
    ctx.rect(CELL * 2, CELL, CELL, CELL);
    // Back face
    ctx.rect(CELL * 3, CELL, CELL, CELL);
    // Bottom face
    ctx.rect(CELL, CELL * 2, CELL, CELL);

    ctx.stroke();

    // Fill unused areas with darker color to indicate non-paintable regions (purely visual)
    ctx.fillStyle = "#1a252f";
    ctx.fillRect(0, 0, CELL, CELL);
    ctx.fillRect(CELL * 2, 0, CELL * 2, CELL);
    ctx.fillRect(0, CELL * 2, CELL, CELL);
    ctx.fillRect(CELL * 2, CELL * 2, CELL * 2, CELL);
    ctx.fillRect(0, CELL * 3, SIZE, CELL); // Empty bottom row
  }

  initCanvas();

  // Pointer interaction
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startPosition(e) {
    isPainting = true;
    lastPos = getMousePos(e);
    draw(e);
  }

  function endPosition() {
    isPainting = false;
    lastPos = null;
    ctx.beginPath();
  }

  function draw(e) {
    if (!isPainting) return;

    e.preventDefault();

    const currentPos = getMousePos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = paintColor;

    ctx.beginPath();
    if (lastPos) {
      ctx.moveTo(lastPos.x, lastPos.y);
    } else {
      ctx.moveTo(currentPos.x, currentPos.y);
    }
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPos = currentPos;

    // Signal Three.js that texture has updated
    if (texture) {
      texture.needsUpdate = true;
    }
  }

  canvas.addEventListener("pointerdown", startPosition);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", endPosition);
  canvas.addEventListener("pointerout", endPosition);
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

  // -------------------------
  // Three.js 3D Setup
  // -------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#121212");

  const camera = new THREE.PerspectiveCamera(45, viewPanel.clientWidth / viewPanel.clientHeight, 0.1, 100);
  camera.position.z = 4;
  camera.position.y = 1;
  camera.position.x = 2;
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewPanel.clientWidth, viewPanel.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  viewPanel.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // Box Geometry and UV Mapping
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

  // The UV mapping strategy for BoxGeometry needs to match our 4x3 cross
  // UV coordinates go from 0 to 1.
  // We have 4 columns and 4 rows (since our canvas is square but our cross fits in 4x3, the bottom row is unused).
  // Actually, SIZE=512, CELL=128.
  // 4 columns = 1.0 / 4 = 0.25 each.
  // 4 rows = 1.0 / 4 = 0.25 each. (y is bottom-up in WebGL)

  // Map individual faces to specific rectangles in the UV space
  // Face order in BoxGeometry: Right, Left, Top, Bottom, Front, Back

  const col = 0.25;
  const row = 0.25;

  // Helper to generate UVs for a face given its grid position (x, y) where (0,0) is top-left in 2D canvas
  // Keep in mind WebGL UV 'y' is 0 at the bottom, 1 at the top.
  function setFaceUVs(faceIndex, gridX, gridY) {
    const uvs = geometry.attributes.uv;

    // Convert gridY (0 is top row) to uvY (0 is bottom).
    // Our canvas is 4x4 cells (bottom row unused).
    // Row 0 is y in [0.75, 1.0]
    // Row 1 is y in [0.5, 0.75]
    // Row 2 is y in [0.25, 0.5]
    // Row 3 is y in [0.0, 0.25]
    const u0 = gridX * col;
    const u1 = (gridX + 1) * col;
    const v1 = 1.0 - (gridY * row);
    const v0 = 1.0 - ((gridY + 1) * row);

    // Each face has 2 triangles = 6 vertices = 6 UV pairs.
    // In BoxGeometry, faces are 4 vertices indexed into triangles. Wait, in BufferGeometry each face is 6 vertices if not indexed.
    // Let's check if it's indexed.

    // For BoxGeometry in r128, it IS indexed. But we can modify the UV array directly since vertices might be shared?
    // Actually, BoxGeometry vertices are duplicated per face to allow distinct normals/UVs.
    // So there are 24 vertices.

    const vertexIndexOffset = faceIndex * 4;

    // BoxGeometry vertex order per face:
    // 0: top right
    // 1: top left
    // 2: bottom right
    // 3: bottom left

    uvs.setXY(vertexIndexOffset + 0, u1, v1);
    uvs.setXY(vertexIndexOffset + 1, u0, v1);
    uvs.setXY(vertexIndexOffset + 2, u1, v0);
    uvs.setXY(vertexIndexOffset + 3, u0, v0);
  }

  // Right face (x = 1, y = 1) in our cross
  // Wait, let's map: Right face is right of front -> grid(2,1)
  setFaceUVs(0, 2, 1);
  // Left face is left of front -> grid(0,1)
  setFaceUVs(1, 0, 1);
  // Top face is above front -> grid(1,0)
  setFaceUVs(2, 1, 0);
  // Bottom face is below front -> grid(1,2)
  setFaceUVs(3, 1, 2);
  // Front face -> grid(1,1)
  setFaceUVs(4, 1, 1);
  // Back face is right of Right face -> grid(3,1)
  setFaceUVs(5, 3, 1);

  geometry.attributes.uv.needsUpdate = true;

  // Texture and Material
  let texture = new THREE.CanvasTexture(canvas);
  // Disable filtering to make the grid and strokes look sharp (optional)
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.1
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Rotation controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };
  let currentRotation = { x: 0, y: 0 };

  viewPanel.addEventListener("pointerdown", e => {
    isDragging = true;
    previousMousePosition = { x: e.offsetX, y: e.offsetY };
  });

  viewPanel.addEventListener("pointermove", e => {
    if (isDragging) {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      targetRotation.y += deltaMove.x * 0.01;
      targetRotation.x += deltaMove.y * 0.01;

      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    }
  });

  window.addEventListener("pointerup", () => {
    isDragging = false;
  });

  // Handle Resize
  window.addEventListener("resize", () => {
    camera.aspect = viewPanel.clientWidth / viewPanel.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewPanel.clientWidth, viewPanel.clientHeight);
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Gently auto-rotate if not dragging
    if (!isDragging) {
      targetRotation.y -= 0.005;
      targetRotation.x -= 0.002;
    }

    // Smoothly interpolate rotation
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;

    cube.rotation.x = currentRotation.x;
    cube.rotation.y = currentRotation.y;

    renderer.render(scene, camera);
  }

  animate();
});
