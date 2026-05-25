import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/felipecrm",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/felipecrm",
  },
};

export default nextConfig;
