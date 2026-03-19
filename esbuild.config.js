import build from "./config/esbuild.defaults.js"
import { basename, dirname } from "path"
import { fileURLToPath } from "url"

// Derive the repo name so base_path stays in sync with config/initializers.rb.
// GITHUB_REPOSITORY ("owner/repo") is set automatically by GitHub Actions;
// fall back to the directory name for local development.
const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split("/").pop()
  : basename(dirname(fileURLToPath(import.meta.url)))

/**
 * @typedef { import("esbuild").BuildOptions } BuildOptions
 * @type {BuildOptions}
 */
const esbuildOptions = {
  publicPath: `/${repoName}/_bridgetown/static`,
  plugins: [
    // add new plugins here...
  ],
  globOptions: {
    excludeFilter: /\.(dsd|lit)\.css$/
  }
}

build(esbuildOptions)
