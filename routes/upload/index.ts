/**
 * File Upload API
 * POST /api/upload - Upload file to Blob Storage
 */

import { Response } from 'express';
import { put } from '@vercel/blob';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse } from '../../lib/utils.js';
import { config } from '../../lib/config.js';

/**
 * POST /api/upload
 * Upload file to Vercel Blob Storage
 * Expects: { file: 'data:mime/type;base64,base64data', fileName: 'filename.pdf' }
 */
export async function uploadFileHandler(req: AuthRequest, res: Response) {
  try {
    // Check if file is provided (base64 format)
    if (!req.body.file) {
      return res.status(400).json(
        errorResponse('Không có file được upload')
      );
    }

    // Parse base64 file data
    // Format: data:mime/type;base64,base64data
    let file: Buffer;
    let fileName: string;
    let mimeType: string;

    if (typeof req.body.file === 'string' && req.body.file.startsWith('data:')) {
      const matches = req.body.file.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json(
          errorResponse('Định dạng file không hợp lệ. Vui lòng sử dụng base64.')
        );
      }
      mimeType = matches[1];
      const base64Data = matches[2];
      file = Buffer.from(base64Data, 'base64');
      fileName = req.body.fileName || `file_${Date.now()}.${mimeType.split('/')[1] || 'bin'}`;
    } else {
      return res.status(400).json(
        errorResponse('Định dạng file không được hỗ trợ. Vui lòng sử dụng base64: data:mime/type;base64,base64data')
      );
    }

    // Validate file size
    if (file.length > config.upload.maxFileSize) {
      return res.status(400).json(
        errorResponse(`File quá lớn. Kích thước tối đa là ${config.upload.maxFileSize / 1024 / 1024}MB`)
      );
    }

    // Validate file type
    if (!config.upload.allowedTypes.includes(mimeType)) {
      return res.status(400).json(
        errorResponse(`Loại file không được hỗ trợ. Các loại file được hỗ trợ: ${config.upload.allowedTypes.join(', ')}`)
      );
    }

    // Check if Blob Storage is enabled
    if (!config.blob.enabled || !config.blob.token) {
      const isLocal = !process.env.VERCEL && process.env.NODE_ENV !== 'production';
      const errorMessage = isLocal
        ? `Blob Storage chưa được cấu hình. Vui lòng thêm BLOB_READ_WRITE_TOKEN vào file .env:
        
1. Tạo file .env trong thư mục gốc (nếu chưa có)
2. Thêm dòng sau vào file .env:
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
3. Restart server để áp dụng thay đổi

Hoặc chạy với token trực tiếp:
BLOB_READ_WRITE_TOKEN=your-token npm run dev`
        : `Blob Storage chưa được cấu hình trên Vercel. 

Cách cấu hình:
1. Vào https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào Settings → Environment Variables
4. Thêm biến mới:
   - Name: BLOB_READ_WRITE_TOKEN
   - Value: vercel_blob_rw_xxxxx (token của bạn)
   - Environment: Production, Preview, Development (chọn tất cả)
5. Click Save
6. Redeploy project để áp dụng thay đổi

Lưu ý: Sau khi thêm Environment Variable, bạn PHẢI redeploy project mới có hiệu lực.`;
      
      console.error('[Upload] Blob Storage not configured:', {
        hasToken: !!config.blob.token,
        enabled: config.blob.enabled,
        isLocal,
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV
      });
      
      return res.status(500).json(
        errorResponse(errorMessage)
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = fileName.split('.').pop() || 'bin';
    const blobFileName = `uploads/${timestamp}_${randomSuffix}.${fileExtension}`;

    // Upload to Blob Storage
    const blob = await put(blobFileName, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: mimeType
    });

    return res.json(
      successResponse(
        {
          url: blob.url,
          fileName: fileName,
          fileSize: file.length,
          mimeType: mimeType
        },
        'Upload file thành công'
      )
    );
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return res.status(500).json(
      errorResponse('Lỗi upload file: ' + (error.message || 'Unknown error'))
    );
  }
}

