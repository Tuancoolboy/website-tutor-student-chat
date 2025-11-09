import { put, del, list } from '@vercel/blob';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * JSONStorage - Quản lý việc đọc/ghi JSON files
 * Hỗ trợ cả Vercel Blob Storage và local file system
 */
export class JSONStorage {
  private useBlob: boolean;
  private dataDir: string;

  constructor(useBlob = false) {
    this.dataDir = join(process.cwd(), 'data');
    
    // On Vercel, file system is read-only, so we MUST use Blob Storage
    // If useBlob is true but no token, we cannot fallback to local (will fail on Vercel)
    if (useBlob) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        if (process.env.VERCEL) {
          // On Vercel, we MUST have token - cannot fallback to local
          throw new Error(
            'BLOB_READ_WRITE_TOKEN is required on Vercel. ' +
            'File system is read-only. ' +
            'Please set BLOB_READ_WRITE_TOKEN in Vercel environment variables. ' +
            'See: https://vercel.com/docs/storage/vercel-blob'
          );
        } else {
          // Not on Vercel, warn but allow fallback to local
          console.warn('⚠️ WARNING: Blob Storage requested but BLOB_READ_WRITE_TOKEN is not set!');
          console.warn('⚠️ Falling back to local file system.');
          this.useBlob = false;
        }
      } else {
        this.useBlob = true;
      }
    } else {
      this.useBlob = false;
    }
  }

  /**
   * Đọc dữ liệu từ JSON file
   */
  async read<T = any>(filename: string): Promise<T[]> {
    try {
      if (this.useBlob) {
        return await this.readFromBlob(filename);
      } else {
        return await this.readFromLocal(filename);
      }
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  /**
   * Ghi dữ liệu vào JSON file
   */
  async write<T = any>(filename: string, data: T[]): Promise<void> {
    try {
      if (this.useBlob) {
        await this.writeToBlob(filename, data);
      } else {
        await this.writeToLocal(filename, data);
      }
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Tìm một item theo ID
   */
  async findById<T extends { id: string }>(
    filename: string,
    id: string
  ): Promise<T | null> {
    const data = await this.read<T>(filename);
    return data.find((item) => item.id === id) || null;
  }

  /**
   * Tìm nhiều items theo danh sách IDs (batch loading)
   * Tránh việc gọi read() nhiều lần trong vòng lặp
   */
  async findByIds<T extends { id: string }>(
    filename: string,
    ids: string[]
  ): Promise<Map<string, T>> {
    if (ids.length === 0) {
      return new Map();
    }
    
    // Chỉ đọc file một lần thay vì nhiều lần
    const data = await this.read<T>(filename);
    const idSet = new Set(ids);
    const result = new Map<string, T>();
    
    for (const item of data) {
      if (idSet.has(item.id)) {
        result.set(item.id, item);
      }
    }
    
    return result;
  }

  /**
   * Tìm nhiều items theo điều kiện
   */
  async find<T = any>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const data = await this.read<T>(filename);
    return data.filter(predicate);
  }

  /**
   * Thêm một item mới
   */
  async create<T extends { id: string }>(
    filename: string,
    item: T
  ): Promise<T> {
    const data = await this.read<T>(filename);
    
    // Kiểm tra duplicate ID
    if (data.some((existing) => existing.id === item.id)) {
      throw new Error(`Item with ID ${item.id} already exists`);
    }

    data.push(item);
    await this.write(filename, data);
    return item;
  }

  /**
   * Thêm nhiều items cùng lúc (batch create)
   * Tối ưu hơn việc gọi create() nhiều lần trong vòng lặp
   */
  async createMany<T extends { id: string }>(
    filename: string,
    items: T[]
  ): Promise<T[]> {
    if (items.length === 0) {
      return [];
    }

    const data = await this.read<T>(filename);
    
    // Kiểm tra duplicate IDs
    const existingIds = new Set(data.map(item => item.id));
    const duplicateIds = items.filter(item => existingIds.has(item.id));
    
    if (duplicateIds.length > 0) {
      throw new Error(`Items with IDs ${duplicateIds.map(i => i.id).join(', ')} already exist`);
    }

    // Thêm tất cả items cùng lúc
    data.push(...items);
    await this.write(filename, data);
    return items;
  }

  /**
   * Cập nhật một item theo ID
   */
  async update<T extends { id: string }>(
    filename: string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const data = await this.read<T>(filename);
    const index = data.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    data[index] = { ...data[index], ...updates, id }; // Preserve ID
    await this.write(filename, data);
    return data[index];
  }

  /**
   * Xóa một item theo ID
   */
  async delete<T extends { id: string }>(
    filename: string,
    id: string
  ): Promise<boolean> {
    const data = await this.read<T>(filename);
    const initialLength = data.length;
    const filtered = data.filter((item) => item.id !== id);

    if (filtered.length === initialLength) {
      return false; // Not found
    }

    await this.write(filename, filtered);
    return true;
  }

  /**
   * Xóa nhiều items theo điều kiện
   */
  async deleteMany<T = any>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<number> {
    const data = await this.read<T>(filename);
    const initialLength = data.length;
    const filtered = data.filter((item) => !predicate(item));
    const deletedCount = initialLength - filtered.length;

    if (deletedCount > 0) {
      await this.write(filename, filtered);
    }

    return deletedCount;
  }

  /**
   * Đếm số lượng items
   */
  async count<T = any>(
    filename: string,
    predicate?: (item: T) => boolean
  ): Promise<number> {
    const data = await this.read<T>(filename);
    return predicate ? data.filter(predicate).length : data.length;
  }

  /**
   * Phân trang dữ liệu
   */
  async paginate<T = any>(
    filename: string,
    page: number = 1,
    limit: number = 10,
    predicate?: (item: T) => boolean
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let data = await this.read<T>(filename);
    
    if (predicate) {
      data = data.filter(predicate);
    }

    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // ===== PRIVATE METHODS =====

  private async readFromLocal<T>(filename: string): Promise<T[]> {
    const filepath = join(this.dataDir, filename);
    try {
      const content = await readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      throw error;
    }
  }

  private async writeToLocal<T>(filename: string, data: T[]): Promise<void> {
    // Check if we're on Vercel (read-only file system)
    if (process.env.VERCEL) {
      const error = new Error(`Cannot write to file system on Vercel. File system is read-only. Please set BLOB_READ_WRITE_TOKEN environment variable to use Vercel Blob Storage.`);
      (error as any).code = 'EROFS';
      (error as any).syscall = 'open';
      (error as any).path = join(this.dataDir, filename);
      throw error;
    }
    
    const filepath = join(this.dataDir, filename);
    try {
      await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error: any) {
      // If we get EROFS error, provide helpful message
      if (error.code === 'EROFS') {
        const helpfulError = new Error(`Cannot write to file system: ${error.message}. On Vercel, file system is read-only. Please set BLOB_READ_WRITE_TOKEN environment variable to use Vercel Blob Storage.`);
        (helpfulError as any).code = 'EROFS';
        (helpfulError as any).syscall = error.syscall;
        (helpfulError as any).path = error.path;
        throw helpfulError;
      }
      throw error;
    }
  }

  private async readFromBlob<T>(filename: string): Promise<T[]> {
    try {
      // Try data/${filename} first (preferred location)
      const blobPath = `data/${filename}`;
      
      // List blobs with exact path match
      const { blobs } = await list({ prefix: blobPath });
      
      // Find exact match (not just prefix match)
      const targetBlob = blobs.find(blob => blob.pathname === blobPath);
      
      if (targetBlob) {
        // Fetch the blob content
        const response = await fetch(targetBlob.url);
        
        // Check if response is OK and content-type is JSON
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        const content = await response.text();
        
        // Validate that content is valid JSON (not HTML or error page)
        const trimmedContent = content.trim();
        if (!trimmedContent.startsWith('[') && !trimmedContent.startsWith('{')) {
          console.error(`Invalid JSON format for ${blobPath}: content starts with "${trimmedContent.substring(0, 50)}"`);
          console.error(`Content-Type: ${contentType}, URL: ${targetBlob.url}`);
          // Try root level as fallback
          throw new Error('Invalid JSON format, trying root level');
        }
        
        return JSON.parse(content);
      }
      
      // If not found at data/, try root level (backward compatibility)
      const { blobs: rootBlobs } = await list({ prefix: filename });
      const rootBlob = rootBlobs.find(blob => blob.pathname === filename);
      
      if (rootBlob) {
        const response = await fetch(rootBlob.url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        const content = await response.text();
        
        // Validate that content is valid JSON
        const trimmedContent = content.trim();
        if (!trimmedContent.startsWith('[') && !trimmedContent.startsWith('{')) {
          console.error(`Invalid JSON format for ${filename} at root: content starts with "${trimmedContent.substring(0, 50)}"`);
          console.error(`Content-Type: ${contentType}, URL: ${rootBlob.url}`);
          console.error(`This might indicate the blob contains HTML or incorrect content. Please verify the file was uploaded correctly.`);
          return [];
        }
        
        return JSON.parse(content);
      }
      
      // File doesn't exist at either location
      console.warn(`No blob found for ${filename} at ${blobPath} or root level`);
      return [];
    } catch (error: any) {
      console.error(`Blob read error for ${filename}:`, error);
      // If it's a JSON parse error, log more details
      if (error.message?.includes('JSON') || error.message?.includes('Unexpected token')) {
        console.error(`JSON parse error - this might indicate the blob contains HTML or incorrect content`);
        console.error(`Please verify that ${filename} was uploaded correctly to blob storage at path: data/${filename}`);
      }
      return [];
    }
  }

  private async writeToBlob<T>(filename: string, data: T[]): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    
    // Always use data/${filename} path - no need to check/list
    // This reduces blob operations from 2 per write to just 1
    const blobPath = `data/${filename}`;
    
    await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
  }

  /**
   * List all JSON files
   * Note: This still uses list() but is rarely called
   * Consider caching or removing if not needed
   */
  async listFiles(): Promise<string[]> {
    if (this.useBlob) {
      // Only use list when absolutely necessary (this is an advanced operation)
      const { blobs } = await list({ prefix: 'data/' });
      return blobs.map((blob) => blob.pathname.replace('data/', ''));
    } else {
      // Local file listing would go here
      return [];
    }
  }

  /**
   * Delete a JSON file completely
   */
  async deleteFile(filename: string): Promise<void> {
    if (this.useBlob) {
      await del(`data/${filename}`);
    } else {
      const filepath = join(this.dataDir, filename);
      await writeFile(filepath, '[]', 'utf-8');
    }
  }
}

// Singleton instance - auto-detect if we should use Blob based on environment
// On Vercel, file system is read-only, so we MUST use Blob Storage
// Also use Blob if BLOB_READ_WRITE_TOKEN is provided (even in development)

// Determine if we should use Blob Storage
// On Vercel, file system is read-only - MUST use Blob Storage
let shouldUseBlob = false;

if (process.env.VERCEL) {
  // On Vercel, file system is read-only - MUST use Blob Storage
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // This will be handled in constructor - it will throw error if useBlob=true but no token
    // But we still need to set shouldUseBlob=true to force Blob usage
    // The constructor will throw a clear error message
    shouldUseBlob = true; // Force Blob, constructor will check token and throw if missing
  } else {
    shouldUseBlob = true;
  }
} else if (process.env.BLOB_READ_WRITE_TOKEN) {
  // Not on Vercel, but token is provided - use Blob Storage (optional)
  shouldUseBlob = true;
}

export const storage = new JSONStorage(shouldUseBlob);

// Helper functions for common operations
export const createRecord = <T extends { id: string }>(
  filename: string,
  data: T
) => storage.create(filename, data);

export const findRecord = <T extends { id: string }>(
  filename: string,
  id: string
) => storage.findById<T>(filename, id);

export const updateRecord = <T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
) => storage.update(filename, id, updates);

export const deleteRecord = <T extends { id: string }>(
  filename: string,
  id: string
) => storage.delete(filename, id);

export const getAllRecords = <T = any>(filename: string) =>
  storage.read<T>(filename);

export const queryRecords = <T = any>(
  filename: string,
  predicate: (item: T) => boolean
) => storage.find<T>(filename, predicate);

