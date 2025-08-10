import { useEffect } from "react";
import { useIsMobile } from "../hooks/use-mobile";

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ANY key to match UI text and ensure ESC works everywhere
      e.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Neural Brew Help"
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40 overflow-y-auto p-4"
      onClick={handleOverlayClick}
      tabIndex={-1}
    >
      <div
        className={`terminal-border bg-terminal-bg ${isMobile ? 'p-3 mx-auto max-w-sm' : 'p-6 max-w-2xl mx-auto'} w-full max-h-[80vh] overflow-y-auto`}
        // Stop propagation no longer needed since any click closes; keep for future if logic changes
      >
        <div className="text-center mb-4">
          <div className={`ascii-art ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <pre>{`╔═══════════════════════════════════════╗
║           NEURAL BREW HELP            ║
╚═══════════════════════════════════════╝`}</pre>
          </div>
        </div>
        
        <div className={`space-y-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <div>
            <span className="text-terminal-yellow">/recipe [ingredients]</span> - Generate AI recipe with specified ingredients
          </div>
          <div>
            <span className="text-terminal-yellow">/search [term]</span> - Search chat history (grep-like functionality)
          </div>
          <div>
            <span className="text-terminal-yellow">/history</span> - Show command history
          </div>
          <div>
            <span className="text-terminal-yellow">/clear</span> - Clear terminal screen
          </div>
          <div>
            <span className="text-terminal-yellow">/uptime</span> - Show system status
          </div>
          <div>
            <span className="text-terminal-yellow">/users</span> - List active users
          </div>
          <div>
            <span className="text-terminal-yellow">/help</span> - Show this help menu
          </div>
          <div>
            <span className="text-terminal-yellow">/exit</span> - Logout and return to authentication
          </div>
        </div>
        
        <div className={`mt-4 pt-4 border-t border-terminal-green text-terminal-dark-green ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <div>• Generate recipes manually with /recipe [ingredients]</div>
          <div>• Use ▲/▼ arrows or click to vote on recipes</div>
          <div>• All messages sync in real-time via Firebase</div>
          {!isMobile && <div>• Use UP/DOWN arrows for command history</div>}
          {!isMobile && <div>• Press TAB for command auto-completion</div>}
          <div>• Press ESC to close this help menu</div>
        </div>
        
        <div className="text-center mt-4">
          <button
            onClick={onClose}
            autoFocus
            className={`text-terminal-yellow hover:text-terminal-green focus:outline-none underline-offset-4 ${isMobile ? 'text-sm' : ''}`}
          >
            {isMobile ? 'Tap anywhere / press any key to close' : 'Press any key or click anywhere to close'}
          </button>
        </div>
      </div>
    </div>
  );
}
