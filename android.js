async function main(config) {
  const response = await fetch(
    'https://gh-proxy.com/https://github.com/YouAreHuman/updatePac/raw/refs/heads/master/newpac.json'
  );
  const parsed = await response.json();
  const prependProxies = parsed.proxies;
  const prxoyNames = prependProxies.map((item) => item.name);
  config.proxies = [...prependProxies, ...config.proxies];
  config['proxy-groups'][0].proxies.push(...prxoyNames);

  return config;
}
