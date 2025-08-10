import { useState, useEffect } from 'react';

interface BootScreenProps {
  onAuthenticated: (username: string) => void;
}

export default function BootScreen({ onAuthenticated }: BootScreenProps) {
  const [username, setUsername] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    // Check for stored username
    const storedUser = localStorage.getItem('neural_brew_user');
    if (storedUser) {
      setUsername(storedUser);
    }

    // Show input after boot sequence
    const timer = setTimeout(() => {
      setShowInput(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      localStorage.setItem('neural_brew_user', trimmedUsername);
      onAuthenticated(trimmedUsername);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-terminal-bg z-50 flex flex-col justify-center items-start p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="ascii-art text-xs mb-4 animate-boot-text font-mono leading-none">
{`╔══════════════════════════════════════════════════════════════════════════════╗
║                              NEURAL BREW v2.1                               ║
║                          Terminal Interface System                          ║
╚══════════════════════════════════════════════════════════════════════════════╝`}
        </div>
        
        <div className="space-y-2 text-sm mb-8">
          <div className="animate-boot-text" style={{ animationDelay: '0.5s' }}>
            Initializing Neural Brew Protocol...
          </div>
          <div className="animate-boot-text" style={{ animationDelay: '1s' }}>
            Loading AI Barista Systems... [OK]
          </div>
          <div className="animate-boot-text" style={{ animationDelay: '1.5s' }}>
            Connecting to Firebase Network... [OK]
          </div>
          <div className="animate-boot-text" style={{ animationDelay: '2s' }}>
            Calibrating Flavor Matrices... [OK]
          </div>
          <div className="animate-boot-text" style={{ animationDelay: '2.5s' }}>
            Establishing Real-time Chat Protocol... [OK]
          </div>
          <div className="animate-boot-text" style={{ animationDelay: '3s' }}>
            System Ready. Awaiting User Authentication...
          </div>
        </div>
        
        {showInput && (
          <div className="animate-boot-text" style={{ animationDelay: '3.5s' }}>
            <div className="mb-4">
              <span className="text-terminal-yellow">WARNING:</span> Neural Brew access requires valid terminal credentials.
            </div>
            
            <form onSubmit={handleSubmit} className="flex items-center">
              <span className="mr-2">neural_brew@localhost:~$</span>
              <span className="text-terminal-yellow mr-2">enter_username</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-terminal-green font-mono flex-1" 
                placeholder="guest_user_001"
                maxLength={20}
                autoFocus
              />
              <span className="animate-blink">_</span>
            </form>
            
            <div className="mt-4 text-xs text-terminal-dark-green">
              Press ENTER to initialize session | ESC to abort | /help for commands
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
