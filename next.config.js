const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.0.22"],
  // Pin Turbopack's workspace root to this project. Without this, an unrelated
  // ~/package-lock.json causes Next to infer the wrong root and bundling fails
  // with "Cannot find module @swc/helpers-..." in development.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
