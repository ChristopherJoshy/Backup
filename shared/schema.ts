import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("user"), // 'user', 'bot', 'system'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  votes: integer("votes").default(0),
  recipeId: text("recipe_id"),
  isCommand: boolean("is_command").default(false),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  effects: text("effects").array().notNull(),
  instructions: text("instructions").notNull(),
  createdBy: text("created_by").notNull(), // 'bot', 'ai', or username
  messageId: text("message_id"),
  votes: integer("votes").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  messageId: text("message_id").notNull(),
  recipeId: text("recipe_id"),
  voteType: text("vote_type").notNull(), // 'up' or 'down'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  timestamp: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
