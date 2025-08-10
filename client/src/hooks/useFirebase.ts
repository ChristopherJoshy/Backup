import { useQuery } from '@tanstack/react-query';

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

export function useFirebaseMessages() {
  const { data: messages = [], isLoading: loading, error } = useQuery({
    queryKey: ['/api/messages'],
    refetchInterval: 500, // Poll every 500ms for very fast updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch for real-time updates
    gcTime: 0, // Don't cache data for immediate updates
  });

  // Sort messages by timestamp (newest first, then reverse for display)
  const sortedMessages = (messages as FirebaseMessage[]).sort((a, b) => a.timestamp - b.timestamp);

  return { 
    messages: sortedMessages, 
    loading, 
    error: error?.message || null 
  };
}
