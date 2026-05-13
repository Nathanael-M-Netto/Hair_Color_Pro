'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

/**
 * Hook que expõe o usuário Firebase atual em Client Components.
 *
 * - `user`: o objeto User do Firebase (ou `null` se não autenticado).
 * - `loading`: `true` durante a verificação inicial do estado de auth.
 *
 * Uso:
 * ```tsx
 * const { user, loading } = useAuth()
 * if (loading) return <Skeleton />
 * if (!user) return <Redirect href="/auth/login" />
 * ```
 *
 * NOTA: Para Server Components, usar a API route ou verificar o session cookie
 * diretamente via `verifySessionCookie` do `@/lib/firebase/admin`.
 */
export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
