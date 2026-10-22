import React, { useState } from 'react';
import styles from './Avatar.module.css';

export const AVATAR_LIST = [
  { id: 0, name: 'Miu', tagline: 'Sweet & tiny', emoji: '👧', bg: '#EDE5FF' },
  { id: 1, name: 'Boo', emoji: '👦', bg: '#FFF0E8' },
  { id: 2, name: 'Mim', emoji: '👧', bg: '#FFE8F1' },
  { id: 3, name: 'Luv', emoji: '👧', bg: '#E6FAF2' },
  { id: 4, name: 'Pip', emoji: '👦', bg: '#FFF3F8' },
  { id: 5, name: 'Kiki', emoji: '👧', bg: '#EBF4FF' },
  { id: 6, name: 'Nix', emoji: '👦', bg: '#FDEBF7' },
  { id: 7, name: 'Lulu', emoji: '👧', bg: '#FFF7E6' },
  { id: 8, name: 'Bibi', emoji: '👧', bg: '#F1ECFF' },
  { id: 9, name: 'Piu', emoji: '👦', bg: '#EAF7F8' },
  { id: 10, name: 'Zuzu', emoji: '👧', bg: '#FFF9E5' },
  { id: 11, name: 'Tia', emoji: '👧', bg: '#EBF5FF' },
  { id: 12, name: 'Moe', emoji: '👦', bg: '#EAF9F1' },
  { id: 13, name: 'Roo', emoji: '👦', bg: '#FFF3E8' },
  { id: 14, name: 'Yui', emoji: '👧', bg: '#F5ECFF' },
  { id: 15, name: 'Fae', emoji: '👧', bg: '#F0F0FF' }
];

export default function Avatar({
  avatarId = 0,
  size = 'md', // xs (26px), sm (40px), md (64px), lg (88px), xl (104px)
  shape = 'squircle', // 'squircle' | 'circle'
  isGuessed = false,
  isDrawing = false,
  className = '',
  onClick,
  selected = false
}) {
  const [imgError, setImgError] = useState(false);
  const safeId = typeof avatarId === 'number' ? avatarId : parseInt(avatarId, 10) || 0;
  const avatarData = AVATAR_LIST[safeId % AVATAR_LIST.length] || AVATAR_LIST[0];

  const avatarClasses = [
    styles.avatarWrapper,
    styles[size],
    styles[shape],
    isGuessed ? styles.guessed : '',
    isDrawing ? styles.drawing : '',
    selected ? styles.selected : '',
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={avatarClasses}
      style={{ backgroundColor: avatarData.bg }}
      onClick={onClick}
    >
      {!imgError ? (
        <img
          src={`/avatars/avatar_${safeId % AVATAR_LIST.length}.png`}
          alt={avatarData.name}
          className={styles.avatarImg}
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <span className={styles.emojiFallback}>{avatarData.emoji}</span>
      )}

      {isGuessed && (
        <span className={styles.guessedBadge} title="Guessed the word!">
          ✓
        </span>
      )}
      {isDrawing && (
        <span className={styles.drawingBadge} title="Currently drawing">
          🎨
        </span>
      )}
    </div>
  );
}
