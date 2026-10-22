import React from 'react';
import styles from './ClayButton.module.css';

export default function ClayButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  onClick,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  const btnClasses = [
    'clay-btn',
    `clay-btn-${variant}`,
    styles.btn,
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? 'clay-btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={btnClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
    </button>
  );
}
