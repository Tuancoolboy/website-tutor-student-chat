/**
 * Script to test if BLOB_READ_WRITE_TOKEN is valid
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/test-blob-token.ts
 */

import { list } from '@vercel/blob';

async function testToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN is not set!');
    process.exit(1);
  }

  console.log('🔍 Testing BLOB_READ_WRITE_TOKEN...');
  console.log(`Token prefix: ${token.substring(0, 20)}...`);
  console.log('');

  try {
    // Try to list blobs (this will fail if token is invalid)
    const result = await list({ limit: 1 });
    console.log('✅ Token is valid!');
    console.log(`   Found ${result.blobs.length} blob(s) in store`);
    console.log('');
    console.log('💡 Next step: Run upload script');
    console.log('   npm run upload:blob');
  } catch (error: any) {
    console.error('❌ Token is invalid or does not have permission!');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('💡 Solutions:');
    console.error('1. Check if token is correct in Vercel Dashboard');
    console.error('2. Make sure you copied the FULL token (including prefix)');
    console.error('3. Verify token has "read" and "write" permissions');
    console.error('4. Check if Blob Store exists in Vercel Dashboard');
    console.error('');
    console.error('📍 How to get token:');
    console.error('1. Go to Vercel Dashboard → Your Project');
    console.error('2. Go to Storage → Blob');
    console.error('3. Create Blob Store (if not exists)');
    console.error('4. Copy BLOB_READ_WRITE_TOKEN');
    process.exit(1);
  }
}

testToken().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

