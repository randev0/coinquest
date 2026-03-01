import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from sniffing a different content type than declared
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Deny framing to block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Minimal referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year; include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Disable browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy
  // - default-src: only self
  // - script-src: self + unsafe-inline/eval needed by Next.js
  // - style-src: self + unsafe-inline needed by Tailwind
  // - img-src: self + data: for inline avatars/icons
  // - connect-src: self (API calls stay on-domain)
  // - frame-ancestors: none (replaces X-Frame-Options for modern browsers)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  basePath: "/coinquest",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
