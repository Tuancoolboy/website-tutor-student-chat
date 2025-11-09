#!/usr/bin/env ts-node

/**
 * Data Validation Script
 * Team B - Ngày 1-2
 * 
 * Validates all JSON database files for integrity
 */

import { validateAllData, generateDataStats } from '../lib/dataValidator';

async function main() {
  console.log('🚀 Starting Data Validation\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Run validation
    const result = await validateAllData();

    console.log('\n');
    console.log('=' .repeat(60));
    console.log('\n📋 VALIDATION SUMMARY\n');

    // Display errors
    if (result.errors.length > 0) {
      console.log('❌ ERRORS:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log();
    }

    // Display warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log();
    }

    // Overall status
    if (result.valid) {
      console.log('✅ ALL DATA VALID!\n');
    } else {
      console.log('❌ DATA VALIDATION FAILED!\n');
      process.exit(1);
    }

    // Generate statistics
    console.log('=' .repeat(60));
    console.log('\n📊 DATA STATISTICS\n');
    await generateDataStats();

    console.log('\n');
    console.log('=' .repeat(60));
    console.log('\n✨ Validation complete!\n');

  } catch (error: any) {
    console.error('\n❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

