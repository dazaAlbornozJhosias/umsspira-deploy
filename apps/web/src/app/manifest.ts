import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/portal',
    name: 'UMSSPIRA — Egresados UMSS',
    short_name: 'UMSSPIRA',
    description: 'Egresados que inspiran, talento que conecta',
    lang: 'es',
    start_url: '/portal',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1E3A5F',
    theme_color: '#1E3A5F',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}