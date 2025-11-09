/**
 * POST /api/messages/send
 * Send message directly to a user (auto-create conversation if needed)
 * Body: { receiverId: string, content: string, type?: 'text' | 'file' | 'image', fileUrl?: string }
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Message, Conversation, User } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

export async function sendMessageToUserHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { receiverId, content, type = 'text', fileUrl } = req.body;

    if (!receiverId) {
      return res.status(400).json(
        errorResponse('receiverId là bắt buộc')
      );
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json(
        errorResponse('Nội dung tin nhắn không được để trống')
      );
    }

    // Verify receiver exists
    const receiver = await storage.findById<User>('users.json', receiverId);
    if (!receiver) {
      return res.status(404).json(errorResponse('Không tìm thấy người nhận'));
    }

    // Check if conversation already exists between these two users
    const allConversations = await storage.read<Conversation>('conversations.json');
    let conversation = allConversations.find(conv => {
      const participants = conv.participants.sort();
      const expectedParticipants = [currentUser.userId, receiverId].sort();
      return participants.length === 2 &&
        participants[0] === expectedParticipants[0] &&
        participants[1] === expectedParticipants[1];
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      const newConversation: Conversation = {
        id: generateId('conv'),
        participants: [currentUser.userId, receiverId],
        unreadCount: {
          [currentUser.userId]: 0,
          [receiverId]: 0
        },
        createdAt: now(),
        updatedAt: now()
      };

      conversation = await storage.create('conversations.json', newConversation);
    }

    // Create message
    const newMessage: Message = {
      id: generateId('msg'),
      conversationId: conversation.id,
      senderId: currentUser.userId,
      receiverId,
      content: content.trim(),
      type: type as 'text' | 'file' | 'image',
      fileUrl,
      read: false,
      createdAt: now()
    };

    await storage.create('messages.json', newMessage);

    // Update conversation
    await storage.update<Conversation>('conversations.json', conversation.id, {
      updatedAt: now(),
      lastMessage: newMessage,
      unreadCount: {
        ...conversation.unreadCount,
        [receiverId]: (conversation.unreadCount[receiverId] || 0) + 1
      }
    });

    return res.status(201).json(
      successResponse({
        message: newMessage,
        conversation
      }, 'Gửi tin nhắn thành công')
    );
  } catch (error: any) {
    console.error('Send message error:', error);
    return res.status(500).json(
      errorResponse('Lỗi gửi tin nhắn: ' + error.message)
    );
  }
}

