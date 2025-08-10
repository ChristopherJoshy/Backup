import { useState, useEffect, useRef } from 'react';
import { useFirebaseMessages } from '../hooks/useFirebase';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

interface NeuralInterfaceProps {
  username: string;
  onLogout: () => void;
}

export default function NeuralInterface({ username, onLogout }: NeuralInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [nextBrewCountdown, setNextBrewCountdown] = useState(60);
  
  const { messages, loading, error } = useFirebaseMessages();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Countdown timer for next auto-brew
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = 60 - (new Date().getSeconds());
      setNextBrewCountdown(seconds === 60 ? 0 : seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (message: string, isRecipe: boolean) => {
    try {
      setIsLoading(true);
      
      let content = message;
      if (isRecipe && !message.startsWith('/recipe')) {
        content = `/recipe ${message}`;
      }

      // Send message to server
      await apiRequest('POST', '/api/messages', {
        username,
        content,
        type: 'user',
        isCommand: isRecipe || message.startsWith('/'),
      });

      // Immediately invalidate queries for instant update
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      // Force a refetch to get the latest messages including any AI responses
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      }, 500); // Small delay to allow server processing

      // Handle special commands
      if (message === '/help') {
        setShowHelp(true);
      } else if (message === '/exit') {
        onLogout();
      }
    } catch (error) {
      toast({
        title: "Message failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = () => {
    const now = new Date();
    return now.toISOString().substr(0, 10) + ' - ' + now.toTimeString().substr(0, 8);
  };

  const formatCountdown = () => {
    const minutes = Math.floor(nextBrewCountdown / 60);
    const seconds = nextBrewCountdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
  <div className="min-h-screen flex items-center justify-center bg-terminal-bg text-terminal-green">
        <div className="text-center">
          <div className="animate-blink mb-2">Connecting to Neural Brew Network...</div>
          <div className="text-xs text-terminal-dark-green">Establishing real-time connection</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
  <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-center">
          <div className="mb-2 text-terminal-red">CONNECTION ERROR: {error}</div>
          <div className="text-xs text-terminal-dark-green">Falling back to local storage...</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 terminal-border bg-terminal-bg text-terminal-green hover:text-terminal-yellow"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex flex-col crt-screen terminal-glow relative bg-terminal-bg text-terminal-green">
      {/* Header with ASCII Art */}
      <header className="terminal-border p-2 md:p-4 bg-terminal-bg">
        <div className="hidden md:block ascii-art text-xs text-center font-mono leading-none">
{` ███▄    █ ▓█████  █    ██  ██▀███   ▄▄▄       ██▓        ▄▄▄▄    ██▀███  ▓█████  █     █░
 ██ ▀█   █ ▓█   ▀  ██  ▓██▒▓██ ▒ ██▒▒████▄    ▓██▒       ▓█████▄ ▓██ ▒ ██▒▓█   ▀ ▓█░ █ ░█░
▓██  ▀█ ██▒▒███   ▓██  ▒██░▓██ ░▄█ ▒▒██  ▀█▄  ▒██░       ▒██▒ ▄██▓██ ░▄█ ▒▒███   ▒█░ █ ░█ 
▓██▒  ▐▌██▒▒▓█  ▄ ▓▓█  ░██░▒██▀▀█▄  ░██▄▄▄▄██ ▒██░       ▒██░█▀  ▒██▀▀█▄  ▒▓█  ▄ ░█░ █ ░█ 
▒██░   ▓██░░▒████▒▒▒█████▓ ░██▓ ▒██▒ ▓█   ▓██▒░██████▒   ░▓█  ▀█▓░██▓ ▒██▒░▒████▒░░██▒██▓ 
░ ▒░   ▒ ▒ ░░ ▒░ ░░▒▓▒ ▒ ▒ ░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░ ▒░▓  ░   ░▒▓███▀▒░ ▒▓ ░▒▓░░░ ▒░ ░░ ▓░▒ ▒  
░ ░░   ░ ▒░ ░ ░  ░░░▒░ ░ ░   ░▒ ░ ▒░  ▒   ▒▒ ░░ ░ ▒  ░   ▒░▒   ░   ░▒ ░ ▒░ ░ ░  ░  ▒ ░ ░  
   ░   ░ ░    ░    ░░░ ░ ░   ░░   ░   ░   ▒     ░ ░       ░    ░   ░░   ░    ░     ░   ░  
         ░    ░  ░   ░        ░           ░  ░    ░  ░    ░         ░        ░  ░    ░    
                                                               ░                           `}
        </div>
        <div className="md:hidden flex justify-between items-center text-[10px] leading-tight tracking-tight mt-1">
          <span className="font-bold text-terminal-yellow">NEURAL BREW</span>
          <span className="text-terminal-green">{username.toUpperCase()}</span>
          <span className="text-terminal-dark-green">{formatTime().split(' - ')[1]}</span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs">
          <span>GLITCH CAFÉ NEURAL INTERFACE</span>
          <span>USER: {username.toUpperCase()}</span>
          <span>{formatTime()}</span>
        </div>
      </header>

      {/* Status Bar */}
      <div className="terminal-border border-t-0 px-4 py-2 bg-terminal-bg text-xs flex justify-between">
        <div className="flex space-x-4">
          <span className="text-terminal-yellow">●</span> <span>BREW_BOT ONLINE</span>
          <span className="text-terminal-green">●</span> <span>FIREBASE SYNC</span>
          <span className="text-terminal-green">●</span> <span>AI_BARISTA READY</span>
        </div>
        <div className="flex space-x-4">
          <span>MESSAGES: <span>{messages.length}</span></span>
          <span>UPTIME: <span>∞</span></span>
        </div>
      </div>

      {/* Chat Area */}
      <main className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="terminal-border bg-terminal-bg p-4 flex-1 flex flex-col">
          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scroll-container mb-4 space-y-2"
          >
            {/* System Welcome Message */}
            <div className="text-terminal-yellow text-xs">
              <span className="text-terminal-dark-green">[SYS]</span> Welcome to Neural Brew Terminal. Type /help for commands.
            </div>
            
            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                currentUser={username}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="text-terminal-dark-green text-xs">
                <span className="animate-blink">Processing command</span>
                <span className="animate-blink" style={{ animationDelay: '0.5s' }}>.</span>
                <span className="animate-blink" style={{ animationDelay: '1s' }}>.</span>
                <span className="animate-blink" style={{ animationDelay: '1.5s' }}>.</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>

      {/* Footer Status */}
      <footer className="terminal-border border-t-0 px-4 py-2 bg-terminal-bg text-xs">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <span className="text-terminal-yellow">F1</span><span>Help</span>
            <span className="text-terminal-yellow">↑↓</span><span>History</span>
            <span className="text-terminal-yellow">TAB</span><span>Complete</span>
            <span className="text-terminal-yellow">ESC</span><span>Clear</span>
          </div>
          <div className="text-terminal-dark-green">
            Next auto-brew in: <span className="text-terminal-yellow">{formatCountdown()}</span>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40">
          <div className="terminal-border bg-terminal-bg p-6 max-w-2xl w-full mx-4">
            <div className="text-center mb-4">
              <div className="ascii-art text-xs font-mono leading-none">
{`╔═══════════════════════════════════════╗
║           NEURAL BREW HELP            ║
╚═══════════════════════════════════════╝`}
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div><span className="text-terminal-yellow">/recipe [ingredients]</span> - Generate AI recipe with specified ingredients</div>
              <div><span className="text-terminal-yellow">TEXT mode</span> - Regular chat messages</div>
              <div><span className="text-terminal-yellow">RECIPE mode</span> - Auto-format as recipe requests</div>
              <div><span className="text-terminal-yellow">/help</span> - Show this help menu</div>
              <div><span className="text-terminal-yellow">/exit</span> - Logout and return to authentication</div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-terminal-green text-xs text-terminal-dark-green">
              <div>• BREW_BOT generates new recipes every 60 seconds automatically</div>
              <div>• Use ▲/▼ arrows to vote on recipes</div>
              <div>• All messages sync in real-time via Firebase</div>
              <div>• Switch between TEXT and RECIPE modes with the buttons</div>
              <div>• Use UP/DOWN arrows for command history</div>
              <div>• Press TAB for command auto-completion</div>
            </div>
            
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowHelp(false)}
                className="text-terminal-yellow hover:text-terminal-green"
              >
                Press ESC or click to continue...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Line Effect */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-terminal-green opacity-30 animate-scan-line pointer-events-none"></div>
    </div>
  );
}