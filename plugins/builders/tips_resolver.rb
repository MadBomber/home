class Builders::TipsResolver < SiteBuilder
  def build
    hook :site, :post_read do
      resolve_tips
    end
  end

  private

  # One ordered tip list per language, keyed by locale name ("en", "es") in
  # site.data[:tips_by_locale]. A language with no tips of its own gets the
  # default language's list, so its banner and tips index are never empty.
  # site.data[:tips_ordered] stays as the default language's list.
  def resolve_tips
    default = default_locale.to_s
    lists   = locales.to_h { |loc| [loc.to_s, tips_for(loc)] }

    lists.each { |loc, tips| lists[loc] = lists[default] if tips.empty? }

    site.data[:tips_by_locale] = lists
    site.data[:tips_ordered]   = lists[default]
  end

  # Order comes from the NN_ prefix each tip file is named with (e.g.
  # tips/02_pray-before-you-read.md), read straight off the resolved URL
  # since no tip overrides its permalink.
  def tips_for(locale)
    pattern = tip_url_pattern(locale)

    site.resources
      .select  { |r| r.relative_url.to_s.match?(pattern) }
      .sort_by { |r| r.relative_url.to_s[pattern, 1].to_i }
      .map     { |r| tip_entry(r) }
  end

  # English tips live under /tips/, every other language under /<locale>/tips/.
  def tip_url_pattern(locale)
    %r{\A#{site.base_path}#{locale_prefix(locale)}/tips/(\d+)_[^/]+/\z}
  end

  def tip_entry(resource)
    {
      "title"       => resource.data[:title],
      "url"         => resource.relative_url.to_s,
      "category"    => resource.data[:category],
      "description" => resource.data[:description],
    }
  end

  def locale_prefix(locale)
    locale.to_sym == default_locale ? "" : "/#{locale}"
  end

  def locales
    site.config.available_locales.map(&:to_sym)
  end

  def default_locale
    site.config.default_locale.to_sym
  end
end
