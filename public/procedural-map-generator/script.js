/**
 * A fast, compact 2D Simplex Noise implementation.
 */
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

    // Simple seeded LCG
    let currentSeed = seed;
    const lcg = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(lcg() * 256);
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  dot(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let n0, n1, n2;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1, j1;
    if (x0 > y0) {
      i1 = 1; j1 = 0;
    } else {
      i1 = 0; j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

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

    // Scale to range roughly [-1, 1]
    return 70.0 * (n0 + n1 + n2);
  }
}

/**
 * Procedural Map Generator logic
 */
const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let simplexElevation;
let simplexMoisture;
let simplexRivers;

const config = {
  scale: 0.003,
  octaves: 6,
  persistence: 0.5,
  lacunarity: 2.0,
  waterLevel: 0.4,
  riverThreshold: 0.015
};

// Colors (R, G, B, A)
const colors = {
  deepWater: [24, 61, 138, 255],
  shallowWater: [37, 99, 235, 255],
  sand: [243, 211, 136, 255],
  grassland: [74, 222, 128, 255],
  forest: [22, 163, 74, 255],
  jungle: [21, 128, 61, 255],
  savanna: [250, 204, 21, 255],
  desert: [251, 146, 60, 255],
  taiga: [14, 116, 144, 255],
  tundra: [165, 243, 252, 255],
  snow: [255, 255, 255, 255],
  rock: [100, 116, 139, 255],
  river: [59, 130, 246, 255]
};

let currentSeed = 0;

function init() {
  window.addEventListener("resize", handleResize);
  canvas.parentElement.addEventListener("click", generateMap);
  generateMap();
}

function handleResize() {
  if (generateMapTimeout) clearTimeout(generateMapTimeout);
  generateMapTimeout = setTimeout(generateMap, 200);
}

let generateMapTimeout = null;

function fBm(x, y, simplexInstance) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < config.octaves; i++) {
    total += simplexInstance.noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= config.persistence;
    frequency *= config.lacunarity;
  }
  // Normalize to [0, 1] roughly
  return (total / maxValue) * 0.5 + 0.5;
}

function ridgedMF(x, y, simplexInstance) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let weight = 1.0;
  for (let i = 0; i < config.octaves; i++) {
    let n = simplexInstance.noise2D(x * frequency, y * frequency);
    n = 1.0 - Math.abs(n);
    n *= n;
    n *= weight;
    weight = Math.max(0, Math.min(1, n * 2.0));
    total += n * amplitude;
    amplitude *= config.persistence;
    frequency *= config.lacunarity;
  }
  return total;
}

function getBiomeColor(elevation, moisture, riverVal) {
  if (elevation < config.waterLevel - 0.1) return colors.deepWater;
  if (elevation < config.waterLevel) return colors.shallowWater;

  // Rivers only flow on land
  if (elevation >= config.waterLevel && riverVal > 1.0 - config.riverThreshold) {
      return colors.river;
  }

  if (elevation < config.waterLevel + 0.05) return colors.sand;

  if (elevation < config.waterLevel - 0.1) return colors.deepWater;
  if (elevation < config.waterLevel) return colors.shallowWater;
  if (elevation < config.waterLevel + 0.05) return colors.sand;

  if (elevation > 0.8) {
    if (moisture > 0.5) return colors.snow;
    return colors.rock;
  }
  if (elevation > 0.6) {
    if (moisture > 0.66) return colors.taiga;
    if (moisture > 0.33) return colors.forest;
    return colors.rock;
  }

  // Lowlands
  if (moisture > 0.66) return colors.jungle;
  if (moisture > 0.33) return colors.grassland;
  if (moisture > 0.15) return colors.savanna;
  return colors.desert;
}

function generateMap(e) {
  // If it's a click, change seed. Otherwise (resize), keep seed.
  if (e && e.type === "click") {
      currentSeed = Math.random() * 10000;
  } else if (currentSeed === 0) {
      currentSeed = Math.random() * 10000;
  }

  simplexElevation = new SimplexNoise(currentSeed);
  simplexMoisture = new SimplexNoise(currentSeed + 1000);
  simplexRivers = new SimplexNoise(currentSeed + 2000);

  canvas.width = window.innerWidth / 2;
  canvas.height = window.innerHeight / 2;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Offset so we aren't always looking at 0,0 (seeded pseudo-randomly for stability)
  const lcg = (s) => (s * 1664525 + 1013904223) % 4294967296;
  const offsetX = (lcg(currentSeed) / 4294967296) * 100000;
  const offsetY = (lcg(currentSeed + 1) / 4294967296) * 100000;

  let dataIndex = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x + offsetX) * config.scale;
      const ny = (y + offsetY) * config.scale;

      const elevation = fBm(nx, ny, simplexElevation);
      const moisture = fBm(nx, ny, simplexMoisture);

      // Use lower frequency for wider, more spaced out rivers
      const riverVal = ridgedMF(nx * 0.5, ny * 0.5, simplexRivers);

      const color = getBiomeColor(elevation, moisture, riverVal);

      data[dataIndex++] = color[0]; // R
      data[dataIndex++] = color[1]; // G
      data[dataIndex++] = color[2]; // B
      data[dataIndex++] = color[3]; // A
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Start
init();
