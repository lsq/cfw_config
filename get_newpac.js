// process.env.SHELL = '/bin/bash';
const {
  exec,
  execSync,
  execFile,
  execFileSync,
} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const axiosN = require('axios');

const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);
const fsA = require('node:fs/promises');
const { DOMParser } = require('@xmldom/xmldom');
const yaml = require('js-yaml');
const xpath = require('xpath');
const { linkToClash } = require('./lib/converter');
// const {updateUrll} = require('./findNode')
// const url = 'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7'
const parser = new DOMParser();
const process = require('node:process');
// const uriPath = "/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/";
const fixedurl
  = 'https://fan3.206102.xyz/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/';
const ssIpv6
/*
= `- name: PL【机场推荐：https://a9a.xyz】66
  type: vless
  server: pl0.nerpvpn.net
  port: 443
  uuid: 79cc33cf-93b4-419b-9e46-33e3edf7057c
  network: ws
  skip-cert-verify: false
  ws-opts:
    path: /`;
*/
= `- name: newpac-SS-ipv6
  type: ss
  server: 2a14:7584:d0a1::a
  port: 12345
  password: fan3.380227.xyz
  cipher: aes-256-gcm`;
// password: alvin9999.com
function xpathHtml(parseString, doc) {
  return xpath.parse(parseString).select({ node: doc, isHtml: true });
}
//
// 解析函数
const htmlSpace = /\n\s*\n/;
function parseNodes(input) {
  // 按空行分割成两行
  const lines = input.trim().split(htmlSpace);

  return lines.map((line) => {
    // 匹配各个字段
    const typeMatch = line.match(/(ipv[46]\s+)?节点：\s*(\S+)/);
    const portMatch = line.match(/端口：\s*(\d+)/);
    const passwordMatch = line.match(/密码：\s*(\S+)/);
    const encryptionMatch = line.match(/加密方式：\s*(\S+)/);
    const protocolMatch = line.match(/协议：\s*(\S+)/);
    const obfsMatch = line.match(/混淆：\s*(\S+)/);
    const className = protocolMatch ? 'ssr' : 'ss';

    if (typeMatch) {
      if (className === 'ssr') {
        return {
          name: typeMatch
            ? `new-pac-${className}-${(typeMatch[1] ?? '节点').trim()}`
            : null,
          type: className,
          server: typeMatch ? typeMatch[2] : null,
          port: portMatch ? Number.parseInt(portMatch[1], 10) : null,
          password: passwordMatch ? passwordMatch[1] : null,
          cipher: encryptionMatch ? encryptionMatch[1] : null,
          protocol: protocolMatch ? protocolMatch[1] : null,
          obfs: obfsMatch ? obfsMatch[1] : null,
        };
      }
      return {
        name: typeMatch
          ? `new-pac-${className}-${(typeMatch[1] ?? '节点').trim()}`
          : null,
        type: className,
        server: typeMatch ? typeMatch[2] : null,
        port: portMatch ? Number.parseInt(portMatch[1], 10) : null,
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
  }
  catch (err) {
    console.error('保存文件时出错:', err);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. 解码 Cloudflare 邮箱
function decodeCFEmail(encoded) {
  const r = Number.parseInt(encoded.substr(0, 2), 16);
  let email = '';
  for (let i = 2; i < encoded.length; i += 2) {
    email += String.fromCharCode(Number.parseInt(encoded.substr(i, 2), 16) ^ r);
  }
  return email;
}

const cfEmailRegex
  = /<a[^>]*class="__cf_email__"[^>]*data-cfemail="([a-fA-F0-9]+)"[^>]*>.*?<\/a>/g;

function replaceCFEmailWithReal(htmlString) {
  return htmlString.replace(cfEmailRegex, (match, encodedEmail) => {
    try {
      return decodeCFEmail(encodedEmail);
    }
    catch (e) {
      console.warn('Failed to decode CF email:', match);
      return '[email protected]'; // fallback
    }
  });
}

function createParseProxies() {
  let hasAppended = false;
  return function parseProxies(response) {
    if (!response.success) {
      throw new Error('Response not successful');
    }

    const data = response.data;

    // 方法 1：直接用 YAML 解析整个 data（推荐）
    // 因为 "proxies:" 是合法的 YAML 映射键，值是一个列表
    try {
      const parsed = yaml.load(
        hasAppended ? data : ((hasAppended = true), `${data}\n${ssIpv6}`),
      );
      // parsed 是 { proxies: [ {...}, {...} ] }
      return parsed.proxies.filter((n) => {
        return (
          n.name !== null
          && n.server
          && n.name !== 'Unnamed'
          && n.server !== null
        );
      });
    }
    catch (err) {
      console.error('YAML parse error:', err.message);
      throw err;
    }
  };
}

async function rparse_data(consoleObj) {
  const msg = `  ${new Date().toLocaleString()}: newUri -> (Test Write)`;

  // 1. 正常打印
  consoleObj.log(msg);

  // 2. 【关键】强制刷新 stdout 缓冲区
  // 很多 Node 环境日志丢失是因为进程退出太快，缓冲区没写完
  if (process && process.stdout) {
    // 尝试强制同步写入一个空字符，触发 flush
    // 注意：某些沙箱环境可能禁止同步 IO，如果报错请去掉 try-catch 外的逻辑
    try {
      process.stdout.write('');
    }
    catch (e) {
      // 如果无法强制刷新，至少我们尝试了
    }
  }

  const rmsg = `  ${new Date().toLocaleString()}: newUri -> (return)`;
  return rmsg;
}

async function ttparse_data(consoleObj) {
  // --- 诊断开始 ---

  // 1. 检查对象是否存在
  const exists = consoleObj !== undefined && consoleObj !== null;

  // 2. 检查是否有 log 方法
  const hasLog = exists && typeof consoleObj.log === 'function';

  // 3. 获取构造函数名称 (判断是否为原生 console 还是框架特供)
  const constructorName = exists ? consoleObj.constructor.name : 'NULL';

  // 4. 获取原型链上的关键属性 (尝试寻找框架特有的属性，不同框架可能不同，常见如 _path, _ctx 等，这里列出通用检查)
  const ownKeys = exists ? Object.getOwnPropertyNames(consoleObj).join(',') : 'NULL';
  const protoKeys = exists ? Object.getOwnPropertyNames(Object.getPrototypeOf(consoleObj) || {}).join(',') : 'NULL';

  // 5. 尝试判断是否是原生 Node Console (原生通常不会自动写文件到特定路径)
  // 框架注入的对象通常不是 "Console" 类，或者是经过包装的
  const isNative = exists && consoleObj.constructor.name === 'Console';

  // 构建诊断报告字符串
  const diagnosticReport = `
  [DIAGNOSTIC REPORT]
  Time: ${new Date().toLocaleString()}
  Object Exists: ${exists}
  Has .log(): ${hasLog}
  Constructor Name: ${constructorName}
  Is Likely Native: ${isNative}
  Own Properties: ${ownKeys}
  Prototype Properties: ${protoKeys}
  ---------------------
  `;

  // --- 尝试输出 ---
  if (hasLog) {
    // 如果 log 方法存在，尝试输出诊断信息
    // 注意：如果这里的 log 依然不写文件，说明这个对象确实失去了文件写入的上下文
    consoleObj.log(diagnosticReport);

    // 尝试执行实际的日志写入
    consoleObj.log(`  ${new Date().toLocaleString()}: newUri -> (Test Write)`);
  }
  else {
    // 如果连 log 都没有，抛出错误让主模块捕获
    throw new Error(`Received invalid console object: ${diagnosticReport}`);
  }

  return diagnosticReport; // 返回报告给主模块处理
}
async function getFromGitHub() {
  const giturl
    = 'https://gh-proxy.com/https://github.com/YouAreHuman/updatePac/raw/refs/heads/master/newpac.yaml';
  const gData = await getPublicNodeset(giturl);
  return gData;
}
async function parse_data(options = {}) {
  const {
    consoleObj = console,
    url, // 先解构出来，不设置默认值
    // timeout = 5000
  } = options;
  let shouldFetch = false;
  let newUri = null;
  try {
    if (url) {
      shouldFetch = true;
      newUri = url;
    }
    else {
      const udUrl = await updateUrl(consoleObj);
      if (udUrl) {
        shouldFetch = true;
        newUri = udUrl;
      }
      else {
        shouldFetch = false;
        const ret = await getFromGitHub();
        return ret;
      }
    }
    if (shouldFetch) {
      consoleObj.log('开始更新....');
      const v2rayUri = newUri.replace('/v2ray', '/ss');
      consoleObj.log(` ${new Date().toLocaleString()}: newUri -> ${newUri}\n v2rayUri -> ${v2rayUri}\n`);
      // await sleep(3000)
      // const input = await fsA.readFile("./ssrurl.txt", "utf8");
      // const newUri = input?.trim()
      // if (newUri) {
      // await fsA.rm("ssrurl.txt");
      // }
      const parseProxies = createParseProxies();
      const ret = await Promise.allSettled(
        [newUri, v2rayUri].map(async (link) => {
          saveTextToFile(
            path.join(__dirname, 'ssUrl.log'),
            // new Date().toLocaleString() + ": " + (newUri || url) + (JSON.stringify(newUri)) + "\n",
            `${new Date().toLocaleString()}: parse_data() -> ${link}\n`,
            { f: 'a' },
          );
          const response = await axiosN.get(link);
          // const data = response.data;
          const orig_data = response.data;
          const codeContentRegex = /(<code[^>]*>)(.*?)(<\/code>)/gs;
          const data = orig_data.replace(
            codeContentRegex,
            (match, openTag, content, closeTag) => {
              const cleanedContent = replaceCFEmailWithReal(content);
              return openTag + cleanedContent + closeTag;
            },
          );
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

          const node = xpathHtml(
            '//p[.//code]//code//text()[normalize-space()]',
            // '//p[.//code]//code',
            doc,
          );

          const new_pac_link = node
            .map((info) => {
              return info.nodeValue;
            })
            .filter(item => item !== null);
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
        }),
      );
      const new_pac = ret
        .map((result) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          else {
            saveTextToFile(
              path.join(__dirname, 'ssUrl.log'),
              `${new Date().toLocaleString()}: parse.js -> Fetch error: ${result.reason}`
              + `\n`,
              { f: 'a' },
            );
            throw result.reason;
          }
        })
        .flat();
      return new_pac;
    }
  }
  catch (e) {
    console.log(e);
  }
}

function o_parseProxies(response) {
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
  }
  catch (err) {
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
  }
  catch (err) {
    return {
      path: nodePath,
      osName: null,
      error: err.message || 'Unknown error',
    };
  }
}

async function findLocaleNode() {
  const output = execSync('where.exe node', { encoding: 'utf8' });
  const nodePaths = output.split(/\r?\n/).filter(p => p.trim() !== '');
  const results = await Promise.all(
    nodePaths.map(path => getNodeOsName(path)),
  );

  console.log('Node.js 运行时操作系统测试结果：');
  results.forEach(({ path, osName, error }) => {
    if (osName) {
      console.log(`✅ ${path} -> ${osName}`);
    }
    else {
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
    path.join(__dirname, 'ssUrl.log'),
    `${new Date().toLocaleString()}: ${validPath}\n`,
    { f: 'a' },
  );
  return validPath;
}
async function updateUrl(consoleObj = console) {
  // setTimeout(()=>{
  //     console('haha..')
  // }, 3000)

  let nodePath;
  consoleObj.log(`正在更新URL...`);
  try {
    if (process.platform === 'win32') {
      const output = execSync('where.exe node', { encoding: 'utf8' });
      const pathArr = output.split(/\r?\n/).filter(p => p.trim() !== '');
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
        }),
      );
      saveTextToFile(
        path.join(__dirname, 'ssUrl.log'),
        `${new Date().toLocaleString()}: nodePaths found in: ${JSON.stringify(results)}\n`,
        { f: 'a' },
      );
      const validPath = results
        .filter((p) => {
          return !p.osName.startsWith('MINGW');
        })
        .map(item => item.path);
      saveTextToFile(
        path.join(__dirname, 'ssUrl.log'),
        `${new Date().toLocaleString()}: ${validPath}\n`,
        { f: 'a' },
      );
      if (validPath.length > 0) {
        nodePath = validPath[0];
      }
    }
    else {
      nodePath = process.execPath;
    }
    consoleObj.log(`nodePath: ${nodePath}\n`);

    const nodeOutput = execSync(
      `${nodePath.trim()} ${path.join(__dirname, 'updateUri.js')}`,
      { encoding: 'utf8' },
    );
    consoleObj.log(`${new Date().toLocaleString()}: getting new Url ->  ${nodeOutput}\n`);
    saveTextToFile(
      path.join(__dirname, 'ssUrl.log'),
      `${new Date().toLocaleString()}: getting new Url ->  ${nodeOutput}`,
      { f: 'a' },
    );
    return nodeOutput?.trim() === 'null' ? null : nodeOutput?.trim();
  }
  catch (e) {
    consoleObj.log(`execSync updateUri.js error: ${e.message}\n`);
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
    sni: apple.com
    insecure: true
- name: SS节点-ipv6
    type: ss
    server: 2a14:7584:d0a1::a
    port: 12345
    password: alvin9999.com
    cipher: aes-256-gcm
*/

// update-yaml.js

// 目标 URL（注意：GitHub raw 内容应使用 raw.githubusercontent.com，但这里按你给的代理链接）
// const giturl
// = 'https://gh-proxy.com/https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.yml';

// 本地保存路径
const outputPath = path.join(__dirname, 't_modified.yaml');

// 要修改的字段（示例：假设 YAML 中有 key: value，我们修改某个 key）
// 如果你不知道结构，可以先打印 data 查看

async function getPublicNodeset(giturl) {
  try {
    console.log(`正在获取 YAML 文件...\nFrom ${giturl}`);

    // 注意：GitHub 的 blob 页面是 HTML，不是原始文件！
    // 必须使用 raw 链接。但你的链接用了 gh-proxy.com 代理 blob，这通常返回网页。
    // 所以我们需要修正为 raw 链接格式。

    // 正确的 raw 链接应该是：
    // https://raw.githubusercontent.com/xream/dashboard/main/screenshots/t.yaml
    // 通过 gh-proxy 代理 raw 链接：
    // const rawUrl = 'https://gh-proxy.com/https://raw.githubusercontent.com/xream/dashboard/main/screenshots/t.yaml';

    const response = await axiosN.get(giturl, {
      responseType: 'text',
    });

    console.log('成功获取内容，正在解析 YAML...');

    // 解析 YAML
    const data = yaml.load(response.data);

    // 打印原始内容（可选，用于调试）
    // console.log('原始数据:', JSON.stringify(data, null, 2));

    // 修改某一项（示例：如果 data 是对象，且包含 modifyField）
    if (typeof data === 'object' && data !== null) {
      // 示例：修改一个字段
      // 假设你想修改的是顶层的某个 key，比如 "version"
      // 这里我们以 "version" 为例，你可以根据实际结构调整
      // if (data.version !== undefined) {
      //   console.log(`将 version 从 ${data.version} 改为 2.0.0`);
      //   data.version = '2.0.0';
      // } else {
      // 如果没有 version，就添加一个示例字段（避免报错）
      // console.log('未找到 version 字段，添加 example_field');
      // data.example_field = 'modified by script';
      // }

      // 你也可以根据实际需求修改其他字段
      // 例如：data.settings.theme = 'dark';
      console.log('解析YAML完成返回...');
      return data;
    }
    else {
      throw new Error('YAML 内容不是有效的对象');
    }
  }
  catch (error) {
    console.error('❌ 获取YAML内容发生错误:', error.message);
    if (error.response) {
      console.error('HTTP 状态码:', error.response.status);
      console.error(
        '响应内容预览:',
        (await error.response.data?.substring?.(0, 200)) || error.response.data,
      );
    }
    process.exit(1);
  }
}

async function exportData(storePath, ymlobj) {
  try {
    // const prependProxies = await parse_data();
    const newYamlStr = yaml.dump(ymlobj, {
      indent: 2,
      noRefs: true,
      sortKeys: false, // 保持原有顺序
    });

    // 保存到本地
    await fsA.writeFile(storePath, newYamlStr, 'utf8');
    console.log(`✅ 修改后的 YAML 已保存到: ${storePath}`);
  }
  catch (error) {
    console.error('❌ 写入数据发生错误:', error.message);
  }
}

async function mergeData(getFn, parseFn, storePath) {
  try {
    let prependProxies;
    const obj = await getFn();
    prependProxies = await parseFn();
    const deYaml = path.join(__dirname, './default.yaml');
    const isDefaultFile = await fileExists(deYaml);
    if (!isDefaultFile) {
      console.log('./default.yml 不存在或无法访问');
    }
    else {
      const deData = await fsA.readFile(deYaml, 'utf8');
      const dData = yaml.load(deData);
      if (dData) {
        prependProxies = [...prependProxies, ...dData];
      }
    }

    console.log(`Proxies: ${JSON.stringify(prependProxies)}`);
    const prxoyNames = prependProxies.map(item => item.name);
    obj.proxies = [...prependProxies, ...obj.proxies];
    console.log(`Proxies: ${JSON.stringify(obj.proxies)}`);
    obj['proxy-groups'][0].proxies.push(...prxoyNames);
    obj['allow-lan'] = true;
    await exportData(storePath, obj);
  }
  catch (error) {
    console.error('❌ 合并数据发生错误:', error.message);
  }
}

async function restartMihomo() {
  const isWindows = process.platform === 'win32';
  const port = isWindows ? 56907 : 9090;
  // 3. 构建基础 Headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    // 注意：Sec-Fetch-* 和 Sec-GPC 是浏览器自动添加的安全头，
    // 在 Node.js 中手动添加通常会被忽略或导致请求被某些服务器拒绝，建议移除。
    // 如果目标服务器强制校验这些头，可以保留，但通常不需要。
    'Priority': 'u=0',
  };
    // 4. 根据平台决定是否添加 Authorization
  if (isWindows) {
    headers.Authorization = 'Bearer 95217e41-622f-4139-a583-f6a228201004';
  }

  // 5. 请求配置
  const options = {
    method: 'PUT',
    headers,
    body: JSON.stringify({ path: '', payload: '' }),
    // Node.js fetch 默认行为类似 cors，但不需要显式声明 mode，除非特定库要求
    // credentials: 'include' 在 Node.js 中通常用于携带 Cookie，需配合 agent 使用，
    // 如果只是简单的 API 调用且无 Cookie 依赖，可省略。若必须，需确保服务端支持。
  };
  const res = await fetch(`http://127.0.0.1:${port}/configs?force=true`, options);

  if (res.status === 204) {
  // 无内容，不要尝试读取 .json() 或 .text()
    console.log('Success, no response body');
    return true;
  }
  else if (res.ok) {
  // 可能有内容
    const data = await res.json(); // 或 .text()
    console.log('Response:', data);
    return true;
  }
  return false;
}

async function fileExists(filePath) {
  try {
    const stats = await fsA.stat(filePath);
    if (stats.isFile()) {
      console.log(filePath, '是一个文件');
      return true;
    }
    else {
      console.log(filePath, '存在但不是文件（可能是目录）');
      return false;
    }
  }
  catch (err) {
    if (err.code === 'ENOENT') {
      console.log(filePath, '文件不存在');
      return false;
    }
    else {
      throw err;
    }
  }
}

exports.parseData = parse_data;
exports.mergeData = mergeData;
exports.getPublicNodeset = getPublicNodeset;
exports.restartMihomo = restartMihomo;
exports.updateUrl = updateUrl;
exports.exportData = exportData;
exports.fileExists = fileExists;
