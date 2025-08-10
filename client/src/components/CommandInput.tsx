import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "../hooks/use-mobile";

interface CommandInputProps {
  onCommand: (command: string) => void;
}

export default function CommandInput({ onCommand }: CommandInputProps) {
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

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
    if (input.trim()) {
      const command = input.trim();
      
      // Add to history
      const newHistory = [...commandHistory, command];
      setCommandHistory(newHistory);
      saveCommandHistory(newHistory);
      
      // Reset history index
      setHistoryIndex(-1);
      
      // Execute command
      onCommand(command);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Auto-complete commands
      const commands = ['/recipe', '/help', '/clear', '/search', '/history', '/uptime', '/users', '/exit'];
      const matches = commands.filter(cmd => cmd.startsWith(input));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      }
    } else if (e.key === "Escape") {
      setInput("");
      setHistoryIndex(-1);
    }
  };

  return (
    <div className={`flex items-center bg-terminal-bg ${isMobile ? 'p-1' : 'p-2'}`}>
      <span className={`text-terminal-yellow mr-2 ${isMobile ? 'text-xs' : ''}`}>
        {isMobile ? 'neural_brew$' : 'neural_brew@cafe:~$'}
      </span>
      <form onSubmit={handleSubmit} className="flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`bg-terminal-bg border-none outline-none text-terminal-green font-mono flex-1 ${isMobile ? 'text-xs' : ''}`}
          placeholder={isMobile ? "Type command..." : "Type message or /recipe [ingredients]..."}
          autoFocus
        />
      </form>
      <div className={`text-terminal-dark-green ${isMobile ? 'text-xs ml-1' : 'text-xs ml-2'}`}>
        <span className="animate-blink">█</span>
      </div>
    </div>
  );
}
