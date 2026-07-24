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
      url: `${opt.url}/`,
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

/**
 * 将 URL 或域名列表转换为 mihomo nameserver-policy 配置对象
 * @param {string|string[]} inputs - 单个URL/域名，或URL/域名数组
 * @param {string|string[]} dnsServers - 单个DNS服务器地址，或多个DNS服务器地址数组
 * @returns {Object} mihomo nameserver-policy 格式的对象
 */
function toNameserverPolicy(
  inputs,
  dnsServers = 'https://dns.alidns.com/dns-query#ecs=223.5.5.5/24&ecs-override=true'
) {
  const list = Array.isArray(inputs) ? inputs : [inputs];
  // 核心修改：统一将 dnsServers 转为数组，确保每个域名的值都是合法的 DNS 服务器数组
  const servers = Array.isArray(dnsServers) ? dnsServers : [dnsServers];

  const domains = list.map((input) => {
    try {
      const hostname = new URL(input).hostname;
      return `+.${hostname}`;
    } catch {
      const cleaned = input.replace(/^(https?:\/\/)/, '').split('/')[0];
      return cleaned.startsWith('+.') ? cleaned : `+.${cleaned}`;
    }
  });

  const uniqueDomains = [...new Set(domains)];

  const policy = {};
  uniqueDomains.forEach((domain) => {
    // 直接赋值完整的服务器数组，而非包装单元素数组
    policy[domain] = servers;
  });

  return policy;
}

/**
 * 将 toNameserverPolicy 的返回值安全合并到原 mihomo 配置的 nameserver-policy 中
 * @param {Object} originalConfig - 原始 mihomo 完整配置对象
 * @param {Object} newPolicy - toNameserverPolicy() 的返回值
 * @returns {Object} 合并后的完整配置对象（不修改原对象）
 */
function mergeNameserverPolicy(originalConfig, newPolicy) {
  // 1. 深拷贝原配置，避免直接修改原始数据
  const merged = JSON.parse(JSON.stringify(originalConfig));

  // 2. 确保 nameserver-policy 字段存在
  if (!merged.dns) merged.dns = {};
  if (!merged.dns['nameserver-policy']) merged.dns['nameserver-policy'] = {};

  // 3. 浅合并：新策略的键值对覆盖/追加到原 policy 中
  // ⚠️ 相同域名键时，newPolicy 的值会完全替换原值（符合 mihomo 语义）
  Object.assign(merged.dns['nameserver-policy'], newPolicy);

  return merged;
}

async function main(config) {
  // 如果ipv6连接不通，在flClash上会出现同步providers失败
  // 那么就会VPN代理不通，需要切换github下载代理链接
  // https://testipv6.cn/index.html.zh_CN
  // https://ipv6.ustb.edu.cn/
  const githubProxies = [
    'https://gh-proxy.com/',
    'https://v6.gh-proxy.org/',
    'https://gh-proxy.org/',
    'https://hk.gh-proxy.org/',
    'https://fastgit.cc/',
    'https://fastgit.cc/',
    'https://gh.jasonzeng.dev/',
    'https://gp.zkitefly.eu.org/',
    'https://gitproxy.mrhjx.cn/',
  ];
  const gitfast = await fetchProxyList();
  console.log(gitfast);
  const githubProxy = gitfast?.[0]?.url ?? githubProxies?.[0];
  const url = [
    `${githubProxy}https://github.com/ssrsub/ssr/raw/refs/heads/master/clash.yaml`, // 0
    `${githubProxy}https://github.com/snakem982/proxypool/raw/refs/heads/main/source/clash-meta.yaml`, // 1
    `${githubProxy}https://github.com/snakem982/proxypool/raw/refs/heads/main/source/clash-meta-2.yaml`, // 2

    'https://xmxosfepggzm.503403.xyz', // 3
    'https://www.xrayvip.com/free.txt', // 4
    `${githubProxy}https://github.com/chengaopan/AutoMergePublicNodes/raw/refs/heads/master/list.meta.yml`, // 5
    `${githubProxy}https://github.com/anaer/Sub/raw/refs/heads/main/proxies.yaml`, // 6
    `${githubProxy}https://raw.githubusercontent.com/anaer/Sub/main/proxies.yaml`, //7
  ];
  // config.ipv6 = true;
  // config.tun.enable = true; // android上此参数无效
  // config['proxy-providers'] = {};
  config['external-controller'] = '0.0.0.0:9090';
  config['proxy-providers'].main.url = url[0];
  config['proxy-providers'].main.interval = 3600;
  config['proxy-providers'].main.header = {};
  config['proxy-providers'].main.override['proxy-name'] = [
    {
      pattern: '机场推荐[：:]',
      target: '',
    },
  ];

  config['proxy-providers'].back.url = url[3];
  config['proxy-providers'].back.interval = 3600;
  config['proxy-providers'].back.type = 'http';
  config['proxy-providers'].back.override['proxy-name'] = [
    {
      pattern: '机场推荐[：:]',
      target: '',
    },
  ];
  const newPolicy = toNameserverPolicy(
    // ['https://fastgit.cc', 'https://gitproxy.mrhjx.cn'],
    githubProxy,
    [
      'https://dns.alidns.com/dns-query#ecs=223.5.5.5/24&ecs-override=true',
      'https://doh.pub/dns-query#ecs=223.5.5.5/24&ecs-override=true',
    ]
  );

  // 3. ✅ 核心：一行合并
  // config.dns['nameserver-policy'] = merge({},config.dns?.['nameserver-policy'] || {}, newPolicy);
  const finalConfig = mergeNameserverPolicy(config, newPolicy);

  return finalConfig;
}
