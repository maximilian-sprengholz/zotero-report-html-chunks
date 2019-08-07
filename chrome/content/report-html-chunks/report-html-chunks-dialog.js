/*

	=== Zotero Report HTML Chunks ===

	License: GNU AGPLv3

	Copyright © 2019 Maximilian Sprengholz
				Humboldt-Universität zu Berlin
				maximilian.sprengholz@hu-berlin.de

	This file handles the user interaction (options dialog) when reporting HTML
	chunks.

*/

const OPTION_PREFIX = "report-html-chunks-export-dialog-";

var Report_HTML_Chunks_Interface_Dialog = new function() {

	// Options to be set
	var allOptions = {};

	// Init triggered by menu item
	this.init = function (reportTypeRequested) {

		// Get all itemFields for options dialog
		var allItemFields = [];

		// Get all items present in selection or collection
		if (reportTypeRequested = 'item') {
			var allItems = ZoteroPane.getSelectedItems();
		} else if (reportTypeRequested = 'collection') {
			var collection = ZoteroPane.getSelectedCollection();
			var allItems = collection.getChildItems();
		}

		for (var i=0; i<allItems.length; i++) {
		    let obj = allItems[i]._itemData
			let fieldName;
			let fieldValue;
		    let fieldKey;

		    for (var j in obj) {

				// Skip empty fields
				if (!obj[j]) {
					continue;
				}

		    // get all item fields with at least one valid value within item set
				fieldName = Zotero.ItemFields.getName(j);
				fieldValue = obj[j];
		        fieldKey = j;
		        if (fieldValue != false && fieldName != 'title' && !allItemFields.includes(fieldKey)) {
		            // Push to array only if item field key not already in it,
					// Exclude title (Used as headline anyhow)
		            allItemFields.push(fieldKey);
		        }
		    }
		}

		// Sort array ascending
		function compareNumbers(a, b) {
		  return a - b;
		}
		allItemFields.sort(compareNumbers);

		/*
		 * Present options dialog:
		 * On load the available options are displayed that match the selected items
		 * by the user (metadata customization). The array allItemfields is passed as
		 * argument as well as the report type (item/collection).
		 */
		window.openDialog("chrome://report-html-chunks/content/report-html-chunks-export-dialog.xul",
			"_blank", "chrome,modal,centerscreen,resizable=no", allItemFields, reportTypeRequested);

	}

	// Populate dialog and save by default selected options
	this.index = function (allItemFields, reportTypeRequested) {

		// Populate dialog with metadata field options and save
		var metaDataBox1 = document.getElementById(OPTION_PREFIX+"metadata-col1");
		var metaDataBox2 = document.getElementById(OPTION_PREFIX+"metadata-col2");

		// Metadata container
		allOptions.metadata = {};

		for (var i=0; i<allItemFields.length; i++) {

			// Get label from localized string
			let fieldLabel;
			try {
	      fieldLabel = Zotero.ItemFields.getLocalizedString(null, allItemFields[i]);
	    }
	    catch (e) {
				fieldLabel = Zotero.ItemFields.getName(allItemFields[i]); // set name instead as fallback
	    	Zotero.debug('Localized string not available for ' + 'itemFields.' + allItemFields[i], 2);
	    }
			// Get field name as id
			let fieldName = Zotero.ItemFields.getName(allItemFields[i]);
			// Create checkboxes
			var checkbox = document.createElement("checkbox");
			checkbox.setAttribute("id", OPTION_PREFIX + "metadata-" + fieldName);
			checkbox.setAttribute("label", fieldLabel);
			// deselect some by default
			let fieldValue;
			if ( fieldName.includes('Date') || fieldName.includes('journalAbbr') ) {
				fieldValue = false;
			} else {
				fieldValue = true;
			}
			checkbox.setAttribute("checked", fieldValue);
			// set update function and it's argument
			checkbox.setAttribute("oncommand", 'Report_HTML_Chunks_Interface_Dialog.update(\'metadata-' + fieldName +'\')');
			// Populate dialog: 2 column layout to limit vertical space
			if (i % 2 === 0) {
				metaDataBox1.insertBefore(checkbox, metaDataBox1.childNodes[i]);
			} else {
				metaDataBox2.insertBefore(checkbox, metaDataBox2.childNodes[i]);
			}
			allOptions.metadata[fieldName] = fieldValue;
		}
		// Select headline level per default
		var hlIndexMenu = document.getElementById(OPTION_PREFIX + "hlIndex");
		hlIndexMenu.selectedIndex = 1;
		// Add default options to allOptions object
		allOptions.mdToggle = true; // Metadata toggle
		allOptions.hlIndex = hlIndexMenu.value; // Headline Index level (corresponding to tag)
		allOptions.includeTags = true; // Include Tags in report
		// Add requested report type to options
		allOptions.reportTypeRequested = reportTypeRequested;
	}

	// Update options array with user selection
	this.update = function (fieldName) {
		let fieldElement = document.getElementById(OPTION_PREFIX + fieldName);
		let fieldValue;
		if (fieldElement.tagName == 'menulist') {
			// Update dropdown value on interaction
			fieldValue = fieldElement.value;  // value corresponding to tag
			allOptions[fieldName] = fieldValue;
		} else if (fieldElement.tagName == 'checkbox') {
			// Update checkbox values on interaction
			fieldValue = fieldElement.checked;
			if (fieldName.includes('metadata-')) {
				// Metadata box
				fieldName = fieldName.substring(9); // omit the 'metadata-' prefix (tidy XUL)
				allOptions.metadata[fieldName] = fieldValue;
			}	else {
				// Other checkbox options
				allOptions[fieldName] = fieldValue;
			}
		} else {
			Zotero.debug('No update function available for element.', 2)
		}
	}

	// Do report export on OK
	this.accept = function () {
		// Pick file export location
		let destFile = Report_HTML_Chunks_Interface_Dialog.filePicker();
		// Start export only when file location returned
		if (destFile) {
			allOptions.destFile = destFile // Metadata toggle
			// Set accessible object for Report_HTML_Chunks_Interface
			Report_HTML_Chunks_Interface_Dialog.allOptions = allOptions;
			// Pass selected options to report function (only used for report type atm)
			Report_HTML_Chunks_Interface.doReport(allOptions);
		}
	}

	this.cancel = function () {
	}

	/*
	 * Present file picker on accept
	 */

	this.filePicker = function () {

		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"]
				.createInstance(nsIFilePicker);
		fp.init(window, 'Choose file saving location', nsIFilePicker.modeSave);

		fp.defaultString = 'report-html-chunk.html';
		fp.defaultExtension = 'html';
		fp.appendFilter('HTML', "*.html");

		var rv = fp.show();
		if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace) {
			return;
		}

	    return(fp.file.path);
	}

}
