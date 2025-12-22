'use strict';
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

// const source= '<books><book><title lang="en">XPath指南</title></book><book><title lang="en">XxPath指南</title></book></books>'
const source =
  '<book><title lang="en">XPath指南</title></book><book><title lang="en">XxPath指南</title></book>';
/*
const source = `<xml xmlns="a">
	<child>test</child>
	<child/>
</xml>`;
*/

const doc = new DOMParser().parseFromString(source, 'text/xml');
console.log(doc);

const serialized = new XMLSerializer().serializeToString(doc);
if (source !== serialized) {
  console.error(`expected\n${source}\nbut was\n${serialized}`);
  process.exit(1);
} else {
  console.log(serialized);
}
