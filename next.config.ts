import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ["d40c-102-180-110-135.ngrok-free.app"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      // Augmenter les limites pour les routes de upload
      {
        source: "/api/documents/upload-file",
        headers: [
          {
            key: "Content-Length",
            value: "52428800", // 50MB
          },
        ],
      },
    ];
  },
};

export default nextConfig;
