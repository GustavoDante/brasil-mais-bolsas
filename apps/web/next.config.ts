import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * As imagens de instituição vêm do bucket de uploads da API — sem liberar o host
     * aqui, o `next/image` recusa a URL em tempo de execução. Os registros antigos
     * gravam só o nome do arquivo e são resolvidos contra `NEXT_PUBLIC_IMAGES_BASE_URL`
     * (ver `src/lib/images.ts`), que precisa apontar para um destes hosts.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bucketbrasilmaisbolsas.s3.sa-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "bucketbrasilmaisbolsas.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
