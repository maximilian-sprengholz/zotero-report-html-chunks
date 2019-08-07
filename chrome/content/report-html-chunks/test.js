var allItems = ZoteroPane.getSelectedItems();
var allItemFields = [];

for (var i=0; i<allItems.length; i++) {
    let obj = allItems[i]._itemData
    let fieldName;
    let fieldValue;
    let fieldKey;

    for (var j in obj) {
        // get all item fields with at least one valid value within item set
        fieldName = Zotero.ItemFields.getName(j);
        fieldValue = obj[j];
        fieldKey = j;
        /*
        try {
            l = Zotero.ItemFields.getLocalizedString(j);
        }
    	catch (e) {
    		Zotero.debug('Localized string not available for ' + 'itemFields.' + j, 2);
    		continue;
    	}
        */

        if (fieldName !== false && fieldValue != false && allItemFields.includes(j)) {
            // Push to array only if item field key not already in it
            allItemFields.push(j);
            /*
            Zotero.log(j);
            Zotero.log('Key:' + k);
            Zotero.log('Value:' + v);
            Zotero.log('Localized string:' + l);
            */
        }
    }
}

// Sort array ascending
function compareNumbers(a, b) {
  return a - b;
}
allItemFields.sort(compareNumbers);
Zotero.log(Object.Values(allItemFields));



//Zotero.log('Name:' + Zotero.ItemFields.getName(item.itemType,1));

//Zotero.log('Loc:' + Zotero.ItemFields.getLocalizedString(item.itemType, 1));





function compareNumbers(a, b) {
  return a - b;
}
