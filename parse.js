const { exec, execSync, execFile, execFileSync } = require('child_process');
const axiosN = require('axios');
const fs = require('fs');
const util = require('util');
const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);
const fsA = require('fs/promises');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');
const { linkToClash } = require('./lib/converter');
const yaml = require('js-yaml');
// const {updateUrll} = require('./findNode')
// const url = 'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
const parser = new DOMParser();
// const uriPath = "/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/";
const fixedurl =
  'https://fan2.194529.xyz/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/';
const xpathHtml = (parseString, doc) =>
  xpath.parse(parseString).select({ node: doc, isHtml: true });
//
// 解析函数
function parseNodes(input) {
  // 按空行分割成两行
  const lines = input.trim().split(/\n\s*\n/);

  return lines.map((line) => {
    // 匹配各个字段
    const typeMatch = line.match(/(ipv[46]\s+)?节点：\s*([^\s]+)/);
    const portMatch = line.match(/端口：\s*(\d+)/);
    const passwordMatch = line.match(/密码：\s*([^\s]+)/);
    const encryptionMatch = line.match(/加密方式：\s*([^\s]+)/);
    const protocolMatch = line.match(/协议：\s*([^\s]+)/);
    const obfsMatch = line.match(/混淆：\s*([^\s]+)/);
    const className = protocolMatch ? 'ssr' : 'ss';

    if (typeMatch) {
      if (className === 'ssr') {
        return {
          name: typeMatch
            ? 'new-pac-' + className + '-' + (typeMatch[1] ?? '节点').trim()
            : null,
          type: className,
          server: typeMatch ? typeMatch[2] : null,
          port: portMatch ? parseInt(portMatch[1], 10) : null,
          password: passwordMatch ? passwordMatch[1] : null,
          cipher: encryptionMatch ? encryptionMatch[1] : null,
          protocol: protocolMatch ? protocolMatch[1] : null,
          obfs: obfsMatch ? obfsMatch[1] : null,
        };
      }
      return {
        name: typeMatch
          ? 'new-pac-' + className + '-' + (typeMatch[1] ?? '节点').trim()
          : null,
        type: className,
        server: typeMatch ? typeMatch[2] : null,
        port: portMatch ? parseInt(portMatch[1], 10) : null,
        password: passwordMatch ? passwordMatch[1] : null,
        cipher: encryptionMatch ? encryptionMatch[1] : null,
      };
    }
    return null;
  });
}

async function saveTextToFile(filename, content, options = {}) {
  const { e = 'utf8', f = 'w' } = options;
  try {
    await fsA.writeFile(filename, content, { encoding: e, flag: f });
  } catch (err) {
    console.error('保存文件时出错:', err);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function parse_data() {
  try {
    const newUri = (await updateUrl()) || url;
    const v2rayUri = newUri.replace('/ss', '/v2ray');
    // await sleep(3000)
    // const input = await fsA.readFile("./ssrurl.txt", "utf8");
    // const newUri = input?.trim()
    // if (newUri) {
    // await fsA.rm("ssrurl.txt");
    // }
    const ret = await Promise.allSettled(
      [newUri, v2rayUri].map(async (link) => {
        saveTextToFile(
          __dirname + '/ssUrl.log',
          // new Date().toLocaleString() + ": " + (newUri || url) + (JSON.stringify(newUri)) + "\n",
          new Date().toLocaleString() + `: ${link}\n`,
          { f: 'a' }
        );
        const response = await axiosN.get(link);
        const data = response.data;
        // console.log(data)
        const doc = parser.parseFromString(data, 'text/html');
        // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code', doc)
        // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code/text()', doc)
        // const node = xpath.select("//code/text()", doc);
        // console.log(node.nodeValue)
        // console.log(node[2].nodeValue)
        // console.log(doc.querySelector('.wp-block-code'))
        // const info = node[2].nodeValue;
        /* for xmldom
    const node = xpath.select(
      "//code[preceding::*[contains(text(),'SS节点')]]",
      doc,
    );
    */
        /* for @xmldom
         */
        // const node = xpath
        //   .parse("//code[preceding::*[contains(text(),'SSR节点')]]")
        //   .select({ node: doc, isHtml: true });
        // const info = node[0].firstChild?.nodeValue;

        const node = xpathHtml('//p[.//code]//code//text()[normalize-space()]', doc);

        const new_pac_link = node
          .map((info) => {
            return info.nodeValue;
          })
          .filter((item) => item !== null);
        const config_data = parseProxies(linkToClash(new_pac_link));
        // console.log(info)
        /*
    const jsonStr =
      '{"' +
      info
        .replace(/\s([^\s]*?：)/g, ",$1")
        .replace(/：/g, '":"')
        .replace(/,/g, '","')
        .replace(/ /g, "") +
      '"}';
    // console.log(jsonStr)
    const meta = JSON.parse(jsonStr);
    const new_pac = [
      {
        name: "new-pac",
        type: "ss",
        server: meta["节点"],
        port: meta["端口"],
        cipher: meta["加密方式"],
        password: meta["密码"],
      },
    ];
    */
        // const new_pac = parseNodes(info);

        return config_data;
      })
    );
    const new_pac = ret
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          saveTextToFile(
            __dirname + '/ssUrl.log',
            new Date().toLocaleString() +
              `Fetch error: ${result.reason}` +
              '\n',
            { f: 'a' }
          );
          throw result.reason;
        }
      })
      .flat();
    return new_pac;
  } catch (e) {
    console.log(e);
  }
}

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
      return (
        n.name !== null && n.server && n.name !== 'Unnamed' && n.server !== null
      );
    });
  } catch (err) {
    console.error('YAML parse error:', err.message);
    throw err;
  }
}

async function getNodeOsName(nodePath) {
  try {
    // 方法1: 使用 process.platform（轻量，无需 require）
    // const { stdout } = await execFileAsync(nodePath, ['-e', 'console.log(process.platform)']);

    // 方法2: 使用 os.type()（返回更友好的名称，如 'Windows_NT'）
    // const { stdout } = await execFileAsync(nodePath, [
    //   '-e',
    //   'console.log(require("os").type())'
    // ]);
    // 方法3: 使用 process.report.getReport().header.osName（返回更友好的名称，如 'Windows_NT'）
    const { stdout } = await execFileAsync(nodePath, [
      '-p',
      'process.report.getReport().header.osName',
    ]);

    return {
      path: nodePath,
      osName: stdout.trim(),
      error: null,
    };
  } catch (err) {
    return {
      path: nodePath,
      osName: null,
      error: err.message || 'Unknown error',
    };
  }
}

async function findLocaleNode() {
  const output = execSync('where.exe node', { encoding: 'utf8' });
  const nodePaths = output.split(/\r?\n/).filter((p) => p.trim() !== '');
  const results = await Promise.all(
    nodePaths.map((path) => getNodeOsName(path))
  );

  console.log('Node.js 运行时操作系统测试结果：');
  results.forEach(({ path, osName, error }) => {
    if (osName) {
      console.log(`✅ ${path} -> ${osName}`);
    } else {
      console.log(`❌ ${path} -> Error: ${error}`);
    }
  });

  // return results;

  // const validPath = pathArr.map(p => {
  //   const nodePlatform = execFileAsync(p,
  //       [
  //   '-p',
  //   "process?.report?.getReport?()?.header?.osName"
  //       ])
  //     return nodePlatform.trim().startsWith('MINGW')
  //   })
  const validPath = results.filter((p) => {
    return !p.osName.startsWith('MINGW');
  });
  saveTextToFile(
    __dirname + '/ssUrl.log',
    new Date().toLocaleString() + ': ' + validPath + '\n',
    { f: 'a' }
  );
  return validPath;
}
async function updateUrl() {
  // setTimeout(()=>{
  //     console('haha..')
  // }, 3000)
  const output = execSync('where.exe node', { encoding: 'utf8' });
  const pathArr = output.split(/\r?\n/).filter((p) => p.trim() !== '');
  // saveTextToFile( __dirname + "/ssUrl.log",
  // new Date().toLocaleString() + `✅ ${Array.isArray(pathArr)}-> ` + pathArr + "\n",
  // { f: "a" },);
  // const validPath = await findLocaleNode()

  // const validPath = pathArr.filter((p) => {
  //   try {
  //   const stdout = execFileSync(p,
  //       [ '-p', 'process.report.getReport().header.osName'], {encoding: 'utf8'})
  // saveTextToFile( __dirname + "/ssUrl.log",
  //     new Date().toLocaleString() + `✅ ${p} -> ` + stdout + "\n",
  //   { f: "a" },);

  //   const nodePlatform = stdout.trim()
  // const nodePlatform = execSync(`${p.trim()} -p process.report.getReport\(\).header.osName`, {encoding: 'utf8'})
  // const nodePlatform = execSync(`${p.trim()} -e "const os = require('os'); console.log(os.type())"`, {encoding: 'utf8'})
  // const nodePlatform = execSync(`${p.trim()} -p process.env.OS`, {encoding: 'utf8'})

  // const nodePlatform = stdout.trim()
  // return !nodePlatform.trim().startsWith('MINGW')
  // // return nodePlatform.trim().startsWith('Windows')
  // } catch(e) {
  //     return false
  // }
  // })

  const results = await Promise.all(
    pathArr.map(async (path) => {
      const nodeInfo = await getNodeOsName(path);
      return nodeInfo;
    })
  );
  const validPath = results
    .filter((p) => {
      return !p.osName.startsWith('MINGW');
    })
    .map((item) => item.path);
  saveTextToFile(
    __dirname + '/ssUrl.log',
    new Date().toLocaleString() + ': ' + validPath + '\n',
    { f: 'a' }
  );
  if (validPath.length > 0) {
    const nodePath = validPath[0];
    const nodeOutput = execSync(
      `${nodePath.trim()} ${__dirname + '\\updateUri.js'}`,
      { encoding: 'utf8' }
    );
    return nodeOutput?.trim();
  }
}
/*
- name: new-pac-hysteria2
    type: hysteria2
    server: 109.104.152.244
    port: 11220
    password: dongtaiwang.com
    alpn:
      - h3
    protocol: tls
    sni: 	apple.com
    insecure: true
*/

module.exports.parse = async (
  raw,
  { axios, yaml, notify, console },
  { name, url, interval, selected }
) => {
  const obj = yaml.parse(raw);
  //console.log(obj['proxy-groups'][0]['proxies'])
  //const free_pac = 'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
  // let {data, status} =  await axios.get(url)
  console.log(new Date().toLocaleString());
  let prependProxies = await parse_data();
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
  const prxoyNames = prependProxies.map((item) => item.name);
  obj.proxies = [...prependProxies, ...obj.proxies];
  // console.log(data)
  //axios.get(free_pac).then(function(res) {console.log(res)}).catch(function(err){console.log(err)})
  obj['proxy-groups'][0]['proxies'].push(...prxoyNames);
  obj['allow-lan'] = true;
  return yaml.stringify(obj);
};
