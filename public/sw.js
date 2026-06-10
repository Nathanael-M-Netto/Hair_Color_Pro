/**
 * Service Worker — Hair Color Pro v2
 *
 * Objetivos:
 *   1. Atender o critério de instalabilidade do Chrome (PWA install prompt) —
 *      basta ter SW com `fetch` handler que responde a navegações.
 *   2. Permitir abrir o app offline (shell mínimo cacheado).
 *   3. Não atrapalhar o dev: deixa /_next/webpack-hmr, /api/* e WebSocket
 *      passarem direto, sem cachear.
 *
 * Estratégia:
 *   - Navegações HTML  → network-first, cache como fallback
 *   - Assets estáticos → cache-first (com revalidação em background)
 *   - APIs e HMR       → passthrough (sem cache)
 */

// Versão do cache — incrementar quando a estrutura do app mudar.
// SW antigos com cache desatualizado são limpos no `activate`.
const CACHE_VERSION = 'hcp-v7';
const APP_SHELL = ['/', '/auth/login', '/auth/register', '/icon-192.png', '/icon-512.png'];

// ── Instalação: pré-cacheia o shell mínimo ──────────────────────────────────
// NÃO chamamos skipWaiting() aqui de propósito: quando há uma versão nova, o
// novo SW fica em "waiting" até o usuário confirmar a atualização (toast no
// client → mensagem SKIP_WAITING). Isso evita recarregar a página sem aviso no
// meio de um uso. No primeiro install (sem SW ativo) ele ativa normalmente.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // .catch silencioso: se um asset falhar, não queremos abortar a instalação
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {})))),
  );
});

// ── Atualização sob demanda: o client pede pra ativar a versão que está
//    esperando (disparado pelo toast "Nova versão disponível"). ──────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Ativação: limpa caches antigos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: roteamento por tipo de request ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só intercepta GETs no mesmo origin (não toca em /api/* externas, analytics, etc)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Passthrough completo: HMR, APIs, dev-server, source maps
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.hot-update.json') ||
    url.pathname.endsWith('.hot-update.js') ||
    url.pathname.endsWith('.map')
  ) {
    return;
  }

  // Navegações HTML (rotas) — network-first com fallback ao cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match('/') || new Response('Offline', { status: 503 });
        }),
    );
    return;
  }

  // Assets (JS, CSS, imagens, fontes) — cache-first com revalidação em background
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // Só cacheia respostas ok (200) — evita persistir 404/500
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    }),
  );
});
