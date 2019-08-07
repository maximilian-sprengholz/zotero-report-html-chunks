/*

	=== Zotero Report HTML Chunks ===

	License: GNU AGPLv3

	Copyright © 2019 Maximilian Sprengholz
				Humboldt-Universität zu Berlin
				maximilian.sprengholz@hu-berlin.de

	This file overwrites Zotero's report.js and calls the HTML generation via
	the standard Report Interface. After the report is generated and saved,
	report.js is reset to it's default.

	This approach is a work-around to be able to use Zotero's built in protocol
	handler: The parsed URI beginning with 'zotero://report' in reportInterface.js
	first calls components/zotero-protocol-handler.js before the Zotero.Report.HTML
	object is created.

	https://github.com/zotero/zotero/blob/master/chrome/content/zotero/reportInterface.js
	https://github.com/zotero/zotero/blob/master/chrome/content/zotero/xpcom/report.js

	The code from the above stated files is part of Zotero and used by me
	under the GNU AGPLv3 license:

		Copyright © 2009 Center for History and New Media
	        George Mason University, Fairfax, Virginia, USA
	        http://zotero.org

*/

var Report_HTML_Chunks_Interface = new function() {

	/*
	 * If report creation is triggered:
	 * Alter Zotero.Report object from report.js
	 */

	// Change contents to create HTML chunks as desired
	this.alterJS = function() {
		 /*
	 	 * Alter Zotero.Report object from report.js
	 	 */
		Zotero.Report = {};
		Zotero.Report.HTML = new function () {

			let domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Components.interfaces.nsIDOMParser);

			this.listGenerator = function* (items, combineChildItems) {

				// Get saved options from user dialog
				let allOptions = Report_HTML_Chunks_Interface_Dialog.allOptions;
				Zotero.log(Object.getOwnPropertyNames(allOptions.metadata));
				Zotero.log(Object.values(allOptions.metadata));

				// Get colored tags before processing to export them in colored spans later on
				var libraryID = Zotero.Libraries.userLibraryID;
				var tagColors = Zotero.SyncedSettings.get(libraryID, 'tagColors');

				// Set default headline level
				/*
				 * This value is not yet set in the disabled options
				 * (childItems, attachments)!
				 */
				let hX = allOptions.hlIndex;

				// Get user specified file location
				var destFile = allOptions.destFile;

				// HTML string to be saved before passed to browser
				var htmlStr = '';

				// Message to user (not possible to combine preview and leave chunk unchanged by browser engine)
				yield '<p style="padding: 20px; background-color: green; color: white;">Report chunk saved under ' + destFile + '.<br />';
				yield 'Please do not save this preview as it will add HTML document tags undesired for within-body chunks.';

				for (let i=0; i<items.length; i++) {
					let obj = items[i];

					// Get tags already here to put in html attribute facilitating filtering
					var tagListStr = _tagsToString(obj);

					let content = '<div id="item_' + obj.key + '" class="item ' + obj.itemType + '" taglist="' + tagListStr + '">\n';


					if (obj.title) {
						// Top-level item matched search, so display title
						if (obj.reportSearchMatch) {
							content += '\t<' + hX + '>' + escapeXML(obj.title) + '</' + hX + '>\n';
						}
						// Non-matching parent, so display "Parent Item: [Title]"
						else {
							content += '\t<' + hX + 'class="parentItem">' + escapeXML(Zotero.getString('report.parentItem'))
								+ ' <span class="title">' + escapeXML(obj.title) + '</span></' + hX + '>\n';
						}
					}

					// Show only authors below title, other creators shown in metadata table
					if (obj['creators']) {
						var displayText;

						// Display as paragraph to allow for additional styling; display only authors
						// At the moment: fix as <em> (however: css styling possible)
						content += '\t<p class="creators"><em>\n';

						var creatorContent = '';

						for (let creator of obj['creators']) {
							// One field
							if (creator.name !== undefined) {
								displayText = creator.name;
							}
							// Two field
							else {
								displayText = (creator.firstName + ' ' + creator.lastName).trim();
							}

							if (creator.creatorType == 'author') {
								creatorContent += '\t\t' + escapeXML(displayText) + ',';
							}
						}
						creatorContent = creatorContent.slice(0, -1);
						content += creatorContent + '\n\t</em></p>';
					}

					// If parent matches search, display parent item metadata table and tags
					if (obj.reportSearchMatch) {
						// Option: Tags (placed under title)
						if (allOptions.includeTags) {
							content += '\t<p class="tags">\n' + _generateTagsList(obj, tagColors) + '\t</p>';
						}
						// Option: Hide metadata in <details> environment?
						if (allOptions.mdToggle) {
							content += '\n\t<details>\n\t\t<summary>Show metadata</summary>' + _generateMetadataTable(obj, allOptions) + '\n\t</details>\n';
						} else {
							content += '\t' + _generateMetadataTable(obj, allOptions) + '\n';
						}
						// Independent note
						if (obj['note']) {
							content += '\n\t';
							content += getNoteHTML(obj.note);
						}
					}

					// Children
					if (obj.reportChildren) {
						// Child notes
						if (obj.reportChildren.notes.length) {
							/*/ Only display "Notes:" header if parent matches search
							if (obj.reportSearchMatch) {
								content += '\t\t\t\t<h3 class="notes">' + escapeXML(Zotero.getString('report.notes')) + '</h3>\n';
							} */
							/*
							 * No indentation of divs to enable pandoc parsing when using within
							 * markdown documents. Prettify if necessary.
							 */
							content += '<div class="notes">\n';
							var childTagList;
							for (let note of obj.reportChildren.notes) {
								// Option: Tags (placed under title)
								// Only include if not tagged with 'omitfromreport' (little helper)
								childTagList = _generateTagsList(note, tagColors);

								if (!childTagList.includes('omitfromreport')) {
									content += '<div id="item_' + note.key + '">\n';

									content += getNoteHTML(note.note);

									// Child note tags
									if (childTagList != '' && allOptions.includeTags) {
										content += 'Additional note tags:' + childTagList;
									}

									content += '</div>\n';
								}
							}
							content += '</div>\n';
						}
					/*
						// Child attachments
						content += _generateAttachmentsList(obj.reportChildren);
					*/
					}
					/*
					// Related items

					if (obj.reportSearchMatch && Zotero.Relations.relatedItemPredicate in obj.relations) {
						content += '\t\t\t\t<h3 class="related">' + escapeXML(Zotero.getString('itemFields.related')) + '</h3>\n';
						content += '\t\t\t\t<ul class="related">\n';
						var rels = obj.relations[Zotero.Relations.relatedItemPredicate];
						// TEMP
						if (!Array.isArray(rels)) {
							rels = [rels];
						}
						for (let i=0; i<rels.length; i++) {
							let rel = rels[i];
							let relItem = yield Zotero.URI.getURIItem(rel);
							if (relItem) {
								content += '\t\t\t\t\t<li id="item_' + relItem.key + '">';
								content += escapeXML(relItem.getDisplayTitle());
								content += '</li>\n';
							}
						}
						content += '\t\t\t\t</ul>\n';
					}
					*/
					content += '</div>\n';
					yield content;
					htmlStr += content;
				}

				/*
				 * Save content string directly to user specified location
				 * instead of passing content to the basicViewer.
				 * In this way, no tags are added that are necessary for
				 * a valid html file to have (like <html><head><body>...)
				 * but are undesired for exporting chunks only.
				 */

				Zotero.log('Saving html chunk to ' + destFile);
				let fileWritten = Zotero.File.putContentsAsync(destFile, htmlStr);

				// reset altered JS after saving
				fileWritten.then(Report_HTML_Chunks_Interface.resetJS());
			};


			function _generateMetadataTable(obj, allOptions) {
				var table = false;
				var content = '\n\t\t<table class="metadata">\n\t\t\t<tbody>\n';

				// Item type
				content += '\t\t\t\t<tr>\n';
				content += '\t\t\t\t\t<th>'
					+ escapeXML(Zotero.getString('itemFields.itemType'))
					+ '</th>\n';
				content += '\t\t\t\t\t<td>' + escapeXML(Zotero.ItemTypes.getLocalizedString(obj.itemType)) + '</td>\n';
				content += '\t\t\t\t</tr>\n';

				/**
				 * Authors at top, non-authors shown in table (possibly optional in future)
				 */

				// Creators
				if (obj['creators']) {
					table = true;
					var displayText;

					for (let creator of obj['creators']) {
						// only non-authors:
						if (creator.creatorType != 'author') {
							// One field
							if (creator.name !== undefined) {
								displayText = creator.name;
							}
							// Two fields
							else {
								displayText = (creator.firstName + ' ' + creator.lastName).trim();
							}

							content += '\t\t\t\t\t<tr>\n';
							content += '\t\t\t\t\t\t<th class="' + creator.creatorType + '">'
								+ escapeXML(Zotero.getString('creatorTypes.' + creator.creatorType))
								+ '</th>\n';
							content += '\t\t\t\t\t\t<td>' + escapeXML(displayText) + '</td>\n';
							content += '\t\t\t\t\t</tr>\n';
						}
					}
				}

				// Move dateAdded and dateModified to the end of the objay
				var da = obj['dateAdded'];
				var dm = obj['dateModified'];
				delete obj['dateAdded'];
				delete obj['dateModified'];
				obj['dateAdded'] = da;
				obj['dateModified'] = dm;

				for (var i in obj) {
					// Skip certain fields
					switch (i) {
						case 'reportSearchMatch':
						case 'reportChildren':

						case 'key':
						case 'version':
						case 'itemType':
						case 'title':
						case 'creators':
						case 'note':
						case 'collections':
						case 'relations':
						case 'tags':
						case 'deleted':
						case 'parentItem':

						case 'charset':
						case 'contentType':
						case 'linkMode':
						case 'path':
							continue;
					}

					try {
						var localizedFieldName = Zotero.ItemFields.getLocalizedString(obj.itemType, i);
					}
					// Skip fields we don't have a localized string for
					catch (e) {
						Zotero.debug('Localized string not available for ' + 'itemFields.' + i, 2);
						continue;
					}

					// Option: Skip unrequested fields
					if (!allOptions.metadata[i]) {
						continue;
					}

					obj[i] = (obj[i] + '').trim();

					// Skip empty fields
					if (!obj[i]) {
						continue;
					}

					table = true;
					var fieldText;

					if (i == 'url' && obj[i].match(/^https?:\/\//)) {
						fieldText = '<a href="' + escapeXML(obj[i]) + '">' + escapeXML(obj[i]) + '</a>';
					}
					// Hyperlink DOI
					else if (i == 'DOI') {
						fieldText = '<a href="' + escapeXML('http://doi.org/' + obj[i]) + '">'
							+ escapeXML(obj[i]) + '</a>';
					}
					// Remove SQL date from multipart dates
					// (e.g. '2006-00-00 Summer 2006' becomes 'Summer 2006')
					else if (i=='date') {
						fieldText = escapeXML(Zotero.Date.multipartToStr(obj[i]));
					}
					// Convert dates to local format
					else if (i=='accessDate' || i=='dateAdded' || i=='dateModified') {
						var date = Zotero.Date.isoToDate(obj[i], true)
						fieldText = escapeXML(date.toLocaleString());
					}
					else {
						fieldText = escapeXML(obj[i]);
					}

					content += '\t\t\t\t<tr>\n\t\t\t\t\t<th>' + escapeXML(localizedFieldName)
						+ '</th>\n\t\t\t\t\t<td>' + fieldText + '</td>\n\t\t\t\t</tr>\n';
				}

				content += '\t\t\t</tbody>\n\t\t</table>';

				return table ? content : '';
			}

			function _tagsToString (obj) {
				var tagListStr = '';
				var sep = ''
				if (obj.tags && obj.tags.length) {
					for (let i=0; i<obj.tags.length; i++) {

						if (i == obj.tags.length-1) {
							sep = ''
						}	else {
							sep = ','
						}
						// Exclude automatic tag by Zotero DOI Manager
						// (Possible future option: Select tags to include)
						if (!obj.tags[i].tag.includes('No DOI found')) {
							tagListStr += escapeXML(obj.tags[i].tag) + sep;
						}
					}
					return tagListStr;
				}
			}

			function _generateTagsList(obj, tagColors) {

				let content = {}; // fill array to sort and convert to string later
				let orderedContent = '';

				if (obj.tags && obj.tags.length) {
					/**
					 * Object does not seem to contain the tag color.
					 * Work-around for now: get all tag names and colors in library
					 * and check if fetched tags match colored tags (there are only 9).
					 *
					 * Display colored tags before other tags.
					 *
					 * CSS styling is presumed!
					 */
					// var str = Zotero.getString('report.tags');
					// content += '\t\t\t\t<p class="tags">' + escapeXML(str) + '</p>\n';
					for (let i=0; i<obj.tags.length; i++) {
						var tagName = escapeXML(obj.tags[i].tag);
						// Exclude automatic tag by Zotero DOI Manager
						// (Possible future option: Select tags to include)
						if (!tagName.includes('No DOI found')) {
							if (tagColors.length) {
								let coloredTag = false;
								// tagColors sorted as defined by user shortcuts (1-9)
								for (let j=0; j<tagColors.length; j++) {
									if (tagName == escapeXML(tagColors[j].name)) {
										// Omit # from class name: Using the Zotero default colors ensures fixed CSS class usage
										content[j] = '\t\t<span class="tag color' + j + '">' + tagName + '</span>';
										coloredTag = true;
									}
								}
								if (!coloredTag) {
									let j = i + tagColors.length; // add after colored tags
									content[j] = '\t\t<span class="tag">' + tagName + '</span>';
								}
							} else {
								content[i] = '\t\t<span class="tag">' + tagName + '</span>';
							}
						}
					}

					// Sort ascending and return string
					function compareNumbers(a, b) {
					  return a - b;
					}

					let orderedTags = [];

					for (let tag in content) {
						if (content.hasOwnProperty(tag)) {
							orderedTags.push(tag);
						}
					}

					orderedTags.sort(compareNumbers);

					for (let i = 0; i < orderedTags.length; i++) {
						tagNumber = orderedTags[i];
						orderedContent += content[tagNumber] + '\n';
					}
				}
				return orderedContent;
			}

			/*
			function _generateAttachmentsList(obj) {
				var content = '';
				if (obj.attachments && obj.attachments.length) {
					content += '\t\t\t\t<h3 class="attachments">' + escapeXML(Zotero.getString('itemFields.attachments')) + '</h3>\n';
					content += '\t\t\t\t<ul class="attachments">\n';
					for (let i=0; i<obj.attachments.length; i++) {
						let attachment = obj.attachments[i];

						content += '\t\t\t\t\t<li id="item_' + attachment.key + '">';
						if (attachment.title !== undefined) {
							content += escapeXML(attachment.title);
						}

						// Attachment tags
						content += _generateTagsList(attachment);

						// Attachment note
						if (attachment.note) {
							content += '\t\t\t\t\t\t<div class="note">';
							content += getNoteHTML(attachment.note);
							content += '\t\t\t\t\t</div>';
						}

						content += '\t\t\t\t\t</li>\n';
					}
					content += '\t\t\t\t</ul>\n';
				}
				return content;
			}
			*/

			function getNoteHTML(note) {
				// If HTML tag or entity, parse as HTML
				if (note.match(/(<(p|ul|ol|div|a|br|b|i|u|strong|em( >))|&[a-z]+;|&#[0-9]+;)/)) {
					let doc = domParser.parseFromString(
						note
							// Strip control characters (for notes that were
							// added before item.setNote() started doing this)
							.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
					 , "text/html");
					return doc.body.innerHTML + '\n';
				}
				// Otherwise, treat as plain text
				return '<p class="plaintext">' + escapeXML(note) + '</p>\n';
			}

			var escapeXML = function (str) {
				str = str.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/g, '\u2B1A');
				return Zotero.Utilities.htmlSpecialChars(str);
			}

		}
		// Altered
		return(true);
	}
	// Reset Zotero.Report
	this.resetJS = function() {
		Zotero.Report = {};
		Zotero.Report.HTML = new function () {
			let domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Components.interfaces.nsIDOMParser);

			this.listGenerator = function* (items, combineChildItems) {
				yield '<!DOCTYPE html>\n'
					+ '<html>\n'
					+ '	<head>\n'
					+ '		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'
					+ '		<title>' + Zotero.getString('report.title.default') + '</title>\n'
					+ '		<link rel="stylesheet" type="text/css" href="zotero://report/detail.css"/>\n'
					+ '		<link rel="stylesheet" type="text/css" media="screen,projection" href="zotero://report/detail_screen.css"/>\n'
					+ '		<link rel="stylesheet" type="text/css" media="print" href="zotero://report/detail_print.css"/>\n'
					+ '	</head>\n'
					+ '	<body>\n'
					+ '		<ul class="report' + (combineChildItems ? ' combineChildItems' : '') + '">';

				for (let i=0; i<items.length; i++) {
					let obj = items[i];

					let content = '\n\t\t\t<li id="item_' + obj.key + '" class="item ' + obj.itemType + '">\n';

					if (obj.title) {
						// Top-level item matched search, so display title
						if (obj.reportSearchMatch) {
							content += '\t\t\t<h2>' + escapeXML(obj.title) + '</h2>\n';
						}
						// Non-matching parent, so display "Parent Item: [Title]"
						else {
							content += '\t\t\t<h2 class="parentItem">' + escapeXML(Zotero.getString('report.parentItem'))
								+ ' <span class="title">' + escapeXML(obj.title) + '</span></h2>\n';
						}
					}

					// If parent matches search, display parent item metadata table and tags
					if (obj.reportSearchMatch) {
						content += _generateMetadataTable(obj);

						content += _generateTagsList(obj);

						// Independent note
						if (obj['note']) {
							content += '\n\t\t\t';
							content += getNoteHTML(obj.note);
						}
					}

					// Children
					if (obj.reportChildren) {
						// Child notes
						if (obj.reportChildren.notes.length) {
							// Only display "Notes:" header if parent matches search
							if (obj.reportSearchMatch) {
								content += '\t\t\t\t<h3 class="notes">' + escapeXML(Zotero.getString('report.notes')) + '</h3>\n';
							}
							content += '\t\t\t\t<ul class="notes">\n';
							for (let note of obj.reportChildren.notes) {
								content += '\t\t\t\t\t<li id="item_' + note.key + '">\n';

								content += getNoteHTML(note.note);

								// Child note tags
								content += _generateTagsList(note);

								content += '\t\t\t\t\t</li>\n';
							}
							content += '\t\t\t\t</ul>\n';
						}

						// Child attachments
						content += _generateAttachmentsList(obj.reportChildren);
					}

					// Related items
					if (obj.reportSearchMatch && Zotero.Relations.relatedItemPredicate in obj.relations) {
						content += '\t\t\t\t<h3 class="related">' + escapeXML(Zotero.getString('itemFields.related')) + '</h3>\n';
						content += '\t\t\t\t<ul class="related">\n';
						var rels = obj.relations[Zotero.Relations.relatedItemPredicate];
						// TEMP
						if (!Array.isArray(rels)) {
							rels = [rels];
						}
						for (let i=0; i<rels.length; i++) {
							let rel = rels[i];
							let relItem = yield Zotero.URI.getURIItem(rel);
							if (relItem) {
								content += '\t\t\t\t\t<li id="item_' + relItem.key + '">';
								content += escapeXML(relItem.getDisplayTitle());
								content += '</li>\n';
							}
						}
						content += '\t\t\t\t</ul>\n';
					}

					content += '\t\t\t</li>\n\n';

					yield content;
				}

				yield '\t\t</ul>\n\t</body>\n</html>';
			};


			function _generateMetadataTable(obj) {
				var table = false;
				var content = '\t\t\t\t<table>\n';

				// Item type
				content += '\t\t\t\t\t<tr>\n';
				content += '\t\t\t\t\t\t<th>'
					+ escapeXML(Zotero.getString('itemFields.itemType'))
					+ '</th>\n';
				content += '\t\t\t\t\t\t<td>' + escapeXML(Zotero.ItemTypes.getLocalizedString(obj.itemType)) + '</td>\n';
				content += '\t\t\t\t\t</tr>\n';

				// Creators
				if (obj['creators']) {
					table = true;
					var displayText;

					for (let creator of obj['creators']) {
						// One field
						if (creator.name !== undefined) {
							displayText = creator.name;
						}
						// Two field
						else {
							displayText = (creator.firstName + ' ' + creator.lastName).trim();
						}

						content += '\t\t\t\t\t<tr>\n';
						content += '\t\t\t\t\t\t<th class="' + creator.creatorType + '">'
							+ escapeXML(Zotero.getString('creatorTypes.' + creator.creatorType))
							+ '</th>\n';
						content += '\t\t\t\t\t\t<td>' + escapeXML(displayText) + '</td>\n';
						content += '\t\t\t\t\t</tr>\n';
					}
				}

				// Move dateAdded and dateModified to the end of the objay
				var da = obj['dateAdded'];
				var dm = obj['dateModified'];
				delete obj['dateAdded'];
				delete obj['dateModified'];
				obj['dateAdded'] = da;
				obj['dateModified'] = dm;

				for (var i in obj) {
					// Skip certain fields
					switch (i) {
						case 'reportSearchMatch':
						case 'reportChildren':

						case 'key':
						case 'version':
						case 'itemType':
						case 'title':
						case 'creators':
						case 'note':
						case 'collections':
						case 'relations':
						case 'tags':
						case 'deleted':
						case 'parentItem':

						case 'charset':
						case 'contentType':
						case 'linkMode':
						case 'path':
							continue;
					}

					try {
						var localizedFieldName = Zotero.ItemFields.getLocalizedString(obj.itemType, i);
					}
					// Skip fields we don't have a localized string for
					catch (e) {
						Zotero.debug('Localized string not available for ' + 'itemFields.' + i, 2);
						continue;
					}

					obj[i] = (obj[i] + '').trim();

					// Skip empty fields
					if (!obj[i]) {
						continue;
					}

					table = true;
					var fieldText;

					if (i == 'url' && obj[i].match(/^https?:\/\//)) {
						fieldText = '<a href="' + escapeXML(obj[i]) + '">' + escapeXML(obj[i]) + '</a>';
					}
					// Hyperlink DOI
					else if (i == 'DOI') {
						fieldText = '<a href="' + escapeXML('http://doi.org/' + obj[i]) + '">'
							+ escapeXML(obj[i]) + '</a>';
					}
					// Remove SQL date from multipart dates
					// (e.g. '2006-00-00 Summer 2006' becomes 'Summer 2006')
					else if (i=='date') {
						fieldText = escapeXML(Zotero.Date.multipartToStr(obj[i]));
					}
					// Convert dates to local format
					else if (i=='accessDate' || i=='dateAdded' || i=='dateModified') {
						var date = Zotero.Date.isoToDate(obj[i], true)
						fieldText = escapeXML(date.toLocaleString());
					}
					else {
						fieldText = escapeXML(obj[i]);
					}

					content += '\t\t\t\t\t<tr>\n\t\t\t\t\t<th>' + escapeXML(localizedFieldName)
						+ '</th>\n\t\t\t\t\t\t<td>' + fieldText + '</td>\n\t\t\t\t\t</tr>\n';
				}

				content += '\t\t\t\t</table>\n';

				return table ? content : '';
			}


			function _generateTagsList(obj) {
				var content = '';
				if (obj.tags && obj.tags.length) {
					var str = Zotero.getString('report.tags');
					content += '\t\t\t\t<h3 class="tags">' + escapeXML(str) + '</h3>\n';
					content += '\t\t\t\t<ul class="tags">\n';
					for (let i=0; i<obj.tags.length; i++) {
						content += '\t\t\t\t\t<li>' + escapeXML(obj.tags[i].tag) + '</li>\n';
					}
					content += '\t\t\t\t</ul>\n';
				}
				return content;
			}


			function _generateAttachmentsList(obj) {
				var content = '';
				if (obj.attachments && obj.attachments.length) {
					content += '\t\t\t\t<h3 class="attachments">' + escapeXML(Zotero.getString('itemFields.attachments')) + '</h3>\n';
					content += '\t\t\t\t<ul class="attachments">\n';
					for (let i=0; i<obj.attachments.length; i++) {
						let attachment = obj.attachments[i];

						content += '\t\t\t\t\t<li id="item_' + attachment.key + '">';
						if (attachment.title !== undefined) {
							content += escapeXML(attachment.title);
						}

						// Attachment tags
						content += _generateTagsList(attachment);

						// Attachment note
						if (attachment.note) {
							content += '\t\t\t\t\t\t<div class="note">';
							content += getNoteHTML(attachment.note);
							content += '\t\t\t\t\t</div>';
						}

						content += '\t\t\t\t\t</li>\n';
					}
					content += '\t\t\t\t</ul>\n';
				}
				return content;
			}


			function getNoteHTML(note) {
				// If HTML tag or entity, parse as HTML
				if (note.match(/(<(p|ul|ol|div|a|br|b|i|u|strong|em( >))|&[a-z]+;|&#[0-9]+;)/)) {
					let doc = domParser.parseFromString('<div>'
						+ note
							// Strip control characters (for notes that were
							// added before item.setNote() started doing this)
							.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
					 + '</div>', "text/html");
					return doc.body.innerHTML + '\n';
				}
				// Otherwise, treat as plain text
				return '<p class="plaintext">' + escapeXML(note) + '</p>\n';
			}


			var escapeXML = function (str) {
				str = str.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/g, '\u2B1A');
				return Zotero.Utilities.htmlSpecialChars(str);
			}
		}
		// Reset
		Zotero.debug('JS reset to initial state.', 2)
	}

	this.doReport = function (allOptions) {

		let alteredJS;

		/*
		 * Wait for javascript alteration to finish. Implementation as a promise
		 * did for some reason no longer work after calling this from the dialog.
		 * So, doing this the classic way. Promise code commented out below.
		 */
		waitForReportJS = function(timeout) {
			if (alteredJS) {
				Zotero.debug('JS overwritten', 2);
				// Load requested report type
	        	if (allOptions.reportTypeRequested == 'collection') {
	    	 		Report_HTML_Chunks_Interface.loadCollectionReport(); // Collection
	    	 	}
		 		else if (allOptions.reportTypeRequested == 'item') {
		 			Report_HTML_Chunks_Interface.loadItemReport(); // Items
		 		}
		 		else {
					throw new Error('Report could not be processed: No items or collection selected.');
		 		}
			} else if((timeout -= 100) < 0) {
				Zotero.error('Error: Could not alter JS.');
			} else {
				setTimeout(waitReportJS, 100);
			}
		}
		alteredJS = Report_HTML_Chunks_Interface.alterJS(false);
		waitForReportJS(5000); // wait 5 seconds before throwing error

		/*
	    // Wait for JS overwrite to finish before creating report
	    var waitForReportJS = timeoutms => new Promise((r, j) => {
	      var check = () => {
	        Zotero.warn('Waiting for JS to be overwritten...')
	        if(alteredJS) {
	        	r('JS overwritten');
				// Load requested report type
	        	if (allOptions.reportTypeRequested == 'collection') {
	    	 		Report_HTML_Chunks_Interface.loadCollectionReport(); // Collection
	    	 	}
		 		else if (allOptions.reportTypeRequested == 'item') {
		 			Report_HTML_Chunks_Interface.loadItemReport(); // Items
		 		}
	        }
	        else if((timeoutms -= 100) < 0) {
	          j('Error: Could not alter JS.');
	        }
	        else {
	          setTimeout(check, 100);
	        }
	      }
	      setTimeout(check, 100);
	    })
	    // Overwrite JS
		alteredJS = Report_HTML_Chunks_Interface.alterJS(false);
	    // Process report when finished or abort after 5 seconds
	    (async () => {
	      waitForReportJS(3000);
	  	})(); */
	}

	/*
	 * Load a report for the currently selected collection
	 */
	this.loadCollectionReport = function (event) {

		Zotero.debug('Collection report is created...', 2);

		let ZoteroPane_Local = Zotero.getActiveZoteroPane();

		// Load report
		var sortColumn = ZoteroPane_Local.getSortField();
		var sortDirection = ZoteroPane_Local.getSortDirection();
		var queryString = '?sort=' + sortColumn
			+ '&direction=' + (sortDirection == 'ascending' ? 'asc' : 'desc');

		var url = 'zotero://report/';

		var source = ZoteroPane_Local.getSelectedCollection();
		if (!source) {
			source = ZoteroPane_Local.getSelectedSavedSearch();
		}
		if (!source) {
			throw new Error('No collection currently selected');
		}

		url += Zotero.API.getLibraryPrefix(source.libraryID) + '/';

		if (source instanceof Zotero.Collection) {
			url += 'collections/' + source.key;
		}
		else {
			url += 'searches/' + source.key;
		}

		url += '/items' + queryString;

		ZoteroPane_Local.loadURI(url, event);

	}

	/*
	 * Load a report for the currently selected items
	 */
	this.loadItemReport = function (event) {

		Zotero.debug('Item report is created...', 2);

		let ZoteroPane_Local = Zotero.getActiveZoteroPane();

		// Load report
		var libraryID = ZoteroPane_Local.getSelectedLibraryID();
		var items = ZoteroPane_Local.getSelectedItems();

		if (!items || !items.length) {
			throw new Error('No items currently selected');
		}

		var url = 'zotero://report/' + Zotero.API.getLibraryPrefix(libraryID) + '/items'
			+ '?itemKey=' + items.map(item => item.key).join(',');

		ZoteroPane_Local.loadURI(url, event);

	}
}
