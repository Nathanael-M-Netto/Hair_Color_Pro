import type { MetadataRoute } from 'next';

/**
 * sitemap.xml — só rotas públicas (landing). Tudo dentro de auth/app é
 * privado e não interessa pra crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://haircolorpro.app';
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];
}
