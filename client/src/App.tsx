import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import UserContext from './contexts/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout';
import AuthPage from './components/auth';
import PostListPage from './components/posts/PostList';
import NotFound from './components/NotFound';
import { SafeDatabaseUser } from 'shared/types/user';
import { ServerToClientEvents, ClientToServerEvents } from 'shared/types/socket';
import { applyTheme } from './utils/theme';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8000';

const App = () => {
  const [user, setUser] = useState<SafeDatabaseUser | null>(null);
  const [socket] = useState<AppSocket>(() => io(SOCKET_URL, { autoConnect: false }));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored) as SafeDatabaseUser;
      setUser(parsed);
      applyTheme(parsed.theme);
      socket.connect();
    }
    return () => { socket.disconnect(); };
  }, [socket]);

  if (!user) {
    return (
      <ErrorBoundary>
        <AuthPage onLogin={(u) => { setUser(u); socket.connect(); }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserContext.Provider value={{ user, socket }}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Layout />}>
              <Route index element={<Navigate to='/posts' replace />} />
              <Route path='posts' element={<PostListPage />} />
              {/* Catch-all: any unmatched path under / renders 404 */}
              <Route path='*' element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
