/**
 * API Route — /api/profile
 *
 * GET  /api/profile          → retorna o perfil do usuário autenticado
 * PATCH /api/profile         → atualiza nome e/ou salão do perfil
 *
 * Segurança: verifica o Firebase session cookie antes de qualquer operação.
 * Usa Firestore Admin SDK (server-side) — nenhum dado sensível exposto ao browser.
 *
 * runtime = 'nodejs' obrigatório: firebase-admin usa módulos Node.js
 * incompatíveis com Edge Runtime.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/firebase/admin';
import { getProfile, updateProfile, upsertProfile } from '@/lib/firestore';
import { z } from 'zod';

// ── Validação ────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  nome: z.string().min(2).max(80).trim().optional(),
  salao: z.string().max(100).trim().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__firebase_session')?.value;
  if (!sessionCookie) return null;
  const claims = await verifySessionCookie(sessionCookie);
  return claims?.uid ?? null;
}

// ── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET() {
  const uid = await getAuthenticatedUid();
  if (!uid) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const profile = await getProfile(uid);
  return NextResponse.json({ profile });
}

// ── PATCH /api/profile ───────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const uid = await getAuthenticatedUid();
  if (!uid) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Se o documento ainda não existe, faz upsert (primeiro acesso via web)
  const existing = await getProfile(uid);
  if (!existing) {
    // Extrai email do token para criar perfil inicial
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__firebase_session')?.value ?? '';
    const claims = await verifySessionCookie(sessionCookie);
    await upsertProfile(uid, {
      email: claims?.email ?? '',
      nome: parsed.data.nome ?? null,
      salao: parsed.data.salao ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
    });
  } else {
    await updateProfile(uid, {
      ...(parsed.data.nome !== undefined && { nome: parsed.data.nome }),
      ...(parsed.data.salao !== undefined && { salao: parsed.data.salao }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
    });
  }

  return NextResponse.json({ ok: true });
}
