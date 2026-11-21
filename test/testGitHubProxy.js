const { fetchProxyList } = require('../getFastGit');
const { getProxyWithFallback, fetchproxy_next } = require('../githubProxy');
// Fallback 链：按优先级从高到低排列
// 既然有本地代理，raw.githubusercontent.com 直连应排在第一位

(async () => {
  const [ghfast, gh_next] = await Promise.all([
    fetchProxyList(),
    fetchproxy_next(),
  ]);
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

  if (gh_next) console.log(gh_next);
})();
