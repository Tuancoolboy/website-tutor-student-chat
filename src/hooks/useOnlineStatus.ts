/**
 * React Hook for Tracking Online Users via WebSocket
 * Tracks which users are currently online (connected via WebSocket)
 */

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Get WebSocket URL from environment or use default
const WEBSOCKET_URL = (typeof window !== 'undefined' && (window as any).__WEBSOCKET_URL__) 
  || (typeof process !== 'undefined' && process.env?.VITE_WEBSOCKET_URL)
  || 'http://localhost:3001';

interface UseOnlineStatusOptions {
  enabled?: boolean;
}

export function useOnlineStatus({ enabled = true }: UseOnlineStatusOptions = {}) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[useOnlineStatus] No token, skipping WebSocket connection');
      return;
    }

    console.log('[useOnlineStatus] Connecting to WebSocket:', WEBSOCKET_URL);

    // Connect to WebSocket server
    const socket = io(WEBSOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useOnlineStatus] WebSocket connected');
      setIsConnected(true);
    });

    // Handle initial connection with online users list
    socket.on('connected', (data: { userId: string; socketId: string; onlineUsers?: string[] }) => {
      console.log('[useOnlineStatus] Connection confirmed:', data);
      if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
        console.log('[useOnlineStatus] Received initial online users list:', data.onlineUsers);
        // Initialize with the list of users who were already online
        setOnlineUsers(new Set(data.onlineUsers));
      }
    });

    socket.on('disconnect', () => {
      console.log('[useOnlineStatus] WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[useOnlineStatus] WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for user online events
    socket.on('user-online', (data: { userId: string }) => {
      console.log('[useOnlineStatus] User online:', data.userId);
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.add(data.userId);
        return updated;
      });
    });

    // Listen for user offline events
    socket.on('user-offline', (data: { userId: string }) => {
      console.log('[useOnlineStatus] User offline:', data.userId);
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('[useOnlineStatus] Cleaning up WebSocket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled]);

  // Check if a user is online
  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    isConnected
  };
}

