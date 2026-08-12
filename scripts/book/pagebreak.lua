-- Pandoc filter: turn the "---" separators in draft.md into real page breaks.
--
-- draft.md uses a horizontal rule between the title page, the table of
-- contents, each section page, and each week. Pandoc's docx writer renders a
-- HorizontalRule as a bordered empty paragraph, not a page break, so without
-- this filter the book runs together.
--
-- Used by build_docx.rb via: pandoc --lua-filter=pagebreak.lua

local PAGE_BREAK_OPENXML =
  '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

local PAGE_BREAK_LATEX = '\\newpage'

function HorizontalRule (elem)
  if FORMAT:match 'docx' then
    return pandoc.RawBlock('openxml', PAGE_BREAK_OPENXML)
  elseif FORMAT:match 'latex' then
    return pandoc.RawBlock('tex', PAGE_BREAK_LATEX)
  elseif FORMAT:match 'html' then
    return pandoc.RawBlock('html', '<div style="page-break-after: always;"></div>')
  end
  return elem
end
