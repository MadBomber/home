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
  url "https://lamplight.guide"

  # Available options are `erb` (default), `serbea`, or `liquid`
  template_engine "erb"

  # Custom domain — no subfolder path needed
  base_path ""
end
