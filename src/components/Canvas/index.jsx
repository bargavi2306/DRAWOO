import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from './Canvas.module.css';

const Canvas = forwardRef(function Canvas({
  interactive = true,
  color = '#3D3A5C',
  size = 5, // 3, 5, 10, 16
  tool = 'brush', // 'brush' | 'eraser'
  onDrawStroke,
  className = ''
}, ref) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);
  const historyRef = useRef([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    },
    undo: () => {
      const canvas = canvasRef.current;
      if (!canvas || historyRef.current.length <= 1) return;
      historyRef.current.pop();
      const previousState = historyRef.current[historyRef.current.length - 1];
      const ctx = canvas.getContext('2d');
      ctx.putImageData(previousState, 0, 0);
    },
    drawRemoteStroke: (strokeData) => {
      const canvas = canvasRef.current;
      if (!canvas || !strokeData || !strokeData.points || strokeData.points.length === 0) return;

      const ctx = canvas.getContext('2d');
      const { points, tool: remoteTool, color: remoteColor, size: remoteSize } = strokeData;

      ctx.beginPath();
      ctx.strokeStyle = remoteTool === 'eraser' ? '#FFFFFF' : (remoteColor || '#3D3A5C');
      ctx.lineWidth = remoteTool === 'eraser' ? remoteSize * 2.5 : (remoteSize || 5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(300, rect.width);
    const height = Math.max(220, rect.height || width * 0.75);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!interactive) return;
    isDrawingRef.current = true;
    const pos = getPos(e);
    currentPointsRef.current = [pos];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? size * 2 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.fill();
  };

  const draw = (e) => {
    if (!interactive || !isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    const prevPos = currentPointsRef.current[currentPointsRef.current.length - 1] || pos;
    currentPointsRef.current.push(pos);

    ctx.beginPath();
    ctx.moveTo(prevPos.x, prevPos.y);
    ctx.lineTo(pos.x, pos.y);

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 2.5 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!interactive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0 && onDrawStroke) {
      onDrawStroke({
        tool,
        color,
        size,
        points: [...currentPointsRef.current]
      });
    }

    currentPointsRef.current = [];

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (historyRef.current.length >= 20) historyRef.current.shift();
      historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  };

  return (
    <div className={`${styles.canvasContainer} ${className} ${!interactive ? styles.readOnly : ''}`}>
      <canvas
        ref={canvasRef}
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
