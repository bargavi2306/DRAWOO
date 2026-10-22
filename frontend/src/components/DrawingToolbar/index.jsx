import React from 'react';
import styles from './DrawingToolbar.module.css';

export const PALETTE_COLORS = [
  '#000000', '#555555', '#8D6E63', '#E74C3C',
  '#F4956A', '#F5C842', '#2ECC71', '#4EC995',
  '#00BCD4', '#3498DB', '#8069D4', '#DF83A8',
  '#EDE5FF', '#FFFFFF'
];

export const BRUSH_SIZES = [
  { label: 'S', value: 3, dotSize: 5 },
  { label: 'M', value: 7, dotSize: 9 },
  { label: 'L', value: 14, dotSize: 14 },
  { label: 'XL', value: 22, dotSize: 19 }
];

export default function DrawingToolbar({
  activeTool = 'brush',
  onToolChange,
  activeColor = '#000000',
  onColorChange,
  activeSize = 7,
  onSizeChange,
  onUndo,
  onClear
}) {
  return (
    <div className={styles.toolbarCard}>
      {/* Row 1: Color Palette Swatches */}
      <div className={styles.paletteRow}>
        {PALETTE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`${styles.colorSwatch} ${activeColor === c && activeTool !== 'eraser' ? styles.activeSwatch : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              onColorChange(c);
              if (activeTool === 'eraser') onToolChange('brush');
            }}
            title={c}
          />
        ))}
      </div>

      {/* Row 2: Tool Actions & Brush Sizes */}
      <div className={styles.controlsRow}>
        {/* Tool Mode Buttons */}
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${activeTool === 'brush' ? styles.activeTool : ''}`}
            onClick={() => onToolChange('brush')}
            title="Pencil / Brush"
          >
            ✏️
          </button>

          <button
            type="button"
            className={`${styles.toolBtn} ${activeTool === 'eraser' ? styles.activeTool : ''}`}
            onClick={() => onToolChange('eraser')}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className={styles.divider} />

        {/* Brush Size Selector */}
        <div className={styles.sizeGroup}>
          {BRUSH_SIZES.map((sz) => (
            <button
              key={sz.label}
              type="button"
              className={`${styles.sizeBtn} ${activeSize === sz.value ? styles.activeSize : ''}`}
              onClick={() => onSizeChange(sz.value)}
              title={`Size ${sz.label}`}
            >
              <span
                className={styles.sizeDot}
                style={{
                  width: `${sz.dotSize}px`,
                  height: `${sz.dotSize}px`,
                  backgroundColor: activeTool === 'eraser' ? '#8E8A9F' : activeColor
                }}
              />
            </button>
          ))}
        </div>

        <div className={styles.divider} />

        {/* Action Buttons: Undo & Clear */}
        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onUndo}
            title="Undo stroke"
          >
            ↩
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.clearBtn}`}
            onClick={onClear}
            title="Clear canvas"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
