import React, { useState } from 'react';
import Modal from '../Modal';
import ClayButton from '../ClayButton';
import styles from './LeaveModal.module.css';

export default function LeaveModal({ isOpen = false, onStay, onClose, onLeave }) {
  const [isLeaving, setIsLeaving] = useState(false);

  if (!isOpen) return null;

  const handleStay = () => {
    if (isLeaving) return;
    if (onStay) onStay();
    else if (onClose) onClose();
  };

  const handleConfirmLeave = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    if (onLeave) onLeave();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleStay}
      title="Leave game?"
      maxWidth="420px"
    >
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🚪</span>
        </div>
        <p className={styles.message}>
          Your current progress may not be recoverable.
        </p>
        <div className={styles.actions}>
          <ClayButton variant="ghost" size="md" onClick={handleConfirmLeave} disabled={isLeaving}>
            LEAVE
          </ClayButton>
          <ClayButton variant="primary" size="md" onClick={handleStay} disabled={isLeaving}>
            STAY IN GAME
          </ClayButton>
        </div>
      </div>
    </Modal>
  );
}
