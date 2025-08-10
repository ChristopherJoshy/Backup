import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoService } from './services/mongo';
import { memoryStorage } from "./services/storage";
import { geminiService } from "./services/gemini";
import { insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Send a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Check if it's a recipe command
      if (messageData.content.startsWith('/recipe ')) {
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

  // Auto-generate recipe (for bot posting)
  app.post("/api/auto-recipe", async (req, res) => {
    try {
      const recipe = await geminiService.generateAutoRecipe();
      let recipeId;
      try {
        recipeId = await mongoService.addRecipe({
          ...recipe,
          createdBy: 'BREW_BOT'
        });
      } catch (e) {
        recipeId = await memoryStorage.addRecipe({
          ...recipe,
          createdBy: 'BREW_BOT'
        });
      }

      const recipeContent = `🤖 NEW AUTO-GENERATED RECIPE:\n${formatRecipeMessage(recipe)}`;
      let messageId;
      try {
        messageId = await mongoService.addMessage({
          username: '[BREW_BOT]',
          content: recipeContent,
          type: 'bot',
          recipeId,
          isCommand: false
        });
      } catch (e) {
        messageId = await memoryStorage.addMessage({
          username: '[BREW_BOT]',
          content: recipeContent,
          type: 'bot',
          recipeId,
          isCommand: false
        });
      }

      res.json({ messageId, recipeId, recipe });
    } catch (error) {
      console.error('Auto recipe generation failed:', error);
      res.status(500).json({ error: "Auto recipe generation failed" });
    }
  });

  const httpServer = createServer(app);

  // Start auto-brewing bot (every 60 seconds)
  setInterval(async () => {
    try {
  await fetch('http://localhost:5000/api/auto-recipe', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Auto-recipe generation failed:', error);
    }
  }, 60000);

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
