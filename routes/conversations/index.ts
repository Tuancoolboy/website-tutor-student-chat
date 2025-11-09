/**
 * Conversations APIs
 * GET /api/conversations - List conversations
 * POST /api/conversations - Create conversation
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Conversation, Message } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/conversations
 */
export async function listConversationsHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Filter conversations where user is a participant and not hidden by user
    const filter = (conversation: Conversation) => 
      conversation.participants.includes(currentUser.userId) &&
      !(conversation.hiddenFor || []).includes(currentUser.userId);

    const result = await storage.paginate<Conversation>(
      'conversations.json',
      pageNum,
      limitNum,
      filter
    );

    // Populate lastMessage and unreadCount for each conversation
    const conversations = await Promise.all(
      result.data.map(async (conv) => {
        // Get last message
        const messages = await storage.read<Message>('messages.json');
        const conversationMessages = messages
          .filter(m => m.conversationId === conv.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const lastMessage = conversationMessages[0] || undefined;
        
        // Calculate unread count
        const unreadMessages = conversationMessages.filter(
          m => !m.read && m.receiverId === currentUser.userId
        );
        const unreadCount = unreadMessages.length;

        return {
          ...conv,
          lastMessage,
          unreadCount: { [currentUser.userId]: unreadCount }
        };
      })
    );

    return res.json({
      success: true,
      data: conversations,
      pagination: result.pagination
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách cuộc trò chuyện: ' + error.message)
    );
  }
}

/**
 * POST /api/conversations
 */
export async function createConversationHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json(
        errorResponse('Cần ít nhất 1 người tham gia')
      );
    }

    // Add current user to participants if not already included
    const allParticipants = [
      ...new Set([currentUser.userId, ...participantIds])
    ];

    // Check if conversation already exists
    const existingConversations = await storage.read<Conversation>('conversations.json');
    const existing = existingConversations.find(conv => {
      const convParticipants = conv.participants.sort();
      const newParticipants = allParticipants.sort();
      return convParticipants.length === newParticipants.length &&
        convParticipants.every((p, i) => p === newParticipants[i]);
    });

    if (existing) {
      return res.json(successResponse(existing, 'Cuộc trò chuyện đã tồn tại'));
    }

    const newConversation: Conversation = {
      id: generateId('conv'),
      participants: allParticipants,
      unreadCount: {},
      createdAt: now(),
      updatedAt: now()
    };

    // Initialize unreadCount for all participants
    allParticipants.forEach(userId => {
      newConversation.unreadCount[userId] = 0;
    });

    await storage.create('conversations.json', newConversation);

    return res.status(201).json(
      successResponse(newConversation, 'Tạo cuộc trò chuyện thành công')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi tạo cuộc trò chuyện: ' + error.message)
    );
  }
}

/**
 * GET /api/conversations/:id
 */
export async function getConversationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const conversation = await storage.findById<Conversation>('conversations.json', id);
    if (!conversation) {
      return res.status(404).json(errorResponse('Không tìm thấy cuộc trò chuyện'));
    }

    // Check if user is a participant
    if (!conversation.participants.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền truy cập cuộc trò chuyện này')
      );
    }

    return res.json(successResponse(conversation));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy cuộc trò chuyện: ' + error.message)
    );
  }
}

/**
 * DELETE /api/conversations/:id
 * Hide/delete conversation for current user only (other users still see it)
 */
export async function deleteConversationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const conversation = await storage.findById<Conversation>('conversations.json', id);
    if (!conversation) {
      return res.status(404).json(errorResponse('Conversation not found'));
    }

    // Check if user is a participant
    if (!conversation.participants.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('You do not have permission to delete this conversation')
      );
    }

    // Add user to hiddenFor array (don't actually delete the conversation)
    const hiddenFor = conversation.hiddenFor || [];
    if (!hiddenFor.includes(currentUser.userId)) {
      hiddenFor.push(currentUser.userId);
      await storage.update<Conversation>('conversations.json', id, {
        hiddenFor,
        updatedAt: now()
      });
    }

    return res.json(
      successResponse(null, 'Conversation deleted successfully')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Error deleting conversation: ' + error.message)
    );
  }
}

