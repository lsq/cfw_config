const {
  fetchProxyList,
  mergeAndSortProxies,
  fetchGitMxgPubList,
} = require('../getFastGit');

(async () => {
  try {
    const myExisting = [
      { url: 'https://custom.proxy', name: '自定义代理', latency: 300 },
    ];

    const fetched = await fetchGitMxgPubList();
    const merged = mergeAndSortProxies(myExisting, fetched);

    console.log(merged);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
