/**
 * Forum Posts APIs
 * GET /api/forum/posts - List posts
 * POST /api/forum/posts - Create post
 * GET /api/forum/posts/:id - Get post detail
 * PUT /api/forum/posts/:id - Update post
 * DELETE /api/forum/posts/:id - Delete post
 * POST /api/forum/posts/:id/like - Like/unlike post
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { ForumPost } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/forum/posts
 */
export async function listPostsHandler(req: AuthRequest, res: Response) {
  try {
    const { category, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    console.log('[Forum] Loading posts with filters:', { category, search, page: pageNum, limit: limitNum });

    const filter = (post: ForumPost) => {
      if (category && post.category !== category) return false;
      
      if (search) {
        const searchLower = (search as string).toLowerCase();
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    };

    console.log('[Forum] Calling storage.paginate for forum-posts.json...');
    const result = await storage.paginate<ForumPost>(
      'forum-posts.json',
      pageNum,
      limitNum,
      filter
    );

    console.log('[Forum] Storage returned', result.data.length, 'posts (total:', result.pagination.total, ')');

    // Count comments for each post
    const postsWithComments = await Promise.all(
      result.data.map(async (post) => {
        try {
          const comments = await storage.read('forum-comments.json');
          const commentCount = comments.filter((c: any) => c.postId === post.id).length;
          return {
            ...post,
            commentsCount: commentCount
          };
        } catch (error) {
          console.error(`Error counting comments for post ${post.id}:`, error);
          return {
            ...post,
            commentsCount: 0
          };
        }
      })
    );

    console.log('[Forum] Returning', postsWithComments.length, 'posts with comments');

    // Return with success flag for consistency with other APIs
    return res.json({
      success: true,
      data: postsWithComments,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('[Forum] Error in listPostsHandler:', error);
    console.error('[Forum] Error stack:', error.stack);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách bài viết: ' + error.message)
    );
  }
}

/**
 * POST /api/forum/posts
 */
export async function createPostHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { title, content, category, tags, images } = req.body;

    const newPost: ForumPost = {
      id: generateId('post'),
      authorId: currentUser.userId,
      title,
      content,
      category,
      tags: tags || [],
      images: images || [],
      likes: [],
      views: 0,
      pinned: false,
      locked: false,
      createdAt: now(),
      updatedAt: now()
    };

    console.log('[Forum] Creating post:', newPost.id, newPost.title);
    await storage.create('forum-posts.json', newPost);
    console.log('[Forum] Post created successfully:', newPost.id);

    return res.status(201).json(
      successResponse(newPost, 'Tạo bài viết thành công')
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi tạo bài viết: ' + error.message)
    );
  }
}

/**
 * GET /api/forum/posts/:id
 */
export async function getPostHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const post = await storage.findById<ForumPost>('forum-posts.json', id);
    if (!post) {
      return res.status(404).json(errorResponse('Không tìm thấy bài viết'));
    }

    // Increment views
    await storage.update<ForumPost>('forum-posts.json', id, {
      views: post.views + 1
    });

    return res.json(successResponse({ ...post, views: post.views + 1 }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy bài viết: ' + error.message)
    );
  }
}

/**
 * PUT /api/forum/posts/:id
 */
export async function updatePostHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    const post = await storage.findById<ForumPost>('forum-posts.json', id);
    if (!post) {
      return res.status(404).json(errorResponse('Không tìm thấy bài viết'));
    }

    // Authorization: only author can update
    if (post.authorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Chỉ tác giả mới có thể sửa bài viết')
      );
    }

    delete updates.id;
    delete updates.authorId;
    delete updates.likes;
    delete updates.views;
    delete updates.createdAt;

    const updated = await storage.update<ForumPost>(
      'forum-posts.json',
      id,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updated, 'Cập nhật bài viết thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật bài viết: ' + error.message)
    );
  }
}

/**
 * DELETE /api/forum/posts/:id
 */
export async function deletePostHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const post = await storage.findById<ForumPost>('forum-posts.json', id);
    if (!post) {
      return res.status(404).json(errorResponse('Không tìm thấy bài viết'));
    }

    if (post.authorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Chỉ tác giả mới có thể xóa bài viết')
      );
    }

    await storage.delete('forum-posts.json', id);

    return res.json(successResponse(null, 'Xóa bài viết thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa bài viết: ' + error.message)
    );
  }
}

/**
 * POST /api/forum/posts/:id/like
 */
export async function likePostHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const post = await storage.findById<ForumPost>('forum-posts.json', id);
    if (!post) {
      return res.status(404).json(errorResponse('Không tìm thấy bài viết'));
    }

    const likes = post.likes || [];
    const userIndex = likes.indexOf(currentUser.userId);

    if (userIndex > -1) {
      // Unlike
      likes.splice(userIndex, 1);
    } else {
      // Like
      likes.push(currentUser.userId);
    }

    await storage.update<ForumPost>('forum-posts.json', id, { likes });

    return res.json(
      successResponse({ liked: userIndex === -1, likesCount: likes.length })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi thích bài viết: ' + error.message)
    );
  }
}

