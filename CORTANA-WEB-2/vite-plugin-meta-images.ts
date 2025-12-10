import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that updates og:image and twitter:image meta tags
 * to point to the app's opengraph image with the correct domain.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-meta-images',
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        console.log('[meta-images] no deployment domain found, using relative paths');
        return html;
      }

      // Check if opengraph image exists in public directory
      const publicDir = path.resolve(process.cwd(), 'client', 'public');
      const opengraphPngPath = path.join(publicDir, 'opengraph.png');
      const opengraphJpgPath = path.join(publicDir, 'opengraph.jpg');
      const opengraphJpegPath = path.join(publicDir, 'opengraph.jpeg');

      let imageExt: string | null = null;
      if (fs.existsSync(opengraphPngPath)) {
        imageExt = 'png';
      } else if (fs.existsSync(opengraphJpgPath)) {
        imageExt = 'jpg';
      } else if (fs.existsSync(opengraphJpegPath)) {
        imageExt = 'jpeg';
      }

      if (!imageExt) {
        console.log('[meta-images] OpenGraph image not found, skipping meta tag updates');
        return html;
      }

      const imageUrl = `${baseUrl}/opengraph.${imageExt}`;
      console.log('[meta-images] updating meta image tags to:', imageUrl);

      html = html.replace(
        /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
        `<meta property="og:image" content="${imageUrl}" />`
      );

      html = html.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
        `<meta name="twitter:image" content="${imageUrl}" />`
      );

      return html;
    },
  };
}

function getDeploymentUrl(): string | null {
  // Render provides RENDER_EXTERNAL_URL in production
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL;
    console.log('[meta-images] using Render external URL:', url);
    return url;
  }

  // For local development
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '5000';
    const url = `http://localhost:${port}`;
    console.log('[meta-images] using local development URL:', url);
    return url;
  }

  return null;
}
