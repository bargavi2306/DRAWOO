import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from './Canvas.module.css';

export const LOGICAL_CANVAS_WIDTH = 800;
export const LOGICAL_CANVAS_HEIGHT = 600;

function toLogicalPoint(p) {
  if (!p) return { x: 0, y: 0 };
  // If coordinates are normalized in [0, 1] range:
  if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) {
    return {
      x: Math.round(p.x * LOGICAL_CANVAS_WIDTH * 10) / 10,
      y: Math.round(p.y * LOGICAL_CANVAS_HEIGHT * 10) / 10
    };
  }
  return {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10
  };
}

function renderStroke(ctx, strokeData) {
  if (!ctx || !strokeData || !strokeData.points || strokeData.points.length === 0) return;
  const { points, tool, color, size } = strokeData;
  const isEraser = tool === 'eraser';

  ctx.beginPath();
  ctx.strokeStyle = isEraser ? '#FFFFFF' : (color || '#3D3A5C');
  ctx.lineWidth = isEraser ? (size || 7) * 2.5 : (size || 7);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const p0 = toLogicalPoint(points[0]);
  ctx.moveTo(p0.x, p0.y);

  if (points.length === 1) {
    // Single tap/dot: draw dot to ensure visibility across all browsers
    ctx.lineTo(p0.x + 0.1, p0.y);
  } else {
    for (let i = 1; i < points.length; i++) {
      const p = toLogicalPoint(points[i]);
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
}

function redrawAllStrokes(ctx, strokes) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);
  for (const s of strokes) {
    renderStroke(ctx, s);
  }
}

const Canvas = forwardRef(function Canvas({
  interactive = true,
  color = '#3D3A5C',
  size = 7, // 3, 7, 14, 22
  tool = 'brush', // 'brush' | 'eraser'
  onDrawStroke,
  className = ''
}, ref) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);
  const strokesRef = useRef([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokesRef.current = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);
    },
    undo: () => {
      if (strokesRef.current.length === 0) return;
      strokesRef.current.pop();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      redrawAllStrokes(ctx, strokesRef.current);
    },
    drawRemoteStroke: (strokeData) => {
      if (!strokeData || !strokeData.points || strokeData.points.length === 0) return;
      strokesRef.current.push(strokeData);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      renderStroke(ctx, strokeData);
    },
    setStrokesHistory: (strokes) => {
      strokesRef.current = Array.isArray(strokes) ? [...strokes] : [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      redrawAllStrokes(ctx, strokesRef.current);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = LOGICAL_CANVAS_WIDTH;
    canvas.height = LOGICAL_CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    redrawAllStrokes(ctx, strokesRef.current);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };

    const scaleX = LOGICAL_CANVAS_WIDTH / rect.width;
    const scaleY = LOGICAL_CANVAS_HEIGHT / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const rawX = (clientX - rect.left) * scaleX;
    const rawY = (clientY - rect.top) * scaleY;

    return {
      x: Math.round(Math.max(0, Math.min(LOGICAL_CANVAS_WIDTH, rawX)) * 10) / 10,
      y: Math.round(Math.max(0, Math.min(LOGICAL_CANVAS_HEIGHT, rawY)) * 10) / 10
    };
  };

  const startDrawing = (e) => {
    if (!interactive) return;
    isDrawingRef.current = true;
    const pos = getPos(e);
    currentPointsRef.current = [pos];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isEraser = tool === 'eraser';
    ctx.beginPath();
    ctx.fillStyle = isEraser ? '#FFFFFF' : color;
    const dotRadius = (isEraser ? size * 2.5 : size) / 2;
    ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e) => {
    if (!interactive || !isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    const prevPos = currentPointsRef.current[currentPointsRef.current.length - 1] || pos;
    const dx = pos.x - prevPos.x;
    const dy = pos.y - prevPos.y;
    // Skip duplicate/redundant points within 2px to optimize network bandwidth
    if (currentPointsRef.current.length > 1 && (dx * dx + dy * dy) < 4) {
      return;
    }

    currentPointsRef.current.push(pos);

    ctx.beginPath();
    ctx.moveTo(prevPos.x, prevPos.y);
    ctx.lineTo(pos.x, pos.y);

    const isEraser = tool === 'eraser';
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? size * 2.5 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!interactive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const completedStroke = {
        tool,
        color,
        size,
        points: [...currentPointsRef.current]
      };

      strokesRef.current.push(completedStroke);

      if (onDrawStroke) {
        onDrawStroke(completedStroke);
      }
    }

    currentPointsRef.current = [];
  };

  return (
    <div className={`${styles.canvasContainer} ${className} ${!interactive ? styles.readOnly : ''}`}>
      <canvas
        ref={canvasRef}
        width={LOGICAL_CANVAS_WIDTH}
        height={LOGICAL_CANVAS_HEIGHT}
        className={styles.canvasSurface}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!interactive && (
        <div className={styles.readOnlyBadge}>
          👀 Read-Only Canvas
        </div>
      )}
    </div>
  );
});

export default Canvas;
