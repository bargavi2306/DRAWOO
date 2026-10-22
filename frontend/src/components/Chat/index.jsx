import React, { useState, useRef, useEffect } from 'react';
import ClayInput from '../ClayInput';
import ClayButton from '../ClayButton';
import Avatar from '../Avatar';
import styles from './Chat.module.css';

export default function Chat({
  messages = [],
  onSendMessage,
  role = 'guesser', // 'drawer' | 'guesser'
  isGuessed = false,
  placeholder = 'Guess the word…',
  currentUserId
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || role === 'drawer') return;

    if (onSendMessage) {
      // Trim whitespace & prepare clean text
      const cleanText = inputText.trim();
      onSendMessage(cleanText);
    }
    setInputText('');
  };

  const getSystemIcon = (msg) => {
    if (msg.event === 'join') return '👋';
    if (msg.event === 'leave') return '🚪';
    if (msg.event === 'correct' || msg.isCorrect) return '🟢';
    return 'ℹ️';
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>💬 Chat & Guesses</span>
        <span className={styles.msgCount}>{messages.length}</span>
      </div>

      <div className={styles.messagesList}>
        {messages.map((msg, idx) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id || idx}
                className={`${styles.systemMsg} ${msg.isCorrect || msg.event === 'correct' ? styles.correctMsg : ''}`}
              >
                <span className={styles.msgIcon}>{getSystemIcon(msg)}</span>
                <span>{msg.text}</span>
              </div>
            );
          }

          const isYou = msg.senderId === currentUserId || msg.isYou;

          return (
            <div
              key={msg.id || idx}
              className={`${styles.msgRow} ${isYou ? styles.youMsgRow : ''}`}
            >
              <Avatar avatarId={msg.avatarId ?? 0} size="xs" />
              <div className={styles.msgBubble}>
                <div className={styles.senderHeader}>
                  <span className={styles.senderName}>{msg.senderName || msg.senderNickname || 'Player'}:</span>
                </div>
                <span className={styles.msgText}>{msg.text}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - ONLY for guessers */}
      {role === 'guesser' ? (
        <form onSubmit={handleSubmit} className={styles.inputArea}>
          {isGuessed && (
            <div className={styles.guessedBanner}>
              🎉 You've guessed the word!
            </div>
          )}
          <div className={styles.inputRow}>
            <ClayInput
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isGuessed ? 'Send a message…' : placeholder}
              maxLength={60}
            />
            <ClayButton
              type="submit"
              variant={isGuessed ? 'secondary' : 'primary'}
              disabled={!inputText.trim()}
              aria-label="Send guess"
            >
              ➤
            </ClayButton>
          </div>
        </form>
      ) : (
        <div className={styles.drawerNotice}>
          🎨 You are drawing! Relax and watch guesses come in.
        </div>
      )}
    </div>
  );
}
