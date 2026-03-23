const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let seed;

// Simplex Noise Implementation (from https://github.com/jwagner/simplex-noise.js)
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

class SimplexNoise {
  constructor(random = Math.random) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(random() * 256);
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = (this.perm[i] % 12);
    }
  }

  noise2D(xin, yin) {
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
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.gradP[this.permMod12[ii + this.perm[jj]]].dot2(x0, y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.gradP[this.permMod12[ii + i1 + this.perm[jj + j1]]].dot2(x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.gradP[this.permMod12[ii + 1 + this.perm[jj + 1]]].dot2(x2, y2);
    }
    return 70.0 * (n0 + n1 + n2);
  }

  gradP = [
    { dot2: (x, y) => x + y },
    { dot2: (x, y) => -x + y },
    { dot2: (x, y) => x - y },
    { dot2: (x, y) => -x - y },
    { dot2: (x, y) => x },
    { dot2: (x, y) => -x },
    { dot2: (x, y) => y },
    { dot2: (x, y) => -y },
    { dot2: (x, y) => x + y }, // repeated
    { dot2: (x, y) => -x + y }, // repeated
    { dot2: (x, y) => x - y }, // repeated
    { dot2: (x, y) => -x - y }  // repeated
  ];
}

let elevationNoise;
let moistureNoise;

// Biome Colors
const BIOMES = {
  DEEP_WATER: [10, 40, 100],
  SHALLOW_WATER: [30, 100, 180],
  BEACH: [230, 210, 140],
  SCORCHED: [80, 80, 80],
  BARE: [130, 130, 130],
  TUNDRA: [200, 200, 200],
  SNOW: [255, 255, 255],
  TEMPERATE_DESERT: [200, 210, 160],
  SHRUBLAND: [136, 153, 119],
  GRASSLAND: [136, 170, 85],
  TEMPERATE_DECIDUOUS_FOREST: [103, 148, 89],
  TEMPERATE_RAIN_FOREST: [68, 136, 85],
  SUBTROPICAL_DESERT: [210, 185, 139],
  TROPICAL_SEASONAL_FOREST: [85, 153, 68],
  TROPICAL_RAIN_FOREST: [51, 119, 85],
  RIVER: [40, 130, 200],
  TAIGA: [153, 170, 119]
};

function init() {
  const container = document.getElementById('container');
  // Adjust canvas resolution dynamically but keep it somewhat small for performance
  width = 600;
  height = 400;
  canvas.width = width;
  canvas.height = height;

  generateMap();

  // Re-generate on click
  canvas.addEventListener('click', () => {
    generateMap();
  });
}

function generateMap() {
  const randomFunc = mulberry32(Math.random() * 0xFFFFFFFF);
  elevationNoise = new SimplexNoise(randomFunc);

  const randomFunc2 = mulberry32(Math.random() * 0xFFFFFFFF);
  moistureNoise = new SimplexNoise(randomFunc2);

  const imgData = ctx.createImageData(width, height);
  const elevationMap = new Float32Array(width * height);
  const moistureMap = new Float32Array(width * height);

  const seaLevel = 0.35;

  // Generate Base Elevation & Moisture
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      // FBM for Elevation
      let e = 0;
      let amplitude = 1;
      let frequency = 0.005;
      let maxValue = 0;
      const octaves = 6;
      for (let o = 0; o < octaves; o++) {
        e += (elevationNoise.noise2D(x * frequency, y * frequency) * 0.5 + 0.5) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      e /= maxValue;
      // Exponential curving for flatter plains and sharper mountains
      e = Math.pow(e, 1.2);

      // FBM for Moisture
      let m = 0;
      amplitude = 1;
      frequency = 0.005;
      maxValue = 0;
      for (let o = 0; o < octaves; o++) {
        m += (moistureNoise.noise2D(x * frequency, y * frequency) * 0.5 + 0.5) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      m /= maxValue;

      elevationMap[i] = e;
      moistureMap[i] = m;
    }
  }

  // Generate Rivers
  const riverMap = new Uint8Array(width * height);
  const numRivers = 30;

  for (let i = 0; i < numRivers; i++) {
    let rx = Math.floor(Math.random() * width);
    let ry = Math.floor(Math.random() * height);

    // Only start rivers on land, high up
    if (elevationMap[ry * width + rx] > seaLevel + 0.2) {
      let currentX = rx;
      let currentY = ry;

      let iters = 0;
      while (iters < 500) {
        let minZ = elevationMap[currentY * width + currentX];
        let nextX = currentX;
        let nextY = currentY;

        // Check 8 neighbors for lowest point
        for(let dy=-1; dy<=1; dy++){
          for(let dx=-1; dx<=1; dx++){
            if(dx === 0 && dy === 0) continue;
            const nx = currentX + dx;
            const ny = currentY + dy;
            if(nx >= 0 && nx < width && ny >= 0 && ny < height){
              const nz = elevationMap[ny * width + nx];
              if(nz < minZ){
                minZ = nz;
                nextX = nx;
                nextY = ny;
              }
            }
          }
        }

        // Stuck in a pit or reached sea
        if(nextX === currentX && nextY === currentY) break;
        if(elevationMap[nextY * width + nextX] <= seaLevel) {
          riverMap[nextY * width + nextX] = 1; // Mark coast entry
          break;
        }

        riverMap[currentY * width + currentX] = 1;
        currentX = nextX;
        currentY = nextY;
        iters++;
      }
    }
  }

  // Map to Biomes and Color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const e = elevationMap[i];
      const m = moistureMap[i];
      const isRiver = riverMap[i] === 1;

      let color;

      if (e < seaLevel) {
        if (e < seaLevel - 0.15) {
          color = BIOMES.DEEP_WATER;
        } else {
          color = BIOMES.SHALLOW_WATER;
        }
      } else if (isRiver) {
        color = BIOMES.RIVER;
      } else if (e < seaLevel + 0.05) {
        color = BIOMES.BEACH;
      } else if (e > 0.8) {
        if (m < 0.1) color = BIOMES.SCORCHED;
        else if (m < 0.2) color = BIOMES.BARE;
        else if (m < 0.5) color = BIOMES.TUNDRA;
        else color = BIOMES.SNOW;
      } else if (e > 0.6) {
        if (m < 0.33) color = BIOMES.TEMPERATE_DESERT;
        else if (m < 0.66) color = BIOMES.SHRUBLAND;
        else color = BIOMES.TAIGA;
      } else if (e > 0.3) {
        if (m < 0.16) color = BIOMES.TEMPERATE_DESERT;
        else if (m < 0.5) color = BIOMES.GRASSLAND;
        else if (m < 0.83) color = BIOMES.TEMPERATE_DECIDUOUS_FOREST;
        else color = BIOMES.TEMPERATE_RAIN_FOREST;
      } else {
        if (m < 0.16) color = BIOMES.SUBTROPICAL_DESERT;
        else if (m < 0.33) color = BIOMES.GRASSLAND;
        else if (m < 0.66) color = BIOMES.TROPICAL_SEASONAL_FOREST;
        else color = BIOMES.TROPICAL_RAIN_FOREST;
      }

      const pixelIndex = i * 4;
      imgData.data[pixelIndex] = color[0];
      imgData.data[pixelIndex + 1] = color[1];
      imgData.data[pixelIndex + 2] = color[2];
      imgData.data[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// Simple seeded PRNG
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Ensure the image fits correctly with high DPI
function resize() {
  const container = document.getElementById('container');
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();

  // To keep it looking retro/pixelated and fast, we keep a fixed logical resolution
  // and let CSS handle scaling. No need to redraw on resize for this demo.
}

window.addEventListener('resize', resize);
window.onload = init;
