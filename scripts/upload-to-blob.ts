/**
 * Script to upload data files to Vercel Blob Storage
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/upload-to-blob.ts
 * 
 * Or set BLOB_READ_WRITE_TOKEN in .env file
 */

import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';

async function uploadToBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN is not set!');
    console.error('Please set BLOB_READ_WRITE_TOKEN environment variable.');
    console.error('Example: BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/upload-to-blob.ts');
    process.exit(1);
  }

  const dataDir = join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Error: Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.warn('⚠️ Warning: No JSON files found in data directory');
    return;
  }

  console.log(`📦 Found ${files.length} JSON files to upload:`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const filePath = join(dataDir, file);
      const content = await readFile(filePath, 'utf-8');
      
      // Validate JSON
      JSON.parse(content);
      
      const blobPath = `data/${file}`;
      
      console.log(`📤 Uploading ${file}...`);
      
      await put(blobPath, content, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      
      console.log(`✅ Uploaded ${file} to ${blobPath}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('');
    console.log('🎉 All files uploaded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set BLOB_READ_WRITE_TOKEN in Vercel environment variables');
    console.log('2. Redeploy your Vercel project');
    console.log('3. Test sending a message');
  }
}

uploadToBlob().catch((error) => {
  console.error('❌ Upload failed:', error);
  process.exit(1);
});

