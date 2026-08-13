class Builders::DocumentResolver < SiteBuilder
  PREFERRED_ORDER = %w[choose-jesus how-to-use journaling about].freeze

  def build
    hook :site, :post_read do
      resolve_documents
    end
  end

  private

  def resolve_documents
    base            = site.base_path.to_s.chomp("/")
    global_docs     = {}
    study_overrides = Hash.new { |h, k| h[k] = {} }

    site.resources.each do |resource|
      url  = resource.relative_url.to_s
      path = base.empty? ? url : url.delete_prefix(base)

      if (m = path.match(%r{\A/documents/([^/]+)/\z}))
        slug = m[1]
        global_docs[slug] = doc_entry(slug, resource, path)

      elsif (m = path.match(%r{\A/([^/]+)/documents/([^/]+)/\z}))
        study_slug = m[1]
        slug       = m[2]
        study_overrides[study_slug][slug] = doc_entry(slug, resource, path)
      end
    end

    resolved = { "global" => sorted(global_docs) }

    (site.data.studies || []).each do |study|
      s      = study["slug"]
      merged = global_docs.merge(study_overrides[s])
      resolved[s] = sorted(merged)
    end

    site.data[:resolved_documents] = resolved
  end

  def doc_entry(slug, resource, url)
    {
      "slug"        => slug,
      "title"       => resource.data[:document_title] || resource.data[:title],
      "url"         => url,
      "description" => resource.data[:description],
    }
  end

  def sorted(docs_by_slug)
    docs_by_slug.values.sort_by { |d| PREFERRED_ORDER.index(d["slug"]) || 99 }
  end
end
