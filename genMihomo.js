const fs = require('node:fs').promises;
const path = require('node:path');
const axios = require('axios');
const yaml = require('js-yaml');
const { merge } = require('lodash');
const {
  exportData,
  mihomoConfig,
  restartMihomo,
  createSymlink,
} = require('./get_newpac');
const { linkToClash } = require('./lib/converter');
const {getFastestProxy} = require('./githubProxy')

const newline = /\r?\n/;
const trimText = /机场推荐：/;
const mihomoCfg = mihomoConfig();
const { env } = require('node:process');

const isCI = !!env.GITHUB_ACTIONS;
const defaultProxy = "https://gh-proxy.com";
// const mihomoCfg = 'mihomo_config.yaml'

// ======================
// 工具函数
// ======================

function replaceProxyProviders(content, newBlock) {
  // fs.copyFileSync(configPath, configPath + '.bak');
  // const content = fs.readFileSync(configPath, 'utf8');
  const regex = /^proxy-providers:\s*\n(?:\s{2,}.*\n?)*/gm;

  if (!regex.test(content)) {
    // console.log(`content: ${content}`)
    throw new Error('proxy-providers block not found in config');
  }

  return replaceWithExp(regex, content, newBlock);
}

function extractKey(obj, key) {
  return obj?.[key] !== undefined ? { [key]: obj[key] } : undefined;
}

function mergeReplaceWithExp(key, content, obj) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // const regex = new RegExp(`^\\\\s*${escapedKey}:\\\\s*$((?:\\\\n(?:\\\\s.*|$))*)`, 'gm');
  const regex = new RegExp(`^${escapedKey}:\\s*\\n(?:\\s{2,}.*\\n?)*`, 'gm');
  if (!regex.test(content)) {
    throw new Error(`${regex} block not found in content`);
  }

  const block = extractYamlBlock(content, regex);
  if (block) {
    const partial = yaml.load(block); // { tun: { ... } }
    // const merged = merge({}, partial, { tun: { enable: true } });
    const replace = extractKey(obj, key);
    const merged = merge({}, partial, replace);
    // console.log(merged)
    // console.log(yaml.dump(merged))
    const newBlock = yaml.dump(merged, {
      noRefs: true,
      indent: 2,
      sortKeys: false,
    });
    return replaceWithExp(regex, content, newBlock);
  }

  return content;
}

function extractYamlBlock(text, regex) {
  regex.lastIndex = 0;
  const match = regex.exec(text);
  // console.log(match)
  return match ? match[0] : null;
}

function replaceWithExp(reg, content, newBlock) {
  const updated = content.replace(reg, `${newBlock.trim()}\n`);
  // fs.writeFileSync(configPath, updated, 'utf8');
  return updated;
}

/**
 * 将对象格式化为 YAML 子块（作为某个顶级 key 的值）
 * @param {string} key - 顶级键名，如 'main'
 * @param {any} obj - 要序列化的 JavaScript 对象
 * @param {number} [baseIndent] - 子内容的缩进空格数（默认 2）
 * @returns {string} 格式化后的 YAML 字符串
 */
function objectToYamlSubBlock(key, obj, baseIndent = 2) {
  if (typeof key !== 'string' || !key) {
    throw new Error('key must be a non-empty string');
  }

  // 序列化对象为 YAML（不带顶层 key）
  let innerYaml = yaml.dump(obj, {
    indent: 2, // 每层嵌套缩进 2 空格（YAML 内部层级）
    noRefs: true, // 禁用引用（避免 &id / *id）
    lineWidth: -1, // 不自动折行
    skipInvalid: true, // 跳过无效值（如函数、undefined）
  });

  // 去除末尾可能的多余空行
  innerYaml = innerYaml.trimEnd();

  // 每行前面加上 baseIndent 个空格（用于作为子项）
  const indentedLines = innerYaml
    .split('\n')
    .map((line) => (line.trim() ? ' '.repeat(baseIndent) + line : ''));

  // 拼接成最终结果
  return `${key}:\n${indentedLines.join('\n')}`;
}

// 在生成 YAML 字符串阶段处理
function renderProxyProvider(name, config, template) {
  const lines = [`  ${name}:`];
  if (config.type === 'http' && template.providersAnchorUrl) {
    // 你可加个标志
    lines.push(`    <<: *${template.providersAnchorUrl}`);
  } else if (config.type === 'file' && template.providersAnchorFile) {
    lines.push(`    <<: *${template.providersAnchorFile}`);
  }
  if (template.interval) {
      lines.push(`    interval: ${template.interval}`);
  }
  // if (config.type) lines.push(`    type: ${config.type}`);
  if (config.url) lines.push(`    url: ${config.url}`);
  if (config.path) {
    lines.push(
      `    path: ${template.providersDir ? `${template.providersDir}/` : './'}${config.path}`
    );
  }
  if (template.override) {
    const prefix = template.override?.['additional-prefix'] || '|';
    const overrideWithPrefix = {
      ...template.override,
      'additional-prefix': `${name}${prefix}`,
    };
    lines.push(
      `${objectToYamlSubBlock('    override', overrideWithPrefix, 6)}`
    );
  }
  return lines.join('\n');
}

async function reloadConfig() {
  const restartOrNot = await restartMihomo();
  if (restartOrNot) {
    console.log('重载mihomo配置成功！');
  }
}
/**
 * Base64 解码
 */
function base64Decode(str) {
  return Buffer.from(str.trim(), 'base64').toString('utf8');
}

function rmKeywords(str, reg) {
  return str.replace(reg, '');
}

// 工具函数：下载文件
async function downloadFile(url, filename) {
  try {
    const res = await axios.get(url, { responseType: 'text' });
    const rawContent = res.data;
    await fs.writeFile(filename, rawContent, { encoding: 'utf8' });
    return rawContent;
  } catch (err) {
    console.error(`❌ 下载失败 [${filename}] ${url}:`, err.message);
    return null;
  }
}
/**
 * 通用本地文件处理器（支持不同解析策略）
 * @param {string[]} files - 文件路径列表
 * @param {function(string, string): any[]} parseFn - 解析函数 (content, filename) => proxy[]
 * @returns {Promise<any[]>} 合并后的 proxies 数组
 */
async function processLocalFiles(files, parseFn) {
  if (!files || files.length === 0) return [];

  const tasks = files.map(async (file) => {
    const content = await fs.readFile(file, 'utf8');
    const prefix = path.parse(file).name;
    const proxies = parseFn(content, file) || [];
    return {
      name: prefix,
      proxies: proxies.map((p) => ({
        ...p,
        name: `${prefix}|${rmKeywords(p.name, trimText)}`,
      })),
    };
  });

  const results = await Promise.all(tasks);
  // return results.flat();
  return results;
}

/**
 * 将订阅链接内容转换为 Clash proxies（需根据实际格式实现）
 * @param {string} content - 原始订阅内容
 * @returns {Array} proxy 对象数组
 */
function linkToConfig(content) {
  // TODO: 根据你的实际订阅格式实现（如 Surge/V2Ray/SS 等转 Clash）
  // 示例：假设内容是 Base64 编码的 YAML
  try {
    const lines = content
      .split(newline)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const clashStr = linkToClash(lines);
    // console.log('[linksToConfig] clashStr:', clashStr)
    const config = yaml.load(clashStr.data);
    return Array.isArray(config?.proxies) ? config.proxies : [];
    // console.log('[linksToConfig] dataObj:', dataObj)
    // console.log(`[linksToConfig] proxies(${proxies.length}):`, proxies)
  } catch (e) {
    console.warn('linkToClash 解析失败，跳过:', e.message);
    return [];
  }
}

/**
 * 将多行clash链接转化为标准yaml对象
 * @param {string} content - 原始订阅内容
 * @returns {Array} proxy 对象数组
 */

function base64ToClash(content) {
  // 处理为数组：分割换行符 -> 去除首尾空格 -> 过滤空行
  try {
    const decoded = base64Decode(content);

    // 返回对象以便后续处理（包含文件名和内容）
    // console.log(`${fileNameWithOutExt} lines: ${lines}, ${getType(lines)}`);
    const res = linkToConfig(decoded);
    return res;
  } catch (e) {
    console.warn('linkToClash 解析失败，跳过:', e.message);
    return [];
  }
}

/**
 * 检查 proxies 中是否存在重复的 server+port，并打印重复项
 * @param {Array} proxies - 代理列表 [{ name, server, port, ... }]
 */
function checkDuplicateProxies(proxies) {
  const map = new Map(); // key: "server:port", value: { names: [], exampleProxy }

  for (const proxy of proxies) {
    // 跳过没有 server/port 的条目（如 selector、url-test 等 group）
    if (!proxy.server || !proxy.port) continue;

    const key = `${proxy.server}:${proxy.port}`;
    if (!map.has(key)) {
      map.set(key, { names: [proxy.name], example: proxy });
    } else {
      map.get(key).names.push(proxy.name);
    }
  }

  // 打印重复项
  let duplicateCount = 0;
  for (const [key, { names }] of map.entries()) {
    if (names.length > 1) {
      duplicateCount++;
      console.warn(`⚠️ 重复代理 (${key}):`);
      names.forEach((name) => console.warn(`   - ${name}`));
    }
  }

  if (duplicateCount > 0) {
    console.warn(
      `\n🔍 共发现 ${duplicateCount} 组重复代理（基于 server:port）\n`
    );
  } else {
    console.log('✅ 未发现重复代理（server:port 唯一）');
  }
}

// ======================
// Method 1: 修复策略
// ======================

async function processProvidersForMethod1(providers) {
  const tasks = [];

  for (const provider of providers) {
    for (const [index, url] of provider.url.entries()) {
      tasks.push(
        (async () => {
          const remoteFilename = path.basename(url);
          const localFilename = `${provider.name}_${remoteFilename}`;
          const rawContent = await downloadFile(
            url,
            `./downloads/${localFilename}`
          );

          if (provider.main) {
            // 主配置：返回完整配置
            try {
              const mainConfig = yaml.load(rawContent);
              return { isMain: true, proxies: [], mainConfig };
            } catch (e) {
              console.error(`❌ 主配置 YAML 解析失败 [${url}]:`, e.message);
              return { isMain: false, proxies: [], mainConfig: null };
            }
          } else {
            // 普通 provider：提取 proxies
            let proxies = [];
            try {
              if (provider.type === 'yaml') {
                const cfg = yaml.load(rawContent);
                proxies = cfg?.proxies || cfg || [];
              } else if (provider.type === 'base64') {
                const cfg = base64ToClash(rawContent);
                proxies = cfg?.proxies || cfg || [];
              }
            } catch (e) {
              console.warn(
                `⚠️ Provider [${provider.name} - ${localFilename}] 解析失败:`,
                e.message
              );
            }
            if (!Array.isArray(proxies)) {
              console.log(`❌ proxies is not a array!!!`);
              console.log(`url: ${url} filename: ${localFilename}`);
              console.log(`proxies: ${JSON.stringify(proxies)}`);
            }
            proxies = proxies.map((p) => ({
              ...p,
              name: `${provider.name}${index > 0 ? index : ''}|${rmKeywords(p.name, trimText)}`,
            }));
            return {
              isMain: false,
              proxies,
              mainConfig: null,
              name: `${provider.name}|${index}`,
            };
          }
        })()
      );
    }
  }

  const results = await Promise.all(tasks);

  let mainConfig = null;
  // const allProxies = [];
  const allProxyGroup = [];

  for (const r of results) {
    if (r.isMain) {
      mainConfig = r.mainConfig;
    } else {
      // allProxies.push(...r.proxies);
      allProxyGroup.push({ name: r.name, proxies: r.proxies });
    }
  }

  return { mainConfig, allProxyGroup };
}

async function methodOne(config) {
  const [providerResult, fileNameProxies, fileYamlProxies] = await Promise.all([
    processProvidersForMethod1(config.providers),
    processLocalFiles(config.fileName || [], (content) =>
      linkToConfig(content)
    ),
    processLocalFiles(config.fileYaml || [], (content) => {
      try {
        const cfg = yaml.load(content);
        return cfg?.proxies || cfg || [];
      } catch (e) {
        console.warn('YAML 文件解析失败:', e.message);
        return [];
      }
    }),
  ]);

  const { mainConfig, allProxyGroup } = providerResult;
  if (!mainConfig) {
    throw new Error('未找到 main: true 的主配置文件');
  }

  // 合并所有 proxies
  mainConfig.proxies = [
    ...(mainConfig.proxies || []),
    ...allProxyGroup.map((itm) => itm.proxies).flat(),
    ...fileNameProxies.map((itm) => itm.proxies).flat(),
    ...fileYamlProxies.map((itm) => itm.proxies).flat(),
  ];
  checkDuplicateProxies(mainConfig.proxies);
  const providersStrategy = config?.['groups-strategy'].providers || {
    type: 'load-balance',
    interval: 300,
    lazy: true,
    strategy: 'consistent-hashing',
  };

  mainConfig['proxy-groups'] = [
    ...(mainConfig['proxy-groups'] || []),
    ...allProxyGroup.map((itm) => ({
      name: itm.name,
      ...providersStrategy,
      proxies: itm.proxies.map((i) => i.name),
    })),
    ...fileNameProxies.map((itm) => ({
      name: itm.name,
      type: 'select',
      proxies: itm.proxies.map((i) => i.name),
    })),
    ...fileYamlProxies.map((itm) => ({
      name: itm.name,
      type: 'select',
      proxies: itm.proxies.map((i) => i.name),
    })),
  ];

  mainConfig['proxy-groups'][0].proxies.push(
    ...allProxyGroup.map((itm) => itm.name),
    ...fileNameProxies.map((itm) => itm.name),
    ...fileYamlProxies.map((itm) => itm.name)
  );

  // 应用 fix.base
  if (config.fix?.base) {
    Object.assign(mainConfig, config.fix.base);
  }

  if (config.fix?.['rule-providers']) {
    mainConfig['rule-providers'] = Object.assign(
      {},
      mainConfig['rule-providers'] || {},
      config.fix['rule-providers']
    );
  }
  // 应用 rules
  if (config.fix?.rules) {
    mainConfig.rules = [...(mainConfig.rules || []), ...config.fix.rules];
  }

  // 输出最终配置
  // await exportData(mihomoCfg, mainConfig);
  console.log('✅ 方案一完成：config.yaml 已生成');
  return yaml.dump(mainConfig, {
    indent: 2,
    noRefs: true,
    sortKeys: false, // 保持原有顺序
  });
}

// ======================
// Method 2: 模板策略
// ======================

async function processProvidersForMethod2(providers) {
  const proxyProviders = {};

  const tasks = [];

  for (const provider of providers) {
    for (const [index, url] of provider.url.entries()) {
      const remoteFilename = path.basename(url);
      const localFilename = `${provider.name}_${remoteFilename}`;

      tasks.push(
        (async () => {
          // await downloadFile(url, `./downloads/${localFilename}`)
          return {
            name: `${provider.name}${index > 0 ? index : ''}`,
            url,
            path: localFilename,
          };
        })()
      );
    }
  }

  const results = await Promise.all(tasks);
  for (const r of results) {
    if (r) {
      proxyProviders[r.name] = {
        path: `${r.path}`,
        type: 'http',
        url: `${r.url}`,
      };
    }
  }

  return proxyProviders;
}

async function methodTwo(config, mihomoCfg) {
  // 1. 处理 providers（下载并保存到 proxy_providers/）
  const proxyProvidersFromRemote = await processProvidersForMethod2(
    config.providers
  );

  // 2. 获取模板
  let template;
  if (typeof config.templateset === 'number') {
    template = config.templates[config.templateset - 1];
  } else {
    template = config.templates.find((t) => t.name === config.templateset);
  }
  if (!template) throw new Error('模板未找到');

  //切换github 最快代理
  const proxyResult = await getFastestProxy();
    const mostFastProxy = proxyResult.success ? proxyResult.source : defaultProxy;
  // 下载模板为主配置
  const remoteFilename = path.basename(template.url);
  const localFilename = `${template.name}_${remoteFilename}`;
  const res = await downloadFile(
    isCI
      ? template.url
          ?.replace('gh-proxy.com/raw.githubusercontent.com/', 'github.com/')
          .replace('main', 'raw/refs/heads/main')
      : template.url?.replace(defaultProxy, mostFastProxy),
    path.join(__dirname, `downloads/${localFilename}`)
  );
  if (!res) throw new Error(`主配置未下载成功!`);

  // 3. 构建 proxy-providers
  let yamlStr = 'proxy-providers:\n';
  for (const [name, cfg] of Object.entries(proxyProvidersFromRemote)) {
    yamlStr += `${renderProxyProvider(name, cfg, template)}\n`;
  }

  // const mainConfig = yaml.load(res)
  // console.log(mainConfig['proxy-providers'])

  // mainConfig['proxy-providers'] = mainConfig['proxy-providers'] || {};

  // 合并远程 providers
  // Object.assign(mainConfig['proxy-providers'], proxyProvidersFromRemote);

  // 4. 处理本地文件（fileName + fileYaml）→ 作为 file provider
  if (!isCI) {
    const allLocalFiles = [
      ...(config.fileName || []),
      ...(config.fileYaml || []),
    ];
    const mihomoCfgHome = path.dirname(path.resolve(mihomoCfg));
    await createSymlink(
      path.join(__dirname, 'downloads'),
      path.join(mihomoCfgHome, template.providersDir)
    );
    // await fs.mkdir(template.providersDir, { recursive: true });

    for (const file of allLocalFiles) {
      const destPath = `${path.basename(file)}`;
      // 复制文件到 proxy_providers/
      // const content = await fs.readFile(file);
      // await fs.writeFile(destPath, content);
      await createSymlink(
        path.join(__dirname, file),
        path.join(__dirname, 'downloads', destPath)
      );

      const providerName =
        path.parse(file).name === 'default' ? 'back' : path.parse(file).name;
      yamlStr += `${renderProxyProvider(
        providerName,
        { type: 'file', path: destPath },
        template
      )}\n`;
    }
  }

  let mainConfig;

  mainConfig = replaceProxyProviders(res, yamlStr);
  if (template.tun) {
    console.log('准备修改tun配置');
    mainConfig = mergeReplaceWithExp('tun', mainConfig, template);
  }

  mainConfig = mainConfig.replaceAll(defaultProxy, mostFastProxy);

  // 5. 保存最终配置
  // await fs.writeFile(mihomoCfg, mainConfig);
  console.log('✅ 方案二完成：config.yaml 已生成');
  return mainConfig;
}

// ======================
// 主入口
// ======================

async function genClashCfg(miCfg = mihomoCfg) {
  const isUsingDefault = arguments.length === 0;
  try {
    const configFile = await fs.readFile(
      path.join(__dirname, 'config.yaml'),
      'utf8'
    );
    const config = yaml.load(configFile);
    let generatedConfig;

    if (config.method === 1) {
      console.log('🚀 执行方案一：修复策略');
      generatedConfig = await methodOne(config);
    } else if (config.method === 2) {
      console.log('🚀 执行方案二：模板策略');
      generatedConfig = await methodTwo(config, miCfg);
    } else {
      throw new Error('method 必须为 1 或 2');
    }

    // 5. 保存最终配置
    let outputPath;
    outputPath = miCfg;
    if (isUsingDefault && require('node:process').platform === 'win32') {
      outputPath = path.join(__dirname, 't_modified.yaml');
    }
    if (!generatedConfig) {
      throw new Error(`generatedConfig: ${generatedConfig}`);
    }
    await fs.writeFile(outputPath, generatedConfig);
    // if (require('node:process').platform !== 'win32') await reloadConfig();
    return generatedConfig;
  } catch (error) {
    console.error('💥 执行出错:', error);
    // throw new Error(error.message)
    throw new Error(`${error.message}\n ${error.stack}`);
    // process.exit(1);
  }
}

if (require.main === module) {
  genClashCfg();
}

module.exports = { methodOne, methodTwo, genClashCfg };
