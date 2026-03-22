/**
 * Procedural Biome Map Generator
 * Uses Simplex Noise for elevation and moisture to dynamically map biomes.
 */

// Simple pseudo-random number generator for seeded noise
class PRNG {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next() {
    return (this.seed = (this.seed * 16807) % 2147483647);
  }
  nextFloat() {
    return (this.next() - 1) / 2147483646;
  }
}

// Map Configuration
const MAP_CONFIG = {
  elevationOctaves: 6,
  elevationPersistence: 0.5,
  elevationLacunarity: 2.0,
  elevationScale: 0.005,

  moistureOctaves: 4,
  moisturePersistence: 0.5,
  moistureLacunarity: 2.0,
  moistureScale: 0.004,

  numRivers: 40
};

// Canvas Setup
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generate-btn');

let isGenerating = false;

function resizeCanvas() {
  const parent = canvas.parentElement;
  // Determine pixel size
  let width = parent.clientWidth;
  let height = parent.clientHeight;

  // Use a sensible internal resolution multiplier to make the pixels slightly "chunky"
  const scaleDownFactor = 0.5; // E.g. 50% resolution to look like a pixel art map and render faster

  width = Math.floor(width * scaleDownFactor);
  height = Math.floor(height * scaleDownFactor);

  // Cap at max size to prevent lag on huge displays
  const maxSize = 800;
  if (width > maxSize || height > maxSize) {
    const aspect = width / height;
    if (width > height) {
      width = maxSize;
      height = Math.floor(maxSize / aspect);
    } else {
      height = maxSize;
      width = Math.floor(maxSize * aspect);
    }
  }

  canvas.width = width;
  canvas.height = height;
}

function generateMap() {
  if (isGenerating) return;
  isGenerating = true;
  generateBtn.disabled = true;
  generateBtn.innerText = 'Generating...';

  // Allow UI to update before heavy computation
  requestAnimationFrame(() => {
    // Re-evaluate width and height to ensure it fits the window without stretching
    resizeCanvas();
    const width = canvas.width;
    const height = canvas.height;

    // Seed randomizer
    const seed = Math.floor(Math.random() * 65536);
    const elevationNoise = new SimplexNoise(seed);
    const moistureNoise = new SimplexNoise(seed + 1234); // Offset seed for moisture

    // Zoom/pan offsets so we aren't always looking at 0,0
    const offsetX = Math.random() * 1000;
    const offsetY = Math.random() * 1000;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const elevationMap = new Float32Array(width * height);
    const moistureMap = new Float32Array(width * height);

    // 1. Generate Noise Maps
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Compute Elevation
        const elev = elevationNoise.fBm2D(
          x + offsetX, y + offsetY,
          MAP_CONFIG.elevationOctaves,
          MAP_CONFIG.elevationPersistence,
          MAP_CONFIG.elevationLacunarity,
          MAP_CONFIG.elevationScale
        );

        // Compute Moisture
        const moist = moistureNoise.fBm2D(
          x + offsetX, y + offsetY,
          MAP_CONFIG.moistureOctaves,
          MAP_CONFIG.moisturePersistence,
          MAP_CONFIG.moistureLacunarity,
          MAP_CONFIG.moistureScale
        );

        const idx = y * width + x;
        elevationMap[idx] = elev;
        moistureMap[idx] = moist;
      }
    }

    // 2. Generate Rivers
    const rivers = generateRivers(width, height, elevationMap, MAP_CONFIG.numRivers);

    // 3. Map Biomes and Draw to ImageData
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const e = elevationMap[idx];
        const m = moistureMap[idx];

        const biome = getBiome(e, m);

        const pxIdx = idx * 4;
        data[pxIdx] = biome.color[0];     // R
        data[pxIdx + 1] = biome.color[1]; // G
        data[pxIdx + 2] = biome.color[2]; // B
        data[pxIdx + 3] = 255;            // A
      }
    }

    // 4. Draw Rivers (override pixel data)
    // River color (Light Blue)
    const riverColor = [80, 150, 220];

    rivers.forEach(riverPath => {
      riverPath.forEach(point => {
        // Make river slightly thicker by coloring adjacent pixels
        const dirs = [
          {dx: 0, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}
        ];

        for (const d of dirs) {
          const rx = point.x + d.dx;
          const ry = point.y + d.dy;

          if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
            // Check if it's already ocean to not overwrite deep ocean or ocean
            const e = (elevationMap[ry * width + rx] + 1) / 2;
            if (e > 0.4) { // Only draw river on land
              const idx = (ry * width + rx) * 4;
              data[idx] = riverColor[0];
              data[idx + 1] = riverColor[1];
              data[idx + 2] = riverColor[2];
            }
          }
        }
      });
    });

    // 5. Render
    ctx.putImageData(imgData, 0, 0);

    isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.innerText = 'Regenerate World';
  });
}

// Generate simple rivers
function generateRivers(width, height, elevationMap, numRivers = 20) {
  const rivers = [];
  const oceanLevel = 0.4;

  for (let i = 0; i < numRivers; i++) {
    // Start river from a random high point
    let startX = Math.floor(Math.random() * width);
    let startY = Math.floor(Math.random() * height);

    // Make sure we start above sea level and not too high
    let e = (elevationMap[startY * width + startX] + 1) / 2;
    let attempts = 0;
    while ((e <= oceanLevel || e > 0.8) && attempts < 100) {
      startX = Math.floor(Math.random() * width);
      startY = Math.floor(Math.random() * height);
      e = (elevationMap[startY * width + startX] + 1) / 2;
      attempts++;
    }

    if (attempts >= 100) continue;

    let path = [{x: startX, y: startY}];
    let currentX = startX;
    let currentY = startY;
    let currentElev = elevationMap[currentY * width + currentX];

    // Follow steepest descent until ocean or stuck
    let stuck = false;
    let steps = 0;
    const maxSteps = 1000;

    while (!stuck && steps < maxSteps) {
      // Check neighbors
      let lowestElev = currentElev;
      let nextX = currentX;
      let nextY = currentY;

      const dirs = [
        {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1},
        {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}
      ];

      for (const dir of dirs) {
        let nx = currentX + dir.dx;
        let ny = currentY + dir.dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          let nElev = elevationMap[ny * width + nx];
          if (nElev < lowestElev) {
            lowestElev = nElev;
            nextX = nx;
            nextY = ny;
          }
        }
      }

      // If we found a lower neighbor, move there
      if (nextX !== currentX || nextY !== currentY) {
        currentX = nextX;
        currentY = nextY;
        currentElev = lowestElev;
        path.push({x: currentX, y: currentY});

        let normE = (currentElev + 1) / 2;
        if (normE <= oceanLevel) {
          // Reached ocean
          break;
        }
      } else {
        // Stuck in a local minimum
        stuck = true;
      }
      steps++;
    }

    // Only keep rivers that actually flow for a bit
    if (path.length > 5) {
      rivers.push(path);
    }
  }

  return rivers;
}

// Biome mappings based on Whittaker diagram (Elevation / Moisture)
const BIOME_COLORS = {
  DEEP_OCEAN: { name: 'Deep Ocean', color: [19, 74, 137] }, // #134a89
  OCEAN: { name: 'Ocean', color: [30, 115, 184] }, // #1e73b8
  BEACH: { name: 'Beach', color: [244, 232, 169] }, // #f4e8a9
  SCORCHED: { name: 'Scorched', color: [143, 85, 83] }, // #8f5553
  BARE: { name: 'Bare', color: [187, 187, 187] }, // #bbbbbb
  TUNDRA: { name: 'Tundra', color: [221, 221, 187] }, // #ddddbb
  SNOW: { name: 'Snow', color: [255, 255, 255] }, // #ffffff
  TEMPERATE_DESERT: { name: 'Temperate Desert', color: [201, 210, 155] }, // #c9d29b
  SHRUBLAND: { name: 'Shrubland', color: [136, 153, 119] }, // #889977
  GRASSLAND: { name: 'Grassland', color: [136, 170, 85] }, // #88aa55
  TEMPERATE_DECIDUOUS_FOREST: { name: 'Temperate Deciduous Forest', color: [103, 148, 89] }, // #679459
  TEMPERATE_RAIN_FOREST: { name: 'Temperate Rain Forest', color: [68, 136, 85] }, // #448855
  SUBTROPICAL_DESERT: { name: 'Subtropical Desert', color: [210, 185, 139] }, // #d2b98b
  TROPICAL_SEASONAL_FOREST: { name: 'Tropical Seasonal Forest', color: [85, 153, 68] }, // #559944
  TROPICAL_RAIN_FOREST: { name: 'Tropical Rain Forest', color: [51, 119, 85] } // #337755
};

function getBiome(elevation, moisture) {
  // Normalize elevation from [-1, 1] to [0, 1] for easier logic
  let e = (elevation + 1) / 2;
  // Make ocean level 0.4
  if (e < 0.3) return BIOME_COLORS.DEEP_OCEAN;
  if (e < 0.4) return BIOME_COLORS.OCEAN;
  if (e < 0.43) return BIOME_COLORS.BEACH;

  // Normalize moisture from [-1, 1] to [0, 1]
  let m = (moisture + 1) / 2;

  // High elevation
  if (e > 0.85) {
    if (m < 0.1) return BIOME_COLORS.SCORCHED;
    if (m < 0.2) return BIOME_COLORS.BARE;
    if (m < 0.5) return BIOME_COLORS.TUNDRA;
    return BIOME_COLORS.SNOW;
  }

  // Mid-High elevation
  if (e > 0.65) {
    if (m < 0.33) return BIOME_COLORS.TEMPERATE_DESERT;
    if (m < 0.66) return BIOME_COLORS.SHRUBLAND;
    return BIOME_COLORS.TAIGA || BIOME_COLORS.SNOW; // Using snow as fallback for taiga in this palette
  }

  // Mid elevation
  if (e > 0.5) {
    if (m < 0.16) return BIOME_COLORS.TEMPERATE_DESERT;
    if (m < 0.50) return BIOME_COLORS.GRASSLAND;
    if (m < 0.83) return BIOME_COLORS.TEMPERATE_DECIDUOUS_FOREST;
    return BIOME_COLORS.TEMPERATE_RAIN_FOREST;
  }

  // Low elevation
  if (m < 0.16) return BIOME_COLORS.SUBTROPICAL_DESERT;
  if (m < 0.33) return BIOME_COLORS.GRASSLAND;
  if (m < 0.66) return BIOME_COLORS.TROPICAL_SEASONAL_FOREST;
  return BIOME_COLORS.TROPICAL_RAIN_FOREST;
}

// Fill legend
const legendContainer = document.getElementById('biome-legend');
Object.values(BIOME_COLORS).forEach(biome => {
  const item = document.createElement('div');
  item.className = 'legend-item';

  const box = document.createElement('div');
  box.className = 'color-box';
  box.style.backgroundColor = `rgb(${biome.color.join(',')})`;

  const text = document.createElement('span');
  text.innerText = biome.name;

  item.appendChild(box);
  item.appendChild(text);
  legendContainer.appendChild(item);
});

// Initialization
window.addEventListener('resize', () => {
  resizeCanvas();
  // Don't auto-regenerate on every resize tick to avoid lag, but wait a bit
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    generateMap();
  }, 200);
});

generateBtn.addEventListener('click', () => {
  // Add quick animation class
  canvas.style.opacity = '0.5';
  setTimeout(() => {
    canvas.style.opacity = '1';
    generateMap();
  }, 50);
});

// Initial Render
resizeCanvas();
generateMap();

// Lightweight 2D Simplex Noise implementation
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

class SimplexNoise {
  constructor(seed) {
    const prng = new PRNG(seed);
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(prng.nextFloat() * 256);
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
    const grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [1, 0], [-1, 0],
      [0, 1], [0, -1], [0, 1], [0, -1]
    ];

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

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      const gi0 = this.permMod12[ii + this.perm[jj]];
      n0 = t0 * t0 * this.dot(grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
      n1 = t1 * t1 * this.dot(grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
      n2 = t2 * t2 * this.dot(grad3[gi2], x2, y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }

  // Fractional Brownian Motion (fBm) for multiple octaves
  fBm2D(x, y, octaves, persistence, lacunarity, scale) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}
