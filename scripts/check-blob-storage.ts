/**
 * Script to check if files are uploaded to Blob Storage
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/check-blob-storage.ts
 */

import { list } from '@vercel/blob';
import * as fs from 'fs';
import { join } from 'path';

async function checkBlobStorage() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN is not set!');
    console.error('Please set BLOB_READ_WRITE_TOKEN environment variable.');
    process.exit(1);
  }

  console.log('🔍 Checking Blob Storage...\n');

  // List all files in data/ folder
  const dataDir = join(process.cwd(), 'data');
  const localFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Local files (${localFiles.length}):`);
  localFiles.forEach(f => console.log(`   - ${f}`));
  console.log('');

  // List all blobs in Blob Storage
  try {
    const { blobs } = await list({ prefix: 'data/' });
    const blobFiles = blobs.map(b => b.pathname.replace('data/', ''));
    
    console.log(`☁️  Blob Storage files (${blobFiles.length}):`);
    blobFiles.forEach(f => console.log(`   - ${f}`));
    console.log('');

    // Compare
    const missingFiles = localFiles.filter(f => !blobFiles.includes(f));
    const extraFiles = blobFiles.filter(f => !localFiles.includes(f));

    if (missingFiles.length > 0) {
      console.log('❌ Missing files (not uploaded):');
      missingFiles.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (extraFiles.length > 0) {
      console.log('⚠️  Extra files (in blob but not local):');
      extraFiles.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (missingFiles.length === 0 && extraFiles.length === 0) {
      console.log('✅ All files are uploaded and synced!');
    } else {
      console.log('⚠️  Files are not synced. Run upload script:');
      console.log('   npx tsx scripts/upload-to-blob.ts');
    }
  } catch (error: any) {
    console.error('❌ Error checking Blob Storage:', error.message);
    if (error.message.includes('403') || error.message.includes('blocked')) {
      console.error('');
      console.error('💡 Blob Storage might be blocked due to usage limits.');
      console.error('💡 Solutions:');
      console.error('   1. Wait for usage limit reset');
      console.error('   2. Upgrade to Pro plan');
      console.error('   3. Deploy on Render with local storage');
    }
    process.exit(1);
  }
}

checkBlobStorage().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

