#!/usr/bin/env node

/**
 * Seed script runner
 * This script uses tsx to run the TypeScript seed file
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🌱 Running database seed...\n');

// Use tsx to run TypeScript directly
const seedFile = path.join(__dirname, '..', 'lib', 'seed.ts');
const process = spawn('npx', ['tsx', seedFile], {
  stdio: 'inherit',
  shell: true
});

process.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Seed completed successfully!');
  } else {
    console.error('\n❌ Seed failed with exit code:', code);
    process.exit(code);
  }
});

process.on('error', (error) => {
  console.error('❌ Error running seed:', error);
  process.exit(1);
});

