import React, { useState } from 'react';
import ClayCard from '../../components/ClayCard';
import ClayButton from '../../components/ClayButton';
import ClayInput from '../../components/ClayInput';
import DisconnectOverlay from '../../components/DisconnectOverlay';
import RoomFullModal from '../../components/RoomFullModal';
import KickedModal from '../../components/KickedModal';
import LeaveModal from '../../components/LeaveModal';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import styles from './EdgeCases.module.css';

export default function EdgeCasesPage({ onBackToHome }) {
  const { addToast } = useToast();

  // Modal open states
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showRoomFull, setShowRoomFull] = useState(false);
  const [showKicked, setShowKicked] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  // Additional Edge Case Modals
  const [showNotFound, setShowNotFound] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [showGenericError, setShowGenericError] = useState(false);

  // Interactive Room Code Validation test
  const [roomCode, setRoomCode] = useState('');
  const [roomCodeError, setRoomCodeError] = useState('');

  const handleValidateRoomCode = (code) => {
    setRoomCode(code);
    const upper = code.toUpperCase();
    if (upper === 'BAD00') {
      setRoomCodeError('Room not found');
    } else if (upper === 'FULL8') {
      setRoomCodeError('Room full');
    } else if (upper.length > 0 && upper.length < 5) {
      setRoomCodeError('Room code must be 5 letters');
    } else {
      setRoomCodeError('');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚡ Phase 11: Edge Cases & Supporting States</h1>
        <p className={styles.subtitle}>
          Interactive workbench to verify and trigger all DRAWO supporting states, notifications, and edge case overlays.
        </p>
      </header>

      <div className={styles.grid}>
        {/* S1 Toast Triggers */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>🍞 S1: Toast Notifications</h2>
          <p className={styles.cardDesc}>
            Toast events stack at bottom-right (max 3 visible, auto-dismiss ~3 seconds).
          </p>
          <div className={styles.btnGroup}>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => addToast('Player Blobby joined the room', '👋', 'info')}
            >
              👋 Player Joined
            </ClayButton>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => addToast('Player Sparky left the room', '🏃', 'info')}
            >
              🏃 Player Left
            </ClayButton>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => addToast('Host transferred to Pixel', '👑', 'info')}
            >
              👑 Host Transferred
            </ClayButton>
            <ClayButton
              variant="mint"
              size="sm"
              onClick={() => addToast('Reconnected to room!', '⚡', 'success')}
            >
              ⚡ Reconnected
            </ClayButton>
            <ClayButton
              variant="primary"
              size="sm"
              onClick={() => addToast('Blobby guessed the word!', '✅', 'success')}
            >
              ✅ Correct Guess
            </ClayButton>
          </div>
        </ClayCard>

        {/* S2 Disconnect / Reconnect */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>📡 S2: Disconnect & Reconnect</h2>
          <p className={styles.cardDesc}>
            Full-screen backdrop overlay when connection drops, with pulse radar animation and recovery action.
          </p>
          <ClayButton variant="primary" size="md" onClick={() => setShowDisconnect(true)}>
            📡 Trigger Connection Lost
          </ClayButton>
        </ClayCard>

        {/* S3 Room Full */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>🚫 S3: Room Full Modal</h2>
          <p className={styles.cardDesc}>
            Modal displayed when attempting to join a room at maximum capacity.
          </p>
          <ClayButton variant="primary" size="md" onClick={() => setShowRoomFull(true)}>
            🚫 Trigger Room Full
          </ClayButton>
        </ClayCard>

        {/* S4 Kicked */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>⚡ S4: Kicked from Room</h2>
          <p className={styles.cardDesc}>
            Notification modal shown when host removes the player from the room session.
          </p>
          <ClayButton variant="primary" size="md" onClick={() => setShowKicked(true)}>
            ⚡ Trigger Kicked State
          </ClayButton>
        </ClayCard>

        {/* S5 Leave Confirmation */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>🚪 S5: Leave Game Confirmation</h2>
          <p className={styles.cardDesc}>
            Confirmation modal prompting user before abandoning active gameplay.
          </p>
          <ClayButton variant="ghost" size="md" onClick={() => setShowLeave(true)}>
            🚪 Trigger Leave Confirmation
          </ClayButton>
        </ClayCard>

        {/* Edge Case: Room Code Validation & Error States */}
        <ClayCard variant="cream" className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>🔍 Room Code Validation & Retry</h2>
          <p className={styles.cardDesc}>
            Test input validation logic (Try typing <code>BAD00</code> or <code>FULL8</code>).
          </p>
          <div className={styles.inputWrap}>
            <ClayInput
              value={roomCode}
              onChange={(e) => handleValidateRoomCode(e.target.value)}
              placeholder="ENTER CODE (e.g. BAD00)"
              maxLength={5}
              error={Boolean(roomCodeError)}
              errorMessage={roomCodeError}
            />
          </div>
          <div className={styles.btnGroup}>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => setShowNotFound(true)}
            >
              🔍 Room Not Found (BAD00)
            </ClayButton>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => setShowNetworkError(true)}
            >
              🌐 Network Error (FAIL9)
            </ClayButton>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => setShowSessionExpired(true)}
            >
              ⏳ Session Expired
            </ClayButton>
            <ClayButton
              variant="secondary"
              size="sm"
              onClick={() => setShowGenericError(true)}
            >
              ⚠️ Generic Recoverable Error
            </ClayButton>
          </div>
        </ClayCard>
      </div>

      {/* S2 Overlay Component */}
      <DisconnectOverlay
        isOpen={showDisconnect}
        onSimulateReconnect={() => {
          setShowDisconnect(false);
          addToast('Reconnected to room!', '⚡', 'success');
        }}
      />

      {/* S3 Room Full Component */}
      <RoomFullModal
        isOpen={showRoomFull}
        onClose={() => setShowRoomFull(false)}
        onBackToHome={() => {
          setShowRoomFull(false);
          if (onBackToHome) onBackToHome();
        }}
      />

      {/* S4 Kicked Component */}
      <KickedModal
        isOpen={showKicked}
        onClose={() => setShowKicked(false)}
        onBackToHome={() => {
          setShowKicked(false);
          if (onBackToHome) onBackToHome();
        }}
      />

      {/* S5 Leave Component */}
      <LeaveModal
        isOpen={showLeave}
        onStay={() => setShowLeave(false)}
        onLeave={() => {
          setShowLeave(false);
          addToast('Left game session', '🚪', 'info');
          if (onBackToHome) onBackToHome();
        }}
      />

      {/* Room Not Found Modal */}
      <Modal
        isOpen={showNotFound}
        onClose={() => setShowNotFound(false)}
        title="ROOM NOT FOUND"
        maxWidth="420px"
      >
        <div className={styles.modalContent}>
          <span className={styles.bigIcon}>🔍</span>
          <p className={styles.modalBody}>
            No room was found matching code <strong>BAD00</strong>. Please double check the 5-character code and try again.
          </p>
          <div className={styles.modalActions}>
            <ClayButton variant="primary" size="md" onClick={() => setShowNotFound(false)}>
              🔄 TRY AGAIN
            </ClayButton>
          </div>
        </div>
      </Modal>

      {/* Network Error Modal */}
      <Modal
        isOpen={showNetworkError}
        onClose={() => setShowNetworkError(false)}
        title="NETWORK ERROR"
        maxWidth="420px"
      >
        <div className={styles.modalContent}>
          <span className={styles.bigIcon}>🌐</span>
          <p className={styles.modalBody}>
            Unable to connect to matchmaking server. Check your internet connection and try again.
          </p>
          <div className={styles.modalActions}>
            <ClayButton
              variant="mint"
              size="md"
              onClick={() => {
                setShowNetworkError(false);
                addToast('Matchmaking re-connected!', '🟢', 'success');
              }}
            >
              🔄 RETRY MATCHMAKING
            </ClayButton>
          </div>
        </div>
      </Modal>

      {/* Session Expired Modal */}
      <Modal
        isOpen={showSessionExpired}
        onClose={() => setShowSessionExpired(false)}
        title="SESSION EXPIRED"
        maxWidth="420px"
      >
        <div className={styles.modalContent}>
          <span className={styles.bigIcon}>⏳</span>
          <p className={styles.modalBody}>
            Your player session has timed out due to inactivity. Please rejoin from the Home screen.
          </p>
          <div className={styles.modalActions}>
            <ClayButton variant="primary" size="md" onClick={() => setShowSessionExpired(false)}>
              🏠 HOME
            </ClayButton>
          </div>
        </div>
      </Modal>

      {/* Generic Error Modal */}
      <Modal
        isOpen={showGenericError}
        onClose={() => setShowGenericError(false)}
        title="SOMETHING WENT WRONG"
        maxWidth="420px"
      >
        <div className={styles.modalContent}>
          <span className={styles.bigIcon}>⚠️</span>
          <p className={styles.modalBody}>
            An unexpected error occurred while loading room state. You can retry the operation or return Home.
          </p>
          <div className={styles.modalActions}>
            <ClayButton variant="ghost" size="md" onClick={() => setShowGenericError(false)}>
              CANCEL
            </ClayButton>
            <ClayButton
              variant="primary"
              size="md"
              onClick={() => {
                setShowGenericError(false);
                addToast('State recovered successfully', '✅', 'success');
              }}
            >
              🔄 RETRY
            </ClayButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
