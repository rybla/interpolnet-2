const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const resetLineBtn = document.getElementById('resetLineBtn');

let width, height;
let points = [];
let sweepLineY = 0;
let speed = 2; // sweep line speed
let animationFrameId = null;

// Offscreen canvas for tracing voronoi edges
const edgeCanvas = document.createElement('canvas');
const edgeCtx = edgeCanvas.getContext('2d');

let prevBeachLine = []; // keep track of beach line to trace breakpoints

function init() {
  resize();
  window.addEventListener('resize', resize);

  canvas.addEventListener('click', addPoint);
  clearBtn.addEventListener('click', clearAll);
  resetLineBtn.addEventListener('click', restartSweep);

  // Start with some random points
  for(let i=0; i<5; i++) {
    points.push({
      x: Math.random() * width * 0.8 + width * 0.1,
      y: Math.random() * height * 0.8 + height * 0.1,
      id: i,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }

  restartSweep();
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Maintain edge canvas size across resize
  const tempEdge = document.createElement('canvas');
  tempEdge.width = edgeCanvas.width;
  tempEdge.height = edgeCanvas.height;
  tempEdge.getContext('2d').drawImage(edgeCanvas, 0, 0);

  edgeCanvas.width = width;
  edgeCanvas.height = height;
  edgeCtx.drawImage(tempEdge, 0, 0);
}

function addPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  points.push({
    x, y,
    id: points.length,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`
  });

  // Reset sweep to allow recalculating
  restartSweep();
}

function clearAll() {
  points = [];
  edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);
  restartSweep();
}

function restartSweep() {
  sweepLineY = 0;
  prevBeachLine = [];
  edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Start animation loop
  loop();
}

function getParabolaY(x, focusX, focusY, directrixY) {
  // y = ( (x - focusX)^2 + focusY^2 - directrixY^2 ) / (2 * (focusY - directrixY))
  if (Math.abs(focusY - directrixY) < 0.1) {
    // very close to sweep line, almost vertical line
    return focusY; // approximate
  }
  const numerator = Math.pow(x - focusX, 2) + Math.pow(focusY, 2) - Math.pow(directrixY, 2);
  const denominator = 2 * (focusY - directrixY);
  return numerator / denominator;
}

function loop() {
  if (points.length === 0) {
    ctx.clearRect(0, 0, width, height);
    animationFrameId = requestAnimationFrame(loop);
    return;
  }

  // Update sweep line
  sweepLineY += speed;

  ctx.clearRect(0, 0, width, height);

  // Draw the edge canvas containing traced voronoi edges
  ctx.drawImage(edgeCanvas, 0, 0);

  // Draw points
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  });

  // Draw sweep line
  ctx.beginPath();
  ctx.moveTo(0, sweepLineY);
  ctx.lineTo(width, sweepLineY);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (sweepLineY > 0) {
    // calculate beachline
    const activePoints = points.filter(p => p.y < sweepLineY);
    let beachLine = []; // array of { x, y, focusId }

    // Pixel-by-pixel approximation of the lower envelope of parabolas
    // We only need an approximation to trace the breakpoints
    // For efficiency, maybe step by 2 or 3 pixels
    const step = 2;
    for (let x = 0; x < width; x += step) {
      let maxY = -Infinity;
      let focusId = -1;

      for (const p of activePoints) {
        let y = getParabolaY(x, p.x, p.y, sweepLineY);
        // We want the HIGHEST parabola (closest to sweep line visually, since y grows downwards)
        if (y > maxY) {
          maxY = y;
          focusId = p.id;
        }
      }

      if (focusId !== -1) {
        beachLine.push({ x, y: maxY, focusId });
      }
    }

    // Draw beach line
    if (beachLine.length > 0) {
      ctx.beginPath();
      ctx.moveTo(beachLine[0].x, beachLine[0].y);
      for (let i = 1; i < beachLine.length; i++) {
        ctx.lineTo(beachLine[i].x, beachLine[i].y);
      }
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Trace breakpoints
      if (prevBeachLine.length > 0) {
        let currentSegments = [];
        let curFocus = beachLine[0].focusId;

        for (let i = 1; i < beachLine.length; i++) {
          if (beachLine[i].focusId !== curFocus) {
            // Breakpoint found at x = beachLine[i].x
            currentSegments.push({ x: beachLine[i].x, y: beachLine[i].y, left: curFocus, right: beachLine[i].focusId });
            curFocus = beachLine[i].focusId;
          }
        }

        // Match with previous breakpoints to draw lines
        // A simple approach: for each breakpoint in current segments, find the closest one in prevBeachLine with same left/right (or just closest x)
        edgeCtx.beginPath();
        edgeCtx.strokeStyle = '#ffff00';
        edgeCtx.lineWidth = 2;

        currentSegments.forEach(currBP => {
           let closestDist = Infinity;
           let bestPrevBP = null;

           prevBeachLine.forEach(prevBP => {
              if ((prevBP.left === currBP.left && prevBP.right === currBP.right) ||
                  (prevBP.left === currBP.right && prevBP.right === currBP.left)) {
                  let d = Math.abs(prevBP.x - currBP.x);
                  if (d < closestDist && d < 20) { // prevent jumping
                     closestDist = d;
                     bestPrevBP = prevBP;
                  }
              }
           });

           if (bestPrevBP) {
              edgeCtx.moveTo(bestPrevBP.x, bestPrevBP.y);
              edgeCtx.lineTo(currBP.x, currBP.y);
           }
        });
        edgeCtx.stroke();

        prevBeachLine = currentSegments;
      } else {
        // First frame with beach line, just collect breakpoints
        let currentSegments = [];
        let curFocus = beachLine[0].focusId;
        for (let i = 1; i < beachLine.length; i++) {
          if (beachLine[i].focusId !== curFocus) {
            currentSegments.push({ x: beachLine[i].x, y: beachLine[i].y, left: curFocus, right: beachLine[i].focusId });
            curFocus = beachLine[i].focusId;
          }
        }
        prevBeachLine = currentSegments;
      }
    }
  }

  // continue animation until sweep line is far off screen
  if (sweepLineY < height + 500) {
    animationFrameId = requestAnimationFrame(loop);
  } else {
    // Reached bottom, just wait for next click
    animationFrameId = null;
  }
}

// Call init when dom is ready
document.addEventListener('DOMContentLoaded', init);
