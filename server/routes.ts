import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoService } from './services/mongo';
import { memoryStorage } from "./services/storage";
import { geminiService } from "./services/gemini";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate recipe (explicit endpoint used by some client code)
  app.post('/api/recipes/generate', async (req, res) => {
    try {
      const { ingredients, username } = req.body as { ingredients?: string; username?: string };
      const recipe = await geminiService.generateRecipe(ingredients);
      let recipeId;
      try {
        recipeId = await mongoService.addRecipe({ ...recipe, createdBy: 'AI_BARISTA' });
      } catch {
        recipeId = await memoryStorage.addRecipe({ ...recipe, createdBy: 'AI_BARISTA' });
      }
      // Store an associated message (optional) for consistency
      let messageId;
      const recipeContent = formatRecipeMessage(recipe);
      try {
        messageId = await mongoService.addMessage({ username: '[AI_BARISTA]', content: recipeContent, type: 'bot', recipeId, isCommand: false });
      } catch {
        messageId = await memoryStorage.addMessage({ username: '[AI_BARISTA]', content: recipeContent, type: 'bot', recipeId, isCommand: false });
      }
      res.json({ id: recipeId, messageId, ...recipe, createdBy: 'AI_BARISTA', timestamp: Date.now(), votes: 0 });
    } catch (e) {
      console.error('Error generating recipe via endpoint:', e);
      res.status(500).json({ error: 'Failed to generate recipe' });
    }
  });

  // Removed: auto-generate recipe endpoint per request
  // Welcome endpoint: emits a system message when a user connects (new vs returning)
  app.post('/api/welcome', async (req, res) => {
    const { username } = req.body as { username?: string };
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username required' });
    const clean = username.trim();
    let hasHistory = false;
    try {
      hasHistory = await mongoService.userHasHistory(clean);
    } catch {
      hasHistory = await memoryStorage.userHasHistory(clean);
    }
    const content = hasHistory
      ? `[SYSTEM] Welcome back, ${clean}! Your workstation context has been restored.`
      : `[SYSTEM] New user ${clean} connected. Initializing environment...`;
    try {
      try {
        await mongoService.addMessage({ username: '[SYSTEM]', content, type: 'system', isCommand: false });
      } catch {
        await memoryStorage.addMessage({ username: '[SYSTEM]', content, type: 'system', isCommand: false });
      }
    } catch (e) {
      return res.status(500).json({ error: 'Failed to log welcome message' });
    }
    res.json({ welcomed: true, returning: hasHistory });
  });
  // Get recent messages
  app.get("/api/messages", async (req, res) => {
    try {
      let messages;
      try {
        messages = await mongoService.getRecentMessages(100);
      } catch (err) {
        messages = await memoryStorage.getRecentMessages(100);
      }
      res.json(messages); // Messages already sorted by timestamp
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Clear all messages & recipes
  app.post('/api/messages/clear', async (_req, res) => {
    try {
      try { await mongoService.clearAll(); } catch { await memoryStorage.clearAll(); }
      res.json({ cleared: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to clear messages' });
    }
  });

  // Send a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);

      // /clear command (case-insensitive): wipe messages/recipes
      const normalizedContent = messageData.content.trim().toLowerCase();
      if (normalizedContent === '/clear') {
        try {
          try { await mongoService.clearAll(); } catch { await memoryStorage.clearAll(); }
          return res.json({ cleared: true });
        } catch (e) {
          return res.status(500).json({ error: 'Failed to clear messages' });
        }
      }
      
      // Check if it's a recipe command (case-insensitive)
      if (normalizedContent.startsWith('/recipe ')) {
        const ingredients = messageData.content.substring(8).trim();
        
        // Add the user's command message
        let commandMessageId;
          try {
            commandMessageId = await mongoService.addMessage({
              username: messageData.username,
              content: messageData.content,
              type: 'user',
              isCommand: true
            });
          } catch (e) {
            commandMessageId = await memoryStorage.addMessage({
              username: messageData.username,
              content: messageData.content,
              type: 'user',
              isCommand: true
            });
          }
        // Generate AI recipe
        try {
          const recipe = await geminiService.generateRecipe(ingredients);
          let recipeId;
            try {
              recipeId = await mongoService.addRecipe({
                ...recipe,
                createdBy: 'AI_BARISTA'
              });
            } catch (e) {
              recipeId = await memoryStorage.addRecipe({
                ...recipe,
                createdBy: 'AI_BARISTA'
              });
            }
          // Create formatted recipe message
          const recipeContent = formatRecipeMessage(recipe);
          let recipeMessageId;
          try {
            recipeMessageId = await mongoService.addMessage({
              username: '[AI_BARISTA]',
              content: recipeContent,
              type: 'bot',
              recipeId,
              isCommand: false
            });
          } catch (e) {
            recipeMessageId = await memoryStorage.addMessage({
              username: '[AI_BARISTA]',
              content: recipeContent,
              type: 'bot',
              recipeId,
              isCommand: false
            });
          }

          res.json({ 
            commandMessageId, 
            recipeMessageId, 
            recipeId,
            recipe 
          });
        } catch (error) {
          console.error('Recipe generation failed:', error);
          await memoryStorage.addMessage({
            username: '[SYSTEM]',
            content: 'Error: Recipe generation failed. Please try again.',
            type: 'system',
            isCommand: false
          });
          res.status(500).json({ error: "Recipe generation failed" });
        }
      } else {
        // Regular message
        let messageId;
          try {
            messageId = await mongoService.addMessage({
              username: messageData.username,
              content: messageData.content,
              type: (messageData.type as 'user' | 'bot' | 'system') || 'user',
              isCommand: messageData.isCommand || false
            });
          } catch (e) {
            messageId = await memoryStorage.addMessage({
              username: messageData.username,
              content: messageData.content,
              type: (messageData.type as 'user' | 'bot' | 'system') || 'user',
              isCommand: messageData.isCommand || false
            });
          }
        res.json({ messageId });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Vote on a message
  app.post("/api/messages/:messageId/vote", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { username, voteType } = req.body;

      if (!username || !['up', 'down'].includes(voteType)) {
        return res.status(400).json({ error: "Invalid vote data" });
      }

      try {
        await mongoService.voteOnMessage(messageId, username, voteType);
      } catch (e) {
        await memoryStorage.voteOnMessage(messageId, username, voteType);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error voting:', error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Removed: legacy auto recipe endpoint

  const httpServer = createServer(app);

  // Auto-brewing interval removed per request (was every 60s) – full feature disabled

  return httpServer;
}

function formatRecipeMessage(recipe: any): string {
  const ingredientsList = recipe.ingredients
    .map((ing: string, idx: number) => `${idx === recipe.ingredients.length - 1 ? '└' : '├'} ${ing}`)
    .join('\n');

  return `> ${recipe.name}
${ingredientsList}

Effects: ${recipe.effects.join(', ')}

Instructions: ${recipe.instructions}`;
}
