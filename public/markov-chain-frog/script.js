document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("pond-canvas");
  const ctx = canvas.getContext("2d");

  let width, height;

  function resizeCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // State
  const lilypads = [];
  const arrows = []; // { id, sourceId, targetId, weight }
  let nextId = 1;

  const LILYPAD_RADIUS = 30;
  const FROG_RADIUS = 15;

  let dragState = {
    isDragging: false,
    startLilypad: null,
    currentX: 0,
    currentY: 0,
  };

  const frog = {
    currentLilypadId: null,
    isJumping: false,
    jumpProgress: 0, // 0 to 1
    jumpPath: null, // the arrow being traversed
    jumpDuration: 800, // ms
    jumpStartTime: 0,
    restingTime: 0,
    restDuration: 500, // delay before next jump
  };

  // Utilities
  function getLilypadAt(x, y) {
    return lilypads.find((pad) => {
      const dx = pad.x - x;
      const dy = pad.y - y;
      return dx * dx + dy * dy <= LILYPAD_RADIUS * LILYPAD_RADIUS;
    });
  }

  function addLilypad(x, y) {
    const newPad = { id: nextId++, x, y };
    lilypads.push(newPad);
    if (frog.currentLilypadId === null) {
      frog.currentLilypadId = newPad.id;
      frog.restingTime = performance.now();
    }
    return newPad;
  }

  function addArrow(sourceId, targetId) {
    if (sourceId === targetId) return; // self loops allowed but visual is hard, ignoring for now or just handling simply

    // Check if arrow already exists
    const existing = arrows.find(
      (a) => a.sourceId === sourceId && a.targetId === targetId
    );
    if (existing) {
      existing.weight += 1; // Increase probability if drawn again
      return existing;
    }

    const newArrow = {
      id: nextId++,
      sourceId,
      targetId,
      weight: 1,
    };
    arrows.push(newArrow);
    return newArrow;
  }

  function getNormalizedProbabilities(sourceId) {
    const outgoing = arrows.filter((a) => a.sourceId === sourceId);
    const totalWeight = outgoing.reduce((sum, a) => sum + a.weight, 0);
    return outgoing.map((a) => ({
      ...a,
      probability: totalWeight > 0 ? a.weight / totalWeight : 0,
    }));
  }

  // Interaction
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    const clickedPad = getLilypadAt(x, y);

    if (clickedPad) {
      dragState.isDragging = true;
      dragState.startLilypad = clickedPad;
      dragState.currentX = x;
      dragState.currentY = y;
    } else {
      // Don't add if clicking close to another
      if (!lilypads.some((pad) => Math.hypot(pad.x - x, pad.y - y) < LILYPAD_RADIUS * 2.5)) {
        addLilypad(x, y);
      }
    }
  }

  function handlePointerMove(e) {
    e.preventDefault();
    if (!dragState.isDragging) return;
    const { x, y } = getPointerPos(e);
    dragState.currentX = x;
    dragState.currentY = y;
  }

  function handlePointerUp(e) {
    e.preventDefault();
    if (!dragState.isDragging) return;

    const { x, y } = getPointerPos(e);
    const targetPad = getLilypadAt(x, y);

    if (targetPad && targetPad.id !== dragState.startLilypad.id) {
      addArrow(dragState.startLilypad.id, targetPad.id);
    }

    dragState.isDragging = false;
    dragState.startLilypad = null;
  }

  canvas.addEventListener("mousedown", handlePointerDown);
  canvas.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("mouseup", handlePointerUp);

  canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
  canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
  window.addEventListener("touchend", handlePointerUp, { passive: false });

  // Math/Geometry for drawing arrows
  function drawArrow(ctx, sourceX, sourceY, targetX, targetY, probability, isBidirectional) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    // If bidirectional, curve it
    let controlX = (sourceX + targetX) / 2;
    let controlY = (sourceY + targetY) / 2;

    if (isBidirectional) {
       const curveOffset = 40;
       controlX -= Math.sin(angle) * curveOffset;
       controlY += Math.cos(angle) * curveOffset;
    }

    // Shorten line so it doesn't go inside lilypad
    const startX = sourceX + Math.cos(angle) * LILYPAD_RADIUS;
    const startY = sourceY + Math.sin(angle) * LILYPAD_RADIUS;
    const endX = targetX - Math.cos(angle) * LILYPAD_RADIUS;
    const endY = targetY - Math.sin(angle) * LILYPAD_RADIUS;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);

    // Thickness based on probability
    ctx.lineWidth = 1 + probability * 8;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + probability * 0.5})`;
    ctx.stroke();

    // Arrow head
    const headlen = 10 + probability * 10;
    // Need tangent angle at end of bezier
    const t = 1; // end
    const tx = 2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX);
    const ty = 2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY);
    const tangentAngle = Math.atan2(ty, tx);

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(tangentAngle - Math.PI / 6), endY - headlen * Math.sin(tangentAngle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(tangentAngle + Math.PI / 6), endY - headlen * Math.sin(tangentAngle + Math.PI / 6));
    ctx.lineTo(endX, endY);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();

    // Draw probability text
    const textX = 0.5 * 0.5 * startX + 2 * 0.5 * 0.5 * controlX + 0.5 * 0.5 * endX;
    const textY = 0.5 * 0.5 * startY + 2 * 0.5 * 0.5 * controlY + 0.5 * 0.5 * endY;

    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Background for text
    const text = `${(probability * 100).toFixed(0)}%`;
    const metrics = ctx.measureText(text);
    ctx.fillStyle = "rgba(10, 31, 51, 0.8)"; // pond bg
    ctx.fillRect(textX - metrics.width/2 - 4, textY - 8, metrics.width + 8, 16);

    ctx.fillStyle = "#fff";
    ctx.fillText(text, textX, textY);
  }

  // Get point along bezier
  function getBezierPoint(t, p0x, p0y, p1x, p1y, p2x, p2y) {
    const x = Math.pow(1-t, 2) * p0x + 2 * (1-t) * t * p1x + Math.pow(t, 2) * p2x;
    const y = Math.pow(1-t, 2) * p0y + 2 * (1-t) * t * p1y + Math.pow(t, 2) * p2y;
    return {x, y};
  }

  function triggerFrogJump() {
    if (frog.isJumping || frog.currentLilypadId === null) return;

    const probs = getNormalizedProbabilities(frog.currentLilypadId);
    if (probs.length === 0) return; // nowhere to jump

    const r = Math.random();
    let accumulated = 0;
    let selectedArrow = null;

    for (const arrow of probs) {
      accumulated += arrow.probability;
      if (r <= accumulated) {
        selectedArrow = arrow;
        break;
      }
    }

    if (selectedArrow) {
      frog.isJumping = true;
      frog.jumpPath = selectedArrow;
      frog.jumpStartTime = performance.now();
      frog.jumpProgress = 0;
    }
  }

  function updateFrog(time) {
    if (frog.isJumping) {
      const elapsed = time - frog.jumpStartTime;
      frog.jumpProgress = Math.min(1, elapsed / frog.jumpDuration);

      if (frog.jumpProgress >= 1) {
        // landed
        frog.isJumping = false;
        frog.currentLilypadId = frog.jumpPath.targetId;
        frog.jumpPath = null;
        frog.restingTime = time;
      }
    } else if (frog.currentLilypadId !== null) {
      // see if we should jump again
      if (time - frog.restingTime > frog.restDuration) {
         triggerFrogJump();
      }
    }
  }

  function draw(time) {
    updateFrog(time);

    ctx.clearRect(0, 0, width, height);

    // Draw active drag arrow
    if (dragState.isDragging && dragState.startLilypad) {
      ctx.beginPath();
      ctx.moveTo(dragState.startLilypad.x, dragState.startLilypad.y);
      ctx.lineTo(dragState.currentX, dragState.currentY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw all arrows
    const renderedArrows = new Set();
    arrows.forEach(arrow => {
        const source = lilypads.find(p => p.id === arrow.sourceId);
        const target = lilypads.find(p => p.id === arrow.targetId);
        if (!source || !target) return;

        const probs = getNormalizedProbabilities(source.id);
        const normArrow = probs.find(a => a.id === arrow.id);
        const probability = normArrow ? normArrow.probability : 0;

        const reverseExists = arrows.some(a => a.sourceId === target.id && a.targetId === source.id);

        drawArrow(ctx, source.x, source.y, target.x, target.y, probability, reverseExists);
    });

    // Draw lilypads
    lilypads.forEach(pad => {
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, LILYPAD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#2ecc71"; // lilypad color

      // Cutout to make it look like a lilypad
      ctx.lineTo(pad.x, pad.y);
      ctx.fill();

      // Slightly darker border
      ctx.strokeStyle = "#27ae60";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, LILYPAD_RADIUS - 2, Math.PI/6, 11*Math.PI/6);
      ctx.stroke();
    });

    // Draw frog
    if (frog.currentLilypadId !== null || frog.isJumping) {
      let fx, fy;
      let scale = 1;

      if (frog.isJumping && frog.jumpPath) {
        const source = lilypads.find(p => p.id === frog.jumpPath.sourceId);
        const target = lilypads.find(p => p.id === frog.jumpPath.targetId);

        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const angle = Math.atan2(dy, dx);
          const reverseExists = arrows.some(a => a.sourceId === target.id && a.targetId === source.id);

          let controlX = (source.x + target.x) / 2;
          let controlY = (source.y + target.y) / 2;

          if (reverseExists) {
             const curveOffset = 40;
             controlX -= Math.sin(angle) * curveOffset;
             controlY += Math.cos(angle) * curveOffset;
          }

          // Ease out
          const t = 1 - Math.pow(1 - frog.jumpProgress, 3);
          const pt = getBezierPoint(t, source.x, source.y, controlX, controlY, target.x, target.y);
          fx = pt.x;
          fy = pt.y;

          // Parabolic arc scale for "jump" effect
          scale = 1 + Math.sin(frog.jumpProgress * Math.PI) * 0.5;
        }
      } else {
        const currentPad = lilypads.find(p => p.id === frog.currentLilypadId);
        if (currentPad) {
          fx = currentPad.x;
          fy = currentPad.y;
        }
      }

      if (fx !== undefined && fy !== undefined) {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(scale, scale);

        // Simple frog
        ctx.beginPath();
        ctx.arc(0, 0, FROG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#f1c40f"; // yellowish frog
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#d4ac0d";
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(-6, -8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -8, 4, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-6, -8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -8, 2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});
