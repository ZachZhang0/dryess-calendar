import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { EventCalendar } from './components/EventCalendar';
import { TimelineRoute } from './components/TimelineRoute';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('timeline');

  // Check for saved login state
  useEffect(() => {
    const savedLogin = localStorage.getItem('dryess_logged_in');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (username: string, password: string, remember: boolean) => {
    setIsLoggedIn(true);
    if (remember) {
      localStorage.setItem('dryess_logged_in', 'true');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('dryess_logged_in');
  };

  const handleSwitchView = () => {
    setViewMode(viewMode === 'timeline' ? 'calendar' : 'timeline');
  };

  return (
    <>
      {isLoggedIn ? (
        viewMode === 'timeline' ? (
          <TimelineRoute onLogout={handleLogout} onSwitchView={handleSwitchView} />
        ) : (
          <EventCalendar onLogout={handleLogout} onSwitchView={handleSwitchView} />
        )
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <Toaster />
    </>
  );
}
