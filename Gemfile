####
# Welcome to your project's Gemfile, used by Rubygems & Bundler.
#
# To install a plugin, run:
#
#   bundle add new-plugin-name
#
# and add a relevant init comment to your config/initializers.rb file.
#
# When you run Bridgetown commands, we recommend using a binstub like so:
#
#   bin/bridgetown start (or console, etc.)
#
# This will help ensure the proper Bridgetown version is running.
####

source "https://rubygems.org"

git_source(:github) { "https://github.com/#{_1}.git" }
git_source(:codeberg) { "https://codeberg.org/#{_1}.git" }

gem "bridgetown", "~> 2.1.1"

# Puma is the Rack-compatible web server used by Bridgetown
gem "puma", "< 8"

group :development, :test do
  gem 'aigcm'
  gem 'debug_me'
end
