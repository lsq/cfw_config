const fs = require('fs');

function replaceProxyProviders(configPath, newBlock) {
  fs.copyFileSync(configPath, configPath + '.bak');
  const content = fs.readFileSync(configPath, 'utf8');
  const regex = /^proxy-providers:\s*\n(?:\s{2,}.*\n?)*/gm;
  
  if (!regex.test(content)) {
    throw new Error('proxy-providers block not found in config');
  }

  const updated = content.replace(regex, newBlock.trim() + '\n');
  fs.writeFileSync(configPath, updated, 'utf8');
}

// 使用
const newBlock = `
proxy-providers:
  wmain:
    <<: *ProvidersURL
    url: https://anyland.club/#/register?code=R7vdKxbE
    path: ./proxy_provider/main.yaml
    override:
      udp: true
      additional-prefix: '主-'
  wback:
    <<: *ProvidersFILE
    path: proxy_provider/back.yaml
    override:
      udp: true
      additional-prefix: "备-6-"
`;

replaceProxyProviders('./downloads/wanswu_config.yaml', newBlock);
