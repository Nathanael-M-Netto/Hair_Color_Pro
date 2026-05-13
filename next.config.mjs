/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Comprime HTML/JS/CSS — Brotli quando suportado, gzip como fallback
  compress: true,
  // 'export' habilita o build estático que o Capacitor empacota.
  // Em ambiente puramente web (Vercel), trocar para 'standalone' ou remover.
  output: process.env.NEXT_OUTPUT_MODE === 'export' ? 'export' : undefined,
  images: {
    // No build estático para Capacitor, otimizacao server-side é desabilitada.
    unoptimized: process.env.NEXT_OUTPUT_MODE === 'export',
  },
  // Headers de cache pra assets estáticos PWA (icons, manifest, splash, sw).
  // Sem isso, browser revalida toda vez = latência extra a cada navegação.
  async headers() {
    return [
      {
        // PNG icons (qualquer tamanho)
        source: '/:file(icon.*\\.png|apple-touch-icon\\.png|favicon.*\\.png|splash-.*\\.png)',
        headers: [
          {
            key: 'Cache-Control',
            // 7d browser, 30d CDN, revalidate em background
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // SVG icons + manifest
        source: '/:file(icon.*\\.svg|manifest\\.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Service Worker — NUNCA cachear (precisa atualizar em cada visita)
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  experimental: {
    // Reduz JS no client para componentes pesados (efeitos bits/*).
    // `optimizePackageImports` re-escreve `import { X } from 'lucide-react'`
    // pra `import X from 'lucide-react/dist/X.js'`, cortando ~80% do bundle
    // dessas libs (lucide-react tem ~700 ícones).
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-slider',
      '@radix-ui/react-tabs',
      'sonner',
    ],
    // View Transitions API — animação nativa do browser entre rotas
    // (Chrome 111+). Quando suportado, navegações ficam visualmente suaves
    // sem framer-motion. Em browsers que não suportam, ignora silenciosamente.
    viewTransition: true,
  },
};

export default nextConfig;
