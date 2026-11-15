class Builders::AnnouncementResolver < SiteBuilder
  NON_POST_SLUGS = %w[announcement tags].freeze

  def build
    hook :site, :post_read do
      resolve_announcements
    end
  end

  private

  # One announcement per language, keyed by locale name ("en", "es") in
  # site.data[:announcements_by_locale]. A language with nothing to announce
  # gets the default language's announcement rather than no banner.
  # site.data[:announcement] stays as the default language's announcement.
  def resolve_announcements
    default = default_locale.to_s
    found   = locales.to_h { |loc| [loc.to_s, announcement_for(loc)] }

    found.each { |loc, ann| found[loc] = found[default] if ann.nil? }

    site.data[:announcements_by_locale] = found
    site.data[:announcement]            = found[default]
  end

  # The banner announces whichever is newer: the latest published essay, or
  # a hand-written src/blog/announcement.md (for news that isn't an essay).
  def announcement_for(locale)
    manual = manual_announcement(locale)
    latest = latest_post(locale)

    if latest && (manual.nil? || date_of(latest) > date_of(manual))
      essay_announcement(latest)
    elsif manual
      page_announcement(manual)
    end
  end

  def manual_announcement(locale)
    url = "#{blog_root(locale)}/announcement/"
    site.resources.find { |r| r.relative_url.to_s == url }
  end

  # Same rules as the blog index: future-dated review drafts are skipped in production.
  def latest_post(locale)
    blog_posts(locale)
      .reject { |r| production? && date_of(r) > Date.today }
      .max_by { |r| date_of(r) }
  end

  def blog_posts(locale)
    pattern = %r{\A#{blog_root(locale)}/([^/]+)/\z}

    site.resources.select do |r|
      slug = r.relative_url.to_s[pattern, 1]
      slug && !NON_POST_SLUGS.include?(slug) && r.data[:date]
    end
  end

  # English essays live under /blog/, every other language under /<locale>/blog/.
  def blog_root(locale)
    prefix = locale.to_sym == default_locale ? "" : "/#{locale}"
    "#{site.base_path}#{prefix}/blog"
  end

  # "essay" => true tells the banner partial to wrap the title in the
  # reader's-language "New Essay: ..." wording; the title here is the essay's own.
  def essay_announcement(resource)
    {
      "title" => resource.data[:title],
      "essay" => true,
      "date"  => resource.data[:date].iso8601,
      "link"  => nil,
      "url"   => resource.relative_url.to_s,
    }
  end

  def page_announcement(resource)
    {
      "title" => resource.data[:title],
      "essay" => false,
      "date"  => resource.data[:date]&.iso8601,
      "link"  => resource.data[:link],
      "url"   => resource.relative_url.to_s,
    }
  end

  def date_of(resource)
    resource.data[:date]&.to_date || Date.new(0)
  end

  def locales
    site.config.available_locales.map(&:to_sym)
  end

  def default_locale
    site.config.default_locale.to_sym
  end

  def production?
    Bridgetown.environment.to_s == "production"
  end
end
