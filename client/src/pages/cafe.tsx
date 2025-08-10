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
    }
  }, []);

  const handleAuthenticated = (user: string) => {
    setUsername(user);
    setIsAuthenticated(true);
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
