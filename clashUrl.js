const yaml = require('js-yaml');
const isEqual = require('lodash/isEqual');
const { exportData } = require('./get_newpac');
const { generateUri, linkToClash } = require('./lib/converter');

const vmessUrl
  = ['vmess://eyJhZGQiOiI4Mi4xOTguMjQ2Ljk3IiwiYWlkIjoiMCIsImFscG4iOiIiLCJmcCI6IiIsImhvc3QiOiI4Mi4xOTguMjQ2Ljk3IiwiaWQiOiJkMTNmYzJmNS0zZTA1LTQ3OTUtODFlYi00NDE0M2EwOWU1NTIiLCJpbnNlY3VyZSI6IjAiLCJuZXQiOiJ0Y3AiLCJwYXRoIjoiLyIsInBvcnQiOiIxODAiLCJwcyI6IlVT44CQ5py65Zy65o6o6I2Q77yaaHR0cHM6Ly9hOWEueHl644CRNiIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'vmess://eyJhZGQiOiI4Mi4xOTguMjQ2Ljk3IiwiYWlkIjoiMCIsImFscG4iOiIiLCJmcCI6IiIsImhvc3QiOiI4Mi4xOTguMjQ2Ljk3IiwiaWQiOiJkMTNmYzJmNS0zZTA1LTQ3OTUtODFlYi00NDE0M2EwOWU1NTIiLCJpbnNlY3VyZSI6IjAiLCJuZXQiOiJ0Y3AiLCJwYXRoIjoiLyIsInBvcnQiOiIxODAiLCJwcyI6IlVT44CQ5py65Zy65o6o6I2Q77yaaHR0cHM6Ly9hOWEueHl644CRNiIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'vmess://eyJhZGQiOiIxMDMuMTgxLjE2NC4yMzciLCJhaWQiOiIwIiwiYWxwbiI6IiIsImZwIjoiIiwiaG9zdCI6IiIsImlkIjoiNDE4MDQ4YWYtYTI5My00Yjk5LTliMGMtOThjYTM1ODBkZDI0IiwiaW5zZWN1cmUiOiIwIiwibmV0IjoidGNwIiwicGF0aCI6IiIsInBvcnQiOiI1MjI4MyIsInBzIjoiSEvjgJDmnLrlnLrmjqjojZDvvJpodHRwczovL2E5YS54eXrjgJE1MyIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'ss://MjAyMi1ibGFrZTMtYWVzLTI1Ni1nY206bXRNa3ArMUZ0dGtTTG1ET0Y5YmxuTk1MaWdjQ1JhY3ByUVMzcnkwbmYzbz06QUF2bytCc2dwdnZSNWxKc2RRVTMydnJNWEw3WkFiWkpaZkVUQjdiZGRoUT0@toy4lkdzy0c.22b74943-12ad-47f4-b705-f2defb6ffea0.org:13142#HK%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9162', 'ss://YWVzLTI1Ni1nY206ZmFCQW9ENTRrODdVSkc3@141.164.45.187:2376#KR%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9156', 'vmess://eyJhZGQiOiIxMDMuMTgxLjE2NC4yMzciLCJhaWQiOiIwIiwiYWxwbiI6IiIsImZwIjoiIiwiaG9zdCI6IiIsImlkIjoiNDE4MDQ4YWYtYTI5My00Yjk5LTliMGMtOThjYTM1ODBkZDI0IiwiaW5zZWN1cmUiOiIwIiwibmV0IjoidGNwIiwicGF0aCI6IiIsInBvcnQiOiI1MjI4MyIsInBzIjoiSEvjgJDmnLrlnLrmjqjojZDvvJpodHRwczovL2E5YS54eXrjgJE1MyIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'vmess://eyJhZGQiOiIxMDMuMTgxLjE2NC4xNDUiLCJhaWQiOiIwIiwiYWxwbiI6IiIsImZwIjoiIiwiaG9zdCI6IiIsImlkIjoiNDE4MDQ4YWYtYTI5My00Yjk5LTliMGMtOThjYTM1ODBkZDI0IiwiaW5zZWN1cmUiOiIwIiwibmV0IjoidGNwIiwicGF0aCI6Ii8iLCJwb3J0IjoiNTE1NTYiLCJwcyI6IkhL44CQ5py65Zy65o6o6I2Q77yaaHR0cHM6Ly9hOWEueHl644CRNTQiLCJzY3kiOiJhdXRvIiwic25pIjoiIiwidGxzIjoiIiwidHlwZSI6Im5vbmUiLCJ2IjoiMiJ9', 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTo2Sjc1NGVlNklUanlmRHlzaTc4dXFK@194.68.225.52:65232#BG%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9155', 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpNaG9sU3R5SEw3RGhyZXdLYnBRYTIw@185.176.221.72:24637#LV%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9157', 'vmess://eyJhZGQiOiIxMDMuMTgxLjE2NC4yMzciLCJhaWQiOiIwIiwiYWxwbiI6IiIsImZwIjoiIiwiaG9zdCI6IiIsImlkIjoiNDE4MDQ4YWYtYTI5My00Yjk5LTliMGMtOThjYTM1ODBkZDI0IiwiaW5zZWN1cmUiOiIwIiwibmV0IjoidGNwIiwicGF0aCI6IiIsInBvcnQiOiIzNDExNCIsInBzIjoiSEvjgJDmnLrlnLrmjqjojZDvvJpodHRwczovL2E5YS54eXrjgJE1MSIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'vmess://eyJhZGQiOiI4Mi4xOTguMjQ2Ljk3IiwiYWlkIjoiMCIsImFscG4iOiIiLCJmcCI6IiIsImhvc3QiOiI4Mi4xOTguMjQ2Ljk3IiwiaWQiOiJkMTNmYzJmNS0zZTA1LTQ3OTUtODFlYi00NDE0M2EwOWU1NTIiLCJpbnNlY3VyZSI6IjAiLCJuZXQiOiJ0Y3AiLCJwYXRoIjoiLyIsInBvcnQiOiIxODAiLCJwcyI6IlVT44CQ5py65Zy65o6o6I2Q77yaaHR0cHM6Ly9hOWEueHl644CRMSIsInNjeSI6ImF1dG8iLCJzbmkiOiIiLCJ0bHMiOiIiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0=', 'vmess://ewogICJ2IjogIjIiLAogICJwcyI6ICJIS+OAkOacuuWcuuaOqOiNkO+8mmh0dHBzOi8vYTlhLnh5euOAkTIiLAogICJhZGQiOiAiMTAzLjE4MS4xNjQuMjM3IiwKICAicG9ydCI6ICIzNDExNCIsCiAgImlkIjogIjQxODA0OGFmLWEyOTMtNGI5OS05YjBjLTk4Y2EzNTgwZGQyNCIsCiAgImFpZCI6ICI2NCIsCiAgInNjeSI6ICJhdXRvIiwKICAibmV0IjogInRjcCIsCiAgInR5cGUiOiAibm9uZSIsCiAgImhvc3QiOiAiIiwKICAicGF0aCI6ICIvIiwKICAidGxzIjogIiIsCiAgInNuaSI6ICIiLAogICJhbHBuIjogIiIsCiAgImZwIjogIiIsCiAgImluc2VjdXJlIjogIjAiCn0=', 'vmess://ewogICJ2IjogIjIiLAogICJwcyI6ICLoioLngrnml6XmnJ/vvJoyMDI2LTAzLTE4IiwKICAiYWRkIjogIjEwMy4xODEuMTY0LjE0NSIsCiAgInBvcnQiOiAiNTQwMjIiLAogICJpZCI6ICI0MTgwNDhhZi1hMjkzLTRiOTktOWIwYy05OGNhMzU4MGRkMjQiLAogICJhaWQiOiAiNjQiLAogICJzY3kiOiAiYXV0byIsCiAgIm5ldCI6ICJ0Y3AiLAogICJ0eXBlIjogIm5vbmUiLAogICJob3N0IjogIiIsCiAgInBhdGgiOiAiIiwKICAidGxzIjogIiIsCiAgInNuaSI6ICIiLAogICJhbHBuIjogIiIsCiAgImZwIjogIiIsCiAgImluc2VjdXJlIjogIjAiCn0=', 'vmess://ewogICJ2IjogIjIiLAogICJwcyI6ICJIS+OAkOacuuWcuuaOqOiNkO+8mmh0dHBzOi8vYTlhLnh5euOAkTIiLAogICJhZGQiOiAiMTAzLjE4MS4xNjQuMjM3IiwKICAicG9ydCI6ICIzNDExNCIsCiAgImlkIjogIjQxODA0OGFmLWEyOTMtNGI5OS05YjBjLTk4Y2EzNTgwZGQyNCIsCiAgImFpZCI6ICI2NCIsCiAgInNjeSI6ICJhdXRvIiwKICAibmV0IjogInRjcCIsCiAgInR5cGUiOiAibm9uZSIsCiAgImhvc3QiOiAiIiwKICAicGF0aCI6ICIvIiwKICAidGxzIjogIiIsCiAgInNuaSI6ICIiLAogICJhbHBuIjogIiIsCiAgImZwIjogIiIsCiAgImluc2VjdXJlIjogIjAiCn0='];
  // = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNRVNT6IqC54K5Mi1pcHY2IiwNCiAgImFkZCI6ICIyYTE0Ojc1ODM6MjlkZTo6YSIsDQogICJwb3J0IjogIjEyMzQ1IiwNCiAgImlkIjogIjY5YzYxM2U2LTdkOTEtNDVkZS1hNDY1LWI0MTMyYjZkNjllYyIsDQogICJhaWQiOiAiMCIsDQogICJzY3kiOiAiYXV0byIsDQogICJuZXQiOiAid3MiLA0KICAidHlwZSI6ICJub25lIiwNCiAgImhvc3QiOiAid3d3LmJpbmcuY29tIiwNCiAgInBhdGgiOiAiL2FsdmluOTk5OS5jb20iLA0KICAidGxzIjogIiIsDQogICJzbmkiOiAiIiwNCiAgImFscG4iOiAiIiwNCiAgImZwIjogIiINCn0=';
// = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNRVNT6IqC54K5Mi1pcHY2IiwNCiAgImFkZCI6ICIyMDAxOmJjODozMmQ3OjIwMTM6OjgiLA0KICAicG9ydCI6ICI2MjIxMSIsDQogICJpZCI6ICJlMTc4NmQ0OS1jY2JhLTQ2NmItYTBkZC1lMWFiNTliZDgzYmIiLA0KICAiYWlkIjogIjAiLA0KICAic2N5IjogImF1dG8iLA0KICAibmV0IjogIndzIiwNCiAgInR5cGUiOiAibm9uZSIsDQogICJob3N0IjogInd3dy5iaW5nLmNvbSIsDQogICJwYXRoIjogIi9naXRodWIuY29tL0FsdmluOTk5OSIsDQogICJ0bHMiOiAiIiwNCiAgInNuaSI6ICIiLA0KICAiYWxwbiI6ICIiLA0KICAiZnAiOiAiIg0KfQ==';
const hy2url
  = 'hysteria2://dongtaiwang.com@109.104.152.244:11220?sni=apple.com&alpn=h3&insecure=1#Hysteria2%E8%8A%82%E7%82%B93';
//
// const ret = linkToClash([hy2url, vmessUrl])
const ssrUrl = [
  'ssr://c3NyMi43NjI5ODgueHl6OjMzMzM2OmF1dGhfY2hhaW5fYTpjaGFjaGEyMC1pZXRmOnRsczEuMl90aWNrZXRfYXV0aDpaRzl1WjNSaGFYZGhibWN1WTI5dC8_b2Jmc3BhcmFtPSZyZW1hcmtzPVUxTlM2SXFDNTRLNQ',
  'ss://YWVzLTI1Ni1nY206ZG9uZ3RhaXdhbmcuY29t@[2a14:7584:d009::a]:12345#SS%E8%8A%82%E7%82%B9-ipv6',
  vmessUrl,
];
// const vlessUrl = 'vless://3fb38b37-c636-44d3-ab0c-897fab438bf1@62.210.8.152:18877?encryption=none&security=reality&sni=mxj.myanimelist.net&fp=chrome&pbk=DZj1qrLAm6EJfPkVRPpSCgoQN8sM8Rbio0jpsS1A3FM&sid=288132e297984d34&spx=%2F&type=xhttp&path=%2Fgithub.com%2FAlvin9999#VLESS%E8%8A%82%E7%82%B91-xhttp-reality'
const vlessUrl
  // = 'vless://79cc33cf-93b4-419b-9e46-33e3edf7057c@pl0.nerpvpn.net:443?encryption=none&security=none&type=ws&path=%2F#PL%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9166';
  = 'vless://79cc33cf-93b4-419b-9e46-33e3edf7057c@144.31.0.212:443?encryption=none&security=none&type=ws&path=%2F#PL%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9167';
  // = 'vless://3fb38b37-c636-44d3-ab0c-897fab438bf1@62.210.8.152:18877?path=%2Fgithub.com%2FAlvin9999&security=reality&encryption=none&pbk=DZj1qrLAm6EJfPkVRPpSCgoQN8sM8Rbio0jpsS1A3FM&fp=chrome&spx=%2F&type=xhttp&sni=mxj.myanimelist.net&sid=288132e297984d34#VLESS%E8%8A%82%E7%82%B91-xhttp-reality';
// const ret = linkToClash(ssrUrl);
const ssUrl
  = 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTo5ZGdPNkZ0UEYyOTR3RHJoUElxVHJj@104.192.227.163:443?#US%E3%80%90%E6%9C%BA%E5%9C%BA%E6%8E%A8%E8%8D%90%EF%BC%9Ahttps%3A%2F%2Fa9a.xyz%E3%80%9154';
  // = 'ss://YWVzLTI1Ni1nY206YWx2aW45OTk5LmNvbQ@[2a14:7584:d0a1::a]:12345#SS%E8%8A%82%E7%82%B9-ipv6';
//
const newVmess = [...new Set(vmessUrl)];
console.log(`new Url: length: ${newVmess.length}/${vmessUrl.length}`);
// const ret = linkToClash([vlessUrl]);
// const ret = linkToClash([ssUrl]);
// const ret = linkToClash([vmessUrl]);
const ret = linkToClash(newVmess);
console.log('解析结果为：', ret);
const proxy = yaml.load(ret.data);
const node = proxy.proxies;

(async () => {
  await exportData('./xrayvim.yaml', node);
  console.log('nd', node);
  const gUri = generateUri(node[0]);
  console.log('gUri', gUri);
  const gret = linkToClash([gUri]);

  // 使用示例
  try {
    const proxies = parseProxies(ret);
    const gproxies = parseProxies(gret);
    console.log(JSON.stringify(proxies, null, 2));
    console.log(JSON.stringify(gproxies, null, 2));
    if (isEqual(proxies, gproxies)) {
      console.log('转换相同！');
    }
  }
  catch (error) {
    console.error('Failed to parse proxies:', error);
  }

  console.log(`decodeBase64: ${decodeBase64(vmessUrl[0].split('vmess://')[1])}`);
})();

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
    return parsed.proxies.filter((n) => {
      console.log(n.name);
      return (
        n.name !== null && n.server && n.name !== 'Unnamed' && n.server !== null
      );
    });
  }
  catch (err) {
    console.error('YAML parse error:', err.message);
    throw err;
  }
}
function encodeBase64(str) {
  return require('node:buffer').Buffer.from(str, 'utf8').toString('base64');
}

function decodeBase64(base64) {
  return require('node:buffer').Buffer.from(base64, 'base64').toString('utf8');
}
