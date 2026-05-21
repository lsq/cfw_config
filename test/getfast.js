const { fetchProxyList, mergeAndSortProxies } = require('../getFastGit');

(async () => {
  try {
    const myExisting = [
      { url: 'https://custom.proxy', name: '自定义代理', latency: 300 },
    ];

    const fetched = await fetchProxyList();
    const merged = mergeAndSortProxies(myExisting, fetched);

    console.log(merged);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
