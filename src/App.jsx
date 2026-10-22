import React, { useState, useMemo, useCallback } from 'react';
import Home from './pages/Home';
import PrivateLobby from './pages/PrivateLobby';
import GamePage from './pages/Game';
import GameOverPage from './pages/GameOver';
import DevPreviewShell from './dev/DevPreviewShell';
import { socketService } from './services/socket';
import { ToastProvider, useToast } from './components/Toast';
import styles from './App.module.css';

function MainAppContent() {
  const { addToast } = useToast();

  // Check if developer explicitly requested dev preview mode via query parameter: ?dev=true
  const isDevMode = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('dev') === 'true' || params.get('preview') === 'true';
      }
    } catch {
      // Fallback
    }
    return false;
  }, []);

  // Real Game Navigation State: 'home' | 'private_lobby' | 'game' | 'game_over'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [finalRoomData, setFinalRoomData] = useState(null);

  // User Identity with local session persistence and stable ID
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('drawo_user_identity');
      const sid = socketService.getSessionId();
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.id) parsed.id = sid;
        return parsed;
      }
      return { id: sid, nickname: 'Player', avatarId: 0 };
    } catch {
      return { id: socketService.getSessionId(), nickname: 'Player', avatarId: 0 };
    }
  });

  // Global room state sync across screen transitions
  React.useEffect(() => {
    const unsub = socketService.onRoomStateUpdated((data) => {
      setRoomData(data);
      if (data?.code) {
        setActiveRoomCode(data.code);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveUser = useCallback((identity) => {
    setCurrentUser((prev) => {
      const fullUser = {
        ...identity,
        id: identity?.id || prev?.id || socketService.getSessionId()
      };
      try {
        sessionStorage.setItem('drawo_user_identity', JSON.stringify(fullUser));
      } catch (e) {
        console.warn('Could not access sessionStorage', e);
      }
      return fullUser;
    });
  }, []);

  const handleCreatePrivate = useCallback(async () => {
    const nick = currentUser?.nickname || 'Host';
    const av = currentUser?.avatarId ?? 0;
    const res = await socketService.createPrivateRoom(nick, av);
    if (res && res.roomCode) {
      setActiveRoomCode(res.roomCode);
      if (res.roomState) {
        setRoomData(res.roomState);
      }
    }
    setCurrentScreen('private_lobby');
  }, [currentUser]);

  const handleJoinRoom = useCallback((code, initialRoomState = null) => {
    setActiveRoomCode(code);
    if (initialRoomState) {
      setRoomData(initialRoomState);
    }
    setCurrentScreen('private_lobby');
  }, []);

  const handlePlayAgain = useCallback(() => {
    addToast('Returning to Private Lobby with room context…', '🏠', 'info');
    setCurrentScreen('private_lobby');
  }, [addToast]);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleStartGame = useCallback(() => {
    setCurrentScreen('game');
  }, []);

  const handleGameOver = useCallback((data) => {
    if (data) setFinalRoomData(data);
    setCurrentScreen('game_over');
  }, []);

  // If ?dev=true is set in the URL, render the detached prototype shell
  if (isDevMode) {
    return (
      <DevPreviewShell
        currentUser={currentUser}
        onSaveUser={handleSaveUser}
        activeRoomCode={activeRoomCode}
        finalRoomData={finalRoomData}
      />
    );
  }

  // Actual Game UI: Occupies 100% of browser viewport without preview frames
  return (
    <div className={styles.appContainer}>
      {currentScreen === 'home' && (
        <Home
          currentUser={currentUser}
          onSaveUser={handleSaveUser}
          onCreatePrivate={handleCreatePrivate}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {currentScreen === 'private_lobby' && (
        <PrivateLobby
          roomCode={activeRoomCode}
          currentUser={currentUser}
          initialData={roomData}
          onBackToHome={handleBackToHome}
          onStartGame={handleStartGame}
        />
      )}

      {currentScreen === 'game' && (
        <GamePage
          currentUser={currentUser}
          initialRoomState={roomData}
          onBackToHome={handleBackToHome}
          onGameOver={handleGameOver}
        />
      )}

      {currentScreen === 'game_over' && (
        <GameOverPage
          gameMode="private"
          roomCode={activeRoomCode}
          currentUserId={currentUser?.id || socketService.getSocketId() || 'p1'}
          players={finalRoomData?.players}
          winner={finalRoomData?.gameState?.winner}
          winnerMessage={finalRoomData?.gameState?.winnerMessage}
          onPlayAgain={handlePlayAgain}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
