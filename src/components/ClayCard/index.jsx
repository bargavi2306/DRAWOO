import React from 'react';
import styles from './ClayCard.module.css';

export default function ClayCard({
  children,
  variant = 'lavender',
  interactive = false,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const cardClasses = [
    'clay-card',
    styles.card,
    styles[variant],
    interactive ? `${styles.interactive} clay-card-interactive` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={interactive ? onClick : undefined}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
