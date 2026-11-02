const {
  checkDuplicateProxies,
  base64Decode,
  linkToConfig,
} = require('../genMihomo');
const { mihomoConfig, readyaml, exportData } = require('../get_newpac');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Calculates the Clash cache filename for a given provider/subscription URL
 * @param {string} url - The complete provider/subscription URL
 * @returns {string} - The exact .yaml filename used by Clash
 */
function getClashCacheFilename(url) {
  // 1. Create an MD5 hash instance
  const hash = crypto.createHash('md5');

  // 2. Update the hash with the pure URL string (without any trailing newlines)
  hash.update(url);

  // 3. Generate the hexadecimal MD5 string and append '.yaml'
  return hash.digest('hex') + '.yaml';
}

// === Test Case ===
// const targetUrl = 'https://gh-proxy.com';

async function filterProxies(res) {
  const providers = res.providers;
  const proxyGroup = {};
  for (const [k, v] of Object.entries(providers)) {
    if (k === 'flNode0') {
      console.log(v.proxies);
    }
    // else if (k===)
  }
}
async function fetPr() {
  const isWindows = process.platform === 'win32';
  const configData = await readyaml(mihomoConfig());
  const externalController = configData['external-controller'];
  // const port = isWindows ? 56907 : 9090;
  // 3. 构建基础 Headers
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    // 注意：Sec-Fetch-* 和 Sec-GPC 是浏览器自动添加的安全头，
    // 在 Node.js 中手动添加通常会被忽略或导致请求被某些服务器拒绝，建议移除。
    // 如果目标服务器强制校验这些头，可以保留，但通常不需要。
    Priority: 'u=0',
  };
  // 4. 根据平台决定是否添加 Authorization
  // if (isWindows) {
  const secret = configData.secret;
  headers.Authorization = `Bearer ${secret}`;
  // }
  // 5. 请求配置
  const options = {
    method: 'GET',
    headers,
    // body: JSON.stringify({ path: '', payload: '' }),
    // Node.js fetch 默认行为类似 cors，但不需要显式声明 mode，除非特定库要求
    // credentials: 'include' 在 Node.js 中通常用于携带 Cookie，需配合 agent 使用，
    // 如果只是简单的 API 调用且无 Cookie 依赖，可省略。若必须，需确保服务端支持。
  };
  const res = await fetch(
    `http://${externalController}/providers/proxies`,
    options
  );

  if (res.status === 204) {
    // 无内容，不要尝试读取 .json() 或 .text()
    console.log('Success, no response body');
    return true;
  } else if (res.ok) {
    // 可能有内容
    const data = await res.json(); // 或 .text()
    // console.log('Response:', data);
    await filterProxies(data);
    return true;
  }
  return false;
}

async function readProviders(fileMap, baseDir) {
  // 1. 异步读取所有文件到对象中
  const readPromises = Object.entries(fileMap).map(async ([key, fileInfo]) => {
    const filename = fileInfo.filename;
    try {
      const filePath = path.join(baseDir, filename);
      console.log(filePath);
      const data =
        fileInfo.type === 'yaml'
          ? await readyaml(filePath)
          : {
              proxies: (await linkToConfig(base64Decode(fs.readFileSync(filePath, 'utf8')))),
            };
      // if (fileInfo.type === 'txt') console.log(data);
      return { key, filename, data };
    } catch (err) {
      console.error(`[ERROR] 读取文件失败 ${filename}: ${err.message}`);
      return { key, filename, data: null, error: err.message };
    }
  });

  const results = await Promise.all(readPromises);

  // 过滤掉读取失败的
  const validResults = results.filter((r) => r.data !== null);

  // 2. 处理 name + 3. 合并所有 proxies
  const mergedProxies = [];
  const i = 0;
  for (const { key, filename, data } of validResults) {
    // if (i ==0) {
    //     console.log(`data: ${data}`)
    //     break
    // }
    if (data.proxies && Array.isArray(data.proxies)) {
      for (const proxy of data.proxies) {
        // 修改 name 为: 文件名|原name
        proxy.name = `${key}|${proxy.name}`;
      }
      mergedProxies.push(...data.proxies);
    } else {
      console.warn(`[WARN] 文件 ${filename}(${key}) 中没有 proxies 数组`);
    }
  }

  const result = { proxies: mergedProxies };

  // 输出合并后的结果(YAML 格式)
  // console.log(yaml.stringify(result));

  // 如果需要同时输出为文件,取消下面的注释
  const outputPath = path.join(__dirname, 'merged_output.yaml');
  await exportData(outputPath, result);
  console.log(`已保存到: ${outputPath}`);
  return result;
}

async function getPr() {
  const basePath = `${path.dirname(mihomoConfig())}`;
  const configPath = `${basePath}/profiles/list.yml`;
  const configData = await readyaml(configPath);
  const prYaml = configData.files
    .filter((it) => {
      if (it.name === 'custom') {
        return true;
      }
    })
    .map((i) => i.time);
  const prData = await readyaml(`${basePath}/profiles/${prYaml}`);
  const prs = prData['proxy-providers'];
  const prInfo = {};
  for (const [key, value] of Object.entries(prs)) {
    if (!value.url) continue;
    const type = path.extname(value.url) === '.txt' ? 'txt' : 'yaml';
    const filename = getClashCacheFilename(value.url);

    // console.log('Subscription URL:', value.url);
    // console.log('Clash Cache Filename:', filename);
    prInfo[key] = { type, filename };
  }

  console.log(prInfo);
  const proxies = await readProviders(prInfo, `${basePath}/providers/proxy`);
  checkDuplicateProxies(proxies.proxies)
}

(async () => {
  await getPr();
})();
