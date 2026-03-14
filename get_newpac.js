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
const ssIpv6 = `- name: newpac-SS-ipv6
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

async function parse_data() {
  try {
    const newUri = (await updateUrl()) || fixedurl;
    const v2rayUri = newUri.replace('/v2ray', '/ss');
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
async function updateUrl() {
  // setTimeout(()=>{
  //     console('haha..')
  // }, 3000)

  let nodePath;
  console.log(`正在更新URL...`);
  if (process.report.getReport().header.osName === 'win32') {
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
    console.log(`nodePath: ${nodePath}`);
  }
  const nodeOutput = execSync(
    `${nodePath.trim()} ${path.join(__dirname, 'updateUri.js')}`,
    { encoding: 'utf8' },
  );
  console.log(`${new Date().toLocaleString()}: getting new Url ->  ${nodeOutput}`);
  saveTextToFile(
    path.join(__dirname, 'ssUrl.log'),
    `${new Date().toLocaleString()}: getting new Url ->  ${nodeOutput}`,
    { f: 'a' },
  );
  return nodeOutput?.trim() === 'null' ? null : nodeOutput?.trim();
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
const giturl
  = 'https://gh-proxy.com/https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.yml';

// 本地保存路径
const outputPath = path.join(__dirname, 't_modified.yaml');

// 要修改的字段（示例：假设 YAML 中有 key: value，我们修改某个 key）
// 如果你不知道结构，可以先打印 data 查看

async function getPublicNodeset(giturl) {
  try {
    console.log('正在获取 YAML 文件...');

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

async function mergeData(getFn, parseFn, storePath) {
  try {
    const obj = await getFn();
    const prependProxies = await parseFn();
    console.log(`Proxies: ${JSON.stringify(prependProxies)}`);
    const prxoyNames = prependProxies.map(item => item.name);
    obj.proxies = [...prependProxies, ...obj.proxies];
    console.log(`Proxies: ${JSON.stringify(obj.proxies)}`);
    obj['proxy-groups'][0].proxies.push(...prxoyNames);
    obj['allow-lan'] = true;
    const newYamlStr = yaml.dump(obj, {
      indent: 2,
      noRefs: true,
      sortKeys: false, // 保持原有顺序
    });

    // 保存到本地
    await fsA.writeFile(storePath, newYamlStr, 'utf8');
    console.log(`✅ 修改后的 YAML 已保存到: ${storePath}`);
  }
  catch (error) {
    console.error('❌ 合并数据发生错误:', error.message);
  }
}

async function restartMihomo() {
  const res = await fetch('http://127.0.0.1:9090/configs?force=true', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: '', payload: '' }),
  });

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

exports.parseData = parse_data;
exports.mergeData = mergeData;
exports.getPublicNodeset = getPublicNodeset;
exports.restartMihomo = restartMihomo;
