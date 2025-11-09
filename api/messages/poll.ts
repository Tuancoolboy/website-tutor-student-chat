/**
 * Long Polling API for Real-Time Messaging
 * This endpoint polls for new messages (free alternative to WebSocket)
 * Runs on Vercel Serverless Functions - 100% FREE
 * 
 * Access via: GET /api/messages/poll?conversationId=xxx&lastMessageId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage.js';
import { Message } from '../../lib/types.js';
import { verifyToken, extractToken } from '../../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Only GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Authenticate user
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }

  const { conversationId, lastMessageId } = req.query;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'conversationId is required' 
    });
  }

  // Long polling: wait up to 8 seconds for new messages
  // Vercel free tier allows up to 10 seconds (we use 8 to be safe)
  const maxWaitTime = 8000; // 8 seconds
  const checkInterval = 1000; // Check every 1 second
  const maxAttempts = Math.floor(maxWaitTime / checkInterval);

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // Get all messages for this conversation
      const allMessages = await storage.findAll<Message>('messages.json');
      const conversationMessages = allMessages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // If lastMessageId is provided, get only new messages after it
      if (lastMessageId && typeof lastMessageId === 'string') {
        const lastIndex = conversationMessages.findIndex(m => m.id === lastMessageId);
        
        if (lastIndex === -1) {
          // Last message not found, return all messages
          return res.json({ 
            success: true, 
            messages: conversationMessages.slice(-50) // Last 50 messages
          });
        }

        const newMessages = conversationMessages.slice(lastIndex + 1);
        
        if (newMessages.length > 0) {
          // Found new messages, return them immediately
          return res.json({ 
            success: true, 
            messages: newMessages 
          });
        }
      } else {
        // No lastMessageId, return last 50 messages
        return res.json({ 
          success: true, 
          messages: conversationMessages.slice(-50) 
        });
      }

      // No new messages, wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      attempts++;
    } catch (error: any) {
      console.error('[Poll] Error:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Internal server error' 
      });
    }
  }

  // Timeout: no new messages found, return empty array
  return res.json({ 
    success: true, 
    messages: [],
    timeout: true
  });
}

