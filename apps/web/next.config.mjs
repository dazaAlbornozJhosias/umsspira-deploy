/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporal para la demo: la dirección principal muestra el perfil del egresado
  async redirects() {
    return [{ source: '/', destination: '/profile', permanent: false }];
  },
};
export default nextConfig;
