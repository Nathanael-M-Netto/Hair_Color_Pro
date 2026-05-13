import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/firebase/admin';

/**
 * Middleware de autenticação — executa antes de cada request.
 *
 * Usa Firebase session cookie (`__firebase_session`) criado pela
 * API route `/api/auth/session` após login bem-sucedido.
 *
 * Responsabilidades:
 * 1. Verificar o session cookie Firebase em rotas protegidas.
 * 2. Redirecionar não-autenticados → /auth/login?next=...
 * 3. Redirecionar autenticados que acessam /auth/* → /scanner
 *
 * NOTA: `firebase-admin` NÃO funciona em Edge Runtime.
 * Por isso o runtime está configurado como 'nodejs'.
 * Custo: ~50ms de cold-start vs Edge, mas verificação de JWT é segura e correta.
 */
export const runtime = 'nodejs';

const SESSION_COOKIE = '__firebase_session';

/** Rotas que exigem autenticação */
const PROTECTED_PREFIXES = ['/scanner', '/review', '/result', '/history', '/profile'];

/** Rotas de auth que usuários logados não devem acessar */
const AUTH_PREFIXES = ['/auth/'];

/** Rotas de API que gerenciam a sessão — nunca redirecionar */
const API_PREFIXES = ['/api/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast-paths sem nenhuma verificação:
  //   - APIs (gerenciam própria auth via cookies)
  //   - Assets estáticos PWA (manifest, sw, icons) — críticos pro install
  //   - Rotas públicas (/ landing) — sem necessidade de checar cookie
  if (
    API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/favicon') ||
    pathname === '/apple-touch-icon.png'
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Rotas públicas (landing `/`, etc.) — pula a verificação completamente
  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  // Sem cookie → não autenticado, decisão O(1) sem chamar Firebase
  if (!sessionCookie) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Verificar cookie — agora cacheado em memória por 60s (vide firebase/admin.ts)
  const claims = await verifySessionCookie(sessionCookie);

  if (!claims) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  // Usuário autenticado tentando acessar /auth/* → redirecionar para o app
  if (isAuthRoute) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = '/scanner';
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
