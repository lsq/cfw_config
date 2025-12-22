// ref: https://blog.csdn.net/2301_81155391/article/details/148168945
// https://webcrack.netlify.app/
// https://obf-io.deobfuscate.io/
// https://lelinhtinh.github.io/de4js/
//
const axios = require('axios');
const { webcrack } = require('@bratel/webcrack');
const { DOMParser } = require('@xmldom/xmldom');
// const { DOMParser } = require("xmldom");
const { linkToClash } = require('./lib/converter');
const yaml = require('js-yaml');

const xpath = require('xpath');
const fs = require('fs').promises;
const parser = new DOMParser();
const url = 'https://fan2.194529.xyz/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/';
// const uriPath = "ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/";
const amazoneUrl =
  'https://s3.dualstack.us-west-2.amazonaws.com/zhifan2/ss.html';
const xpathHtml = (parseString, doc) =>
  xpath.parse(parseString).select({ node: doc, isHtml: true });

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};
//
async function update_uri() {
  const amazoneResponse = await axios.get(amazoneUrl);
  // saveTextToFile("amazoneInfo.html", amazoneResponse.data);
  const retDoc = parser.parseFromString(amazoneResponse.data, 'text/html');
  // const uriNode = xpath.parse("//link[@rel='icon']/@href").select({node: retDoc, isHtml: true})
  const uriNode = xpathHtml("//link[@rel='icon']/@href", retDoc);
  // console.log(uriNode);
  const faviconUri = uriNode[0].nodeValue;
  const retUri = faviconUri.slice(0, faviconUri.lastIndexOf('/') + 1);
  // console.log(retUri);
  if (isValidUrl(retUri)) {
    return retUri;
  }
  const jsDataNode = xpathHtml(
    "//script[contains(text(), '(function')]",
    retDoc
  );
  // console.log(jsDataNode)
  if (jsDataNode) {
    // console.log('-----------------------')
    // console.log(jsDataNode[0].firstChild.nodeValue)
    const jsData = jsDataNode[0].firstChild.nodeValue;
    console.log('-----------------------');
    console.log(jsData);
    const result = await webcrack(jsData);
    const code = result.code;
    if (code) {
      const match = code.match(/\.src\s*=\s*["']([^"']+)["']/);
      if (match) {
        if (isValidUrl(match[1])) {
          console.log('Extracted src:', match[1]);
          saveTextToFile(
            __dirname + '/ssUrl.log',
            new Date().toLocaleString() + 'Extracted src: ' + match[1] + '\n',
            { f: 'a' }
          );
          return match[1];
        }
      }
    }
  }
}
// 原始字符串
const inputString =
  '节点：92.118.205.61 端口：22222 密码： dongtaiwang.com  加密方式：aes-256-gcm';
// const inputString = `ipv4 节点：92.118.205.61 端口：22222 密码： dongtaiwang.com  加密方式：aes-256-gcm
//
// ipv6 节点：2001:bc8:32d7:30b::202 端口：13355 密码： dongtaiwang.com  加密方式：aes-256-gcm`;

// 解析函数
function parseNodes(input) {
  // 按空行分割成两行
  const lines = input.trim().split(/\n\s*\n/);

  return lines.map((line) => {
    // 匹配各个字段
    const typeMatch = line.match(/(ipv[46]\s+)?节点：([^\s]+)/);
    const portMatch = line.match(/端口：(\d+)/);
    const passwordMatch = line.match(/密码：\s*([^ ]+)/);
    const encryptionMatch = line.match(/加密方式：([^ ]+)/);
    const protocolMatch = line.match(/协议：\s*([^ ]+)/);
    const obfsMatch = line.match(/混淆：\s*([^ ]+)/);
    const className = protocolMatch ? 'ssr' : 'ss';

    if (typeMatch) {
      // if (className === "ssr") {
      return {
        name: typeMatch
          ? 'new-pac-' + className + '-' + (typeMatch[1] ?? '节点').trim()
          : null,
        type: className,
        server: typeMatch ? typeMatch[2] : null,
        port: portMatch ? parseInt(portMatch[1], 10) : null,
        password: passwordMatch ? passwordMatch[1] : null,
        cipher: encryptionMatch ? encryptionMatch[1] : null,
        ...(protocolMatch != null && { protocol: protocolMatch[1] }),
        ...(obfsMatch != null && { obfs: obfsMatch[1] }),
      };
    }
    // return {
    //   name: typeMatch
    //     ? "new-pac-" + className + (typeMatch[1] ?? "节点").trim()
    //     : null,
    //   type: className,
    //   address: typeMatch ? typeMatch[2] : null,
    //   port: portMatch ? parseInt(portMatch[1], 10) : null,
    //   password: passwordMatch ? passwordMatch[1] : null,
    //   encryption: encryptionMatch ? encryptionMatch[1] : null,
    // };
    // }
    return null;
  });
}

// 解析并输出结果
const nodes = parseNodes(inputString);
console.log(nodes);

async function saveTextToFile(filename, content, options = {}) {
  const { e = 'utf8', f = 'w' } = options;
  try {
    await fs.writeFile(filename, content, { encoding: e, flag: f });
  } catch (err) {
    console.error('保存文件时出错:', err);
  }
}

async function parse_data() {
  try {
    const newUri = (await update_uri()) || url;
    // const url = newUri + uriPath;
    const v2rayUri = newUri.replace('/ss', '/v2ray');
    const ret = await Promise.allSettled(
      [newUri, v2rayUri].map(async (link) => {
        const response = await axios.get(link, {
          proxy: { host: '127.0.0.1', port: 7890, protocol: 'http' },
        });
        const data = response.data;
        // console.log(data);
        // await saveTextToFile("ssInfo.html", data, { f: "a" });
        // const parser = new xmldom.DOMParser();
        // for xmldom
        // const doc = new DOMParser().parseFromString(data);
        // for @xmldom
        const doc = parser.parseFromString(data, 'text/html');
        // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code', doc)
        // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code/text()', doc)
        // const node = xpath.select('//code/text()', doc)
        // const node = xpath.select("//strong[contains(text(),'SS节点')]", doc)
        // console.log(node[0].parentNode.nextSibling)
        // const node = xpath.select("//strong[contains(text(),'SS链接')]", doc)
        // console.log(node[0].parentNode.previousSibling.previousSibling.previousSibling.previousSibling.firstChild.firstChild.nodeValue)
        // const node = xpath.select("//strong[contains(text(),'SS链接')]/", doc)
        // const node = xpath.select("//strong[contains(text(),'SS链接')]/following-sibling::code", doc)
        /* for xmldom
    const node = xpath.select(
      "//code[preceding::*[contains(text(),'SS节点')]]",
      doc,
    );
    */
        // for @xmldom
        // const node = xpathHtml(
        //   "//code[preceding::*[contains(text(),'SSR节点')]]",
        //   doc,
        // );
        const node = xpathHtml('//p/code/text()', doc);
        /*
          xpath
      .parse("//code[preceding::*[contains(text(),'SS节点')]]")
      .select({ node: doc, isHtml: true });
     */
        console.log(node.length);
        // console.log(node);
        // console.log(node[0].firstChild.nodeValue);
        // const info = node[0].firstChild.nodeValue;
        // console.log(node[0].childNodes['1'].nodeValue)
        // const node = xpath.select("//strong", doc)
        // console.log(node[0].parentNode)
        // console.log(node.nodeValue)
        // console.log(node[2].nodeValue)
        // console.log(doc.querySelector('.wp-block-code'))
        // const info = node[2].nodeValue
        // console.log(info)
        // const jsonStr = '[{"' + info.replace(/ /g,'').replace(/\n+/g,'} {').replace(/\s([^\s]*?：)/g, ',$1').replace(/：/g,'":"').replace(/,/g,'","') + '"}]'
        // const new_pac = parseNodes(info);
        const new_pac_link = node
          .map((info) => {
            // const nvalue = info.firstChild.nodeValue;
            // return parseNodes(nvalue);
            const nvalue = info.nodeValue;
            console.log(`nvalue: ${nvalue}`);
            return nvalue;
          })
          .filter((p) => p !== null);
        console.log(new_pac_link);
        console.log(`link2Clash: ${JSON.stringify(linkToClash(new_pac_link))}`);
        const config_data = parseProxies(linkToClash(new_pac_link));
        console.log(JSON.stringify(config_data));
        /*
    const meta = JSON.parse(jsonStr)
    const new_pac = [{
        name: "new-pac",
        type: "ss",
        server: meta['节点'],
        port: meta['端口'],
        cipher: meta['加密方式'],
        password: meta['密码']
    }]
    */
        return config_data;
      })
    );
    const new_pac = ret
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          saveTextToFile(
            __dirname + '/ssUrl.log',
            new Date().toLocaleString() +
              `Fetch error: ${result.reason}` +
              '\n',
            { f: 'a' }
          );
          throw result.reason;
        }
      })
      .flat();
    return new_pac;
  } catch (e) {
    console.log(e);
  }
}

function parseProxies(response) {
  if (!response.success) {
    throw new Error('Response not successful');
  }

  const data = response.data;

  // 方法 1：直接用 YAML 解析整个 data（推荐）
  // 因为 "proxies:" 是合法的 YAML 映射键，值是一个列表
  try {
    const parsed = yaml.load(data);
    // parsed 是 { proxies: [ {...}, {...} ] }
    return parsed.proxies.filter((n) => {
      return (
        n.name !== null && n.server && n.name !== 'Unnamed' && n.server !== null
      );
    });
  } catch (err) {
    console.error('YAML parse error:', err.message);
    throw err;
  }
}

parse_data().then((data) => console.log(data));
/*
module.exports.parse = async (raw, { axios, yaml, notify, console }, { name, url, interval, selected }) => {
  const obj = yaml.parse(raw)
  //console.log(obj['proxy-groups'][0]['proxies'])
  //const free_pac = 'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
  // let {data, status} =  await axios.get(url)
  console.log(new Date().toLocaleString())
  let prependProxies = await parse_data()
  console.log(prependProxies)
  obj.proxies=[...prependProxies, ...obj.proxies]
  // console.log(data)
  //axios.get(free_pac).then(function(res) {console.log(res)}).catch(function(err){console.log(err)})
  obj['proxy-groups'][0]['proxies'].push('new-pac')
  return yaml.stringify(obj)
}
*/
const pickDefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));

// 使用
const ret = pickDefined({ a: 1, b: null, c: undefined, d: 4 }); // { a: 1, d: 4 }
console.log(ret);
