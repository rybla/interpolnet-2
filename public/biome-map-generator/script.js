// Simplex Noise implementation (based on classical simplex noise)
// Because no external CDN is allowed, we define a lightweight simplex noise.
class SimplexNoise {
  constructor(seed = 1) {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    // seeded random
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(this.random(seed + i) * 256);
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  random(seed) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  dot(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    let s = (xin + yin) * F2; // Hairy factor for 2D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;
    let X0 = i - t; // Unskew the cell origin back to (x,y) space
    let Y0 = j - t;
    let x0 = xin - X0; // The x,y distances from the cell origin
    let y0 = yin - Y0;

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    let ii = i & 255;
    let jj = j & 255;
    let gi0 = this.permMod12[ii + this.perm[jj]];
    let gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    let gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
  }
}

class MapGenerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Fixed resolution for rendering the map
    this.width = 800;
    this.height = 450;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Map data
    this.elevationMap = new Float32Array(this.width * this.height);
    this.moistureMap = new Float32Array(this.width * this.height);
    this.riverMap = new Uint8Array(this.width * this.height);

    // Noise instances
    this.elevationNoise = new SimplexNoise(1337);
    this.moistureNoise = new SimplexNoise(7331);

    // Configuration
    this.scale = 0.005;
    this.octaves = 6;
    this.persistence = 0.5;
    this.lacunarity = 2.0;
    this.seaLevel = 0.4;

    this.colors = {
      DEEP_WATER: [18, 52, 86],
      WATER: [28, 107, 160],
      SAND: [210, 185, 139],
      GRASSLAND: [136, 170, 85],
      FOREST: [51, 119, 85],
      DARK_FOREST: [40, 90, 60],
      SAVANNA: [170, 180, 80],
      DESERT: [230, 210, 150],
      DIRT: [140, 110, 80],
      ROCK: [120, 120, 120],
      SNOW: [240, 240, 240],
      TUNDRA: [170, 180, 180],
      RIVER: [60, 150, 200]
    };

    this.generate();
  }

  generate() {
    this.generateNoiseMaps();
    this.generateRivers(100);
    this.render();
  }

  // Calculate octaves of noise
  fbm(noiseFunction, x, y, scale, octaves, persistence, lacunarity) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += noiseFunction.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize to [0, 1]
    return (total / maxValue + 1) / 2;
  }

  generateNoiseMaps() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let i = y * this.width + x;

        // Add a distance-to-center falloff to make an island
        let nx = 2 * x / this.width - 1;
        let ny = 2 * y / this.height - 1;
        let d = 1 - (1 - nx * nx) * (1 - ny * ny); // Drop-off distance

        let e = this.fbm(this.elevationNoise, x, y, this.scale, this.octaves, this.persistence, this.lacunarity);
        // Apply island mask
        this.elevationMap[i] = Math.max(0, e - d * 0.8);

        let m = this.fbm(this.moistureNoise, x, y, this.scale * 0.8, this.octaves, this.persistence, this.lacunarity);
        // High elevation is dryer, rivers add moisture later
        this.moistureMap[i] = m * (1 - this.elevationMap[i] * 0.5);
        this.riverMap[i] = 0; // reset
      }
    }
  }

  getBiome(e, m) {
    if (e < this.seaLevel) {
      return e < this.seaLevel - 0.15 ? this.colors.DEEP_WATER : this.colors.WATER;
    }

    // Coastline
    if (e < this.seaLevel + 0.05) {
      return this.colors.SAND;
    }

    // Mountains
    if (e > 0.8) {
      if (m > 0.5) return this.colors.SNOW;
      if (m > 0.3) return this.colors.TUNDRA;
      return this.colors.ROCK;
    }
    if (e > 0.65) {
      if (m > 0.6) return this.colors.DARK_FOREST;
      if (m > 0.3) return this.colors.ROCK;
      return this.colors.DIRT;
    }

    // Plains/Forests/Deserts
    if (m > 0.6) return this.colors.DARK_FOREST;
    if (m > 0.4) return this.colors.FOREST;
    if (m > 0.25) return this.colors.GRASSLAND;
    if (m > 0.15) return this.colors.SAVANNA;
    return this.colors.DESERT;
  }

  // Traces path of steepest descent from starting point
  generateRivers(numRivers) {
    // Collect potential springs (high elevation, non-water)
    let potentialSprings = [];
    for (let y = 10; y < this.height - 10; y++) {
      for (let x = 10; x < this.width - 10; x++) {
        let e = this.elevationMap[y * this.width + x];
        if (e > 0.7 && e < 0.9) { // High but not highest peaks
          potentialSprings.push({x, y});
        }
      }
    }

    // Shuffle springs
    for (let i = potentialSprings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [potentialSprings[i], potentialSprings[j]] = [potentialSprings[j], potentialSprings[i]];
    }

    let riversFormed = 0;
    const neighbors = [
      {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
      {dx: -1, dy: 0},                   {dx: 1, dy: 0},
      {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
    ];

    for (let s of potentialSprings) {
      if (riversFormed >= numRivers) break;

      let cx = s.x;
      let cy = s.y;
      let riverPath = [];
      let stuck = false;
      let reachedSea = false;

      while (!stuck && !reachedSea && riverPath.length < 500) {
        riverPath.push({x: cx, y: cy});

        let currentE = this.elevationMap[cy * this.width + cx];

        if (currentE < this.seaLevel) {
          reachedSea = true;
          break;
        }

        let minE = currentE;
        let nextX = cx;
        let nextY = cy;

        // Find steepest neighbor
        for (let n of neighbors) {
          let nx = cx + n.dx;
          let ny = cy + n.dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            let ne = this.elevationMap[ny * this.width + nx];
            if (ne < minE) {
              minE = ne;
              nextX = nx;
              nextY = ny;
            }
          }
        }

        if (nextX === cx && nextY === cy) {
          // stuck in local minimum
          stuck = true;
        } else {
          // Check if we hit another river
          if (this.riverMap[nextY * this.width + nextX] > 0) {
            reachedSea = true; // Merged into another river
          }
          cx = nextX;
          cy = nextY;
        }
      }

      // Only keep rivers that flow enough or reach sea
      if (riverPath.length > 20 || reachedSea) {
        riversFormed++;
        for (let pt of riverPath) {
          this.riverMap[pt.y * this.width + pt.x] = 1;

          // Thicken rivers slightly
          if (this.elevationMap[pt.y * this.width + pt.x] < 0.6) {
             for (let n of neighbors) {
               let nx = pt.x + n.dx;
               let ny = pt.y + n.dy;
               if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && Math.random() > 0.5) {
                  this.riverMap[ny * this.width + nx] = 1;
               }
             }
          }

          // Add moisture around river
          for (let r = -3; r <= 3; r++) {
            for (let c = -3; c <= 3; c++) {
              let nx = pt.x + c;
              let ny = pt.y + r;
              if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                let dist = Math.sqrt(r*r + c*c);
                if (dist < 3) {
                  this.moistureMap[ny * this.width + nx] += 0.2 * (1 - dist/3);
                }
              }
            }
          }
        }
      }
    }
  }

  render() {
    let imgData = this.ctx.createImageData(this.width, this.height);
    let data = imgData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let i = y * this.width + x;
        let px = i * 4;

        let e = this.elevationMap[i];
        let m = this.moistureMap[i];

        let color = this.getBiome(e, m);

        // Overlay river
        if (this.riverMap[i] > 0 && e >= this.seaLevel) {
          color = this.colors.RIVER;
        }

        // Draw coastlines clearly
        if (e >= this.seaLevel && e < this.seaLevel + 0.01 && this.riverMap[i] === 0) {
           color = [200, 175, 129]; // Darker sand edge
        }

        data[px] = color[0];
        data[px + 1] = color[1];
        data[px + 2] = color[2];
        data[px + 3] = 255;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mapCanvas');
  new MapGenerator(canvas);
});
