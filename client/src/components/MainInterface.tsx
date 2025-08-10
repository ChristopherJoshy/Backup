import { useState, useEffect } from "react";
import { type Message, type Recipe } from "@shared/schema";
import { useIsMobile } from "../hooks/use-mobile";
import ChatContainer from "./ChatContainer";
import CommandInput from "./CommandInput";
import HelpModal from "./HelpModal";

interface MainInterfaceProps {
  username: string;
  onLogout: () => void;
}

export default function MainInterface({ username, onLogout }: MainInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(60);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Load initial messages
    loadMessages();
    
    // Update time and countdown every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setCountdown(60 - new Date().getSeconds());
    }, 1000);

    // Auto-generate bot recipes every 60 seconds
    const botInterval = setInterval(() => {
      generateAutoRecipe();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(botInterval);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const generateAutoRecipe = async () => {
    try {
      const response = await fetch('/api/recipes/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const recipe: Recipe = await response.json();
        const recipeMessage = formatRecipeMessage(recipe);
        
        // Add bot message
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: '[BREW_BOT]',
            content: recipeMessage,
            messageType: 'bot',
            recipeId: recipe.id,
          }),
        });

        if (messageResponse.ok) {
          const newMessage = await messageResponse.json();
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to generate auto recipe:', error);
    }
  };

  const formatRecipeMessage = (recipe: Recipe) => {
    return `
<div class="recipe-card border border-terminal-yellow p-3 my-2 bg-terminal-bg">
  <div class="text-terminal-yellow font-bold ${isMobile ? 'text-base' : 'text-lg'} mb-2">${recipe.name}</div>
  
  <div class="grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-4">
    <div>
      <div class="text-terminal-green font-semibold mb-1">INGREDIENTS:</div>
      <ul class="text-sm space-y-1">
        ${recipe.ingredients.map(ing => `<li class="text-terminal-green">→ ${ing}</li>`).join('')}
      </ul>
    </div>
    
    <div>
      <div class="text-terminal-green font-semibold mb-1">EFFECTS:</div>
      <ul class="text-sm space-y-1">
        ${recipe.effects.map(effect => `<li class="text-terminal-yellow">⚡ ${effect}</li>`).join('')}
      </ul>
    </div>
  </div>
  
  <div class="mt-3">
    <div class="text-terminal-green font-semibold mb-1">PREPARATION:</div>
    <div class="text-sm text-terminal-green whitespace-pre-line break-words">${recipe.instructions}</div>
  </div>
  
  <div class="mt-3 flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'} text-xs">
    <div class="text-terminal-dark-green">
      Created by: ${recipe.createdBy} | ${new Date(recipe.timestamp).toLocaleTimeString()}
    </div>
    <div class="text-terminal-yellow">
      Votes: ${recipe.votes || 0}
    </div>
  </div>
</div>`;
  };  const handleCommand = async (command: string) => {
    // Add user message
    const userMessage = {
      username,
      content: command,
      type: 'user' as const,
      recipeId: null,
    };

    const messageResponse = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMessage),
    });

    if (messageResponse.ok) {
      const newMessage = await messageResponse.json();
      setMessages(prev => [...prev, newMessage]);
    }

    // Handle commands
    if (command.startsWith('/recipe ')) {
      const ingredients = command.substring(8);
      await handleRecipeGeneration(ingredients);
    } else if (command === '/help') {
      setShowHelp(true);
    } else if (command === '/clear') {
      setMessages([]);
    } else if (command === '/exit') {
      onLogout();
    }
  };

  const handleRecipeGeneration = async (ingredients: string) => {
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, username }),
      });

      if (response.ok) {
        const recipe: Recipe = await response.json();
        const recipeMessage = formatRecipeMessage(recipe);
        
        // Add AI response message
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: '[AI_BARISTA]',
            content: recipeMessage,
            type: 'bot',
            recipeId: recipe.id,
          }),
        });

        if (messageResponse.ok) {
          const newMessage = await messageResponse.json();
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to generate recipe:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toISOString().substr(0, 10) + ' - ' + date.toTimeString().substr(0, 8);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
  <div className="min-h-screen flex flex-col crt-screen terminal-glow relative">
      {/* Header */}
      <header className="terminal-border px-2 py-2 md:p-4 bg-terminal-bg flex-shrink-0">
        {/* Large ASCII hidden on small screens for better mobile performance */}
        <div className="hidden md:block">
          <div className="ascii-art text-center text-xs">
            <pre>{` ███▄    █ ▓█████  █    ██  ██▀███   ▄▄▄       ██▓        ▄▄▄▄    
 ██ ▀█   █ ▓█   ▀  ██  ▓██▒▓██ ▒ ██▒▒████▄    ▓██▒       ▓█████▄ ▓██ ▒ ██▒▓█   ▀ ▓█░ █ ░█░
▓██  ▀█ ██▒▒███   ▓██  ▒██░▓██ ░▄█ ▒▒██  ▀█▄  ▒██░       ▒██▒ ▄██▓██ ░▄█ ▒▒███   ▒█░ █ ░█ 
▓██▒  ▐▌██▒▒▓█  ▄ ▓▓█  ░██░▒██▀▀█▄  ░██▄▄▄▄██ ▒██░       ▒██░█▀  ▒██▀▀█▄  ▒▓█  ▄ ░█░ █ ░█ 
▒██░   ▓██░░▒████▒▒▒█████▓ ░██▓ ▒██▒ ▓█   ▓██▒░██████▒   ░▓█  ▀█▓░██▓ ▒██▒░▒████▒░░██▒██▓ 
░ ▒░   ▒ ▒ ░░ ▒░ ░░▒▓▒ ▒ ▒ ░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░ ▒░▓  ░   ░▒▓███▀▒░ ▒▓ ░▒▓░░░ ▒░ ░░ ▓░▒ ▒  
░ ░░   ░ ▒░ ░ ░  ░░░▒░ ░ ░   ░▒ ░ ▒░  ▒   ▒▒ ░░ ░ ▒  ░   ▒░▒   ░   ░▒ ░ ▒░ ░ ░  ░  ▒ ░ ░  
   ░   ░ ░    ░    ░░░ ░ ░   ░░   ░   ░   ▒     ░ ░       ░    ░   ░░   ░    ░     ░   ░  
         ░    ░  ░   ░        ░           ░  ░    ░  ░    ░         ░        ░  ░    ░    
                                                               ░                           `}</pre>
          </div>
        </div>
        {/* Compact mobile header */}
        <div className="md:hidden flex justify-between items-center text-[10px] leading-tight tracking-tight">
          <span className="font-bold text-terminal-yellow">NEURAL BREW</span>
          <span className="text-terminal-green">{username.toUpperCase()}</span>
          <span className="text-terminal-dark-green">{formatTime(currentTime).split(' - ')[1]}</span>
        </div>
        <div className={`flex ${isMobile ? 'flex-col space-y-1 mt-1' : 'justify-between items-center mt-2'} text-xs`}>
          <span className={isMobile ? 'text-center' : ''}>GLITCH CAFÉ NEURAL INTERFACE</span>
          <span className={isMobile ? 'text-center' : ''}>USER: {username.toUpperCase()}</span>
          <span className={isMobile ? 'text-center' : ''}>{formatTime(currentTime)}</span>
        </div>
      </header>

      {/* Status Bar */}
      <div className={`terminal-border border-t-0 px-2 md:px-4 py-2 bg-terminal-bg text-xs flex-shrink-0 ${isMobile ? 'overflow-x-auto' : 'flex justify-between'}`}>
        <div className={`flex ${isMobile ? 'space-x-2 mb-1' : 'space-x-4'}`}>
          <span><span className="text-terminal-yellow">●</span> BREW_BOT ONLINE</span>
          <span><span className="text-terminal-green">●</span> FIREBASE SYNC</span>
          {!isMobile && <span><span className="text-terminal-green">●</span> AI_BARISTA READY</span>}
        </div>
        <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
          <span>USERS: 1</span>
          <span>RECIPES: {messages.filter(m => m.type === 'bot').length}</span>
          {!isMobile && <span>UPTIME: 72:14:07</span>}
        </div>
      </div>

      {/* Chat Area - Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
  <div className={`flex-1 flex flex-col terminal-border border-t-0 bg-terminal-bg ${isMobile ? 'm-1 mt-0' : 'm-4 mt-0'} min-h-0`}> 
          {/* Scrollable Messages Area */}
          <div className="flex-1 min-h-0"> 
            <div className={`scroll-container flex-1 ${isMobile ? 'p-2' : 'p-4'}`}> 
              <ChatContainer messages={messages} />
            </div>
          </div>
          
          {/* Fixed Input Area - This stays at bottom */}
          <div className="flex-shrink-0 border-t border-terminal-green pb-safe">
            <CommandInput onCommand={handleCommand} />
          </div>
        </div>
      </div>

      {/* Footer */}
  <footer className={`terminal-border border-t-0 px-2 md:px-4 py-2 bg-terminal-bg text-xs ${isMobile ? 'overflow-x-auto pb-safe' : ''}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'justify-between'}`}>
          <div className={`flex ${isMobile ? 'space-x-2 justify-center' : 'space-x-4'}`}>
            <span><span className="text-terminal-yellow">F1</span> Help</span>
            {!isMobile && <span><span className="text-terminal-yellow">F2</span> History</span>}
            <span><span className="text-terminal-yellow">F3</span> Search</span>
            <span><span className="text-terminal-yellow">ESC</span> Clear</span>
          </div>
          <div className={`text-terminal-dark-green ${isMobile ? 'text-center' : ''}`}>
            Next auto-brew in: <span className="text-terminal-yellow">{formatCountdown(countdown)}</span>
          </div>
        </div>
      </footer>

      {/* Scan Line Effect */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-terminal-green opacity-30 animate-scan-line pointer-events-none"></div>

  {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
