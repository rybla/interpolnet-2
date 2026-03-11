import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// We'll use a simplified BSP-based CSG implementation directly in this file
// Adapted from standard csg.js (Constructive Solid Geometry)

// CSG Implementation starts here
class CSG {
  constructor() {
    this.polygons = [];
  }
  clone() {
    let csg = new CSG();
    csg.polygons = this.polygons.map(p => p.clone());
    return csg;
  }
  toPolygons() {
    return this.polygons;
  }
  union(csg) {
    let a = new Node(this.clone().polygons);
    let b = new Node(csg.clone().polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    return CSG.fromPolygons(a.allPolygons());
  }
  subtract(csg) {
    let a = new Node(this.clone().polygons);
    let b = new Node(csg.clone().polygons);
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }
  intersect(csg) {
    let a = new Node(this.clone().polygons);
    let b = new Node(csg.clone().polygons);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }
  inverse() {
    let csg = this.clone();
    csg.polygons.forEach(p => p.flip());
    return csg;
  }
}

CSG.fromPolygons = function(polygons) {
  let csg = new CSG();
  csg.polygons = polygons;
  return csg;
};

class Vertex {
  constructor(pos, normal, uv) {
    this.pos = pos;
    this.normal = normal;
    this.uv = uv;
  }
  clone() {
    return new Vertex(this.pos.clone(), this.normal.clone(), this.uv.clone());
  }
  flip() {
    this.normal.negate();
  }
  interpolate(other, t) {
    return new Vertex(
      this.pos.clone().lerp(other.pos, t),
      this.normal.clone().lerp(other.normal, t),
      this.uv.clone().lerp(other.uv, t)
    );
  }
}

class Plane {
  constructor(normal, w) {
    this.normal = normal;
    this.w = w;
  }
  clone() {
    return new Plane(this.normal.clone(), this.w);
  }
  flip() {
    this.normal.negate();
    this.w = -this.w;
  }
  splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
    const COPLANAR = 0;
    const FRONT = 1;
    const BACK = 2;
    const SPANNING = 3;

    let polygonType = 0;
    let types = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      let t = this.normal.dot(polygon.vertices[i].pos) - this.w;
      let type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:
        front.push(polygon);
        break;
      case BACK:
        back.push(polygon);
        break;
      case SPANNING:
        let f = [], b = [];
        for (let i = 0; i < polygon.vertices.length; i++) {
          let j = (i + 1) % polygon.vertices.length;
          let ti = types[i], tj = types[j];
          let vi = polygon.vertices[i], vj = polygon.vertices[j];
          if (ti != BACK) f.push(vi);
          if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
          if ((ti | tj) == SPANNING) {
            let t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.clone().sub(vi.pos));
            let v = vi.interpolate(vj, t);
            f.push(v);
            b.push(v.clone());
          }
        }
        if (f.length >= 3) front.push(new Polygon(f, polygon.shared));
        if (b.length >= 3) back.push(new Polygon(b, polygon.shared));
        break;
    }
  }
}
Plane.EPSILON = 1e-5;
Plane.fromPoints = function(a, b, c) {
  let n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  return new Plane(n, n.dot(a));
};

class Polygon {
  constructor(vertices, shared) {
    this.vertices = vertices;
    this.shared = shared;
    this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
  }
  clone() {
    return new Polygon(this.vertices.map(v => v.clone()), this.shared);
  }
  flip() {
    this.vertices.reverse().map(v => v.flip());
    this.plane.flip();
  }
}

class Node {
  constructor(polygons) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];
    if (polygons) this.build(polygons);
  }
  clone() {
    let node = new Node();
    node.plane = this.plane && this.plane.clone();
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    node.polygons = this.polygons.map(p => p.clone());
    return node;
  }
  clipPolygons(polygons) {
    if (!this.plane) return polygons.slice();
    let front = [], back = [];
    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], front, back, front, back);
    }
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  }
  clipTo(bsp) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  }
  invert() {
    for (let i = 0; i < this.polygons.length; i++) this.polygons[i].flip();
    this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    let temp = this.front;
    this.front = this.back;
    this.back = temp;
  }
  build(polygons) {
    if (!polygons.length) return;
    if (!this.plane) this.plane = polygons[0].plane.clone();
    let front = [], back = [];
    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
    }
    if (front.length) {
      if (!this.front) this.front = new Node();
      this.front.build(front);
    }
    if (back.length) {
      if (!this.back) this.back = new Node();
      this.back.build(back);
    }
  }
  allPolygons() {
    let polygons = this.polygons.slice();
    if (this.front) polygons = polygons.concat(this.front.allPolygons());
    if (this.back) polygons = polygons.concat(this.back.allPolygons());
    return polygons;
  }
}

// Three.js <> CSG adapters
function meshToCSG(mesh) {
  mesh.updateMatrixWorld();
  const geometry = mesh.geometry;
  const matrix = mesh.matrixWorld;
  const polygons = [];

  if (!geometry.index) return new CSG(); // Assuming indexed geometries for simplicity

  const positionAttribute = geometry.getAttribute('position');
  const normalAttribute = geometry.getAttribute('normal');
  const uvAttribute = geometry.getAttribute('uv');

  for (let i = 0; i < geometry.index.count; i += 3) {
    const a = geometry.index.getX(i);
    const b = geometry.index.getX(i + 1);
    const c = geometry.index.getX(i + 2);

    const vertices = [];
    [a, b, c].forEach(idx => {
      let pos = new THREE.Vector3().fromBufferAttribute(positionAttribute, idx).applyMatrix4(matrix);
      let normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, idx).transformDirection(matrix);
      let uv = uvAttribute ? new THREE.Vector2().fromBufferAttribute(uvAttribute, idx) : new THREE.Vector2();
      vertices.push(new Vertex(pos, normal, uv));
    });

    polygons.push(new Polygon(vertices, mesh.material));
  }

  return CSG.fromPolygons(polygons);
}

function csgToMesh(csg, material) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];

  const polygons = csg.toPolygons();
  for (let i = 0; i < polygons.length; i++) {
    let poly = polygons[i];
    for (let j = 2; j < poly.vertices.length; j++) {
      let v0 = poly.vertices[0];
      let v1 = poly.vertices[j - 1];
      let v2 = poly.vertices[j];

      positions.push(v0.pos.x, v0.pos.y, v0.pos.z);
      normals.push(v0.normal.x, v0.normal.y, v0.normal.z);
      uvs.push(v0.uv.x, v0.uv.y);

      positions.push(v1.pos.x, v1.pos.y, v1.pos.z);
      normals.push(v1.normal.x, v1.normal.y, v1.normal.z);
      uvs.push(v1.uv.x, v1.uv.y);

      positions.push(v2.pos.x, v2.pos.y, v2.pos.z);
      normals.push(v2.normal.x, v2.normal.y, v2.normal.z);
      uvs.push(v2.uv.x, v2.uv.y);
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

  return new THREE.Mesh(geom, material);
}

// Main App
const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', function (event) {
  orbitControls.enabled = !event.value;
});
scene.add(transformControls);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Grid
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(gridHelper);

// Materials
const transparentMaterial = new THREE.MeshStandardMaterial({
  color: 0x00d2d3,
  transparent: true,
  opacity: 0.6,
  roughness: 0.2,
  metalness: 0.1,
  side: THREE.DoubleSide
});

const selectedMaterial = new THREE.MeshStandardMaterial({
  color: 0xff9f43,
  transparent: true,
  opacity: 0.8,
  roughness: 0.2,
  metalness: 0.1,
  side: THREE.DoubleSide
});

const resultMaterial = new THREE.MeshStandardMaterial({
  color: 0x8395a7,
  roughness: 0.4,
  metalness: 0.6,
  side: THREE.DoubleSide
});

let objects = [];
let selectedObjects = [];

function createShape(type) {
  let geometry;
  if (type === 'cube') {
    geometry = new THREE.BoxGeometry(2, 2, 2);
  } else if (type === 'sphere') {
    geometry = new THREE.SphereGeometry(1.2, 32, 32);
  } else if (type === 'cylinder') {
    geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
  }

  const mesh = new THREE.Mesh(geometry, transparentMaterial.clone());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 1;
  mesh.position.x = (Math.random() - 0.5) * 4;
  mesh.position.z = (Math.random() - 0.5) * 4;
  scene.add(mesh);
  objects.push(mesh);

  // Set random color for distinctiveness
  const colors = [0x00d2d3, 0xff6b6b, 0x1dd1a1, 0x54a0ff, 0x5f27cd];
  mesh.material.color.setHex(colors[objects.length % colors.length]);
}

// Raycasting for selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (event) => {
  // Ignore clicks on UI
  if (event.target !== renderer.domElement) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    // Check if dragging transform controls
    if (transformControls.dragging) return;

    const object = intersects[0].object;

    // Toggle selection
    const index = selectedObjects.indexOf(object);
    if (index > -1) {
      // Deselect
      selectedObjects.splice(index, 1);
      object.material.emissive.setHex(0x000000);

      if (selectedObjects.length > 0) {
        transformControls.attach(selectedObjects[selectedObjects.length - 1]);
      } else {
        transformControls.detach();
      }
    } else {
      // Select
      if (selectedObjects.length >= 2) {
        // Deselect first if already 2 selected
        let first = selectedObjects.shift();
        first.material.emissive.setHex(0x000000);
      }
      selectedObjects.push(object);
      object.material.emissive.setHex(0x333333);
      transformControls.attach(object);
    }
  } else {
    // Clicked empty space
    if (!transformControls.dragging) {
      clearSelection();
    }
  }
});

function clearSelection() {
  selectedObjects.forEach(obj => {
    obj.material.emissive.setHex(0x000000);
  });
  selectedObjects = [];
  transformControls.detach();
}

function clearAll() {
  clearSelection();
  objects.forEach(obj => scene.remove(obj));
  objects = [];
}

function performOperation(op) {
  if (selectedObjects.length !== 2) {
    alert("Please select exactly two shapes.");
    return;
  }

  const meshA = selectedObjects[0];
  const meshB = selectedObjects[1];

  const csgA = meshToCSG(meshA);
  const csgB = meshToCSG(meshB);

  let resultCSG;
  try {
    if (op === 'union') {
      resultCSG = csgA.union(csgB);
    } else if (op === 'subtract') {
      resultCSG = csgA.subtract(csgB);
    } else if (op === 'intersect') {
      resultCSG = csgA.intersect(csgB);
    }
  } catch (e) {
    console.error("CSG Error", e);
    alert("Operation failed due to geometry issues.");
    return;
  }

  const resultMesh = csgToMesh(resultCSG, resultMaterial.clone());
  resultMesh.castShadow = true;
  resultMesh.receiveShadow = true;

  // Remove old objects
  scene.remove(meshA);
  scene.remove(meshB);
  objects = objects.filter(o => o !== meshA && o !== meshB);

  // Add new object
  scene.add(resultMesh);
  objects.push(resultMesh);

  clearSelection();

  // Select the new result
  selectedObjects.push(resultMesh);
  resultMesh.material.emissive.setHex(0x333333);
  transformControls.attach(resultMesh);
}

// UI Listeners
document.getElementById('add-cube').addEventListener('click', () => createShape('cube'));
document.getElementById('add-sphere').addEventListener('click', () => createShape('sphere'));
document.getElementById('add-cylinder').addEventListener('click', () => createShape('cylinder'));

document.getElementById('op-union').addEventListener('click', () => performOperation('union'));
document.getElementById('op-subtract').addEventListener('click', () => performOperation('subtract'));
document.getElementById('op-intersect').addEventListener('click', () => performOperation('intersect'));

document.getElementById('clear-selection').addEventListener('click', clearSelection);
document.getElementById('clear-all').addEventListener('click', clearAll);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

// Start
createShape('cube');
createShape('sphere');
animate();
