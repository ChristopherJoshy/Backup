import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
  
  if (!projectId) {
    console.warn('🔥 Firebase project ID not found - using memory storage fallback');
    console.warn('💡 Add FIREBASE_PROJECT_ID to enable Firestore');
    firebaseInitialized = false;
  } else if (clientEmail && privateKey && privateKeyId) {
    try {
      // Initialize with individual service account fields
      initializeApp({
        projectId: projectId,
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        })
      });
      console.log('🔥 Firebase initialized successfully with service account');
      firebaseInitialized = true;
    } catch (error) {
      console.error('🔥 Firebase initialization failed:', error instanceof Error ? error.message : error);
      console.warn('⚡ Using memory storage instead');
      firebaseInitialized = false;
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Fallback to old JSON method for backward compatibility
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        projectId: serviceAccount.project_id || projectId,
        credential: cert(serviceAccount)
      });
      console.log('🔥 Firebase initialized with service account JSON');
      firebaseInitialized = true;
    } catch (error) {
      console.error('🔥 Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format');
      firebaseInitialized = false;
    }
  } else {
    console.warn('� No Firebase service account credentials found');
    console.warn('� Add FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PRIVATE_KEY_ID');
    console.warn('⚡ Falling back to memory storage');
    firebaseInitialized = false;
  }
}

export const db = firebaseInitialized ? getFirestore() : null;

export interface FirebaseMessage {
  id: string;
  username: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: number;
  votes: number;
  recipeId?: string;
  isCommand: boolean;
}

export interface FirebaseRecipe {
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

export class FirebaseService {
  async addMessage(message: Omit<FirebaseMessage, 'id' | 'timestamp' | 'votes'>): Promise<string> {
    if (!db || !firebaseInitialized) {
      throw new Error('Firestore not available - using memory storage');
    }
    
    const messageData: Omit<FirebaseMessage, 'id'> = {
      ...message,
      timestamp: Date.now(),
      votes: 0,
    };

    const docRef = await db.collection('messages').add(messageData);
    return docRef.id;
  }

  async addRecipe(recipe: Omit<FirebaseRecipe, 'id' | 'timestamp' | 'votes'>): Promise<string> {
    if (!db || !firebaseInitialized) {
      throw new Error('Firestore not available - using memory storage');
    }
    
    const recipeData: Omit<FirebaseRecipe, 'id'> = {
      ...recipe,
      timestamp: Date.now(),
      votes: 0,
    };

    const docRef = await db.collection('recipes').add(recipeData);
    return docRef.id;
  }

  async getRecentMessages(limit: number = 50): Promise<FirebaseMessage[]> {
    if (!db || !firebaseInitialized) {
      throw new Error('Firestore not available - using memory storage');
    }
    
    const snapshot = await db.collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseMessage[];
  }

  async voteOnMessage(messageId: string, username: string, voteType: 'up' | 'down'): Promise<void> {
    if (!db || !firebaseInitialized) {
      throw new Error('Firestore not available - using memory storage');
    }
    
    const messageRef = db.collection('messages').doc(messageId);
    const voteRef = db.collection('votes').doc(`${messageId}_${username}`);

    await db.runTransaction(async (transaction) => {
      const messageDoc = await transaction.get(messageRef);
      const voteDoc = await transaction.get(voteRef);

      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const currentVotes = messageDoc.data()?.votes || 0;
      let newVotes = currentVotes;

      if (voteDoc.exists) {
        const existingVote = voteDoc.data()?.voteType;
        if (existingVote === voteType) {
          // Remove vote
          transaction.delete(voteRef);
          newVotes = voteType === 'up' ? currentVotes - 1 : currentVotes + 1;
        } else {
          // Change vote
          transaction.update(voteRef, { voteType, timestamp: Date.now() });
          newVotes = voteType === 'up' ? currentVotes + 2 : currentVotes - 2;
        }
      } else {
        // New vote
        transaction.set(voteRef, {
          username,
          messageId,
          voteType,
          timestamp: Date.now()
        });
        newVotes = voteType === 'up' ? currentVotes + 1 : currentVotes - 1;
      }

      transaction.update(messageRef, { votes: newVotes });
    });
  }
}

export const firebaseService = new FirebaseService();
