const xpath = require("xpath");

const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const parser = new DOMParser();

const xml =
  '<books><book><title lang="en">XPath指南</title></book><book><title lang="en">XxPath指南</title></book></books>';
// const xml = '<book><title lang="en">XPath指南</title></book><book><title lang="en">XxPath指南</title></book>'

const doc = new DOMParser().parseFromString(xml, "text/xml");

const title = xpath.select("//title/text()", doc);
//
console.log(title);

const str =
  "节点：92.118.205.61 端口：22222 密码： dongtaiwang.com  加密方式：aes-256-gcm";

console.log("{" + str.replace(/\s([^\s]*?)：/g, ",$1:") + "}");
jsonStr =
  '{"' +
  str
    .replace(/\s([^\s]*?：)/g, ",$1")
    .replace(/：/g, '":"')
    .replace(/,/g, '","') +
  '"}';
json = JSON.stringify(jsonStr);
console.log(json);
obj = JSON.parse(jsonStr.replace(/ /g, ""));
console.log(obj);
console.log(obj["节点"], obj.端口);
/*
const shtml = `<div>
  <p><strong>SS节点信息：</strong></p>
  <p><code>server: 1.2.3.4</code></p> <!-- 这个会被方案1, 2, 3 匹配 -->
  <pre><code>port: 12345</code></pre><!-- 这个会被方案1, 3 匹配 -->
</div>
`
*/
/*
 */
const shtml = `<xml><div>
  <p><strong>SS节点信息：</strong>
  <code> type: ss </code> <!-- 这个会被方案2匹配 -->
  <pre><code>port: 12345</code></pre>   <!-- 这个会被方案1, 3 匹配 -->
  <xx>blabla</xx>
  </p>
  <p><code>server: 1.2.3.4</code></p> <!-- 这个会被方案1 匹配 -->
  <div><p><code> test hahaha </code></p></div>
</div>
<div>
  <code>other code</code> <!-- 这个可能被方案1匹配，如果它在文档中位于 strong 之后 -->
</div>
<strong>SS节点配置</strong>
<span>配置详情：<code>password: abc</code></span> <!-- 这个会被方案1, 3 匹配 -->
<div><p>lsq</p></div>
</xml>
`;

const newDoc = parser.parseFromString(shtml, "text/xml");
// console.log(newDoc)

// method 1.查找文档中位于该strong之后的任意code标签(无论层级, 只要满足条件：出现在strong元素之后)
const cNode = xpath.select(
  "//code[preceding::*[self::strong and contains(text(),'SS节点')]]",
  newDoc,
);
// const cNode = xpath.select("//strong[contains(text(),'SS节点')]",newDoc)
// const cNode = xpath.select("//p", newDoc)

console.log(cNode);
// const serialized = new XMLSerializer().serializeToString(cNode[0])
// console.log(serialized)
const info = cNode.map((node) => {
  return new XMLSerializer().serializeToString(node);
});

console.log("method 1:",info);

//method 2. 查找同一父元素下，位于该strong之后的code标签（兄弟关系）
//code标签与strong标签的父标签为同一元素才行
const cNode2 = xpath.select("//strong[contains(text(), 'SS节点')]/following-sibling::code", newDoc)
/*
 *  /following-sibling::code: 从该strong元素出发，选择它之后的同级code元素
*/
// console.log(cNode2)
const info2 = cNode2.map(node => {
    return new XMLSerializer().serializeToString(node)
})
console.log("method 2:", info2)

// method 3. 查找同一父元素下位于该strong之后的任意元素内的code标签
// 查找与'SS节点'strong标签同级，且在它之后的任何元素内部嵌套的code标签
const cNode3 = xpath.select("//strong[contains(text(),'SS节点')]/following-sibling::*//code", newDoc)
/*
 * //strong[contains(text(),'SS')]: 定位strong 
 * following-sibling::*:选择它之后的所有同级元素
 * //code: 在这些同级元素的后代中查找code标签
*/
const info3 = cNode3.map(node => {
    return new XMLSerializer().serializeToString(node)
})
console.log("method 3:",info3)

// method 4. 查找该strong标签的父元素内，位于strong之后的code标签
// 与方案2和3类似，但更明确地限制在父容器内
const cNode4 = xpath.select("//strong[contains(text(),'SS节点')]/parent::*//*[preceding-sibling::strong[contains(text(),'SS节点')]]//code", newDoc)
const info4 = cNode4.map(node => {
    return new XMLSerializer().serializeToString(node)
})
console.log("method 4:",info4)
// const cNode5 = xpath.select("//strong[contains(text(),'SS节点')]/parent::*/following-sibling::*//code", newDoc)
const cNode5 = xpath.select("//strong[contains(text(),'SS节点')]/parent::*/self::*/code", newDoc)
const info5 = cNode5.map(node => {
    return new XMLSerializer().serializeToString(node)
})
console.log("method 5:",info5)
