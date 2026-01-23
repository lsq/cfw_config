const fs = require('node:fs/promises');
const path = require('node:path');
const { webcrack } = require('@bratel/webcrack');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const axiosN = require('axios');
const xpath = require('xpath');

const amazoneUrl
  = 'https://s3.dualstack.us-west-2.amazonaws.com/zhifan2/v2ray.html';
const parser = new DOMParser();
function xpathHtml(parseString, doc) {
  return xpath.parse(parseString).select({ node: doc, isHtml: true });
}

async function saveTextToFile(filename, content, options = {}) {
  const { e = 'utf8', f = 'w' } = options;
  try {
    await fs.writeFile(filename, content, { encoding: e, flag: f });
  }
  catch (err) {
    console.error('保存文件时出错:', err);
  }
}

function isValidUrl(str) {
  try {
    const turl = new URL(str);
    return true;
  }
  catch {
    return false;
  }
}

async function update_uri() {
  try {
    const amazoneResponse = await axiosN.get(amazoneUrl);
    // {
    // proxy: { host: '127.0.0.1', port: 7890, protocol: 'http' },
    // });
    // saveTextToFile("amazoneInfo-log.html", amazoneResponse.data);
    const retDoc = parser.parseFromString(amazoneResponse.data, 'text/html');
    // const uriNode = xpath.parse("//link[@rel='icon']/@href").select({node: retDoc, isHtml: true})
    const uriNode = xpathHtml('//link[@rel=\'icon\']/@href', retDoc);
    // console.log(uriNode)
    if (uriNode.length > 0) {
      const faviconUri = uriNode[0].nodeValue;
      const retUri = faviconUri.slice(0, faviconUri.lastIndexOf('/'));
      if (isValidUrl(retUri)) {
        return retUri;
      }
    }
    const jsDataNode = xpathHtml(
      '//script[contains(text(), \'(function\')]',
      retDoc,
    );
    // console.log(`jsDataNode: ${jsDataNode}`)
    if (jsDataNode.length > 0) {
      // console.log('-----------------------')
      // console.log(jsDataNode[0].firstChild.nodeValue)
      const jsData
        = jsDataNode[0].textContent || jsDataNode[0].firstChild?.nodeValue;
      // console.log("-----------------------");
      // console.log(`jsData:${jsData}`);
      if (jsData) {
        const result = await webcrack(jsData);
        const code = result.code;
        if (code) {
          // const match = code.match(/\.src\s*=\s*["']([^"']+)["']/);
          const match = code.match(
            /id",\s*"(https:\/\/(?:[^\n\r/\u2028\u2029]*\/[\t\v\f "'\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])*[^\n\r/\u2028\u2029]*\/[^\s"']+(?:[\t\v\f "'\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF](?:[^\n\r/\u2028\u2029]*\/[\t\v\f "'\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])*[^\n\r/\u2028\u2029]*\/[^\s"']+)*\/)"/,
          )?.[1];
          // console.log(`match: ${match}`)
          /*
          try {
              const urlhref = (new URL(match)).href
          // console.log(`URL(match): ${(new URL(match)).href}`)
          console.log(`isValidUrl: ${isValidUrl(urlhref)}`)
          } catch (err) {
              console.error(`Invalid url: ${err}`)
          }
          */
          if (match && isValidUrl(match)) {
            const extractedUrl = match;
            // console.log("Extracted src:", extractedUrl);
            await saveTextToFile(
              path.join(__dirname, 'ssUrl.log'),
              `${new Date().toLocaleString()}Extracted src: ${extractedUrl}\n`,
              { f: 'a' },
            );
            return extractedUrl;
          }
        }
      }
    }
    return null;
  }
  catch (err) {
    saveTextToFile(
      path.join(__dirname, 'ssUrl.log'),
      `${new Date().toLocaleString()} update_uri() -> Fetch error: ${err}`
      + `\n`,
      { f: 'a' },
    );
    return null;
  }
}

(async () => {
  const url = await update_uri();
  // console.log(process.execPath)
  console.log(url);
})();
