const { parseData } = require('./get_newpac');

module.exports.parse = async (
  raw,
  { axios, yaml, notify, console },
  { name, url, interval, selected },
) => {
  const obj = yaml.parse(raw);
  // console.log(obj['proxy-groups'][0]['proxies'])
  // const free_pac = 'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
  // let {data, status} =  await axios.get(url)
  console.log(new Date().toLocaleString());
  const prependProxies = await parseData();
  console.log(process.cwd(), ': ', process.report.getReport().header.osName);
  console.log('Node.js 版本:', process.version);
  console.log('Node.js 路径:', process.execPath);
  console.log('平台:', process.platform);
  console.log('架构:', process.arch);
  console.log('当前工作目录:', process.cwd());
  console.log('启动参数:', process.argv);
  console.log('环境变量:', process.env);
  console.log('进程 ID:', process.pid);
  console.log('父进程 ID:', process.ppid);
  console.log('执行目录:', process.execArgv);
  console.log('内存使用情况:', process.memoryUsage());
  console.log('运行时间 (秒):', process.uptime());
  console.log(prependProxies);
  const prxoyNames = prependProxies.map(item => item.name);
  // if (prependProxies) {
  obj.proxies = [...prependProxies, ...obj.proxies];
  // console.log(data)
  // axios.get(free_pac).then(function(res) {console.log(res)}).catch(function(err){console.log(err)})
  obj['proxy-groups'][0].proxies.push(...prxoyNames);
  // }
  obj['allow-lan'] = true;
  return yaml.stringify(obj);
};
