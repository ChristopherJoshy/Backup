import { type Message, type InsertMessage, type Recipe, type InsertRecipe, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Messages
  getMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageVotes(id: string, upvotes: number, downvotes: number): Promise<Message | undefined>;
  
  // Recipes
  getRecipes(limit?: number): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipeVotes(id: string, upvotes: number, downvotes: number): Promise<Recipe | undefined>;
  
  // Users
  getUser(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(username: string, isOnline: boolean): Promise<User | undefined>;
  getOnlineUsers(): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private messages: Map<string, Message>;
  private recipes: Map<string, Recipe>;
  private users: Map<string, User>;

  constructor() {
    this.messages = new Map();
    this.recipes = new Map();
    this.users = new Map();
  }

  async getMessages(limit = 50): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values());
    return allMessages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageVotes(id: string, upvotes: number, downvotes: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      message.upvotes = upvotes;
      message.downvotes = downvotes;
      this.messages.set(id, message);
      return message;
    }
    return undefined;
  }

  async getRecipes(limit = 20): Promise<Recipe[]> {
    const allRecipes = Array.from(this.recipes.values());
    return allRecipes
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = {
      ...insertRecipe,
      id,
      timestamp: new Date(),
      upvotes: 0,
      downvotes: 0,
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async updateRecipeVotes(id: string, upvotes: number, downvotes: number): Promise<Recipe | undefined> {
    const recipe = this.recipes.get(id);
    if (recipe) {
      recipe.upvotes = upvotes;
      recipe.downvotes = downvotes;
      this.recipes.set(id, recipe);
      return recipe;
    }
    return undefined;
  }

  async getUser(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      lastSeen: new Date(),
      isOnline: true,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(username: string, isOnline: boolean): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(user.id, user);
      return user;
    }
    return undefined;
  }

  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }
}

export const storage = new MemStorage();
