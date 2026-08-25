class Builders::TipsResolver < SiteBuilder
  def build
    hook :site, :post_read do
      resolve_tips
    end
  end

  private

  # Order comes from the NN_ prefix each tip file is named with (e.g.
  # tips/02_pray-before-you-read.md), read straight off the resolved URL
  # since no tip overrides its permalink.
  def resolve_tips
    tips = site.resources
      .select { |r| r.relative_url.to_s.match?(%r{\A#{site.base_path}/tips/\d+_[^/]+/\z}) }
      .sort_by { |r| r.relative_url.to_s[%r{/(\d+)_[^/]+/\z}, 1].to_i }

    site.data[:tips_ordered] = tips.map { |r|
      {
        "title"       => r.data[:title],
        "url"         => r.relative_url.to_s,
        "category"    => r.data[:category],
        "description" => r.data[:description],
      }
    }
  end
end
