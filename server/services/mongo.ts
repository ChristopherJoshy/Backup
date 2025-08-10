import { MongoClient, Collection, Db, ObjectId } from 'mongodb';

// Mongo document interfaces mirroring previous Firebase types
export interface MongoMessage {
  _id?: ObjectId; // ObjectId
  username: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: number;
  votes: number;
  recipeId?: string;
  isCommand: boolean;
}

export interface MongoRecipe {
  _id?: ObjectId; // ObjectId
  name: string;
  ingredients: string[];
  effects: string[];
  instructions: string;
  createdBy: string;
  messageId?: string;
  votes: number;
  timestamp: number;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let messagesCol: Collection<MongoMessage> | null = null;
let recipesCol: Collection<MongoRecipe> | null = null;
let votesCol: Collection<{ _id?: ObjectId; messageId: string; username: string; voteType: 'up' | 'down'; timestamp: number; }> | null = null;

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || '';
const MONGO_DB_NAME = process.env.MONGODB_DB || 'Terminal';

export const mongoEnabled = !!MONGO_URI;

export async function initMongo() {
  if (!mongoEnabled || db) return; // Already init or disabled
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(MONGO_DB_NAME);
  messagesCol = db.collection<MongoMessage>('Chat');
    recipesCol = db.collection<MongoRecipe>('recipes');
    votesCol = db.collection('votes');
    // Indexes for performance
    await Promise.all([
      messagesCol.createIndex({ timestamp: -1 }),
      messagesCol.createIndex({ votes: -1 }),
      recipesCol.createIndex({ timestamp: -1 }),
      votesCol.createIndex({ messageId: 1, username: 1 }, { unique: true })
    ]);
    console.log('🟢 MongoDB connected');
  } catch (err) {
    console.error('🔴 MongoDB connection failed:', err);
  }
}

export class MongoService {
  private ensure() {
    if (!mongoEnabled || !messagesCol || !recipesCol || !votesCol) {
      throw new Error('MongoDB not available');
    }
  }

  async addMessage(message: Omit<MongoMessage, '_id' | 'timestamp' | 'votes'>): Promise<string> {
    this.ensure();
    const doc: MongoMessage = { ...message, timestamp: Date.now(), votes: 0 };
    const res = await messagesCol!.insertOne(doc);
    return res.insertedId.toString();
  }

  async addRecipe(recipe: Omit<MongoRecipe, '_id' | 'timestamp' | 'votes'>): Promise<string> {
    this.ensure();
    const doc: MongoRecipe = { ...recipe, timestamp: Date.now(), votes: 0 };
    const res = await recipesCol!.insertOne(doc);
    return res.insertedId.toString();
  }

  async getRecentMessages(limit: number = 50) {
    this.ensure();
    const docs = await messagesCol!
      .find({}, { sort: { timestamp: -1 }, limit })
      .toArray();
    // Map _id to id for client compatibility
  return docs.map((d: MongoMessage) => ({ id: d._id!.toString(), username: d.username, content: d.content, type: d.type, timestamp: d.timestamp, votes: d.votes, recipeId: d.recipeId, isCommand: d.isCommand }));
  }

  async voteOnMessage(messageId: string, username: string, voteType: 'up' | 'down') {
    this.ensure();
    const session = client!.startSession();
    try {
      await session.withTransaction(async () => {
        const voteKeyFilter = { messageId, username };
        const existingVote = await votesCol!.findOne(voteKeyFilter, { session });
        const objectId = new ObjectId(messageId);
        const message = await messagesCol!.findOne({ _id: objectId }, { session });
        if (!message) throw new Error('Message not found');
        let voteDelta = 0;
        if (existingVote) {
          if (existingVote.voteType === voteType) {
            // remove vote
            await votesCol!.deleteOne(voteKeyFilter, { session });
            voteDelta = voteType === 'up' ? -1 : 1;
          } else {
            await votesCol!.updateOne(voteKeyFilter, { $set: { voteType, timestamp: Date.now() } }, { session });
            voteDelta = voteType === 'up' ? 2 : -2;
          }
        } else {
          await votesCol!.insertOne({ messageId, username, voteType, timestamp: Date.now() }, { session });
          voteDelta = voteType === 'up' ? 1 : -1;
        }
        await messagesCol!.updateOne({ _id: objectId }, { $inc: { votes: voteDelta } }, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}

export const mongoService = new MongoService();

// Kick off connection eagerly
initMongo();
