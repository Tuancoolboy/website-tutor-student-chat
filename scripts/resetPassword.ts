/**
 * Script to reset password for a user
 * Usage: tsx scripts/resetPassword.ts <email> <newPassword>
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { hashPassword } from '../lib/utils.js';

async function resetPassword(email: string, newPassword: string) {
  try {
    const dataDir = join(process.cwd(), 'data');
    const usersFile = join(dataDir, 'users.json');
    
    // Read users
    const usersData = await readFile(usersFile, 'utf-8');
    const users = JSON.parse(usersData);
    
    // Find user
    const userIndex = users.findIndex((u: any) => u.email === email);
    
    if (userIndex === -1) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    
    // Write back
    await writeFile(usersFile, JSON.stringify(users, null, 2), 'utf-8');
    
    console.log(`✅ Password reset successful for: ${email}`);
    console.log(`   New password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3] || 'password123';

if (!email) {
  console.error('❌ Usage: tsx scripts/resetPassword.ts <email> [newPassword]');
  console.error('   Example: tsx scripts/resetPassword.ts hoang.nam.hoang@hcmut.edu.vn password123');
  process.exit(1);
}

resetPassword(email, password);

