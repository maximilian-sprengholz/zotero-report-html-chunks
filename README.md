# zotero-report-html-chunks
This [Zotero](https://www.zotero.org) plugin allows you to export customizable reports of your bibliography items (including your notes) as within-body HTML.

_Current version: v0.9_

## What for?

__Flexibility:__
You can directly include your report in other HTML documents. You can set the base level of headlines to let the chunk fit in nicely in the target document structure.

__Look:__
Style the HTML document containing the exported chunk to your liking via CSS

__Filtering:__
Item tag information is passed to the HTML document, allowing you to, for example, filter visible Items by tag via JS

__Example:__
Literature review, items filterable by tags. [See online version](https://amor.cms.hu-berlin.de/~sprenmax/docs/report_html_chunks_example.html)

![Example Report](https://amor.cms.hu-berlin.de/~sprenmax/docs/report_html_chunks.png)
[See online version](https://amor.cms.hu-berlin.de/~sprenmax/docs/report_html_chunks.html)

## Release Notes v0.9
- At the moment, neither a list of attachments nor a list of related items are part of the report (what is the case in Zotero's standard report).
- If you want to exclude a note from the report, you can tag it with ``omitfromreport``. This is useful when you select collections and don't want to manually deselect the notes to exclude.
- Every bibliography item is exported with an HTML tag ``taglist="tag1////tag2////tag3"``. This allows you to apply filters or address certain tags directly.
- Item tags are exported within ``<span>`` tags that contain information if the tag is colored in Zotero or not and which Zotero tag color applies.

#### HTML chunk structure for a single bibliography item

```HTML
<div id="item_ITEMID" class="item ITEMTYPE" taglist="tag1////tag2////tag3////tag4">
  <h3>Publication title</h3>
  <p class="creators">
    <em>Melanie Mainauthor, Chris Coauthor</em>
  </p>
  <p class="tags">
    <!-- The numbered color classed correspond to the user defined number shortcuts
    for colored tags (1-9) within Zotero -->
		<span class="tag colored color0" tagno="0">Tag 1</span>
		<span class="tag colored color2" tagno="2">Tag 2</span>
		<span class="tag colored color4" tagno="4">Tag 3</span>
		<span class="tag">Tag 4</span>
  </p>
  <details>
    <!-- The toggleable details environment is optional -->
    <summary>Show metadata</summary>
    <table class="metadata">
    <!-- This table contains all the user-selected metadata of the item -->
    </table>
  </details>
  <div class="notes">
    <div id="item_ITEMID">
      <!-- Notes also have a unique ID in Zotero -->
      <h4>My notes...</h4>
    </div>
  </div>
</div>
```
Please note that the indentation is not as pretty in the output as displayed here to allow for proper Markdown parsing (depending on the parser, this might be buggy with multiple indented ``<div>`` elements).

#### Sample CSS

The following CSS sets the ``background-color`` of the ``<span>`` elements according to the 9 pre-defined colors in Zotero. However, if you change the numbers assigned to the colors in Zotero, you also have to change it in the CSS. Fixing the colors with inline CSS would be possible, but inconvenient when other colors are desired. Please note that the other styling rules go nicely together with the CSS of [vue](https://vuejs.org/), but might not in your setup.

```css
div.item {
  margin: 0;
  border-top: 1px solid rgb(238, 238, 238);
  padding: 0;
}

div.item p {
  margin: 0 0 1rem 0;
}

div.item details {
  margin-top: 1.4rem;
}

div.item span.tag {
  border-radius: 12px;
  padding: 1px 10px;
  color: #fff;
  font-size: 0.9rem;
  line-height: 1.2rem;
  margin-right:5px;
  margin-top: 7px;
  display: inline-block;
  background-color: #999999;
}

div.item span.color0 {
  background-color: #2EA8E5;
}

div.item span.color1 {
  background-color: #576DD9;
}

div.item span.color2 {
  background-color: #009980;
}

div.item span.color3 {
  background-color: #5FB236;
}

div.item span.color4 {
  background-color: #FF6666;
}

div.item span.color5 {
  background-color: #FF8C19;
}

div.item span.color6 {
  background-color: #A28AE5;
}

div.item span.color7 {
  background-color: #999999;
}

div.item span.color8 {
  background-color: #000000;
}
```

## ToDo
- Allow to export a complete HTML document (with header and body tags) including user specified style sheets. In this way, no further processing of the chunk would be necessary while keeping the style customizable.
- Let user select displayed item tags similar to the selection of exported metadata fields in the options dialog. However, this might become clumsy with a lot of tags.
- Let user choose to include lists of attachments and related items in report.

## Author
Maximilian Sprengholz<br />
Humboldt-Universität zu Berlin<br />
[maximilian.sprengholz@hu-berlin.de](mailto:maximilian.sprengholz@hu-berlin.de)
