import { env } from '../config/env.js';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from './logger.js';

function ensureInitialized() {
  if (getApps().length > 0) return;

  const { projectId, clientEmail, privateKey } = env.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function verifyFirebaseIdToken(idToken: string) {
  ensureInitialized();
  try {
    return await getAuth().verifyIdToken(idToken);
  } catch (err) {
    logger.warn('verifyIdToken failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

