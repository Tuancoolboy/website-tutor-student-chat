/**
 * Long Polling Handler for Real-Time Messaging
 * This endpoint polls for new messages (free alternative to WebSocket)
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Message } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse } from '../../lib/utils.js';

/**
 * GET /api/messages/poll
 * Long polling endpoint to check for new messages
 */
export async function pollMessagesHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { conversationId, lastMessageId } = req.query;

    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json(
        errorResponse('conversationId is required')
      );
    }

    // Long polling: wait up to 8 seconds for new messages
    // Vercel free tier allows up to 10 seconds (we use 8 to be safe)
    const maxWaitTime = 8000; // 8 seconds
    const checkInterval = 500; // Check every 500ms for faster response
    const maxAttempts = Math.floor(maxWaitTime / checkInterval);

    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // Get all messages for this conversation
        const allMessages = await storage.read<Message>('messages.json');
        const conversationMessages = allMessages
          .filter(m => m.conversationId === conversationId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // If lastMessageId is provided, get only new messages after it
        if (lastMessageId && typeof lastMessageId === 'string') {
          const lastIndex = conversationMessages.findIndex(m => m.id === lastMessageId);
          
          if (lastIndex === -1) {
            // Last message not found, return last 50 messages
            return res.json({
              success: true,
              data: {
                messages: conversationMessages.slice(-50)
              }
            });
          }

          const newMessages = conversationMessages.slice(lastIndex + 1);
          
          if (newMessages.length > 0) {
            // Found new messages, return them immediately
            return res.json({
              success: true,
              data: {
                messages: newMessages
              }
            });
          }
        } else {
          // No lastMessageId, return last 50 messages
          return res.json({
            success: true,
            data: {
              messages: conversationMessages.slice(-50)
            }
          });
        }

        // No new messages, wait before checking again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        attempts++;
      } catch (error: any) {
        console.error('[Poll] Error:', error);
        return res.status(500).json(
          errorResponse(error.message || 'Internal server error')
        );
      }
    }

    // Timeout: no new messages found, return empty array
    return res.json({
      success: true,
      data: {
        messages: [],
        timeout: true
      }
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi polling messages: ' + error.message)
    );
  }
}

