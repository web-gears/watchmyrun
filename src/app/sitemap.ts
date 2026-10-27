import type { MetadataRoute } from 'next';
import { SEO_RACE_PAGES } from '@/lib/seo/raceLandingData';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://watchmy.run';
  const now = new Date();

  const raceEntries: MetadataRoute.Sitemap = SEO_RACE_PAGES.map((race) => ({
    url: `${baseUrl}/races/${race.slug}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/races/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...raceEntries,
  ];
}
