/**
 * Simple Constructive Solid Geometry Visualizer
 * Uses an embedded lightweight CSG (Constructive Solid Geometry) library
 * to perform actual 3D boolean operations on Three.js meshes.
 */

// --- Embedded CSG Library ---
// Adapted from the classic CSG.js by Evan Wallace (http://madebyevan.com), MIT License.
class CSGVertex {
    constructor(pos, normal, uv) {
        this.pos = pos;
        this.normal = normal;
        this.uv = uv;
    }
    clone() {
        return new CSGVertex(this.pos.clone(), this.normal.clone(), this.uv ? this.uv.clone() : null);
    }
    flip() {
        this.normal.negate();
    }
    interpolate(other, t) {
        return new CSGVertex(
            this.pos.clone().lerp(other.pos, t),
            this.normal.clone().lerp(other.normal, t),
            this.uv && other.uv ? this.uv.clone().lerp(other.uv, t) : null
        );
    }
}

class CSGPolygon {
    constructor(vertices, shared) {
        this.vertices = vertices;
        this.shared = shared;
        this.plane = new CSGPlane().fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }
    clone() {
        return new CSGPolygon(this.vertices.map(v => v.clone()), this.shared);
    }
    flip() {
        this.vertices.reverse().forEach(v => v.flip());
        this.plane.flip();
    }
}

class CSGPlane {
    constructor(normal, w) {
        this.normal = normal || new THREE.Vector3();
        this.w = w || 0;
    }
    fromPoints(a, b, c) {
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
        this.normal = n;
        this.w = n.dot(a);
        return this;
    }
    clone() {
        return new CSGPlane(this.normal.clone(), this.w);
    }
    flip() {
        this.normal.negate();
        this.w = -this.w;
    }
    splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
        const COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3;
        const EPSILON = 1e-5;
        let polygonType = 0;
        const types = [];

        for (let i = 0; i < polygon.vertices.length; i++) {
            const t = this.normal.dot(polygon.vertices[i].pos) - this.w;
            const type = (t < -EPSILON) ? BACK : (t > EPSILON) ? FRONT : COPLANAR;
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
                const f = [], b = [];
                for (let i = 0; i < polygon.vertices.length; i++) {
                    const j = (i + 1) % polygon.vertices.length;
                    const ti = types[i], tj = types[j];
                    const vi = polygon.vertices[i], vj = polygon.vertices[j];
                    if (ti !== BACK) f.push(vi);
                    if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);
                    if ((ti | tj) === SPANNING) {
                        const t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(new THREE.Vector3().subVectors(vj.pos, vi.pos));
                        const v = vi.interpolate(vj, t);
                        f.push(v);
                        b.push(v.clone());
                    }
                }
                if (f.length >= 3) front.push(new CSGPolygon(f, polygon.shared));
                if (b.length >= 3) back.push(new CSGPolygon(b, polygon.shared));
                break;
        }
    }
}

class CSGNode {
    constructor(polygons) {
        this.plane = null;
        this.front = null;
        this.back = null;
        this.polygons = [];
        if (polygons) this.build(polygons);
    }
    clone() {
        const node = new CSGNode();
        node.plane = this.plane && this.plane.clone();
        node.front = this.front && this.front.clone();
        node.back = this.back && this.back.clone();
        node.polygons = this.polygons.map(p => p.clone());
        return node;
    }
    invert() {
        for (let i = 0; i < this.polygons.length; i++) this.polygons[i].flip();
        this.plane.flip();
        if (this.front) this.front.invert();
        if (this.back) this.back.invert();
        const temp = this.front;
        this.front = this.back;
        this.back = temp;
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
    allPolygons() {
        let polygons = this.polygons.slice();
        if (this.front) polygons = polygons.concat(this.front.allPolygons());
        if (this.back) polygons = polygons.concat(this.back.allPolygons());
        return polygons;
    }
    build(polygons) {
        if (!polygons.length) return;
        if (!this.plane) this.plane = polygons[0].plane.clone();
        const front = [], back = [];
        for (let i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
        }
        if (front.length) {
            if (!this.front) this.front = new CSGNode();
            this.front.build(front);
        }
        if (back.length) {
            if (!this.back) this.back = new CSGNode();
            this.back.build(back);
        }
    }
}

class CSG {
    constructor() {
        this.polygons = [];
    }
    clone() {
        const csg = new CSG();
        csg.polygons = this.polygons.map(p => p.clone());
        return csg;
    }
    toPolygons() {
        return this.polygons;
    }
    union(csg) {
        const a = new CSGNode(this.clone().polygons);
        const b = new CSGNode(csg.clone().polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        const res = new CSG();
        res.polygons = a.allPolygons();
        return res;
    }
    subtract(csg) {
        const a = new CSGNode(this.clone().polygons);
        const b = new CSGNode(csg.clone().polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();
        const res = new CSG();
        res.polygons = a.allPolygons();
        return res;
    }
    intersect(csg) {
        const a = new CSGNode(this.clone().polygons);
        const b = new CSGNode(csg.clone().polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();
        const res = new CSG();
        res.polygons = a.allPolygons();
        return res;
    }
}

CSG.fromGeometry = function(geom, transform) {
    const polygons = [];
    let posAttribute = geom.attributes.position;
    let normalAttribute = geom.attributes.normal;
    let uvAttribute = geom.attributes.uv;
    let index = geom.index;

    // Convert non-indexed geometry to indexed format effectively
    const getVertex = (i) => {
        const vA = new THREE.Vector3().fromBufferAttribute(posAttribute, i).applyMatrix4(transform);
        let nA = new THREE.Vector3();
        if (normalAttribute) {
             nA.fromBufferAttribute(normalAttribute, i);
             const normalMatrix = new THREE.Matrix3().getNormalMatrix(transform);
             nA.applyMatrix3(normalMatrix).normalize();
        }
        let uA = null;
        if (uvAttribute) {
            uA = new THREE.Vector2().fromBufferAttribute(uvAttribute, i);
        }
        return new CSGVertex(vA, nA, uA);
    };

    if (index !== null) {
        for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i);
            const b = index.getX(i + 1);
            const c = index.getX(i + 2);

            const v0 = getVertex(a);
            const v1 = getVertex(b);
            const v2 = getVertex(c);

            if (!normalAttribute) {
                const normal = new THREE.Vector3().subVectors(v1.pos, v0.pos).cross(new THREE.Vector3().subVectors(v2.pos, v0.pos)).normalize();
                v0.normal = normal; v1.normal = normal; v2.normal = normal;
            }

            polygons.push(new CSGPolygon([v0, v1, v2]));
        }
    } else {
        for (let i = 0; i < posAttribute.count; i += 3) {
            const v0 = getVertex(i);
            const v1 = getVertex(i + 1);
            const v2 = getVertex(i + 2);

            if (!normalAttribute) {
                const normal = new THREE.Vector3().subVectors(v1.pos, v0.pos).cross(new THREE.Vector3().subVectors(v2.pos, v0.pos)).normalize();
                v0.normal = normal; v1.normal = normal; v2.normal = normal;
            }

            polygons.push(new CSGPolygon([v0, v1, v2]));
        }
    }

    const csg = new CSG();
    csg.polygons = polygons;
    return csg;
};

CSG.toGeometry = function(csg, inverseTransform) {
    const geom = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i < csg.polygons.length; i++) {
        const poly = csg.polygons[i];

        // Polygons can have > 3 vertices; triangulate them.
        for (let j = 2; j < poly.vertices.length; j++) {
            const v0 = poly.vertices[0];
            const v1 = poly.vertices[j - 1];
            const v2 = poly.vertices[j];

            const p0 = v0.pos.clone().applyMatrix4(inverseTransform);
            const p1 = v1.pos.clone().applyMatrix4(inverseTransform);
            const p2 = v2.pos.clone().applyMatrix4(inverseTransform);

            vertices.push(p0.x, p0.y, p0.z);
            vertices.push(p1.x, p1.y, p1.z);
            vertices.push(p2.x, p2.y, p2.z);

            const n0 = v0.normal.clone();
            const n1 = v1.normal.clone();
            const n2 = v2.normal.clone();

            normals.push(n0.x, n0.y, n0.z);
            normals.push(n1.x, n1.y, n1.z);
            normals.push(n2.x, n2.y, n2.z);

            if (v0.uv && v1.uv && v2.uv) {
                uvs.push(v0.uv.x, v0.uv.y);
                uvs.push(v1.uv.x, v1.uv.y);
                uvs.push(v2.uv.x, v2.uv.y);
            }
        }
    }

    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    if (normals.length > 0) {
        geom.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    } else {
        geom.computeVertexNormals();
    }
    if (uvs.length > 0) {
        geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    }

    geom.computeBoundingSphere();
    geom.computeBoundingBox();

    return geom;
};

// --- Application Logic ---
const init = () => {
    const container = document.getElementById('canvas-container');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    // Materials - Using PhysicalMaterial to simulate a glass-like volume
    const materialA = new THREE.MeshPhysicalMaterial({
        color: 0xff3366,
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
        transmission: 0.5,
        side: THREE.DoubleSide
    });

    const materialB = new THREE.MeshPhysicalMaterial({
        color: 0x33ccff,
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
        transmission: 0.5,
        side: THREE.DoubleSide
    });

    const materialCSG = new THREE.MeshPhysicalMaterial({
        color: 0xa855f7, // Purple-ish mix
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
        transmission: 0.4,
        side: THREE.DoubleSide
    });

    // Primitives Group to hold base shapes
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    // Create primitives
    let meshA, meshB;
    let csgResultMesh = null;

    const setupPrimitives = () => {
        if (meshA) {
            shapesGroup.remove(meshA);
            meshA.geometry.dispose();
        }
        if (meshB) {
            shapesGroup.remove(meshB);
            meshB.geometry.dispose();
        }
        if (csgResultMesh) {
            scene.remove(csgResultMesh);
            csgResultMesh.geometry.dispose();
            csgResultMesh = null;
        }

        const geometryA = new THREE.BoxBufferGeometry(2, 2, 2);
        meshA = new THREE.Mesh(geometryA, materialA);
        meshA.position.set(-1, 0, 0);
        shapesGroup.add(meshA);

        const geometryB = new THREE.SphereBufferGeometry(1.3, 32, 32);
        meshB = new THREE.Mesh(geometryB, materialB);
        meshB.position.set(1, 0, 0);
        shapesGroup.add(meshB);

        shapesGroup.visible = true;
    };

    setupPrimitives();

    let activeMesh = null;
    let offset = new THREE.Vector3();
    let currentOperation = 'union'; // We'll keep it as default but apply it instantly when overlapping or on button click

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // Perform CSG operation and display result
    const performCSG = () => {
        meshA.updateMatrixWorld();
        meshB.updateMatrixWorld();

        const csgA = CSG.fromGeometry(meshA.geometry, meshA.matrixWorld);
        const csgB = CSG.fromGeometry(meshB.geometry, meshB.matrixWorld);

        let csgResult;

        // Catch errors if shapes don't overlap properly
        try {
            if (currentOperation === 'union') {
                csgResult = csgA.union(csgB);
            } else if (currentOperation === 'intersect') {
                csgResult = csgA.intersect(csgB);
            } else if (currentOperation === 'subtract') {
                csgResult = csgA.subtract(csgB);
            }

            // Generate result mesh
            const inverseMatrix = new THREE.Matrix4();
            // Create the new geometry at origin (world space)
            const resultGeometry = CSG.toGeometry(csgResult, inverseMatrix);

            if (csgResultMesh) {
                scene.remove(csgResultMesh);
                csgResultMesh.geometry.dispose();
            }

            csgResultMesh = new THREE.Mesh(resultGeometry, materialCSG);
            scene.add(csgResultMesh);

            // Hide originals
            shapesGroup.visible = false;
        } catch (e) {
            console.error("CSG Operation failed: ", e);
            shapesGroup.visible = true;
            if (csgResultMesh) {
                scene.remove(csgResultMesh);
                csgResultMesh = null;
            }
        }
    };

    // Interaction
    const onPointerDown = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // We only allow dragging when originals are visible
        if (shapesGroup.visible) {
            const intersects = raycaster.intersectObjects([meshA, meshB]);

            if (intersects.length > 0) {
                activeMesh = intersects[0].object;
                const intersectPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, intersectPoint);
                offset.copy(intersectPoint).sub(activeMesh.position);
                container.style.cursor = 'grabbing';
            }
        } else {
            // Revert back to interactable primitives
            shapesGroup.visible = true;
            if (csgResultMesh) {
                scene.remove(csgResultMesh);
                csgResultMesh.geometry.dispose();
                csgResultMesh = null;
            }
        }
    };

    const onPointerMove = (e) => {
        if (!activeMesh) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);
        activeMesh.position.copy(intersectPoint.sub(offset));
    };

    const onPointerUp = () => {
        if (activeMesh) {
            activeMesh = null;
            container.style.cursor = 'default';
            // Perform CSG operation automatically on drop
            performCSG();
        }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // UI Controls
    const setOperation = (op) => {
        currentOperation = op;
        document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-${op}`).classList.add('active');

        // If shapes are currently in their CSG state, recalculate with the new operation immediately
        if (!shapesGroup.visible) {
            performCSG();
        }
    };

    document.getElementById('btn-union').addEventListener('click', () => setOperation('union'));
    document.getElementById('btn-subtract').addEventListener('click', () => setOperation('subtract'));
    document.getElementById('btn-intersect').addEventListener('click', () => setOperation('intersect'));
    document.getElementById('btn-reset').addEventListener('click', () => {
        setupPrimitives();
        setOperation('union');
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const animate = () => {
        requestAnimationFrame(animate);

        // Slowly rotate shapes when not actively interacting
        if (!activeMesh) {
            if (shapesGroup.visible) {
                meshA.rotation.x += 0.005;
                meshA.rotation.y += 0.005;
                meshB.rotation.x -= 0.005;
                meshB.rotation.y += 0.005;
            } else if (csgResultMesh) {
                csgResultMesh.rotation.x += 0.005;
                csgResultMesh.rotation.y += 0.005;
            }
        }

        renderer.render(scene, camera);
    };

    // performCSG(); // Optional: Start with CSG applied
    animate();
};

window.addEventListener('DOMContentLoaded', init);
