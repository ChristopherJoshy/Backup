import { useState } from 'react';
import { FirebaseMessage } from '../hooks/useFirebase';
import { apiRequest } from '../lib/queryClient';

interface ChatMessageProps {
  message: FirebaseMessage;
  currentUser: string;
}

export default function ChatMessage({ message, currentUser }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (voteType: 'up' | 'down') => {
    try {
      await apiRequest('POST', `/api/messages/${message.id}/vote`, {
        username: currentUser,
        voteType
      });
      setUserVote(userVote === voteType ? null : voteType);
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatUsername = (username: string) => {
    if (username.startsWith('[') && username.endsWith(']')) {
      return username; // Keep system usernames as-is
    }
    return username.toUpperCase();
  };

  const isSystemMessage = message.type === 'system';
  const isBotMessage = message.type === 'bot';
  const isRecipeMessage = message.content.includes('🤖 NEW AUTO-GENERATED RECIPE:') || 
                         message.content.includes('> ') || 
                         message.recipeId;

  const parseRecipeContent = (content: string) => {
    // Try to extract recipe data from the formatted content
    const lines = content.split('\n');
    const recipeName = lines.find(line => line.includes('>'))?.replace('>', '').trim();
    const ingredients = lines.filter(line => line.includes('├') || line.includes('└')).map(line => 
      line.replace(/[├└]\s*/, '').trim()
    );
    const effectsLine = lines.find(line => line.includes('Effects:'));
    const effects = effectsLine ? effectsLine.replace('Effects:', '').split(',').map(e => e.trim()) : [];
    const instructionsLine = lines.find(line => line.includes('Instructions:'));
    const instructions = instructionsLine ? instructionsLine.replace('Instructions:', '').trim() : '';
    
    return { recipeName, ingredients, effects, instructions };
  };

  const renderRecipeContent = () => {
    if (!isRecipeMessage) return null;

    const { recipeName, ingredients, effects, instructions } = parseRecipeContent(message.content);
    
    return (
      <div 
        className="bg-terminal-gray p-3 mt-2 rounded border border-terminal-green cursor-pointer hover:border-terminal-yellow transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-terminal-yellow font-bold text-sm">
              {recipeName || 'Neural Brew Recipe'}
            </div>
            
            {!isExpanded ? (
              <div className="text-xs mt-1 text-terminal-dark-green">
                {ingredients.slice(0, 2).join(', ')}{ingredients.length > 2 ? '...' : ''}
                <span className="ml-2 text-terminal-yellow">[Click to expand]</span>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-terminal-green text-xs font-semibold mb-1">INGREDIENTS:</div>
                  <div className="text-xs space-y-1">
                    {ingredients.map((ingredient, idx) => (
                      <div key={idx} className="text-terminal-dark-green">
                        {idx === ingredients.length - 1 ? '└' : '├'} {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
                
                {effects.length > 0 && (
                  <div>
                    <div className="text-terminal-green text-xs font-semibold mb-1">EFFECTS:</div>
                    <div className="text-xs text-terminal-dark-green">
                      {effects.join(' • ')}
                    </div>
                  </div>
                )}
                
                {instructions && (
                  <div>
                    <div className="text-terminal-green text-xs font-semibold mb-1">INSTRUCTIONS:</div>
                    <div className="text-xs text-terminal-dark-green">
                      {instructions}
                    </div>
                  </div>
                )}
                
                <div className="text-terminal-yellow text-xs mt-2">
                  [Click to collapse]
                </div>
              </div>
            )}
          </div>
          
          {/* Voting controls */}
          <div className="flex flex-col items-center ml-4 space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote('up');
              }}
              className={`text-xs ${userVote === 'up' ? 'text-terminal-yellow' : 'text-terminal-dark-green'} hover:text-terminal-green`}
            >
              ▲
            </button>
            <span className="text-xs text-terminal-green">{message.votes}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote('down');
              }}
              className={`text-xs ${userVote === 'down' ? 'text-terminal-red' : 'text-terminal-dark-green'} hover:text-terminal-red`}
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`text-xs ${isSystemMessage ? 'text-terminal-yellow' : ''}`}>
      {/* Message header */}
      <div className="flex items-start space-x-2">
        <span className="text-terminal-dark-green">[{formatTimestamp(message.timestamp)}]</span>
        <span className={`font-bold ${
          isSystemMessage ? 'text-terminal-yellow' : 
          isBotMessage ? 'text-terminal-green' : 
          'text-terminal-blue'
        }`}>
          {formatUsername(message.username)}:
        </span>
      </div>

      {/* Message content */}
      <div className="ml-6 mt-1">
        {isRecipeMessage ? (
          <>
            {message.content.includes('🤖 NEW AUTO-GENERATED RECIPE:') && (
              <div className="text-terminal-green mb-2">🤖 NEW AUTO-GENERATED RECIPE:</div>
            )}
            {renderRecipeContent()}
          </>
        ) : (
          <div className={`${
            isSystemMessage ? 'text-terminal-dark-green' : 
            isBotMessage ? 'text-terminal-green' : 
            'text-terminal-green'
          }`}>
            {message.content}
          </div>
        )}

        {/* Command indicator */}
        {message.isCommand && !isRecipeMessage && (
          <span className="text-terminal-yellow ml-2">[CMD]</span>
        )}
      </div>
    </div>
  );
}