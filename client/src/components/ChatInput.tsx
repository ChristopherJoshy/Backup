import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, isRecipe: boolean) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [chatMode, setChatMode] = useState<'text' | 'recipe'>('text');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load command history from localStorage
    const stored = localStorage.getItem('neural_brew_history');
    if (stored) {
      try {
        setCommandHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load command history:', error);
      }
    }
  }, []);

  const saveCommandHistory = (history: string[]) => {
    try {
      localStorage.setItem('neural_brew_history', JSON.stringify(history.slice(-50))); // Keep last 50 commands
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    // Add to history
    const newHistory = [...commandHistory, trimmedMessage];
    setCommandHistory(newHistory);
    saveCommandHistory(newHistory);
    
    // Reset history index
    setHistoryIndex(-1);

    // Send message
    const isRecipeMessage = chatMode === 'recipe' || trimmedMessage.startsWith('/recipe');
    onSendMessage(trimmedMessage, isRecipeMessage);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setMessage(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setMessage("");
        } else {
          setHistoryIndex(newIndex);
          setMessage(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Auto-complete commands
      const commands = ['/recipe', '/help', '/clear', '/exit'];
      const matches = commands.filter(cmd => cmd.startsWith(message));
      if (matches.length === 1) {
        setMessage(matches[0] + ' ');
      }
    } else if (e.key === "Escape") {
      setMessage("");
      setHistoryIndex(-1);
    }
  };

  const getPlaceholder = () => {
    if (chatMode === 'recipe') {
      return "Enter ingredients for AI recipe generation...";
    }
    return "Type message or /recipe [ingredients]...";
  };

  const getPrompt = () => {
    if (chatMode === 'recipe') {
      return "recipe_gen@neural:~$";
    }
    return "neural_brew@cafe:~$";
  };

  return (
    <div className="terminal-border border-t bg-terminal-bg p-2">
      {/* Mode Switcher */}
      <div className="flex items-center mb-2 text-xs">
        <span className="text-terminal-dark-green mr-2">MODE:</span>
        <button
          onClick={() => setChatMode('text')}
          className={`mr-3 px-2 py-1 rounded ${
            chatMode === 'text' 
              ? 'bg-terminal-green text-terminal-bg' 
              : 'text-terminal-green hover:text-terminal-yellow'
          }`}
        >
          TEXT
        </button>
        <button
          onClick={() => setChatMode('recipe')}
          className={`px-2 py-1 rounded ${
            chatMode === 'recipe' 
              ? 'bg-terminal-yellow text-terminal-bg' 
              : 'text-terminal-yellow hover:text-terminal-green'
          }`}
        >
          RECIPE
        </button>
        <span className="ml-4 text-terminal-dark-green text-xs">
          {chatMode === 'recipe' ? 'Recipe generation mode' : 'Regular chat mode'}
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-terminal-yellow mr-2">{getPrompt()}</span>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-terminal-green font-mono flex-1"
          placeholder={getPlaceholder()}
          disabled={isLoading}
          autoFocus
        />
        {isLoading ? (
          <span className="text-terminal-dark-green text-xs ml-2">PROCESSING...</span>
        ) : (
          <span className="animate-blink ml-1">_</span>
        )}
      </form>
    </div>
  );
}