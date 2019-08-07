// Only create main object once
if (!Report_HTML_Chunks_Interface_Dialog) {
	let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://report-html-chunks/content/report-html-chunks-dialog.js");
	loader.loadSubScript("chrome://report-html-chunks/content/report-html-chunks.js");
}
