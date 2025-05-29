require('dotenv').config();

console.log('Loading config...');  
console.log('OpenAI API key available:', process.env.OPENAI_API_KEY ? 'Yes (starts with ' + process.env.OPENAI_API_KEY.substring(0, 3) + '...)' : 'No');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8000,
  jwtSecret: process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
  jwtExpiryTime: process.env.JWT_EXPIRY || '1d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'YOUR_REFRESH_SECRET',
  refreshTokenExpiryTime: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fizztask',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: (() => {
    console.log('=== Google Callback URL Configuration ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('GOOGLE_CALLBACK_URL env var:', process.env.GOOGLE_CALLBACK_URL);
    
    const callbackUrl = process.env.NODE_ENV === 'production' 
      ? 'https://fizztask.com/auth/gmail/callback'
      : process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/gmail/callback';
    
    console.log('Final callback URL:', callbackUrl);
    console.log('==========================================');
    
    return callbackUrl;
  })(),
  openaiApiKey: process.env.OPENAI_API_KEY,
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },
  appUrl: process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001']
};

module.exports = config;
