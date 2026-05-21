const { fetchProxyList } = require('../getFastGit');

(async () => {
  const fetched = await fetchProxyList();
  console.log(fetched);
})();
