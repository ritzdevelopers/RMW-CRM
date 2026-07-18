import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 5000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME', 'mpf_crm'),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    /** Required for Aiven and most managed MySQL providers. */
    ssl: process.env.DB_SSL === 'true',
    /** Path to CA cert (e.g. ca.pem). Defaults to backend/ca.pem when SSL is on. */
    sslCa: process.env.DB_SSL_CA ?? '',
    /**
     * PEM contents of the CA cert (preferred on Render / CI).
     * Supports literal `\n` escapes from env UIs.
     */
    sslCaCert: (process.env.DB_CA_CERT ?? '').replace(/\\n/g, '\n'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    refreshName: 'mpf_rt',
  },

  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'MPF CRM <no-reply@mypropertyfact.com>',
  },

  appUrl: process.env.APP_URL ?? 'http://localhost:3000',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },

  seed: {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@mypropertyfact.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
    name: process.env.SEED_ADMIN_NAME ?? 'MPF Super Admin',
  },

  mpf: {
    /** Shared secret for MPF → CRM webhook and CRM → MPF export */
    webhookKey: process.env.MPF_CRM_WEBHOOK_KEY ?? '',
    apiUrl: process.env.MPF_API_URL ?? 'https://apis.mypropertyfact.in/api/v1',
    apiKey: process.env.MPF_CRM_WEBHOOK_KEY ?? '',
  },
};
