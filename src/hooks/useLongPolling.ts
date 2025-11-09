/**
 * React Hook for Long Polling Messages
 * Free alternative to WebSocket - runs on Vercel Serverless Functions
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../env';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

interface UseLongPollingOptions {
  conversationId: string | null;
  enabled?: boolean;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useLongPolling({ 
  conversationId, 
  enabled = true,
  onMessage,
  onError
}: UseLongPollingOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef(false);
  const isLoadingHistoryRef = useRef(false);

  const poll = useCallback(async () => {
    if (!enabled || !conversationId || isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;
    // Don't set isPolling to true immediately to avoid UI flickering
    // Only set connected status once
    if (!isConnected) {
      setIsConnected(true);
    }
    
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build URL correctly for both absolute and relative URLs
      const baseUrl = API_BASE_URL.startsWith('http') 
        ? API_BASE_URL 
        : `${window.location.origin}${API_BASE_URL}`;
      const url = new URL(`${baseUrl}/messages/poll`);
      url.searchParams.set('conversationId', conversationId);
      if (lastMessageIdRef.current) {
        url.searchParams.set('lastMessageId', lastMessageIdRef.current);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`Polling failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Polling failed');
      }

      // Handle both response formats: { success: true, data: { messages: [...] } } or { success: true, messages: [...] }
      const messages = data.data?.messages || data.messages || [];
      
      if (messages.length > 0) {
        // Update last message ID
        const lastMessage = messages[messages.length - 1];
        lastMessageIdRef.current = lastMessage.id;

        // Add new messages to state
        setMessages(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = messages.filter((msg: Message) => !existingIds.has(msg.id));
          
          if (newMessages.length === 0) {
            return prev;
          }

          // Call onMessage callback for each new message (silently)
          newMessages.forEach((msg: Message) => {
            onMessage?.(msg);
          });

          // Merge and sort all messages
          const updated = [...prev, ...newMessages];
          updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return updated;
        });
      }

      // Continue polling after receiving response
      isPollingRef.current = false;
      
      // Poll again after a longer delay (2-3 seconds) to avoid UI flickering
      // This reduces the frequency of status changes
      setTimeout(() => {
        if (enabled && conversationId) {
          poll();
        }
      }, 2000); // Increased from 50ms to 2000ms (2 seconds)

    } catch (error: any) {
      isPollingRef.current = false;

      if (error.name === 'AbortError') {
        // Request was aborted, don't retry
        return;
      }

      // Only show error state after multiple failures
      console.error('[useLongPolling] Polling error:', error);
      onError?.(error);

      // Wait longer before retrying on error (5 seconds)
      setTimeout(() => {
        if (enabled && conversationId && !abortControllerRef.current?.signal.aborted) {
          poll();
        }
      }, 5000);
    }
  }, [conversationId, enabled, onMessage, onError, isConnected]);

  // Load message history
  const loadHistory = useCallback(async () => {
    if (!conversationId) {
      console.log('[useLongPolling] loadHistory: No conversationId');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingHistoryRef.current) {
      console.log('[useLongPolling] loadHistory: Already loading, skipping');
      return;
    }

    isLoadingHistoryRef.current = true;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('[useLongPolling] loadHistory: Loading messages for conversation:', conversationId);

      // Build URL correctly
      const baseUrl = API_BASE_URL.startsWith('http') 
        ? API_BASE_URL 
        : `${window.location.origin}${API_BASE_URL}`;
      const url = `${baseUrl}/conversations/${conversationId}/messages?page=1&limit=50`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useLongPolling] Failed to load history:', response.status, errorText);
        throw new Error(`Failed to load message history: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useLongPolling] loadHistory: Response:', data);
      
      if (data.success && data.data) {
        const messagesData = Array.isArray(data.data) ? data.data : [];
        console.log('[useLongPolling] loadHistory: Found', messagesData.length, 'messages');
        
        if (messagesData.length > 0) {
          // Remove duplicates by id (in case API returns duplicates)
          const uniqueMessages = messagesData.reduce((acc: Message[], msg: Message) => {
            if (!acc.find(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, []);
          
          // Sort messages by createdAt
          uniqueMessages.sort((a: Message, b: Message) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          console.log('[useLongPolling] loadHistory: Setting', uniqueMessages.length, 'unique messages to state');
          // Clear and set messages directly (replace, not merge)
          setMessages(uniqueMessages);
          const lastMessage = uniqueMessages[uniqueMessages.length - 1];
          lastMessageIdRef.current = lastMessage.id;
          console.log('[useLongPolling] loadHistory: Set lastMessageId to:', lastMessage.id);
        } else {
          // No messages yet, clear the list
          console.log('[useLongPolling] loadHistory: No messages found, clearing state');
          setMessages([]);
          lastMessageIdRef.current = null;
        }
      } else {
        console.warn('[useLongPolling] Invalid response format:', data);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('[useLongPolling] Load history error:', error);
      onError?.(error);
      setMessages([]);
    } finally {
      isLoadingHistoryRef.current = false;
    }
  }, [conversationId, onError]);

  // Send message function
  const sendMessage = useCallback(async (content: string, type: 'text' | 'file' | 'image' = 'text', fileUrl?: string) => {
    if (!conversationId) {
      throw new Error('No conversation selected');
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // Build URL correctly
      const baseUrl = API_BASE_URL.startsWith('http') 
        ? API_BASE_URL 
        : `${window.location.origin}${API_BASE_URL}`;
      const url = `${baseUrl}/conversations/${conversationId}/messages`;

      console.log('[useLongPolling] Sending message:', {
        url,
        conversationId,
        content: content.substring(0, 50) + '...',
        baseUrl,
        API_BASE_URL
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content, type, fileUrl })
        });
      } catch (fetchError: any) {
        console.error('[useLongPolling] Fetch error:', fetchError);
        // Network error - provide more helpful error message
        if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
          throw new Error(`Cannot connect to server. Please check:
1. API server is running
2. URL is correct: ${url}
3. CORS is configured properly
4. Network connection is stable`);
        }
        throw fetchError;
      }

      console.log('[useLongPolling] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Failed to send message: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('[useLongPolling] Error response:', errorData);
        } catch (e) {
          // Response is not JSON, get text
          const errorText = await response.text();
          console.error('[useLongPolling] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[useLongPolling] Send message response:', data);
      
      // Message will appear automatically via polling
      // But we can add it immediately for better UX
      if (data.success && data.data) {
        const newMsg = data.data;
        console.log('[useLongPolling] Adding message to state:', newMsg);
        setMessages(prev => {
          console.log('[useLongPolling] Previous messages count:', prev.length);
          // Check if message already exists
          if (prev.some(m => m.id === newMsg.id)) {
            console.log('[useLongPolling] Message already exists, skipping');
            return prev;
          }
          // Add new message and sort by createdAt
          const updated = [...prev, newMsg];
          updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          console.log('[useLongPolling] Updated messages count:', updated.length);
          return updated;
        });
        // Update lastMessageIdRef for polling
        lastMessageIdRef.current = newMsg.id;
      } else {
        console.warn('[useLongPolling] Invalid send response format:', data);
      }

      return data;
    } catch (error: any) {
      console.error('[useLongPolling] Send message error:', error);
      console.error('[useLongPolling] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }, [conversationId]);

  // Start polling when conversationId changes or enabled changes
  useEffect(() => {
    // Use a ref to track the current conversation to prevent duplicate calls
    const currentConversationId = conversationId;
    
    if (enabled && conversationId) {
      console.log('[useLongPolling] Conversation changed, loading history:', conversationId);
      // Reset state when conversation changes
      lastMessageIdRef.current = null;
      // Don't clear messages immediately - let loadHistory handle it
      setIsConnected(false); // Reset connection status when conversation changes
      
      // Load history first, then start polling
      loadHistory().then(() => {
        // Only proceed if conversation hasn't changed during loading
        if (currentConversationId === conversationId) {
          console.log('[useLongPolling] History loaded, starting poll');
          // Set connected after history is loaded
          setIsConnected(true);
          // Start polling after history is loaded with a small delay
          setTimeout(() => {
            // Double check conversation hasn't changed
            if (currentConversationId === conversationId) {
              poll();
            }
          }, 500);
        } else {
          console.log('[useLongPolling] Conversation changed during load, skipping poll');
        }
      }).catch((error) => {
        // Only proceed if conversation hasn't changed during loading
        if (currentConversationId === conversationId) {
          console.error('[useLongPolling] Failed to load history:', error);
          // Start polling anyway
          setIsConnected(true);
          setTimeout(() => {
            if (currentConversationId === conversationId) {
              poll();
            }
          }, 500);
        }
      });
    } else {
      console.log('[useLongPolling] Conversation disabled or cleared');
      // Stop polling
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isPollingRef.current = false;
      setIsPolling(false);
      setIsConnected(false);
      setMessages([]);
      isLoadingHistoryRef.current = false;
    }

    // Cleanup: abort ongoing request only if conversation changed
    return () => {
      // Only abort if conversation actually changed
      if (currentConversationId !== conversationId) {
        console.log('[useLongPolling] Cleanup: Conversation changed, aborting');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        isPollingRef.current = false;
      }
    };
  }, [enabled, conversationId, poll, loadHistory]);

  return {
    messages,
    isPolling,
    isConnected,
    sendMessage,
    loadHistory
  };
}

