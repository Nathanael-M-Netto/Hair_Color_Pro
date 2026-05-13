/**
 * POST /api/auth/session
 *
 * Troca um Firebase ID Token (1h) por um session cookie HttpOnly de longa duração (5 dias).
 * Também faz upsert do perfil no Firestore (cria se não existir — útil no primeiro login).
 *
 * Fluxo:
 * 1. Cliente faz login com signInWithEmailAndPassword (Firebase JS SDK).
 * 2. Cliente chama esta rota com { idToken } no body.
 * 3. Server verifica o ID token com Firebase Admin.
 * 4. Server faz upsert do perfil no Firestore (criação lazy).
 * 5. Server cria um session cookie seguro e o devolve no response.
 * 6. Próximos requests incluem o cookie automaticamente.
 *
 * DELETE /api/auth/session — Apaga o cookie (logout server-side).
 *
 * runtime = 'nodejs' obrigatório: firebase-admin usa módulos Node.js
 * incompatíveis com Edge Runtime.
 */

export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { createSessionCookie, verifyIdToken } from '@/lib/firebase/admin';
import { getProfile, upsertProfile } from '@/lib/firestore';

const SESSION_COOKIE_NAME = '__firebase_session';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.idToken || typeof body.idToken !== 'string') {
    return NextResponse.json({ error: 'idToken obrigatório' }, { status: 400 });
  }

  // Verificar se o ID token é válido
  const claims = await verifyIdToken(body.idToken);
  if (!claims) {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
  }

  // Criar perfil no Firestore na primeira vez que o usuário faz login.
  // Resiliente: se o Firestore ainda não estiver habilitado no projeto,
  // estas chamadas viram no-op (com aviso no log) — o login continua.
  const existing = await getProfile(claims.uid);
  if (!existing) {
    await upsertProfile(claims.uid, {
      email: claims.email ?? '',
      nome: (claims.name as string | undefined) ?? null,
      salao: null,
      avatarUrl: (claims.picture as string | undefined) ?? null,
    });
  }

  // Criar session cookie de longa duração
  const sessionCookie = await createSessionCookie(body.idToken, SESSION_DURATION_MS);

  const response = NextResponse.json({ uid: claims.uid, email: claims.email });

  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000, // em segundos
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
