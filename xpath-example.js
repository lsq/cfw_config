const xpath = require('xpath');

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const parser = new DOMParser();

const xml =
  '<books><book><title lang="en">XPath指南</title></book><book><title lang="en">XxPath指南</title></book></books>';

const doc = new DOMParser().parseFromString(xml, 'text/xml');

const title = xpath.select('//title/text()', doc);
//
console.log(title);

const str =
  '节点：92.118.205.61 端口：22222 密码： dongtaiwang.com  加密方式：aes-256-gcm';

console.log('{' + str.replace(/\s([^\s]*?)：/g, ',$1:') + '}');
jsonStr =
  '{"' +
  str
    .replace(/\s([^\s]*?：)/g, ',$1')
    .replace(/：/g, '":"')
    .replace(/,/g, '","') +
  '"}';
json = JSON.stringify(jsonStr);
console.log(json);
obj = JSON.parse(jsonStr.replace(/ /g, ''));
console.log(obj);
console.log(obj['节点'], obj.端口);

const html = `<div>
  <p><strong>SS节点信息：</strong></p>
  <p><code>server: 1.2.3.4</code></p> <!-- 这个会被方案1, 2, 3 匹配 -->
  <pre><code>port: 12345</code></pre>   <!-- 这个会被方案1, 3 匹配 -->
</div>
<div>
  <code>other code</code> <!-- 这个可能被方案1匹配，如果它在文档中位于 strong 之后 -->
</div>
<strong>SS节点配置</strong>
<span>配置详情：<code>password: abc</code></span> <!-- 这个会被方案1, 3 匹配 -->`;

const newDoc = parser.parseFromString(html, 'text/html');

const cNode = xpath.select(
  "//code[preceding::*[self::strong and contains(text(),'SS节点')]]",
  newDoc
);

console.log(cNode);
