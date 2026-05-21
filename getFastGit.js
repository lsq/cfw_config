/**
 * 请求 gh-fast.com 的代理配置接口，返回标准化的代理列表
 * @returns {Promise<Array<{url: string, name: string, latency: number}>>}
 */
async function fetchProxyList() {
  const response = await fetch('https://gh-fast.com/api/proxy-config.json', {
    credentials: 'omit',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0',
      Accept: '*/*',
      'Accept-Language':
        'zh-CN,zh;q=0.9,zh-TW;q=0.8,zh-HK;q=0.7,en-US;q=0.6,en;q=0.5',
      'Alt-Used': 'gh-fast.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-GPC': '1',
      Priority: 'u=4',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    },
    referrer: 'https://gh-fast.com/',
    method: 'GET',
    mode: 'cors',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('API returned success: false');
  }

  const options = data.data?.options || [];
  return options
    .map((opt) => ({
      url: opt.url,
      name: opt.name,
      latency: opt.latency,
    }))
    .sort((a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity));
}

/**
 * 合并两个代理列表，以 url 为唯一键去重，新数据优先，最终按 latency 升序排序
 * @param {Array<{url: string, name: string, latency: number}>} existing
 * @param {Array<{url: string, name: string, latency: number}>} fetched
 * @returns {Array<{url: string, name: string, latency: number}>}
 */
function mergeAndSortProxies(existing = [], fetched = []) {
  const proxyMap = new Map();

  // 先加入已有的（会被 fetched 覆盖）
  for (const item of existing) {
    if (item.url) proxyMap.set(item.url, item);
  }

  // 再加入新获取的（覆盖同 url 的旧项）
  for (const item of fetched) {
    if (item.url) proxyMap.set(item.url, item);
  }

  return Array.from(proxyMap.values()).sort(
    (a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity)
  );
}

// CommonJS 导出
module.exports = {
  fetchProxyList,
  mergeAndSortProxies,
};
