import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || null,
  jwtSecret: process.env.JWT_SECRET || null,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || null,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openrouter/free',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || null,
};

export const isProd = env.nodeEnv === 'production';