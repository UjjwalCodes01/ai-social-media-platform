#!/usr/bin/env node

// Environment Check Script
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_HOTJAR_ID'
];

console.log('🔍 Environment Variables Check\n');

// Check required variables
let allRequired = true;
console.log('📋 Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allRequired = false;
  }
});

// Check optional variables
console.log('\n🔧 Optional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (allRequired) {
  console.log('✅ All required environment variables are set!');
  console.log('🚀 Ready for deployment!');
  process.exit(0);
} else {
  console.log('❌ Missing required environment variables!');
  console.log('📖 Check DEPLOYMENT.md for setup instructions.');
  process.exit(1);
}