import type { MetadataRoute } from 'next';

/**
 * robots.txt gerado dinamicamente pelo Next.js.
 *
 * Permite indexação geral mas BLOQUEIA rotas autenticadas (não fazem sentido
 * indexar — o crawler nem consegue acessar, mas é boa prática deixar explícito).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/scanner', '/history', '/profile', '/auth/'],
      },
    ],
    sitemap: 'https://haircolorpro.app/sitemap.xml',
  };
}
