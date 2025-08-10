// In-memory storage service as fallback for MongoDB

interface MemoryMessage {
  id: string;
  username: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: number;
  votes: number;
  recipeId?: string;
  isCommand: boolean;
}

interface MemoryRecipe {
  id: string;
  name: string;
  ingredients: string[];
  effects: string[];
  instructions: string;
  createdBy: string;
  messageId?: string;
  votes: number;
  timestamp: number;
}

class MemoryStorageService {
  private messages: MemoryMessage[] = [];
  private recipes: MemoryRecipe[] = [];
  private votes: Map<string, any> = new Map();

  async addMessage(message: Omit<MemoryMessage, 'id' | 'timestamp' | 'votes'>): Promise<string> {
    const id = Math.random().toString(36).substr(2, 9);
    const messageData: MemoryMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      votes: 0,
    };

    this.messages.push(messageData);
    return id;
  }

  async addRecipe(recipe: Omit<MemoryRecipe, 'id' | 'timestamp' | 'votes'>): Promise<string> {
    const id = Math.random().toString(36).substr(2, 9);
    const recipeData: MemoryRecipe = {
      ...recipe,
      id,
      timestamp: Date.now(),
      votes: 0,
    };

    this.recipes.push(recipeData);
    return id;
  }

  async getRecentMessages(limit: number = 50): Promise<MemoryMessage[]> {
    return this.messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .reverse(); // Return in chronological order
  }

  async voteOnMessage(messageId: string, username: string, voteType: 'up' | 'down'): Promise<void> {
    const voteKey = `${messageId}_${username}`;
    const existingVote = this.votes.get(voteKey);
    const message = this.messages.find(m => m.id === messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote
        this.votes.delete(voteKey);
        message.votes += voteType === 'up' ? -1 : 1;
      } else {
        // Change vote
        this.votes.set(voteKey, { voteType, timestamp: Date.now() });
        message.votes += voteType === 'up' ? 2 : -2;
      }
    } else {
      // New vote
      this.votes.set(voteKey, { voteType, timestamp: Date.now() });
      message.votes += voteType === 'up' ? 1 : -1;
    }
  }

  async clearAll(): Promise<void> {
    this.messages = [];
    this.recipes = [];
    this.votes.clear();
  }
}

export const memoryStorage = new MemoryStorageService();