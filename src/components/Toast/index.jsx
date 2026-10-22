import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, icon = 'ℹ️', type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const updated = [...prev, { id, message, icon, type }];
      if (updated.length > 3) return updated.slice(updated.length - 3); // max 3 visible
      return updated;
    });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const contextValue = useMemo(() => ({
    addToast,
    removeToast
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastStack}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toastCard} ${styles[toast.type]}`}>
            <span className={styles.icon}>{toast.icon}</span>
            <span className={styles.message}>{toast.message}</span>
            <button
              className={styles.closeBtn}
              onClick={() => removeToast(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if not inside provider
    return {
      addToast: (msg, icon) => console.log(`[Toast] ${icon} ${msg}`),
      removeToast: () => {}
    };
  }
  return ctx;
}
