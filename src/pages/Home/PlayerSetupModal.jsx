import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Avatar, { AVATAR_LIST } from '../../components/Avatar';
import ClayInput from '../../components/ClayInput';
import ClayButton from '../../components/ClayButton';
import { useToast } from '../../components/Toast';
import styles from './PlayerSetupModal.module.css';

export default function PlayerSetupModal({
  isOpen,
  onClose,
  onSaveIdentity,
  initialIdentity = null
}) {
  const { addToast } = useToast();
  const [nickname, setNickname] = useState(initialIdentity?.nickname || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialIdentity?.avatarId ?? null);
  const [error, setError] = useState('');
  const [gridPulse, setGridPulse] = useState(false);

  useEffect(() => {
    if (initialIdentity) {
      setNickname(initialIdentity.nickname || '');
      setSelectedAvatarId(initialIdentity.avatarId ?? null);
    }
  }, [initialIdentity, isOpen]);

  const handleAvatarSelect = (id) => {
    setSelectedAvatarId(id);
    setError('');
  };

  const handleNicknameChange = (e) => {
    const val = e.target.value;
    setNickname(val);
    if (val.trim().length > 0) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError('Please enter a nickname');
      return;
    }

    if (selectedAvatarId === null || selectedAvatarId === undefined) {
      addToast('Please pick an avatar', '👤', 'warning');
      setGridPulse(true);
      setTimeout(() => setGridPulse(false), 600);
      return;
    }

    onSaveIdentity({
      nickname: trimmed,
      avatarId: selectedAvatarId
    });

    onClose();
  };

  const isValid = nickname.trim().length > 0 && selectedAvatarId !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose your look 🎨"
      subtitle="Select an avatar and nickname to start playing"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        {/* Avatar Grid 4x3 */}
        <div className={styles.avatarSection}>
          <label className={styles.sectionLabel}>Pick an Avatar</label>
          <div className={`${styles.avatarGrid} ${gridPulse ? styles.pulseGrid : ''}`}>
            {AVATAR_LIST.map((av) => {
              const isSelected = selectedAvatarId === av.id;

              return (
                <div
                  key={av.id}
                  className={`${styles.avatarWrapper} ${isSelected ? styles.selectedAvatar : ''}`}
                  onClick={() => handleAvatarSelect(av.id)}
                >
                  <div className={styles.avatarRel}>
                    <Avatar
                      avatarId={av.id}
                      size="md"
                      selected={isSelected}
                    />
                    {isSelected && (
                      <span className={styles.checkBadge}>
                        ✓
                      </span>
                    )}
                  </div>
                  <span className={styles.avatarName} title={av.tagline ? `${av.name} — ${av.tagline}` : av.name}>
                    {av.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nickname Input */}
        <div className={styles.inputSection}>
          <label className={styles.sectionLabel}>Your Nickname</label>
          <ClayInput
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Enter your nickname"
            maxLength={20}
            error={Boolean(error)}
            errorMessage={error}
          />
        </div>

        {/* Action Button */}
        <div className={styles.submitArea}>
          <ClayButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            disabled={!isValid}
          >
            Continue →
          </ClayButton>
        </div>
      </form>
    </Modal>
  );
}
