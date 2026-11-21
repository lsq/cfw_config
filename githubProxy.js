const axios = require('axios');
const { fetchProxyList } = require('./getFastGit');

// https://github.akams.cn
// https://github.com/hubporg/ghproxy-next/tree/main
const ghproxy_next =
  'https://github.com/hubporg/ghproxy-next/blob/main/components/nodes.ts';
const imciel = 'http://ghproxy.imciel.com';

const githubcdn = 'https://githubcdn.com/';
// https://download.githubcdn.com/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fhubporg%2Fghproxy-next%2Fmain%2Fcomponents%2Fnodes.ts
const ghproxy_vip = 'https://ghproxy.vip/';

const gh_proxy_cn = 'https://gh-proxy.cn/github';

const PROXY_SOURCES = [
  'https://gh-proxy.com',
  gh_proxy_cn,
  'https://ghfast.top',
  'https://mirror.ghproxy.com',
  imciel,
  ghproxy_vip,
  githubcdn,
];

/**
 * 2. 从源码文本中提取所有 value 值
 * @param {string} text - response.text() 返回的原始字符串
 * @returns {string[]} - 提取出的域名数组（未去重）
 */
function extractValues(text) {
  // 匹配 value: "..." 或 value: '...'（兼容单双引号和任意空格）
  const regex = /value:\s*["']([^"']+)["']/g;
  const results = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    // match[1] 就是括号中捕获到的域名内容
    results.push(match[1].trim());
  }

  return results;
}

/**
 * 1. 独立的数组去重函数
 * 利用 ES6 Set 特性，保留原有顺序并去除重复项
 * @param {Array} arr - 原始数组
 * @returns {Array} - 去重后的新数组
 */
function uniqueArray(arr) {
  if (!arr || arr.length == 0) return;
  return [...new Set(arr)];
}

async function fetchproxy_next() {
  const result = await getProxyWithFallback(PROXY_SOURCES);
  if (!result.success) return;
  const response = await fetch(`${result.source}/${ghproxy_next}`, {
    credentials: 'omit',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64; rv:158.0) Gecko/20100101 Firefox/158.0',
      Accept: '*/*',
      'Accept-Language':
        'zh-CN,zh;q=0.9,zh-TW;q=0.8,zh-HK;q=0.7,en-US;q=0.6,en;q=0.5',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-GPC': '1',
      Priority: 'u=4',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    },
    referrer: 'https://github.com',
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    return;
    // throw new Error(`HTTP error! status: ${response.status}`);
  }

  const domainNodes = extractValues(await response.text());

  return uniqueArray(domainNodes);
}

/**
 * 通过指定的 gh-proxy 获取配置文件
 * @param {string} proxyHost - 代理域名，如 'gh-proxy.com'
 * @returns {Promise<boolean>} 请求成功返回 true，失败返回 false
 */
async function checkProxy(proxyHost) {
  const url = `${proxyHost}/raw.githubusercontent.com/HenryChiao/MIHOMO_YAMLS/main/THEDOC/THE_REAL_README.md`;

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ [${proxyHost}] 请求成功，状态码: ${response.status}`);
      return true;
    }

    // 理论上 axios 非 2xx 会抛异常，此处做防御性处理
    console.error(`❌ [${proxyHost}] 非预期状态码: ${response.status}`);
    return false;
  } catch (error) {
    if (error.response) {
      console.error(`❌ [${proxyHost}] HTTP 响应码: ${error.response.status}`);
    } else if (error.request) {
      console.error(`❌ [${proxyHost}] 无响应: ${error.message}`);
    } else {
      console.error(`❌ [${proxyHost}] 请求错误: ${error.message}`);
    }
    return false;
  }
}

/**
 * 按顺序尝试 fallback 列表中的代理源
 * @param {string[]} sources - 代理域名列表
 * @returns {Promise<{success: boolean, source: string|null}>}
 */
async function getProxyWithFallback(sources) {
  for (const source of sources) {
    console.log(`\n🔄 正在尝试: ${source}`);
    const ok = await checkProxy(source);

    if (ok) {
      return { success: true, source };
    }

    console.log(`⏭️  [${source}] 失败，尝试下一个...`);
  }

  console.error('\n❌ 所有代理源均不可用');
  return { success: false, source: null };
}

/**
 * 按顺序尝试 fallback 列表中的代理源
 * @returns {Promise<{success: boolean, source: string|null}>}
 */
async function getFastestProxy() {
  let ghfast, ghnext;
  try {
    [ghfast, ghnext] = await Promise.all([fetchProxyList(), fetchproxy_next()]);
    // console.log(ghfast);
  } catch (err) {
    console.log(`[gh-fast]: ${err.message}`);
    ghfast = [];
    ghnext = [];
  }
  const ghfastUrl = ghfast.map((itm) => itm.url);

  const proxy_sources = uniqueArray([
    ...PROXY_SOURCES,
    ...ghnext,
    ...ghfastUrl,
  ]);

  const result = await getProxyWithFallback(proxy_sources);

  if (result.success) {
    console.log(`\n✅ 最终成功，可用源: ${result.source}`);
  } else {
    console.log('\n💀 获取配置失败，请检查网络或更换代理列表');
  }

  return result;
}

module.exports = {
  checkProxy,
  getProxyWithFallback,
  getFastestProxy,
  fetchproxy_next,
};
