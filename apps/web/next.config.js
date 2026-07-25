const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ["@repo/ui"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};
