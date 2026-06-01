import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  title: 'react-nav-router',
  description: 'Lightweight iOS-style stack router for React 18.',
  base: '/react-nav-router/',
  srcExclude: ['superpowers/**'],
  vite: {
    plugins: [react()],
    resolve: {
      alias: {
        'react-nav-router': resolve(__dirname, '../../src/index.ts'),
      },
    },
    optimizeDeps: {
      exclude: ['react-nav-router'],
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/index' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'Recipes', link: '/guide/recipes' },
            { text: 'History Mode', link: '/guide/history' },
            { text: 'Testing', link: '/guide/testing' },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/n43/react-nav-router',
      },
    ],
  },
});
