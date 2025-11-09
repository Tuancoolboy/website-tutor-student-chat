/**
 * Messages APIs
 * GET /api/conversations/:id/messages - Get messages
 * POST /api/conversations/:id/messages - Send message (fallback)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Message, Conversation } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../../lib/utils.js';

/**
 * GET /api/conversations/:id/messages
 */
export async function getMessagesHandler(req: AuthRequest, res: Response) {
  try {
    const { id: conversationId } = req.params;
    const currentUser = req.user!;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Verify conversation exists and user is a participant
    const conversation = await storage.findById<Conversation>('conversations.json', conversationId);
    if (!conversation) {
      return res.status(404).json(errorResponse('Không tìm thấy cuộc trò chuyện'));
    }

    if (!conversation.participants.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền truy cập cuộc trò chuyện này')
      );
    }

    // Get messages for this conversation
    const filter = (message: Message) => message.conversationId === conversationId;

    const result = await storage.paginate<Message>(
      'messages.json',
      pageNum,
      limitNum,
      filter
    );

    // Sort by createdAt ascending (oldest first) for UI display
    result.data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Lấy tin nhắn thành công'
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy tin nhắn: ' + error.message)
    );
  }
}

/**
 * POST /api/conversations/:id/messages
 * Fallback method when WebSocket is not available
 */
export async function sendMessageHandler(req: AuthRequest, res: Response) {
  try {
    const { id: conversationId } = req.params;
    const currentUser = req.user!;
    const { content, type = 'text', fileUrl } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json(
        errorResponse('Nội dung tin nhắn không được để trống')
      );
    }

    // Verify conversation exists and user is a participant
    const conversation = await storage.findById<Conversation>('conversations.json', conversationId);
    if (!conversation) {
      return res.status(404).json(errorResponse('Không tìm thấy cuộc trò chuyện'));
    }

    if (!conversation.participants.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này')
      );
    }

    // Get receiver (the other participant)
    const receiverId = conversation.participants.find(
      id => id !== currentUser.userId
    );

    if (!receiverId) {
      return res.status(400).json(
        errorResponse('Không tìm thấy người nhận')
      );
    }

    // Create message
    const newMessage: Message = {
      id: generateId('msg'),
      conversationId,
      senderId: currentUser.userId,
      receiverId,
      content: content.trim(),
      type: type as 'text' | 'file' | 'image',
      fileUrl,
      read: false,
      createdAt: now()
    };

    await storage.create('messages.json', newMessage);

    // Update conversation updatedAt
    await storage.update<Conversation>('conversations.json', conversationId, {
      updatedAt: now(),
      lastMessage: newMessage
    });

    // Increment unread count for receiver
    const updatedUnreadCount = {
      ...conversation.unreadCount,
      [receiverId]: (conversation.unreadCount[receiverId] || 0) + 1
    };
    await storage.update<Conversation>('conversations.json', conversationId, {
      unreadCount: updatedUnreadCount
    });

    return res.status(201).json(
      successResponse(newMessage, 'Gửi tin nhắn thành công')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi gửi tin nhắn: ' + error.message)
    );
  }
}

/**
 * PUT /api/messages/:id/read
 * Mark message as read
 */
export async function markMessageReadHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const message = await storage.findById<Message>('messages.json', id);
    if (!message) {
      return res.status(404).json(errorResponse('Không tìm thấy tin nhắn'));
    }

    // Only receiver can mark as read
    if (message.receiverId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền đánh dấu tin nhắn này')
      );
    }

    if (message.read) {
      return res.json(successResponse(message, 'Tin nhắn đã được đánh dấu đọc'));
    }

    // Update message
    const updated = await storage.update<Message>('messages.json', id, {
      read: true
    });

    // Update conversation unread count
    const conversation = await storage.findById<Conversation>('conversations.json', message.conversationId);
    if (conversation) {
      const updatedUnreadCount = {
        ...conversation.unreadCount,
        [currentUser.userId]: Math.max(0, (conversation.unreadCount[currentUser.userId] || 0) - 1)
      };
      await storage.update<Conversation>('conversations.json', message.conversationId, {
        unreadCount: updatedUnreadCount
      });
    }

    return res.json(successResponse(updated, 'Đánh dấu đọc thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi đánh dấu đọc: ' + error.message)
    );
  }
}

