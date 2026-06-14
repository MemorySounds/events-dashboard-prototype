import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a small Docker image.
  output: "standalone",
  // Pin the workspace/file-tracing root to this app, so a stray lockfile elsewhere
  // (e.g. one in the home directory) isn't inferred as the root. Also silences the
  // "inferred your workspace root" build warning.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
