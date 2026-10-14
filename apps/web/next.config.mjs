/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  // Temporal para la demo: la dirección principal muestra el perfil del egresado
  async redirects() {
    return [{ source: '/', destination: '/profile', permanent: false }];
  },
};

export default nextConfig;
