#!/usr/bin/env node

/**
 * Script to check if document extraction dependencies are installed
 * and provide instructions to enable the feature
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking document extraction dependencies...\n');

const requiredPackages = [
  'pdf-parse',
  'mammoth', 
  'xlsx',
  'natural',
  'compromise',
  'file-type',
  'mime-types'
];

const missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} - installed`);
  } catch (e) {
    console.log(`❌ ${pkg} - NOT installed`);
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.log('\n⚠️  Missing packages detected!');
  console.log('\nTo install missing packages, run:');
  console.log(`\n  npm install ${missingPackages.join(' ')}\n`);
  console.log('Or simply run:\n');
  console.log('  npm install\n');
  console.log('After installing, you need to:');
  console.log('1. Uncomment document routes in server.js (lines 145 and 169)');
  console.log('2. Uncomment EmailAttachments in frontend EmailDetail.js (lines 451-459)');
  console.log('3. Restart the server\n');
} else {
  console.log('\n✅ All dependencies installed!');
  console.log('\nTo enable document extraction:');
  console.log('1. Uncomment document routes in server.js (lines 145 and 169)');
  console.log('2. Uncomment EmailAttachments in frontend EmailDetail.js (lines 451-459)');
  console.log('3. Restart the server\n');
  console.log('Document extraction features:');
  console.log('- Extract tasks from PDF documents');
  console.log('- Extract tasks from Word documents (.doc, .docx)');
  console.log('- Extract tasks from Excel spreadsheets (.xls, .xlsx)');
  console.log('- Extract tasks from CSV files');
  console.log('- Extract tasks from text files');
  console.log('- Natural language processing for better task detection\n');
}