async function main(config) {
  const response = await fetch(
    // 'https://gh-proxy.com/https://github.com/YouAreHuman/updatePac/raw/refs/heads/master/newpac.json'
    'https://gh-proxy.com/https://github.com/YouAreHuman/updatePac/raw/refs/heads/master/newpac.yaml'
  );
  // const parsed = await response.json();
  const contents = await response.text();
  const parsed = jsyaml.load(contents);
  const prependProxies = parsed.proxies;
  const prxoyNames = prependProxies.map((item) => item.name);
  config.proxies = [...prependProxies, ...config.proxies];
  config['proxy-groups'][0].proxies.push(...prxoyNames);

  return config;
}
