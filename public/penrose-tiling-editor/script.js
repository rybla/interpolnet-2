// Penrose Tiling Editor

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;

// Mathematical constants
const PHI = (1 + Math.sqrt(5)) / 2;
const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const PI_OVER_5 = Math.PI / 5;

// Thematic Colors (fetch from CSS if available or hardcode for safety)
const colors = {
    kite: '#ff7e67',
    dart: '#00d2d3',
    bg: '#1e272e',
    line: 'rgba(255, 255, 255, 0.5)',
    vertex: '#feca57',
    vertexHover: '#ffffff'
};

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    add(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }

    sub(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    mult(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }

    distSq(p) {
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        return dx * dx + dy * dy;
    }

    dist(p) {
        return Math.sqrt(this.distSq(p));
    }

    rotate(angle, center = new Point(0, 0)) {
        const x = this.x - center.x;
        const y = this.y - center.y;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        return new Point(
            center.x + x * cosA - y * sinA,
            center.y + x * sinA + y * cosA
        );
    }
}

// Subdividing functions

// A Kite is defined by 3 points A, B, C (symmetric around AC)
// A is the acute tip (angle 72)
// B and D are the obtuse tips (angle 108) -> represented by B here for subdivision purposes
// C is the other tip (angle 72)
// Since a Kite is symmetric, we can define it with 3 points, representing half of it, or all 4.
// For deflation, it's easier to represent half-tiles (triangles) to preserve matching rules.
// Let's use Robinson Triangles.

class HalfKite {
    constructor(A, B, C) {
        // A, B, C are points. Angle at A is 36, at B is 72, at C is 72
        // Length ratios: AB/AC = phi, BC/AC = 1
        this.A = A;
        this.B = B;
        this.C = C;
    }

    deflate() {
        // Deflates a HalfKite into 2 smaller HalfKites and 1 HalfDart
        // Point P is on AB such that A-P-B and AP/AB = 1/phi
        // Point Q is on BC such that B-Q-C and BQ/BC = 1/phi

        // Let's use standard Penrose deflation
        // A HalfKite (A,B,C) ->
        // P on AB where AP/AB = 1/phi -> AP = AB/phi. Since AB = phi*AC, AP = AC.
        // wait, let's use a simpler standard representation.

        // Triangle A, B, C. A is apex (36 deg), B and C are base (72 deg).
        // P is on AB such that AP = AC.
        // Q is on BC such that BQ = BP.

        const P = this.A.add(this.B.sub(this.A).mult(1 / PHI));

        return [
            new HalfKite(this.C, P, this.B),
            new HalfKite(this.C, P, this.A) // Wait, actually standard deflation creates a dart and kite
        ];
    }
}

// Actually, an easier approach for dragging vertices with 10-fold symmetry is to maintain
// a central pool of vertices and refer to them by index in the tiles, but for Penrose tiling,
// we want to subdivide the tiles.

// Let's use the standard "Robinson triangles" deflation:
// There are two types of Robinson triangles: Acute (half-kite) and Obtuse (half-dart).
// Acute triangle A,B,C: angle A=36, B=72, C=72. AB = AC = phi * BC
// Obtuse triangle A,B,C: angle A=108, B=36, C=36. BC = phi * AB = phi * AC

const TYPE_KITE = 0;
const TYPE_DART = 1;

class Triangle {
    constructor(type, A, B, C) {
        this.type = type;
        this.A = A;
        this.B = B;
        this.C = C;
    }

    deflate() {
        if (this.type === TYPE_KITE) {
            // Acute triangle A,B,C
            // A is 36 deg, B and C are 72 deg
            // Split into two smaller triangles: an acute and an obtuse
            // P is on AB such that AP = BC
            const P = this.A.add(this.B.sub(this.A).mult(1 / PHI));

            return [
                new Triangle(TYPE_KITE, this.C, P, this.B),
                new Triangle(TYPE_DART, P, this.C, this.A)
            ];
        } else {
            // Obtuse triangle A,B,C
            // A is 108 deg, B and C are 36 deg
            // Split into two acute and one obtuse? No, obtuse splits into one acute and one obtuse
            // P is on BC such that BP = AB
            const P = this.B.add(this.C.sub(this.B).mult(1 / PHI));

            return [
                new Triangle(TYPE_DART, P, this.C, this.A),
                new Triangle(TYPE_KITE, this.B, this.A, P)
            ];
        }
    }
}

let triangles = [];

function initTiling() {
    triangles = [];
    // Create a "sun" starting pattern (5 kites around origin)
    // Actually, 10 acute triangles around the origin
    const origin = new Point(0, 0);
    const radius = Math.min(width, height) * 0.45;

    for (let i = 0; i < 10; i++) {
        const angle1 = i * TWO_PI / 10;
        const angle2 = ((i + 1) % 10) * TWO_PI / 10;

        const p1 = new Point(Math.cos(angle1) * radius, Math.sin(angle1) * radius);
        const p2 = new Point(Math.cos(angle2) * radius, Math.sin(angle2) * radius);

        // Alternate orientation to make kites
        if (i % 2 === 0) {
            triangles.push(new Triangle(TYPE_KITE, origin, p2, p1));
        } else {
            triangles.push(new Triangle(TYPE_KITE, origin, p1, p2));
        }
    }

    // Deflate a few times
    for (let i = 0; i < 5; i++) {
        const nextTriangles = [];
        for (const t of triangles) {
            nextTriangles.push(...t.deflate());
        }
        triangles = nextTriangles;
    }

    extractVertices();
}

let vertices = [];

// To allow symmetric deformation, we extract all unique vertices
// and group them into their 10-fold symmetry orbits.
function extractVertices() {
    vertices = [];
    const threshold = 1.0; // Dist threshold to merge vertices

    const addVertex = (p) => {
        for (let v of vertices) {
            if (v.base.distSq(p) < threshold) return v;
        }
        const newV = { base: p.clone(), current: p.clone() };
        vertices.push(newV);
        return newV;
    };

    for (let t of triangles) {
        t.vA = addVertex(t.A);
        t.vB = addVertex(t.B);
        t.vC = addVertex(t.C);
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initTiling();
}

window.addEventListener('resize', resize);
resize();

// Interaction state
let draggedVertex = null;
let hoverVertex = null;

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - width/2;
    const py = e.clientY - rect.top - height/2;
    const p = new Point(px, py);

    let closestDistSq = Infinity;
    let closestV = null;

    for (let v of vertices) {
        const d = v.current.distSq(p);
        if (d < 400 && d < closestDistSq) { // 20px radius
            closestDistSq = d;
            closestV = v;
        }
    }

    if (closestV) {
        draggedVertex = closestV;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - width/2;
    const py = e.clientY - rect.top - height/2;
    const p = new Point(px, py);

    if (draggedVertex) {
        // Calculate displacement from base
        // Wait, for continuous dragging, we update current, but we need to find its
        // base relation to correctly update symmetries.
        // Actually, we can calculate displacement from its CURRENT position and apply it
        // symmetrically to its orbit.

        const delta = p.sub(draggedVertex.current);

        // To find its symmetry orbit, we check all vertices to see if their BASE position
        // is a rotated version of the dragged vertex's BASE position.
        const draggedBase = draggedVertex.base;
        const distFromOriginSq = draggedBase.distSq(new Point(0,0));

        for (let v of vertices) {
            const vDistSq = v.base.distSq(new Point(0,0));
            // Check if it's in the same orbit (same distance from origin)
            if (Math.abs(vDistSq - distFromOriginSq) < 1.0) {
                // Determine the rotation angle between draggedBase and v.base
                let angleDrag = Math.atan2(draggedBase.y, draggedBase.x);
                let angleV = Math.atan2(v.base.y, v.base.x);
                let angleDiff = angleV - angleDrag;

                // Ensure it's roughly a multiple of 36 deg (PI/5)
                const steps = Math.round(angleDiff / PI_OVER_5);
                if (Math.abs(angleDiff - steps * PI_OVER_5) < 0.1) {
                    // It is part of the symmetry group!
                    // Apply rotated delta
                    const rotatedDelta = delta.rotate(steps * PI_OVER_5);
                    v.current = v.current.add(rotatedDelta);
                }
            }
        }

    } else {
        // Hover logic
        let closestDistSq = Infinity;
        let closestV = null;
        for (let v of vertices) {
            const d = v.current.distSq(p);
            if (d < 400 && d < closestDistSq) {
                closestDistSq = d;
                closestV = v;
            }
        }
        hoverVertex = closestV;
        if (hoverVertex) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    }
});

window.addEventListener('pointerup', () => {
    draggedVertex = null;
    if (hoverVertex) canvas.style.cursor = 'pointer';
    else canvas.style.cursor = 'default';
});

// Render Loop
function render() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width/2, height/2);

    // Draw tiles
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.line;

    for (let t of triangles) {
        ctx.beginPath();
        ctx.moveTo(t.vA.current.x, t.vA.current.y);
        ctx.lineTo(t.vB.current.x, t.vB.current.y);
        ctx.lineTo(t.vC.current.x, t.vC.current.y);
        ctx.closePath();

        if (t.type === TYPE_KITE) {
            ctx.fillStyle = colors.kite;
        } else {
            ctx.fillStyle = colors.dart;
        }

        ctx.fill();
        ctx.stroke();
    }

    // Draw vertices
    for (let v of vertices) {
        ctx.beginPath();
        ctx.arc(v.current.x, v.current.y, 4, 0, TWO_PI);
        if (v === hoverVertex || v === draggedVertex) {
            ctx.fillStyle = colors.vertexHover;
            ctx.fill();
        } else {
            ctx.fillStyle = colors.vertex;
            ctx.fill();
        }
    }

    ctx.restore();

    requestAnimationFrame(render);
}

render();
