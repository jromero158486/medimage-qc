import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,

  basePath:
    process.env.NODE_ENV === "production"
      ? "/medimage-qc"
      : "",

  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
