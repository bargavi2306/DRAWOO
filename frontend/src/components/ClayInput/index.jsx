import React from 'react';
import styles from './ClayInput.module.css';

export default function ClayInput({
  value,
  onChange,
  placeholder,
  error = false,
  errorMessage = '',
  icon = null,
  disabled = false,
  maxLength,
  type = 'text',
  className = '',
  ...props
}) {
  const containerClasses = [
    styles.inputWrapper,
    error ? styles.hasError : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'clay-input',
    styles.input,
    error ? 'clay-input-error' : '',
    icon ? styles.hasIcon : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.inputFieldContainer}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClasses}
          {...props}
        />
        {maxLength && (
          <span className={`${styles.charCount} ${value?.length >= maxLength ? styles.charCountMax : ''}`}>
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
      {errorMessage && (
        <span className={styles.errorMessage}>
          ⚠️ {errorMessage}
        </span>
      )}
    </div>
  );
}
