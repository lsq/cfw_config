const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { merge } = require('lodash');

const input = `
# 入站
tun:
  enable: false
  stack: mixed
  auto-route: true
  dns-hijack: [any:53]

proxy:
  type: ss
`;

const content = fs.readFileSync(
  path.join(__dirname, '../downloads/wanswu_config.yaml')
);
function extractYamlBlock(text, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // const regex = new RegExp(`^\\\\s*${escapedKey}:\\\\s*$((?:\\\\n(?:\\\\s.*|$))*)`, 'gm');
  const regex = new RegExp(`^${escapedKey}:\\s*\\n(?:\\s{2,}.*\\n?)*`, 'gm');
  const match = regex.exec(text);
  console.log(match);
  return match ? match[0] : null;
}

// 使用
// const tunBlock = extractYamlBlock(input, 'tun');
const tunBlock = extractYamlBlock(content, 'tun');
console.log('Extracted:', tunBlock);

if (tunBlock) {
  const partial = yaml.load(tunBlock); // { tun: { ... } }
  const merged = merge({}, partial, { tun: { enable: true } });
  console.log(merged.tun.enable); // true
  console.log(merged);
  console.log(yaml.dump(merged));
}
