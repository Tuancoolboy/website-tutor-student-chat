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
      
      // If error is about file not found (first time use), return empty array for ALL files
      // This allows creating the first item in a new file (forum-posts.json, etc.)
      if (error.message.includes('No blob found') || 
          error.message.includes('not found') ||
          error.message.includes('ENOENT') ||
          (error.code && error.code === 'ENOENT')) {
        console.log(`[Storage] File ${filename} doesn't exist yet. This is normal for new files. Returning empty array.`);
        return [];
      }
      
      // For critical files, throw error for other types of errors (403, 500, network errors, etc.)
      // For non-critical files, return empty array but log warning
      const criticalFiles = ['users.json', 'messages.json', 'conversations.json'];
      if (criticalFiles.includes(filename)) {
        console.error(`[Storage] Critical file ${filename} failed to load. Error:`, error.message);
        console.error(`[Storage] Error stack:`, error.stack);
        throw error;
      }
      // For non-critical files (including forum-posts.json), return empty array but log warning
      console.warn(`[Storage] Non-critical file ${filename} failed to load. Returning empty array. Error:`, error.message);
      return [];
    }
  }

  /**
   * Ghi dữ liệu vào JSON file
   */
  async write<T = any>(filename: string, data: T[]): Promise<void> {
    console.log(`[Storage] Writing to ${filename}, using ${this.useBlob ? 'Blob Storage' : 'local file system'}, data length: ${data.length}`);
    try {
      if (this.useBlob) {
        await this.writeToBlob(filename, data);
        console.log(`[Storage] Successfully wrote to Blob Storage: ${filename}`);
      } else {
        await this.writeToLocal(filename, data);
        console.log(`[Storage] Successfully wrote to local file: ${filename}`);
      }
    } catch (error: any) {
      console.error(`[Storage] Error writing to ${filename}:`, error.message);
      console.error(`[Storage] Error stack:`, error.stack);
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
    console.log(`[Storage] Creating item in ${filename}:`, item.id);
    const data = await this.read<T>(filename);
    console.log(`[Storage] Current data length in ${filename}:`, data.length);
    
    // Kiểm tra duplicate ID
    if (data.some((existing) => existing.id === item.id)) {
      throw new Error(`Item with ID ${item.id} already exists`);
    }

    data.push(item);
    console.log(`[Storage] Writing ${data.length} items to ${filename}...`);
    await this.write(filename, data);
    console.log(`[Storage] Successfully wrote to ${filename}`);
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
          console.log(`[Blob Storage] Found ${result.blobs.length} blobs with prefix ${blobPath}`);
          const targetBlob = result.blobs.find(blob => blob.pathname === blobPath);
          if (targetBlob) {
            blobUrl = targetBlob.url;
            this.blobUrlCache.set(blobPath, blobUrl);
            console.log(`[Blob Storage] Found and cached URL for ${blobPath}: ${blobUrl}`);
          } else {
            console.log(`[Blob Storage] Blob not found at ${blobPath}, trying root level...`);
            // Try root level as fallback
            try {
              const rootResult = await list({ prefix: filename });
              console.log(`[Blob Storage] Found ${rootResult.blobs.length} blobs with prefix ${filename}`);
              const rootBlob = rootResult.blobs.find(blob => blob.pathname === filename);
              if (rootBlob) {
                blobUrl = rootBlob.url;
                this.blobUrlCache.set(filename, blobUrl);
                console.log(`[Blob Storage] Found and cached URL for ${filename} at root level: ${blobUrl}`);
              }
            } catch (rootListError: any) {
              console.error(`[Blob Storage] Error listing blobs at root level:`, rootListError.message);
              // File doesn't exist - return empty array for first-time use
              console.log(`[Blob Storage] File ${filename} doesn't exist yet. Returning empty array.`);
              return [];
            }
          }
      } catch (listError: any) {
        console.error(`[Blob Storage] Error listing blobs for ${blobPath}:`, listError.message);
          // File doesn't exist - return empty array for first-time use
          console.log(`[Blob Storage] File ${filename} doesn't exist yet (error listing). Returning empty array.`);
          return [];
        }
      } else {
        console.log(`[Blob Storage] Using cached URL for ${blobPath}: ${blobUrl.substring(0, 50)}...`);
      }
      
      if (!blobUrl) {
        // File doesn't exist yet - this is OK for first-time use
        // Return empty array so we can create the first item
        console.log(`[Blob Storage] No blob found for ${filename} at ${blobPath} or root level. This is normal for new files. Returning empty array.`);
        return [];
      }
      
      // Fetch blob using cached URL (this doesn't count as Advanced Operation)
      // Try without token first (if blob is public), then with token if needed
        let response: Response;
        try {
        // First try: Fetch without token (for public blobs)
        console.log(`[Blob Storage] Fetching from URL: ${blobUrl.substring(0, 80)}...`);
        response = await fetch(blobUrl);
        console.log(`[Blob Storage] Fetch response status: ${response.status} ${response.statusText}`);
        
        // If 403, try with token
        if (response.status === 403) {
          const token = process.env.BLOB_READ_WRITE_TOKEN;
          if (token) {
            console.log(`[Blob Storage] Got 403, retrying with token...`);
            response = await fetch(blobUrl, {
              headers: {
              'Authorization': `Bearer ${token}`
              }
            });
            console.log(`[Blob Storage] Retry with token status: ${response.status} ${response.statusText}`);
          }
        }
        
        // If 404, file doesn't exist - return empty array
        if (response.status === 404) {
          console.log(`[Blob Storage] Got 404 for ${blobPath}. File doesn't exist. Clearing cache and returning empty array.`);
          this.blobUrlCache.delete(blobPath);
          this.blobUrlCache.delete(filename);
          return [];
        }
      } catch (fetchError: any) {
        // URL might be stale, clear cache
        console.warn(`[Blob Storage] Failed to fetch from cached URL: ${fetchError.message}. Clearing cache for ${blobPath}`);
        this.blobUrlCache.delete(blobPath);
        this.blobUrlCache.delete(filename);
        // If it's a network error or 404, return empty array (file doesn't exist)
        if (fetchError.message.includes('404') || fetchError.message.includes('not found')) {
          console.log(`[Blob Storage] File ${filename} doesn't exist. Returning empty array.`);
          return [];
        }
        throw new Error(`Failed to fetch blob: ${fetchError.message}. Cache cleared, will retry on next request.`);
        }
        
        // Check if response is OK
        if (!response.ok) {
        const errorStatus = response.status;
          const errorText = await response.text().catch(() => 'Unknown error');
        
        // If 403 or 404, clear cache and retry once with fresh list()
        if (errorStatus === 403 || errorStatus === 404) {
          console.warn(`[Blob Storage] Got ${errorStatus} from cached URL for ${blobPath}, clearing cache and retrying...`);
          this.blobUrlCache.delete(blobPath);
          this.blobUrlCache.delete(filename);
          
          // Retry: Get fresh URL using list() and fetch again
          try {
            console.log(`[Blob Storage] Retrying with fresh list() for ${blobPath}...`);
            const retryResult = await list({ prefix: blobPath });
            const retryBlob = retryResult.blobs.find(blob => blob.pathname === blobPath);
            
            if (retryBlob) {
              const freshUrl = retryBlob.url;
              this.blobUrlCache.set(blobPath, freshUrl);
              console.log(`[Blob Storage] Got fresh URL, retrying fetch...`);
              
              // Retry fetch with fresh URL (try without token first, then with token)
              let retryResponse = await fetch(freshUrl);
              
              // If 403, try with token
              if (retryResponse.status === 403) {
                const token = process.env.BLOB_READ_WRITE_TOKEN;
                if (token) {
                  console.log(`[Blob Storage] Retry got 403, trying with token...`);
                  retryResponse = await fetch(freshUrl, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                }
              }
              
              if (!retryResponse.ok) {
                const retryErrorText = await retryResponse.text().catch(() => 'Unknown error');
                console.error(`[Blob Storage] Retry failed: ${retryResponse.status} ${retryResponse.statusText}`, retryErrorText.substring(0, 200));
                if (retryResponse.status === 403) {
                  throw new Error(`403 Forbidden: Blob may not be public or token is invalid. 

CÁCH KHẮC PHỤC:
1. Lấy token mới từ Blob Store:
   - Vào https://vercel.com/dashboard/stores
   - Chọn Blob Store của bạn (ví dụ: website-tutor-student-blob)
   - Vào tab "Settings" → "Tokens"
   - Copy token có dạng: vercel_blob_rw_xxxxx

2. Cập nhật token trên Vercel:
   - Vào https://vercel.com/dashboard → Chọn project của bạn
   - Settings → Environment Variables
   - Tìm BLOB_READ_WRITE_TOKEN → Edit
   - Paste token mới → Save
   - QUAN TRỌNG: Redeploy project để áp dụng thay đổi

3. Nếu vẫn lỗi, upload lại các file:
   - Chạy: BLOB_READ_WRITE_TOKEN=token-mới npm run upload:blob
   - Đảm bảo các file được upload với access: 'public'`);
                }
                throw new Error(`Failed to fetch blob after retry: ${retryResponse.status} ${retryResponse.statusText}. ${retryErrorText.substring(0, 100)}`);
              }
              
              // Success - use retry response
              response = retryResponse;
            } else {
              // Not found at data/, try root level
              console.log(`[Blob Storage] Not found at ${blobPath}, trying root level...`);
              const rootResult = await list({ prefix: filename });
              const rootBlob = rootResult.blobs.find(blob => blob.pathname === filename);
              
              if (rootBlob) {
                const rootUrl = rootBlob.url;
                this.blobUrlCache.set(filename, rootUrl);
                
                // Try without token first (public blob), then with token if needed
                let rootResponse = await fetch(rootUrl);
                
                // If 403, try with token
                if (rootResponse.status === 403) {
                  const token = process.env.BLOB_READ_WRITE_TOKEN;
                  if (token) {
                    console.log(`[Blob Storage] Root level got 403, trying with token...`);
                    rootResponse = await fetch(rootUrl, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                  }
                }
                
                if (!rootResponse.ok) {
                  const rootErrorText = await rootResponse.text().catch(() => 'Unknown error');
                  console.error(`[Blob Storage] Root level fetch failed: ${rootResponse.status} ${rootResponse.statusText}`, rootErrorText.substring(0, 200));
                  if (rootResponse.status === 403) {
                    throw new Error(`403 Forbidden: Blob may not be public or token is invalid. 

CÁCH KHẮC PHỤC:
1. Lấy token mới từ Blob Store:
   - Vào https://vercel.com/dashboard/stores
   - Chọn Blob Store của bạn (ví dụ: website-tutor-student-blob)
   - Vào tab "Settings" → "Tokens"
   - Copy token có dạng: vercel_blob_rw_xxxxx

2. Cập nhật token trên Vercel:
   - Vào https://vercel.com/dashboard → Chọn project của bạn
   - Settings → Environment Variables
   - Tìm BLOB_READ_WRITE_TOKEN → Edit
   - Paste token mới → Save
   - QUAN TRỌNG: Redeploy project để áp dụng thay đổi

3. Nếu vẫn lỗi, upload lại các file:
   - Chạy: BLOB_READ_WRITE_TOKEN=token-mới npm run upload:blob
   - Đảm bảo các file được upload với access: 'public'`);
                  }
                  throw new Error(`Failed to fetch blob at root level: ${rootResponse.status} ${rootResponse.statusText}. ${rootErrorText.substring(0, 100)}`);
                }
                
                // Success - use root response
                response = rootResponse;
              } else {
                // File doesn't exist yet - this is OK for first-time use
                // Return empty array so we can create the first item
                console.log(`[Blob Storage] No blob found for ${filename} at ${blobPath} or root level after retry. This is normal for new files. Returning empty array.`);
                return [];
              }
            }
          } catch (retryError: any) {
            console.error(`[Blob Storage] Retry failed:`, retryError.message);
            // If error is about file not found, return empty array (first time use)
            if (retryError.message.includes('No blob found') || retryError.message.includes('404')) {
              console.log(`[Blob Storage] File ${filename} doesn't exist yet. This is normal for new files. Returning empty array.`);
              return [];
            }
            // If it's still a 403, provide helpful message
            if (retryError.message.includes('403')) {
              throw new Error(`403 Forbidden: Blob may not be public or token is invalid. 

CÁCH KHẮC PHỤC:
1. Lấy token mới từ Blob Store:
   - Vào https://vercel.com/dashboard/stores
   - Chọn Blob Store của bạn (ví dụ: website-tutor-student-blob)
   - Vào tab "Settings" → "Tokens"
   - Copy token có dạng: vercel_blob_rw_xxxxx

2. Cập nhật token trên Vercel:
   - Vào https://vercel.com/dashboard → Chọn project của bạn
   - Settings → Environment Variables
   - Tìm BLOB_READ_WRITE_TOKEN → Edit
   - Paste token mới → Save
   - QUAN TRỌNG: Redeploy project để áp dụng thay đổi

3. Nếu vẫn lỗi, upload lại các file:
   - Chạy: BLOB_READ_WRITE_TOKEN=token-mới npm run upload:blob
   - Đảm bảo các file được upload với access: 'public'

Original error: ${errorText.substring(0, 200)}`);
            }
            throw retryError;
          }
        } else {
          // Other errors (500, etc.)
          console.error(`[Blob Storage] Failed to fetch blob: ${errorStatus}`, errorText.substring(0, 200));
          throw new Error(`Failed to fetch blob: ${errorStatus}. ${errorText.substring(0, 100)}`);
        }
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
    
    console.log(`[Blob Storage] Writing to ${blobPath}, content size: ${content.length} bytes, items: ${data.length}`);
    
    try {
      const result = await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });
    
      console.log(`[Blob Storage] Successfully wrote to ${blobPath}`);
      console.log(`[Blob Storage] Blob details:`, {
        pathname: result.pathname,
        url: result.url
      });
    
      // IMPORTANT: Update cache with the new URL after writing
      // This ensures subsequent reads will use the correct URL
      if (result.url) {
        this.blobUrlCache.set(blobPath, result.url);
        // Also update root level cache if it exists
        this.blobUrlCache.set(filename, result.url);
        console.log(`[Blob Storage] Updated cache with new URL for ${blobPath}`);
        console.log(`[Blob Storage] Cache now contains URL for ${blobPath}: ${result.url.substring(0, 80)}...`);
      } else {
        console.error(`[Blob Storage] WARNING: No URL returned from put() for ${blobPath}`);
      }
    } catch (error: any) {
      console.error(`[Blob Storage] Error writing to ${blobPath}:`, error.message);
      console.error(`[Blob Storage] Error details:`, error);
      console.error(`[Blob Storage] Error stack:`, error.stack);
      throw error;
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

