class Shared::Navbar < Bridgetown::Component
  def initialize(metadata:, resource:, studies: [], resolved_documents: {})
    @metadata           = metadata
    @resource           = resource
    @studies            = Array(studies)
    @resolved_documents = resolved_documents || {}
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
    @studies
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
end
