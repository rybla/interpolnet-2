// 2D Canvas setup
const canvas = document.getElementById('uv-canvas');
const ctx = canvas.getContext('2d');

// The UV map layout will be a 4x3 grid.
//  [ ][T][ ][ ]
//  [L][F][R][B]
//  [ ][Bo][ ][ ]
// Each square will be 200x200 pixels.
// Total canvas width = 4 * 200 = 800
// Total canvas height = 3 * 200 = 600

const TILE_SIZE = 200;

// Draw initial grid and guides
function drawGuides() {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';

    const tiles = [
        { x: 1, y: 0, label: 'TOP' },
        { x: 0, y: 1, label: 'LEFT' },
        { x: 1, y: 1, label: 'FRONT' },
        { x: 2, y: 1, label: 'RIGHT' },
        { x: 3, y: 1, label: 'BACK' },
        { x: 1, y: 2, label: 'BOTTOM' }
    ];

    tiles.forEach(tile => {
        const px = tile.x * TILE_SIZE;
        const py = tile.y * TILE_SIZE;

        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillText(tile.label, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
    });
}

// Initial drawing
drawGuides();

// Painting logic
let isPainting = false;

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function startPosition(e) {
    isPainting = true;
    draw(e);
}

function endPosition() {
    isPainting = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isPainting) return;

    e.preventDefault(); // prevent scrolling on touch

    const pos = getPos(e);

    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#38bdf8'; // Neon blue/cyan accent

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    // Flag texture for update
    if (texture) {
        texture.needsUpdate = true;
    }
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseout', endPosition);

canvas.addEventListener('touchstart', startPosition, { passive: false });
canvas.addEventListener('touchend', endPosition);
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchcancel', endPosition);


// Three.js 3D Scene setup
const container3d = document.getElementById('three-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a); // Match container background

const camera = new THREE.PerspectiveCamera(75, container3d.clientWidth / container3d.clientHeight, 0.1, 1000);
camera.position.z = 3;
camera.position.x = 2;
camera.position.y = 2;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container3d.clientWidth, container3d.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container3d.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Create the material using the canvas as a texture
const texture = new THREE.CanvasTexture(canvas);
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// Ensure pixelated mapping
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.6,
    metalness: 0.2
});

const geometry = new THREE.BoxGeometry(2, 2, 2);

// Re-map UV coordinates to match our 4x3 grid layout
// UVs are normalized between 0 and 1
// Layout:
//  [ ][T][ ][ ] -> Top
//  [L][F][R][B] -> Left, Front, Right, Back
//  [ ][Bo][ ][ ] -> Bottom
// Grid is 4 wide by 3 high

const w = 1/4; // width of one tile
const h = 1/3; // height of one tile

// Helper to get UVs for a specific tile (column, row) from bottom-left
// WebGL UV origin (0,0) is bottom-left, canvas origin (0,0) is top-left.
// So canvas row 0 is UV row 2.
// Canvas layout:
// col,row:
// (1,0) = Top
// (0,1) = Left
// (1,1) = Front
// (2,1) = Right
// (3,1) = Back
// (1,2) = Bottom

// Convert to UV space (from bottom-left):
function getTileUV(col, row) {
    const uvCol = col;
    const uvRow = 2 - row; // flip y

    const u0 = uvCol * w;
    const v0 = uvRow * h;
    const u1 = (uvCol + 1) * w;
    const v1 = (uvRow + 1) * h;

    // Return standard face UVs: [u0,v1, u1,v1, u0,v0, u1,v0] (bottom-left origin mapped)
    // BoxGeometry uses a different vertex order. We need to set the UVs specifically.
    return {u0, v0, u1, v1};
}

const tilesMap = {
    right: getTileUV(2, 1),
    left: getTileUV(0, 1),
    top: getTileUV(1, 0),
    bottom: getTileUV(1, 2),
    front: getTileUV(1, 1),
    back: getTileUV(3, 1)
};

// Update geometry UVs
const uvAttribute = geometry.attributes.uv;

// BoxGeometry face order: Right, Left, Top, Bottom, Front, Back
// Each face has 4 vertices, thus 2 triangles (6 vertices total in non-indexed, but r128 BoxGeometry is indexed by default).
// Actually r128 BoxGeometry has 24 vertices (4 per face) and an index buffer.
const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];

for (let i = 0; i < 6; i++) {
    const faceName = faceOrder[i];
    const uv = tilesMap[faceName];

    // Each face has 4 vertices. Order is typically top-left, top-right, bottom-left, bottom-right locally.
    // Wait, BoxGeometry vertex UV layout per face:
    // 0: 0,1 (top-left)
    // 1: 1,1 (top-right)
    // 2: 0,0 (bottom-left)
    // 3: 1,0 (bottom-right)

    const vertexIndexOffset = i * 4;

    // Modify UVs for the 4 vertices of this face
    uvAttribute.setXY(vertexIndexOffset + 0, uv.u0, uv.v1); // top-left
    uvAttribute.setXY(vertexIndexOffset + 1, uv.u1, uv.v1); // top-right
    uvAttribute.setXY(vertexIndexOffset + 2, uv.u0, uv.v0); // bottom-left
    uvAttribute.setXY(vertexIndexOffset + 3, uv.u1, uv.v0); // bottom-right
}
uvAttribute.needsUpdate = true;

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Passive animation: slow rotation if not interacting
    if (!controls.state && !isPainting) {
        cube.rotation.y += 0.005;
        cube.rotation.x += 0.002;
    }

    renderer.render(scene, camera);
}
animate();

// Handle resizing
window.addEventListener('resize', () => {
    camera.aspect = container3d.clientWidth / container3d.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container3d.clientWidth, container3d.clientHeight);
});
