import { useEffect, useRef, useState } from "react";
import { type Message } from "@shared/schema";
import { useIsMobile } from "../hooks/use-mobile";

interface ChatContainerProps {
  messages: Message[];
}

export default function ChatContainer({ messages }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
      if (containerRef.current) {
        // Find the scroll container (parent)
        const scrollContainer = containerRef.current.closest('.scroll-container');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };
    
    // Small delay to ensure DOM updates
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBorderColor = (messageType: string) => {
    switch (messageType) {
      case 'bot': return 'border-terminal-yellow';
      case 'system': return 'border-terminal-red';
      default: return 'border-terminal-green';
    }
  };

  const getUserColor = (messageType: string) => {
    switch (messageType) {
      case 'bot': return 'text-terminal-yellow';
      case 'system': return 'text-terminal-red';
      default: return 'text-terminal-green';
    }
  };

  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const handleCopy = (raw: string, id: string | number) => {
    try {
      // Convert potential HTML to plain text for cleaner copy
      const el = document.createElement('div');
      el.innerHTML = raw;
      const text = el.innerText.trim();
      navigator.clipboard.writeText(text || raw);
      setCopiedId(id);
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* System Welcome Message */}
      <div className={`text-terminal-yellow ${isMobile ? 'text-xs' : 'text-xs'}`}>
        <span className="text-terminal-dark-green">[SYS]</span> Welcome to Neural Brew Terminal. Type /help for commands.
      </div>

      {messages.map((message, index) => {
        const key = message.id || index;
        const isRecipe = message.content.includes('recipe-card');
        const isCommand = !isRecipe && message.content.trim().startsWith('/') && !message.content.startsWith('<');
        const typeBadge = message.type === 'bot' ? 'BOT' : message.type === 'system' ? 'SYS' : undefined;
        return (
          <div
            key={key}
            className={`group relative message-container border-l-2 ${getBorderColor(message.type)} ${isMobile ? 'text-[11px]' : 'text-xs'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center flex-wrap gap-1 min-w-0">
                {typeBadge && (
                  <span className={`message-badge ${typeBadge === 'BOT' ? 'badge-bot' : 'badge-sys'}`}>{typeBadge}</span>
                )}
                {isCommand && (
                  <span className="message-badge badge-cmd">CMD</span>
                )}
                <span className={`font-semibold truncate ${getUserColor(message.type)}`}>{message.username}</span>
                <span className="text-terminal-dark-green opacity-60">• {formatTimestamp(message.timestamp)}</span>
              </div>
              <button
                onClick={() => handleCopy(message.content, key)}
                className="ml-auto px-1 py-0.5 text-[10px] border border-terminal-green text-terminal-green hover:text-terminal-yellow hover:border-terminal-yellow transition rounded-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                aria-label="Copy message"
              >
                {copiedId === key ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div
              className={`mt-1 leading-relaxed break-words ${isRecipe ? 'recipe-wrapper' : ''} ${isCommand ? 'text-terminal-yellow' : ''}`}
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        );
      })}

      {messages.length === 0 && (
        <div className={`text-terminal-dark-green text-center py-8 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <div className="animate-blink">Awaiting neural transmissions...</div>
        </div>
      )}
    </div>
  );
}
