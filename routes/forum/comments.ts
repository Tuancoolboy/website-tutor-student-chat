/**
 * Forum Comments APIs
 * GET /api/forum/posts/:id/comments - Get comments
 * POST /api/forum/posts/:id/comments - Add comment
 * DELETE /api/forum/comments/:id - Delete comment
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { ForumComment } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/forum/posts/:id/comments
 */
export async function getCommentsHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await storage.paginate<ForumComment>(
      'forum-comments.json',
      pageNum,
      limitNum,
      (comment) => comment.postId === id
    );

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy bình luận: ' + error.message)
    );
  }
}

/**
 * POST /api/forum/posts/:id/comments
 */
export async function createCommentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const currentUser = req.user!;

    // Verify post exists
    const post = await storage.findById('forum-posts.json', id);
    if (!post) {
      return res.status(404).json(errorResponse('Không tìm thấy bài viết'));
    }

    const newComment: ForumComment = {
      id: generateId('cmt'),
      postId: id,
      authorId: currentUser.userId,
      content,
      parentCommentId,
      likes: [],
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('forum-comments.json', newComment);

    return res.status(201).json(
      successResponse(newComment, 'Thêm bình luận thành công')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi thêm bình luận: ' + error.message)
    );
  }
}

/**
 * DELETE /api/forum/comments/:id
 */
export async function deleteCommentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const comment = await storage.findById<ForumComment>('forum-comments.json', id);
    if (!comment) {
      return res.status(404).json(errorResponse('Không tìm thấy bình luận'));
    }

    if (comment.authorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Chỉ tác giả mới có thể xóa bình luận')
      );
    }

    await storage.delete('forum-comments.json', id);

    return res.json(successResponse(null, 'Xóa bình luận thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa bình luận: ' + error.message)
    );
  }
}

