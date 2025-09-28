const validateEnvironment = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const optionalVars = [
    'OPENAI_API_KEY',
    'FRONTEND_URL',
    'TWITTER_API_KEY',
    'LINKEDIN_CLIENT_ID',
    'INSTAGRAM_APP_ID',
    'FACEBOOK_APP_ID'
  ];

  console.log('🔍 Validating environment variables...');

  const missingRequired = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please check your .env file or Render environment variables');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');

  // Check optional variables
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.log('⚠️  Optional environment variables not set:');
    missingOptional.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('   These are optional but may limit functionality');
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('mongodb')) {
    console.error('❌ MONGODB_URI appears to be invalid (should start with mongodb:// or mongodb+srv://)');
    process.exit(1);
  }

  // Validate OpenAI API key format (if provided)
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('⚠️  OPENAI_API_KEY appears to be invalid (should start with sk-). AI features may not work.');
  }

  console.log('✅ Environment validation complete\n');
};

module.exports = validateEnvironment;