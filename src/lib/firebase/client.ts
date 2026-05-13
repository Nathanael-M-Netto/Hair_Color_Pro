import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Configuração do Firebase Web App.
 *
 * Projeto: arte-de-colorir-cabelos (mesmo projeto do app Flutter).
 * Os usuários criados no Flutter podem fazer login aqui sem re-cadastro.
 *
 * Variáveis de ambiente obrigatórias (NEXT_PUBLIC_ para ficarem disponíveis no browser):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * Como obter: Firebase Console → Project Settings → Your apps → Web app
 * (App ID da web: 1:205375342353:web:b07166e0699c88dc1d2eb0)
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'arte-de-colorir-cabelos',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '205375342353',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:205375342353:web:b07166e0699c88dc1d2eb0',
};

/**
 * Singleton da app Firebase — evita re-inicialização no Hot Reload do Next.js.
 */
function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Instância de auth Firebase para Client Components.
 *
 * @example
 *   import { getFirebaseAuth } from '@/lib/firebase/client'
 *   const auth = getFirebaseAuth()
 *   await signInWithEmailAndPassword(auth, email, password)
 */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
