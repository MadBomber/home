import build from "./config/esbuild.defaults.js"

/**
 * @typedef { import("esbuild").BuildOptions } BuildOptions
 * @type {BuildOptions}
 */
const esbuildOptions = {
  publicPath: `/_bridgetown/static`,
  plugins: [
    // add new plugins here...
  ],
  globOptions: {
    excludeFilter: /\.(dsd|lit)\.css$/
  }
}

build(esbuildOptions)
