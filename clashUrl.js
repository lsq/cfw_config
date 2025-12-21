const {linkToClash} = require('./lib/converter')
const yaml = require('js-yaml')

const vmessUrl = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNRVNT6IqC54K5Mi1pcHY2IiwNCiAgImFkZCI6ICIyMDAxOmJjODozMmQ3OjIwMTM6OjgiLA0KICAicG9ydCI6ICI2MjIxMSIsDQogICJpZCI6ICJlMTc4NmQ0OS1jY2JhLTQ2NmItYTBkZC1lMWFiNTliZDgzYmIiLA0KICAiYWlkIjogIjAiLA0KICAic2N5IjogImF1dG8iLA0KICAibmV0IjogIndzIiwNCiAgInR5cGUiOiAibm9uZSIsDQogICJob3N0IjogInd3dy5iaW5nLmNvbSIsDQogICJwYXRoIjogIi9naXRodWIuY29tL0FsdmluOTk5OSIsDQogICJ0bHMiOiAiIiwNCiAgInNuaSI6ICIiLA0KICAiYWxwbiI6ICIiLA0KICAiZnAiOiAiIg0KfQ=='
const hy2url = 'hysteria2://dongtaiwang.com@109.104.152.244:11220?sni=apple.com&alpn=h3&insecure=1#Hysteria2%E8%8A%82%E7%82%B93'
//
const ret = linkToClash([hy2url, vmessUrl])
console.log("解析结果为：", ret)

function parseProxies(response) {
  if (!response.success) {
    throw new Error('Response not successful');
  }

  const data = response.data;

  // 方法 1：直接用 YAML 解析整个 data（推荐）
  // 因为 "proxies:" 是合法的 YAML 映射键，值是一个列表
  try {
    const parsed = yaml.load(data);
    // parsed 是 { proxies: [ {...}, {...} ] }
    return parsed.proxies;
  } catch (err) {
    console.error('YAML parse error:', err.message);
    throw err;
  }
}

// 使用示例
try {
  const proxies = parseProxies(ret);
  console.log(JSON.stringify(proxies, null, 2));
} catch (error) {
  console.error('Failed to parse proxies:', error);
}
