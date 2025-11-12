/**
 * Hook realtime cho chat sử dụng Socket.IO.
 * Giữ tên useLongPolling để tương thích với code cũ.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, WEBSOCKET_URL } from '../env';

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

const buildApiUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return path;
  }

  const baseUrl = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : `${window.location.origin}${API_BASE_URL}`;

  return `${baseUrl}${path}`;
};

const normaliseError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return new Error((error as any).message);
  }
  return new Error('Socket error');
};

export function useLongPolling({
  conversationId,
  enabled = true,
  onMessage,
  onError
}: UseLongPollingOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPolling, setIsPolling] = useState(false); // dùng làm trạng thái tải lịch sử
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const currentConversationRef = useRef<string | null>(null);
  const previousConversationRef = useRef<string | null>(null);
  const historyAbortControllerRef = useRef<AbortController | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.conversationId !== currentConversationRef.current) {
      return;
    }

    lastMessageIdRef.current = message.id;

    setMessages(prev => {
      if (prev.some(existing => existing.id === message.id)) {
        return prev;
      }
      const updated = [...prev, message];
      updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return updated;
    });

    onMessageRef.current?.(message);
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    if (socketRef.current) {
      // đã kết nối
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const token = window.localStorage.getItem('token');
    if (!token) {
      console.warn('[useLongPolling] Không tìm thấy token -> không kết nối Socket.IO');
      return;
    }

    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (currentConversationRef.current) {
        socket.emit('join-room', currentConversationRef.current);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      const normalised = normaliseError(err);
      console.error('[useLongPolling] Socket connect error:', normalised);
      setIsConnected(false);
      onErrorRef.current?.(normalised);
    });

    socket.on('error', (err) => {
      const normalised = normaliseError(err);
      console.error('[useLongPolling] Socket error:', normalised);
      onErrorRef.current?.(normalised);
    });

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('new-message', handleNewMessage);
      disconnectSocket();
    };
  }, [disconnectSocket, enabled, handleNewMessage]);

  const loadHistory = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      lastMessageIdRef.current = null;
      return;
    }

    if (historyAbortControllerRef.current) {
      historyAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    historyAbortControllerRef.current = controller;

    try {
      setIsPolling(true);

      const token = typeof window !== 'undefined'
        ? window.localStorage.getItem('token')
        : null;

      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const url = buildApiUrl(`/conversations/${conversationId}/messages?page=1&limit=100`);
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Không thể tải lịch sử tin nhắn (${response.status}): ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      const messagesData: Message[] = Array.isArray(data?.data) ? data.data : [];

      const sorted = messagesData
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setMessages(sorted);
      if (sorted.length > 0) {
        lastMessageIdRef.current = sorted[sorted.length - 1].id;
      } else {
        lastMessageIdRef.current = null;
      }
    } catch (error) {
      const normalised = normaliseError(error);
      console.error('[useLongPolling] Load history error:', normalised);
      onErrorRef.current?.(normalised);
      setMessages([]);
      lastMessageIdRef.current = null;
    } finally {
      setIsPolling(false);
      historyAbortControllerRef.current = null;
    }
  }, [conversationId]);

  useEffect(() => {
    currentConversationRef.current = conversationId;

    if (!enabled) {
      setMessages([]);
      lastMessageIdRef.current = null;
      return;
    }

    if (!conversationId) {
      if (previousConversationRef.current && socketRef.current?.connected) {
        socketRef.current.emit('leave-room', previousConversationRef.current);
      }
      previousConversationRef.current = null;
      setMessages([]);
      lastMessageIdRef.current = null;
      return;
    }

    void loadHistory();

    if (socketRef.current?.connected) {
      if (previousConversationRef.current && previousConversationRef.current !== conversationId) {
        socketRef.current.emit('leave-room', previousConversationRef.current);
      }
      socketRef.current.emit('join-room', conversationId);
    }

    previousConversationRef.current = conversationId;

    return () => {
      if (socketRef.current?.connected && conversationId) {
        socketRef.current.emit('leave-room', conversationId);
      }
    };
  }, [conversationId, enabled, loadHistory]);

  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'file' | 'image' = 'text',
    fileUrl?: string
  ) => {
    if (!conversationId) {
      throw new Error('Chưa chọn cuộc trò chuyện');
    }

    const trimmed = content?.trim();
    if (!trimmed) {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    const payload = {
      conversationId,
      content: trimmed,
      type,
      fileUrl
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', payload);
      return { success: true };
    }

    // Fallback: gọi API REST để không mất tin nhắn
    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem('token')
      : null;

    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const url = buildApiUrl(`/conversations/${conversationId}/messages`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gửi tin nhắn thất bại (${response.status}): ${errorText || response.statusText}`
      );
    }

    const data = await response.json();
    if (data?.success && data?.data) {
      handleNewMessage(data.data);
    }

    return data;
  }, [conversationId, handleNewMessage]);

  return {
    messages,
    isPolling,
    isConnected,
    sendMessage,
    loadHistory
  };
}

