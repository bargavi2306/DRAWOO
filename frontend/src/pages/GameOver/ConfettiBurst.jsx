import React, { useState, useEffect, useMemo } from 'react';
import styles from './ConfettiBurst.module.css';

const PALETTE = [
  '#F5C842', // DRAWO Yellow / Gold
  '#FFD700', // Bright Gold
  '#7C6FCD', // DRAWO Lavender
  '#9B8DFF', // Light Violet
  '#E879A0', // DRAWO Pink
  '#FF8EAF', // Light Pink
  '#5BB89A', // DRAWO Mint
  '#74D6B8', // Light Mint
  '#F4956A', // DRAWO Peach
  '#FFA882'  // Light Peach
];

const SHAPES = ['rect', 'circle', 'strip', 'star', 'sparkle'];

export default function ConfettiBurst() {
  const [active, setActive] = useState(true);

  // Auto clean-up burst after animation completes (~3.2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  // Generate 32 particles once on mount
  const particles = useMemo(() => {
    const items = [];
    const count = 32;

    for (let i = 0; i < count; i++) {
      const isLeft = i % 2 === 0;
      const shapeType = SHAPES[i % SHAPES.length];
      const color = PALETTE[i % PALETTE.length];
      const delay = (0.02 + (i * 0.018)).toFixed(3) + 's';
      const duration = (2.2 + ((i % 5) * 0.15)).toFixed(2) + 's';

      // Trajectory calculations
      // Left bursts to the right (+dx), Right bursts to the left (-dx)
      const dx = Math.floor(100 + (Math.random() * 260));
      const dy = Math.floor(-320 - (Math.random() * 260));
      const rot = Math.floor(280 + (Math.random() * 540)) + 'deg';
      const scale = (0.75 + Math.random() * 0.45).toFixed(2);
      const size = Math.floor(9 + (Math.random() * 6)) + 'px';

      items.push({
        id: i,
        isLeft,
        shapeType,
        color,
        delay,
        duration,
        dx: `${dx}px`,
        dy: `${dy}px`,
        rot,
        scale,
        size
      });
    }

    return items;
  }, []);

  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {/* Calm static sparkles for prefers-reduced-motion */}
      <span className={`${styles.staticDecor} ${styles.static1}`}>✨</span>
      <span className={`${styles.staticDecor} ${styles.static2}`}>⭐</span>
      <span className={`${styles.staticDecor} ${styles.static3}`}>🎉</span>
      <span className={`${styles.staticDecor} ${styles.static4}`}>✨</span>

      {/* Dynamic confetti burst */}
      {active &&
        particles.map((p) => {
          const originClass = p.isLeft ? styles.leftOrigin : styles.rightOrigin;
          const style = {
            '--dx': p.dx,
            '--dy': p.dy,
            '--rot': p.rot,
            '--scale': p.scale,
            '--size': p.size,
            '--color': p.color,
            '--delay': p.delay,
            '--dur': p.duration
          };

          if (p.shapeType === 'star') {
            return (
              <span
                key={p.id}
                className={`${styles.particle} ${originClass} ${styles.symbol}`}
                style={style}
              >
                ★
              </span>
            );
          }

          if (p.shapeType === 'sparkle') {
            return (
              <span
                key={p.id}
                className={`${styles.particle} ${originClass} ${styles.symbol}`}
                style={style}
              >
                ✦
              </span>
            );
          }

          const shapeClass =
            p.shapeType === 'circle'
              ? styles.circle
              : p.shapeType === 'strip'
              ? styles.strip
              : styles.rect;

          return (
            <div
              key={p.id}
              className={`${styles.particle} ${originClass} ${shapeClass}`}
              style={style}
            />
          );
        })}
    </div>
  );
}
