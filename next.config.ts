// next.config.ts
import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.10.151"],
};

export default withSerwist(nextConfig);
