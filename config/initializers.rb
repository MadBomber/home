# Welcome to Bridgetown!
#
# For more documentation on using this initializers file, visit:
# https://www.bridgetownrb.com/docs/configuration/initializers/
#
# NOTE: This file is NOT reloaded automatically when you use `bin/bridgetown start`.
# If you change this file, please restart the server process.
#
# For reloadable site metadata (title, description, author, etc.),
# edit `src/_data/site_metadata.yml`.

Bridgetown.configure do |config|
  # The base hostname & protocol for your site, e.g. https://example.com
  url ""

  # Available options are `erb` (default), `serbea`, or `liquid`
  template_engine "erb"

  # Optionally host your site off a subfolder path, e.g. /my_study
  # If you set this, update publicPath in esbuild.config.js to match.
  #
  repo_name = ENV.fetch("GITHUB_REPOSITORY", File.basename(Dir.pwd)).split("/").last
  base_path "/#{repo_name}"
end
