# zotero-report-html-chunks
This [Zotero](https://www.zotero.org) plugin allows you to export customizable reports of your bibliography items (including your notes) as within-body HTML.

_Current version: v0.9_

## What for?
__Flexibility:__ You can directly include your report in other HTML documents. You can set the base level of headlines to let the chunk fit in nicely in the target document structure.

__Look:__ Style the HTML document containing the exported chunk to your liking via CSS

__Filtering:__ Item tag information is passed to the HTML document, allowing you to, for example, filter visible Items by tag via JS

__Example:__ [Literature review](https://amor.cms.hu-berlin.de/~sprenmax/docs/report_html_chunks.html)

## Release Notes v0.9
- At the moment, neither a list of attachments nor a list of related items are part of the report (what is the case in Zotero's standard report).
- If you want to exclude a note from the report, you can tag it with ``omitfromreport``. This is useful when you select collections and don't want to manually deselect the notes to exclude.
- Every bibliography item is exported with an HTML tag ``taglist="tag1////tag2////tag3"``. This allows you to apply filters or address certain tags directly.
- Item tags are exported within ``<span>`` tags that contain information if the tag is colored in Zotero or not. A class list and example CSS file will be provided here soon.

## ToDo
- Allow to export a complete HTML document (with header and body tags) including user specified style sheets. In this way, no further processing of the chunk would be necessary while keeping the style customizable.
- Let user select displayed item tags similar to the selection of exported metadata fields in the options dialog. However, this might become clumsy with a lot of tags.
- Let user choose to include lists of attachments and related items in report.
