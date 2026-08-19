class Builders::AnnouncementResolver < SiteBuilder
  def build
    hook :site, :post_read do
      resolve_announcement
    end
  end

  private

  def resolve_announcement
    resource = site.resources.find { |r| r.relative_url.to_s.match?(%r{\A#{site.base_path}/blog/announcement/\z}) }
    site.data[:announcement] = resource && {
      "title" => resource.data[:title],
      "date"  => resource.data[:date]&.iso8601,
      "link"  => resource.data[:link],
      "url"   => resource.relative_url.to_s,
    }
  end
end
