const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');

// 1. 解码 Cloudflare 邮箱
function decodeCFEmail(encoded) {
  const r = Number.parseInt(encoded.substr(0, 2), 16);
  let email = '';
  for (let i = 2; i < encoded.length; i += 2) {
    email += String.fromCharCode(Number.parseInt(encoded.substr(i, 2), 16) ^ r);
  }
  return email;
}

// 2. 解析 HTML
const html = `<p><code>vless://<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="b6d4d5d48785d3d5d49b82d080859b828483819bd7d386879bd3d583d7d3d7d7808785d783f68783819884838298848485988082">[email&#160;protected]</a>:23000?encryption=none&amp;security=reality&amp;sni=mxj.myanimelist.net&amp;fp=chrome&amp;pbk=dJFLqPCinyadJxJk7zA_DwBOEAvexvm7AZT2Pw84_EY&amp;sid=955275866feece09&amp;spx=%2F&amp;type=xhttp&amp;path=%2Ffan3.206102.xyz#VLESS%E8%8A%82%E7%82%B91-xhttp-reality</code></p>`;

const doc = new DOMParser().parseFromString(html, 'text/html');

// 3. 提取 <code> 内容
// const codeEl = xpath.parse('//code', doc);
const codeEla = xpath.parse('//code').select({ node: doc, isHtml: true });
console.log(codeEla);
if (!codeEla) throw new Error('No <code> found');

// 4. 获取前缀和后缀文本
const codeEl = codeEla[0];
const prefix = codeEl.firstChild?.data || ''; // "vless://"
const suffix = codeEl.lastChild?.data || ''; // ":23000?..."
console.log(`prefix: ${prefix}\nsuffix: ${suffix}`);

// 5. 提取并解码邮箱
const aEl = codeEl.getElementsByTagName('a')[0];
let email = '[email protected]';
if (aEl && aEl.getAttribute('data-cfemail')) {
  email = decodeCFEmail(aEl.getAttribute('data-cfemail'));
}

// 6. 拼接完整链接
const fullLink = prefix + email + suffix;
console.log(fullLink);
// 输出: vless://bcb13ecb-4f63-4257-ae01-ec5aeaa613a5@157.254.223.64:23000?encryption=none&security=reality&...
//
//

// 正则方式
// 正则：匹配 Cloudflare 保护的 <a> 标签
const cfEmailRegex =
  /<a[^>]*class="__cf_email__"[^>]*data-cfemail="([a-fA-F0-9]+)"[^>]*>.*?<\/a>/g;

function replaceCFEmailWithReal(htmlString) {
  return htmlString.replace(cfEmailRegex, (match, encodedEmail) => {
    try {
      return decodeCFEmail(encodedEmail);
    } catch (e) {
      console.warn('Failed to decode CF email:', match);
      return '[email protected]'; // fallback
    }
  });
}

const output = replaceCFEmailWithReal(html);
console.log(output);

const codeContentRegex = /(<code[^>]*>)(.*?)(<\/code>)/gs;
const result = html.replace(
  codeContentRegex,
  (match, openTag, content, closeTag) => {
    const cleanedContent = replaceCFEmailWithReal(content);
    return openTag + cleanedContent + closeTag;
  }
);

console.log(result);
