import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const sameSiteRaw = (process.env.COOKIE_SAME_SITE || 'none').toLowerCase();
const cookieSameSite: 'lax' | 'strict' | 'none' =
  sameSiteRaw === 'lax' ? 'lax' : sameSiteRaw === 'strict' ? 'strict' : 'none';

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  /** Comma-separated list of allowed browser origins. */
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  /**
   * 'lax' for same-site deployments (default). Set to 'none' when the API and
   * the SPA live on different domains (e.g. Vercel + Render); 'none' forces
   * the Secure flag so it only works over HTTPS.
   */
  cookieSameSite,
  isProduction: process.env.NODE_ENV === 'production',
};
