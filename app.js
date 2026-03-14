const os = require('node:os');
const path = require('node:path');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');
const { getPublicNodeset, mergeData, parseData, restartMihomo } = require('./get_newpac');
const math = require('./math');

const html = `<code>abc\nbcb13ecb-4f63-4257-ae01-ec5aeaa613a5@157.254.223.64\ndef</code>`;
const doc = new DOMParser().parseFromString(html, 'text/html');
// 用 XPath 代替 querySelector
const codeNode = xpath.parse('//code').select({ node: doc, isHtml: true });
// console.log(codeNode)
if (codeNode) {
  console.log(codeNode[0].textContent); // ✅ 正确获取文本
}
// 输出: email protected （或类似）

console.log(math.add(8, 8));

const str = 'haha';

function createParsedata() {
  let used = false;
  return data => (used ? data : ((used = true), `${data}${str}`));
}

// 使用示例
const processArray = arr => arr.map(createParsedata());

console.log(processArray([])); // []
console.log(processArray(['x'])); // ["xhaha"]
console.log(processArray(['a', 'b'])); // ["ahaha", "b"]

const giturl
  = 'https://gh-proxy.com/https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.yml';
const mhdir = path.join(getHomeDir(), '.config/mihomo/config.yaml');
console.log(`mihomo config path: ${mhdir}`);

let outputPath;
if (require('node:process').platform === 'win32') {
  outputPath = path.join(__dirname, 't_modified.yaml');
}
else {
  outputPath = mhdir;
}

function getHomeDir() {
  const home = os.homedir();
  if (!home) {
    throw new Error('无法确定用户主目录');
  }
  return home;
}

// getPublicNodeset(giturl, outputPath);
const getNodesetForUrl = url => () => getPublicNodeset(url);
(async () => {
  await mergeData(getNodesetForUrl(giturl), parseData, outputPath);
  const restartOrNot = await restartMihomo();
  if (restartOrNot) {
    console.log('重载mihomo配置成功！');
  }
})();
