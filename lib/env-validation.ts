// Environment variable validation and database configuration
export const validateEnvironment = () => {
  const requiredEnvVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  // Check for missing variables
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }

  // Validate DATABASE_URL format
  if (requiredEnvVars.DATABASE_URL) {
    try {
      const url = new URL(requiredEnvVars.DATABASE_URL);
      if (!url.protocol.startsWith('postgres')) {
        invalidVars.push('DATABASE_URL (must be a PostgreSQL connection string)');
      }
    } catch (error) {
      invalidVars.push('DATABASE_URL (invalid URL format)');
    }
  }

  // Report validation results
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
  }

  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables:', invalidVars.join(', '));
  }

  if (missingVars.length > 0 || invalidVars.length > 0) {
    throw new Error('Environment validation failed. Check your .env configuration.');
  }

  console.log('✅ Environment variables validated successfully');
  return true;
};

export const getDatabaseConfig = () => {
  validateEnvironment();
  
  return {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000'),
  };
};

export const getAppConfig = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    authSecret: process.env.AUTH_SECRET!,
  };
}; 