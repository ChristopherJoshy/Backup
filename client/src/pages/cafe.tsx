import { useState, useEffect } from 'react';
import BootScreen from '../components/BootScreen';
import TerminalInterface from '../components/TerminalInterface';

export default function Cafe() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('neural_brew_user');
    if (storedUser) {
      setUsername(storedUser);
      setIsAuthenticated(true);
  // Fire welcome for returning session
  fetch('/api/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: storedUser }) }).catch(()=>{});
    }
  }, []);

  const handleAuthenticated = (user: string) => {
    setUsername(user);
    setIsAuthenticated(true);
  localStorage.setItem('neural_brew_user', user);
    fetch('/api/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user }) })
      .catch(()=>{});
  };

  const handleLogout = () => {
    localStorage.removeItem('neural_brew_user');
    setUsername('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <BootScreen onAuthenticated={handleAuthenticated} />;
  }

  return <TerminalInterface username={username} onLogout={handleLogout} />;
}
