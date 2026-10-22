import React from 'react';
import Modal from '../Modal';
import ClayButton from '../ClayButton';
import styles from './RoomFullModal.module.css';

export default function RoomFullModal({ isOpen = false, onClose, onBackToHome }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ROOM IS FULL"
      showCloseButton={false}
      maxWidth="420px"
    >
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🚫</span>
        </div>
        <p className={styles.message}>
          This room has reached its maximum player limit.
        </p>
        <div className={styles.actions}>
          <ClayButton variant="primary" size="md" onClick={onBackToHome || onClose}>
            🏠 BACK TO HOME
          </ClayButton>
        </div>
      </div>
    </Modal>
  );
}
