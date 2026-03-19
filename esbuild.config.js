import build from "./config/esbuild.defaults.js"

// You can customize this as you wish, perhaps to add new esbuild plugins.
//
// Update `publicPath` to match your site's base_path if deploying to a subfolder.
// e.g. publicPath: "/my_study/_bridgetown/static"

/**
 * @typedef { import("esbuild").BuildOptions } BuildOptions
 * @type {BuildOptions}
 */
const esbuildOptions = {
  publicPath: "/bible_study_template/_bridgetown/static",
  plugins: [
    // add new plugins here...
  ],
  globOptions: {
    excludeFilter: /\.(dsd|lit)\.css$/
  }
}

build(esbuildOptions)
