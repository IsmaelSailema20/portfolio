import { defineConfig } from 'astro/config';
import { basePath, siteUrl } from './site.config';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
