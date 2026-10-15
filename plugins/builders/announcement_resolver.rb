class Builders::AnnouncementResolver < SiteBuilder
  NON_POST_SLUGS = %w[announcement tags].freeze

  def build
    hook :site, :post_read do
      resolve_announcement
    end
  end

  private

  # The banner announces whichever is newer: the latest published essay, or
  # a hand-written src/blog/announcement.md (for news that isn't an essay).
  def resolve_announcement
    manual = manual_announcement
    latest = latest_post

    site.data[:announcement] =
      if latest && (manual.nil? || date_of(latest) > date_of(manual))
        essay_announcement(latest)
      elsif manual
        page_announcement(manual)
      end
  end

  def manual_announcement
    site.resources.find { |r| r.relative_url.to_s.match?(%r{\A#{site.base_path}/blog/announcement/\z}) }
  end

  # Same rules as the blog index: future-dated review drafts are skipped in production.
  def latest_post
    blog_posts
      .reject { |r| production? && date_of(r) > Date.today }
      .max_by { |r| date_of(r) }
  end

  def blog_posts
    site.resources.select do |r|
      slug = r.relative_url.to_s[%r{\A#{site.base_path}/blog/([^/]+)/\z}, 1]
      slug && !NON_POST_SLUGS.include?(slug) && r.data[:date]
    end
  end

  def essay_announcement(resource)
    {
      "title" => "New Essay: #{resource.data[:title]}",
      "date"  => resource.data[:date].iso8601,
      "link"  => nil,
      "url"   => resource.relative_url.to_s,
    }
  end

  def page_announcement(resource)
    {
      "title" => resource.data[:title],
      "date"  => resource.data[:date]&.iso8601,
      "link"  => resource.data[:link],
      "url"   => resource.relative_url.to_s,
    }
  end

  def date_of(resource)
    resource.data[:date]&.to_date || Date.new(0)
  end

  def production?
    Bridgetown.environment.to_s == "production"
  end
end
