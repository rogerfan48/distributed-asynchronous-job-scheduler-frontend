import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle for a slim Docker runtime image.
  output: "standalone",
  // The BFF talks to the backend over the network; no client env is exposed.
  // BACKEND_ORIGIN is server-only and read at request time (see src/lib/env.ts).
};

export default nextConfig;
