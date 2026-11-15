class Shared::Navbar < Bridgetown::Component
  # Each language's name in that language, so a Spanish reader finds "Español"
  # on an English page and an English reader finds "English" on a Spanish one.
  # Add a line here when a locale is added to available_locales.
  LANGUAGE_NAMES = { en: "English", es: "Español" }.freeze

  def initialize(metadata:, resource:, studies: [], resolved_documents: {}, has_memory_verse: true)
    @metadata           = metadata
    @resource           = resource
    @studies            = Array(studies)
    @resolved_documents = resolved_documents || {}
    @has_memory_verse   = has_memory_verse
  end

  def has_memory_verse?
    @has_memory_verse
  end

  def study_slug
    @resource.data[:study_slug]
  end

  def study_prefix
    study_slug ? "/#{study_slug}" : ""
  end

  def on_landing_page?
    study_slug.nil?
  end

  def studies
    @studies.reject { |s| s["hidden"] }
  end

  def study_title
    return nil unless study_slug
    found = @studies.find { |s| s["slug"] == study_slug }
    found&.[]("title")
  end

  def menu_documents
    key = study_slug || "global"
    @resolved_documents[key] || @resolved_documents["global"] || []
  end

  # --- Languages ---

  def site
    Bridgetown::Current.site
  end

  def default_locale
    site.config.default_locale.to_sym
  end

  # The locale this page is rendered in.
  def locale
    (@resource.data[:locale] || default_locale).to_sym
  end

  # URL prefix for a locale: "" for the default (English keeps its unprefixed
  # URLs), "/es" for Spanish. Mirrors prefix_default_locale false.
  def locale_prefix(loc = locale)
    loc.to_sym == default_locale ? "" : "/#{loc}"
  end

  # Every version of this page, keyed by locale: { en: "/blog/x/", es: "/es/blog/x/" }.
  # Bridgetown pairs them by slug and locale-free path (resource.all_locales).
  def locale_twins
    return {} unless @resource.respond_to?(:all_locales)
    @resource.all_locales.to_h { |r| [r.data[:locale].to_sym, r.relative_url.to_s] }
  end

  # One entry per available locale for the switcher, in configured order.
  # The link for a language goes to this page's version in that language when
  # one exists, otherwise to the best page that language does have.
  def language_links
    twins = locale_twins
    site.config.available_locales.map do |loc|
      loc = loc.to_sym
      {
        locale:  loc,
        name:    LANGUAGE_NAMES.fetch(loc, loc.to_s),
        href:    twins[loc] || fallback_url(loc),
        current: loc == locale,
      }
    end
  end

  # Where a language's link lands when this page has no version in it: that
  # language's home page if it has one, else its essay index, else the site root.
  def fallback_url(loc)
    prefix = locale_prefix(loc)
    ["#{prefix}/", "#{prefix}/blog/"].find { |url| url_exists?(url) } || "/"
  end

  # Menu link that stays in the reader's language when a page exists there.
  # "/blog/" on a Spanish page becomes "/es/blog/" because that page exists;
  # "/settings/" stays English because no Spanish settings page exists yet.
  def localized_url(path)
    candidate = "#{locale_prefix}#{path}"
    url_exists?(candidate) ? candidate : path
  end

  def url_exists?(url)
    resource_urls.include?("#{site.base_path}#{url}")
  end

  # Set of every resource URL in the build, computed once per build. tmp_cache
  # is wiped on each site reset, so a watch rebuild never sees stale URLs.
  def resource_urls
    site.tmp_cache[:navbar_resource_urls] ||= site.resources.map { |r| r.relative_url.to_s }.to_set
  end
end
