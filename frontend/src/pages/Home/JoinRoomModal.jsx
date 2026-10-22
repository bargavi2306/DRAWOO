import React, { useState } from 'react';
import Modal from '../../components/Modal';
import ClayInput from '../../components/ClayInput';
import ClayButton from '../../components/ClayButton';
import { socketService } from '../../services/socket';
import styles from './JoinRoomModal.module.css';

export default function JoinRoomModal({
  isOpen,
  onClose,
  currentUser,
  onJoinSuccess
}) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'joining' | 'invalid_format' | 'not_found' | 'room_full' | 'net_error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(val);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    const trimmed = code.trim();

    if (trimmed.length !== 5) {
      setStatus('invalid_format');
      setErrorMessage('Room code must be 5 alphanumeric characters');
      return;
    }

    setStatus('joining');

    try {
      const nickname = currentUser?.nickname || 'Guest';
      const avatarId = currentUser?.avatarId ?? 0;
      const sessionId = currentUser?.id || socketService.getSessionId();

      const res = await socketService.joinPrivateRoom(trimmed, nickname, avatarId, sessionId);

      if (res && res.success) {
        setStatus('idle');
        if (onJoinSuccess) {
          onJoinSuccess(res.roomCode || trimmed, res.roomState);
        }
        onClose();
      } else {
        const reason = res?.reason || 'not_found';
        if (reason === 'game_in_progress') {
          setStatus('game_in_progress');
          setErrorMessage(res.message || 'Match is already in progress and mid-game join is disabled.');
        } else if (reason === 'room_full') {
          setStatus('room_full');
          setErrorMessage('This room is full and cannot accept new players.');
        } else if (reason === 'not_found') {
          setStatus('not_found');
          setErrorMessage('Room not found. Check your code and try again.');
        } else {
          setStatus('net_error');
          setErrorMessage(res?.message || 'Could not connect. Check network connection.');
        }
      }
    } catch {
      setStatus('net_error');
      setErrorMessage('Network connection error. Try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Private Room 🔑"
      subtitle="Enter your 5-character room code"
      showCloseButton={true}
    >
      <form onSubmit={handleJoin} className={styles.formContainer}>
        {/* Banner Error States */}
        {status === 'not_found' && (
          <div className={styles.peachBanner}>
            😕 {errorMessage}
          </div>
        )}

        {status === 'room_full' && (
          <div className={styles.redBanner}>
            🚫 {errorMessage}
          </div>
        )}

        {status === 'net_error' && (
          <div className={styles.redBanner}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Input */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Room Code</label>
          <ClayInput
            value={code}
            onChange={handleCodeChange}
            placeholder="e.g. AB7KQ"
            maxLength={5}
            disabled={status === 'joining'}
            error={status === 'invalid_format'}
            errorMessage={status === 'invalid_format' ? errorMessage : ''}
            className={styles.codeInput}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <ClayButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            disabled={code.length !== 5 || status === 'joining' || status === 'room_full'}
          >
            {status === 'joining' ? 'Joining… ⏳' : 'JOIN ROOM'}
          </ClayButton>

          {status === 'net_error' ? (
            <ClayButton
              type="button"
              variant="secondary"
              size="md"
              fullWidth={true}
              onClick={handleJoin}
            >
              🔄 Retry Connection
            </ClayButton>
          ) : (
            <button
              type="button"
              className={styles.cancelLink}
              onClick={onClose}
              disabled={status === 'joining'}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
