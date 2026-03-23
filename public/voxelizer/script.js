const canvasContainer = document.getElementById('canvas-container');
const voxelSizeSlider = document.getElementById('voxel-size');
const voxelSizeValue = document.getElementById('voxel-size-value');

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 60);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 30, 20);
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x66fcf1, 0.5);
dirLight2.position.set(-20, -10, -20);
scene.add(dirLight2);

// Base Geometry (High-Poly)
// We use a TorusKnot to provide a complex shape to voxelize.
const geometry = new THREE.TorusKnotGeometry(10, 3, 200, 32);

// The issue says: "Convert a high-poly 3D model into an increasingly blocky Minecraft-style voxel grid by testing bounding box intersections."
// We don't render the base geometry, but we compute its bounding box to define the voxel grid.
geometry.computeBoundingBox();
const bbox = geometry.boundingBox;

let voxelGroup = new THREE.Group();
scene.add(voxelGroup);

const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
const voxelMaterial = new THREE.MeshStandardMaterial({
    color: 0x66fcf1,
    roughness: 0.4,
    metalness: 0.6,
});

function updateVoxels() {
    const voxelSize = parseFloat(voxelSizeSlider.value);
    voxelSizeValue.textContent = voxelSize.toFixed(1);

    // Remove old voxels
    if (voxelGroup.children.length > 0) {
        voxelGroup.remove(...voxelGroup.children);
    }

    // Grid bounds
    const minX = Math.floor(bbox.min.x / voxelSize) * voxelSize;
    const minY = Math.floor(bbox.min.y / voxelSize) * voxelSize;
    const minZ = Math.floor(bbox.min.z / voxelSize) * voxelSize;

    const maxX = Math.ceil(bbox.max.x / voxelSize) * voxelSize;
    const maxY = Math.ceil(bbox.max.y / voxelSize) * voxelSize;
    const maxZ = Math.ceil(bbox.max.z / voxelSize) * voxelSize;

    const dummy = new THREE.Object3D();
    const positions = [];
    const halfSize = voxelSize / 2;
    const positionsAttr = geometry.attributes.position;
    const v = new THREE.Vector3();

    // The issue states: "...by testing bounding box intersections."
    // To approximate voxelizing the *shape* and not just filling the AABB,
    // we iterate through the vertices of the high-poly model and determine
    // which voxel cell they fall into based on the cell's local bounding box.

    const voxelSet = new Set();

    for (let i = 0; i < positionsAttr.count; i++) {
        v.fromBufferAttribute(positionsAttr, i);

        // Find the voxel grid coordinate for this vertex
        const vx = Math.floor((v.x - minX) / voxelSize);
        const vy = Math.floor((v.y - minY) / voxelSize);
        const vz = Math.floor((v.z - minZ) / voxelSize);

        // Use a string key to keep track of unique voxels
        const key = `${vx},${vy},${vz}`;

        if (!voxelSet.has(key)) {
            voxelSet.add(key);

            // Calculate center of this voxel cell
            const cellCenter = new THREE.Vector3(
                minX + (vx * voxelSize) + halfSize,
                minY + (vy * voxelSize) + halfSize,
                minZ + (vz * voxelSize) + halfSize
            );

            // The logic: checking if the vertex falls within the cell's local bounding box
            // is effectively handled by the spatial hashing above, which is highly efficient.
            // If the vertex is in the cell, then the base model's bounding box (around that vertex)
            // intersects the cell's local bounding box.

            positions.push(cellCenter);
        }
    }

    // Use InstancedMesh for performance
    if (positions.length > 0) {
        const instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, positions.length);

        // Make the voxels slightly smaller than the cell size to create distinct blocks
        const scale = voxelSize * 0.95;
        dummy.scale.set(scale, scale, scale);

        for (let i = 0; i < positions.length; i++) {
            dummy.position.copy(positions[i]);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        voxelGroup.add(instancedMesh);
    }
}

// Initial voxelization
updateVoxels();

// Event listeners
voxelSizeSlider.addEventListener('input', updateVoxels);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera rotation
let rotationY = 0;
let rotationX = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    rotationY += 0.005;

    voxelGroup.rotation.y = rotationY;
    voxelGroup.rotation.x = rotationX;

    renderer.render(scene, camera);
}

animate();
