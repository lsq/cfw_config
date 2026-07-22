const axios = require('axios');
const { fetchProxyList } = require('./getFastGit');

/**
 * 通过指定的 gh-proxy 获取配置文件
 * @param {string} proxyHost - 代理域名，如 'gh-proxy.com'
 * @returns {Promise<boolean>} 请求成功返回 true，失败返回 false
 */
async function checkProxy(proxyHost) {
  const url = `${proxyHost}/raw.githubusercontent.com/HenryChiao/MIHOMO_YAMLS/main/THEDOC/THE_REAL_README.md`;

  try {
    const response = await axios.get(url, {
      timeout: 15000,
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
  const ghfast = await fetchProxyList();
  console.log(ghfast);
  const ghfastUrl = ghfast.map((itm) => itm.url);
  const PROXY_SOURCES = [
    'https://gh-proxy.com',
    ...ghfastUrl,
    'https://ghfast.top',
    'https://mirror.ghproxy.com',
  ];

  const result = await getProxyWithFallback(PROXY_SOURCES);

  if (result.success) {
    console.log(`\n✅ 最终成功，可用源: ${result.source}`);
  } else {
    console.log('\n💀 获取配置失败，请检查网络或更换代理列表');
  }

  return result;
}

module.exports = { checkProxy, getProxyWithFallback, getFastestProxy };
