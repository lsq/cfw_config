const os = require('node:os');
const path = require('node:path');
const { env } = require('process');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');
const { genClashCfg } = require('./genMihomo');
const {
  getPublicNodeset,
  mergeData,
  parseData,
  restartMihomo,
  mihomoConfig,
} = require('./get_newpac');
const math = require('./math');
const isCI = !!env.GITHUB_ACTIONS;

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
  return (data) => (used ? data : ((used = true), `${data}${str}`));
}

// 使用示例
const processArray = (arr) => arr.map(createParsedata());

console.log(processArray([])); // []
console.log(processArray(['x'])); // ["xhaha"]
console.log(processArray(['a', 'b'])); // ["ahaha", "b"]

const giturl =
  // 'https://gh-proxy.com/https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.yml';
  'https://gh-proxy.com/raw.githubusercontent.com/free18/v2ray/refs/heads/main/c.yaml';
// const newpacData = path.join(__dirname, 'newpac.yaml');
const outputPath = mihomoConfig();

// getPublicNodeset(giturl, outputPath);
const getNodesetForUrl = (url) => () => getPublicNodeset(url);

async function reloadConfig() {
  const restartOrNot = await restartMihomo();
  if (restartOrNot) {
    console.log('重载mihomo配置成功！');
  }
}

(async () => {
  if (false) {
    await mergeData(getNodesetForUrl(giturl), parseData, outputPath);
    // ----- test exportData ----------
    // const rest = await parseData();
    // await exportData(newpacData, rest);
    // ----- test exportData ----------
    // ----- test  reload mihomo config ----------
    const restartOrNot = await restartMihomo();
    if (restartOrNot) {
      console.log('重载mihomo配置成功！');
    }
  }
  if (true) {
    await genClashCfg();
    if (!isCI) {
      await reloadConfig();
    }
  }
  // ----- test  reload mihomo config ----------
})();
