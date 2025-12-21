const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const xpath = require("xpath");
const fs = require("fs");

const parser = new DOMParser()
var xhtmlNs = 'http://www.w3.org/1999/xhtml';
const parseXml = (xml, mimeType = 'text/xml') => parser.parseFromString(xml, mimeType);

const data = fs.readFileSync("./ssInfo.html", "utf-8");
const doc = new DOMParser().parseFromString(data, "text/html");

const node = xpath.parse(
 "//code[preceding::*[contains(text(),'SS节点')]]"
//  "//title"
).select({node: doc, isHtml:true});
console.log(node);
const ret = node.map(nd=> {
    return new XMLSerializer().serializeToString(nd)
})
console.log(ret)

// console.log(node[0].firstChild.nodeValue);

const markup = '<html><head></head><body><p>Hi Ron!</p><my:p xmlns:my="http://www.example.com/my">Hi Draco!</p><p>Hi Hermione!</p></body></html>';
const docHtml = parseXml(markup, 'text/html');
const ns = {h: xhtmlNs}

// allow matching on unprefixed nodes
const greetings1 = xpath.parse('/html/body/p').select({node: docHtml, isHtml: true})
console.log(greetings1)
