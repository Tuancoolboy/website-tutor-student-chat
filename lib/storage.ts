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
  // Cache blob URLs to avoid list() operations (Advanced Operations are limited to 2k/month)
  private blobUrlCache: Map<string, string> = new Map();

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
    } catch (error: any) {
      console.error(`[Storage] Error reading ${filename}:`, error.message);
      // For critical files like users.json, we should throw the error
      // instead of returning empty array to avoid silent failures
      if (filename === 'users.json' || filename === 'messages.json' || filename === 'conversations.json') {
        console.error(`[Storage] Critical file ${filename} failed to load. Throwing error.`);
        throw error;
      }
      // For non-critical files, return empty array
      console.warn(`[Storage] Non-critical file ${filename} failed to load. Returning empty array.`);
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
      // Check if BLOB_READ_WRITE_TOKEN is set
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error(`[Blob Storage] BLOB_READ_WRITE_TOKEN is not set! Cannot read ${filename}`);
        throw new Error(`BLOB_READ_WRITE_TOKEN is required to read from Blob Storage. Please set it in environment variables.`);
      }

      // Try data/${filename} first (preferred location)
      const blobPath = `data/${filename}`;
      
      // Check cache first to avoid list() operations
      let blobUrl = this.blobUrlCache.get(blobPath);
      
      if (!blobUrl) {
        // URL not in cache, need to find it using list() (Advanced Operation - use sparingly)
        // Only do this once per file, then cache the URL
        console.log(`[Blob Storage] URL not in cache, finding blob for ${blobPath}...`);
        try {
          const result = await list({ prefix: blobPath });
          const targetBlob = result.blobs.find(blob => blob.pathname === blobPath);
          if (targetBlob) {
            blobUrl = targetBlob.url;
            this.blobUrlCache.set(blobPath, blobUrl);
            console.log(`[Blob Storage] Found and cached URL for ${blobPath}`);
          }
        } catch (listError: any) {
          console.error(`[Blob Storage] Error listing blobs for ${blobPath}:`, listError.message);
          // Try root level as fallback
          try {
            const rootResult = await list({ prefix: filename });
            const rootBlob = rootResult.blobs.find(blob => blob.pathname === filename);
            if (rootBlob) {
              blobUrl = rootBlob.url;
              this.blobUrlCache.set(filename, blobUrl);
              console.log(`[Blob Storage] Found and cached URL for ${filename} at root level`);
            }
          } catch (rootListError: any) {
            throw new Error(`Failed to find blob for ${filename}: ${listError.message}`);
          }
        }
      } else {
        console.log(`[Blob Storage] Using cached URL for ${blobPath}`);
      }
      
      if (!blobUrl) {
        throw new Error(`No blob found for ${filename} at ${blobPath} or root level. Please upload the file to Blob Storage.`);
      }
      
      // Fetch blob using cached URL (this doesn't count as Advanced Operation)
      let response: Response;
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        response = await fetch(blobUrl, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
      } catch (fetchError: any) {
        // URL might be stale, clear cache and retry once
        console.warn(`[Blob Storage] Failed to fetch from cached URL, clearing cache for ${blobPath}`);
        this.blobUrlCache.delete(blobPath);
        this.blobUrlCache.delete(filename);
        throw new Error(`Failed to fetch blob: ${fetchError.message}. Cache cleared, will retry on next request.`);
      }
      
      // Check if response is OK
      if (!response.ok) {
        // If 404, clear cache and throw error
        if (response.status === 404) {
          this.blobUrlCache.delete(blobPath);
          this.blobUrlCache.delete(filename);
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[Blob Storage] Failed to fetch blob: ${response.status} ${response.statusText}`, errorText.substring(0, 200));
        if (response.status === 403) {
          throw new Error(`403 Forbidden: Blob may not be public or token is invalid. Please verify blob was uploaded with access: 'public' or check BLOB_READ_WRITE_TOKEN.`);
        }
        throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}. ${errorText.substring(0, 100)}`);
      }
      
      const content = await response.text();
      
      // Validate that content is valid JSON (not HTML or error page)
      const trimmedContent = content.trim();
      if (!trimmedContent.startsWith('[') && !trimmedContent.startsWith('{')) {
        console.error(`[Blob Storage] Invalid JSON format for ${blobPath}: content starts with "${trimmedContent.substring(0, 100)}"`);
        console.error(`[Blob Storage] Content length: ${content.length} bytes`);
        throw new Error(`Invalid JSON format for ${blobPath}. Content appears to be HTML or error page instead of JSON. Please verify the file was uploaded correctly.`);
      }
      
      try {
        const parsed = JSON.parse(content);
        console.log(`[Blob Storage] Successfully read ${filename}, found ${Array.isArray(parsed) ? parsed.length : 'N/A'} items`);
        return parsed;
      } catch (parseError: any) {
        console.error(`[Blob Storage] JSON parse error for ${blobPath}:`, parseError.message);
        console.error(`[Blob Storage] Content preview: ${trimmedContent.substring(0, 200)}`);
        throw new Error(`Failed to parse JSON from ${blobPath}: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error(`[Blob Storage] Error reading ${filename}:`, error.message);
      console.error(`[Blob Storage] Error stack:`, error.stack);
      // Re-throw the error instead of returning empty array
      // This allows the calling code to handle the error appropriately
      throw error;
    }
  }

  private async writeToBlob<T>(filename: string, data: T[]): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    
    // Always use data/${filename} path - no need to check/list
    // This reduces blob operations from 2 per write to just 1
    const blobPath = `data/${filename}`;
    
    const result = await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    // Cache the URL after writing to avoid list() on next read
    if (result.url) {
      this.blobUrlCache.set(blobPath, result.url);
      console.log(`[Blob Storage] Cached URL for ${blobPath} after write`);
    }
  }

  /**
   * List all JSON files
   * WARNING: This uses list() which is an Advanced Operation (counts toward 2k/month limit)
   * Only use this when absolutely necessary. Consider caching the result.
   * For blob storage, we can't avoid list() here, but this function is rarely called.
   */
  async listFiles(): Promise<string[]> {
    if (this.useBlob) {
      // WARNING: list() is an Advanced Operation - use sparingly
      // Consider caching results or removing this function if not needed
      try {
        const { blobs } = await list({ prefix: 'data/' });
        return blobs.map((blob) => blob.pathname.replace('data/', ''));
      } catch (error: any) {
        console.error('[Blob Storage] Error listing files:', error.message);
        // Return empty array instead of throwing to avoid breaking the app
        return [];
      }
    } else {
      // Local file listing - read from file system
      try {
        const { readdir } = await import('fs/promises');
        const files = await readdir(this.dataDir);
        return files.filter(file => file.endsWith('.json'));
      } catch (error: any) {
        console.error('[Storage] Error listing local files:', error.message);
        return [];
      }
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
// On other platforms (Render, Railway, local), can use local file system
let shouldUseBlob = false;

// Check if user explicitly wants to use local storage (disable blob)
const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';

if (useLocalStorage) {
  // User explicitly wants local storage
  if (process.env.VERCEL) {
    // On Vercel, cannot use local storage - file system is read-only
    console.error('[Storage] ERROR: Cannot use local storage on Vercel. File system is read-only.');
    console.error('[Storage] Please remove USE_LOCAL_STORAGE=true or deploy on Render/Railway instead.');
    throw new Error('Cannot use local storage on Vercel. File system is read-only. Deploy on Render/Railway instead.');
  }
  // Not on Vercel - can use local storage
  shouldUseBlob = false;
  console.log('[Storage] Using local file system (blob storage disabled via USE_LOCAL_STORAGE=true)');
} else {
  // Auto-detect: use blob if on Vercel or if BLOB_READ_WRITE_TOKEN is provided
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
    console.log('[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)');
  } else {
    // Not on Vercel, no token - use local file system
    shouldUseBlob = false;
    console.log('[Storage] Using local file system (no BLOB_READ_WRITE_TOKEN found)');
  }
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

