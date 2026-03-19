// install: npm install node-fetch cheerio
const { spawn } = require('node:child_process');
const path = require('node:path');
// const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('node:fs').promises;
const { saveTextToFile } = require('./get_newpac');

// 配置区
const CONFIG = {
  baseUri: 'https://d.serctl.com',
  maxRedirectRetries: 5,
  retryIntervalMs: 5000,
  maxConcurrentTasks: 3, // 同时处理的任务数
  aria2: {
    mode: 'rpc',
    rpcUrl: 'http://localhost:6800/jsonrpc',
  },
  aria2Options: {
    split: 16, // -s
    maxConnectionPerServer: 16, // -x
    dir: './downloads', // 下载目录
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0',
  },
};

const header = {
  'User-Agent': CONFIG.aria2Options.userAgent,
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.6,en;q=0.5',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-GPC': '1',
};

// ========== 工具函数 ==========

function isHtmlComplete(html) {
  return html.includes('</body>') && html.includes('</html>');
}

function parseHtmlResult(html) {
  const $ = cheerio.load(html);
  // 1. 找到第一个真正的数据行（跳过表头 row）
  // 表头通常是第一个 .row，数据从第二个 .row 开始（index=1）
  // const firstDataRow = $('.container-fluid > .row').eq(1);
  // const dataRows = $('div.row[style*="padding: 5px"][style*="border-top"]');
  const dataRows = $('div.row[style*="middle"][style*="padding: 5px"][style*="border-top"]');
  const firstDataRow = dataRows.first();
  // const firstDataRow = $('.container-fluid > .row').filter((i, el) => {
  //   return $(el).find('.btn').length > 0;
  // }).first();

  // 排除表头行（包含“操作”和“文件名”的行）
  /*
  let firstDataRow = null;
  $('div.row').each((i, el) => {
    const $row = $(el);
    const text = $row.text();

    // 跳过表头
    if (text.includes('操作') && text.includes('文件名')) {
      return true; // continue
    }

    // 如果这一行有操作按钮（.btn），就认为是有效数据行
    if ($row.find('.col-xs-6.col-sm-2 .btn').length > 0) {
      firstDataRow = $row;
      return false; // break
    }
  });
    */

  if (!firstDataRow || firstDataRow.length === 0) {
    return { status: 'unknown', error: '未找到数据行' };
  }
  // console.log(`找到firstDataRow: ${firstDataRow.text()}`)
  const operationBtn = firstDataRow.find('.col-xs-6.col-sm-1 .btn').first();
  const operationText = operationBtn.text().trim();

  let detailHref = null;
  const completedLink = $('a.btn.btn-success, a.btn.btn-warning').filter((i, el) => {
    const href = $(el).attr('href');
    return ($(el).text().trim() === '已完成' || $(el).text().trim() === '执行中') && (href && href.startsWith('/?uuid='));
  }).first();
  if (completedLink.length) {
    detailHref = completedLink.attr('href');
  }

  if (operationText === '执行中') {
    return { status: 'processing', detailHref };
  }

  const links = [];
  firstDataRow.find('a.btn.btn-success').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('http')) {
      links.push(href);
    }
  });

  if (links.length > 0) {
    return { status: 'completed', links, detailHref };
  }

  return { status: 'unknown' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== 核心逻辑 ==========

async function sendDownloadRequest(url, uuid, downloadUrl) {
  const payloadStr = `uuid=${encodeURIComponent(uuid)}&download_url=${encodeURIComponent(downloadUrl)}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: header,
      body: payloadStr,
    });

    let data;
    const ct = response.headers.get('content-type');
    if (ct?.includes('application/json')) {
      data = await response.json();
    }
    else {
      data = JSON.parse(await response.text());
    }

    switch (data.messages) {
      case 'download_again':
        return { action: 'redirect', url: data.data };
      case 'danger':
        return { action: 'error', message: data.data || `${downloadUrl}提交失败`};
      default:
        return { action: 'error', message: '未知响应' };
    }
  }
  catch (err) {
    return { action: 'error', message: `${err.message}(${downloadUrl})` };
  }
}

async function redirectRequestWithRetry(redirectPath) {
  const fullUrl = `${CONFIG.baseUri}${redirectPath}`;
  const fileName = extractFileNameFromUrl(fullUrl);
  let attempt = 0;

  while (attempt < CONFIG.maxRedirectRetries) {
    if (attempt > 0)
      console.log(`${redirectPath} -- 重试第${attempt}次！`);
    attempt++;
    try {
      const res = await fetch(fullUrl, { headers: header });
      const html = await res.text();

      // await saveTextToFile(path.join(__dirname, `debug_${fileName}_${attempt}_${Date.now()}.html`), html, { f: 'w' });

      if (!isHtmlComplete(html)) {
        // if (attempt >= CONFIG.maxRedirectRetries) break;
        // await sleep(CONFIG.retryIntervalMs);
        // continue;
        break;
      }

      console.log(`${fileName}: 开始解析(第${attempt}次)Html\n`);
      const result = parseHtmlResult(html);
      if (result.detailHref) {
        console.log(`${fileName} 下载uuid=${result.detailHref}`);
      }
      console.log(`${fileName}: 解析Html后状态: ${result.status}\n`);
      if (result.status === 'processing') {
        if (attempt >= CONFIG.maxRedirectRetries)
          break;
        await sleep(CONFIG.retryIntervalMs);
        continue;
      }
      else if (result.status === 'completed') {
        return { success: true, links: result.links };
      }
      else {
        return { success: false, error: `${fileName} 无法解析页面状态` };
      }
    }
    catch (err) {
      if (attempt >= CONFIG.maxRedirectRetries) {
        return { success: false, error: err.message };
      }
      await sleep(CONFIG.retryIntervalMs);
    }
  }
  return { success: false, error: `${fileName} 达到最大重试次数，任务未完成` };
}

// ========== Aria2 下载 ==========

function extractFileNameFromUrl(url) {
  try {
    // 尝试解析外层 URL
    const outer = new URL(url);
    let target = url;

    // 如果有 ?url=...，优先用它
    if (outer.searchParams.has('url')) {
      target = outer.searchParams.get('url');
    }

    // 处理可能被编码的情况（如 %2F 等）
    try {
      target = decodeURIComponent(target);
    }
    catch (e) {
      // 如果解码失败，就用原值
    }

    // 提取文件名
    return (target.split(/[?#]/)[0].match(/[^/]*$/) || ['unknown_file'])[0];
  }
  catch (e) {
    // 如果不是合法 URL，直接按字符串处理
    return (url.split(/[?#]/)[0].match(/[^/]*$/) || ['unknown_file'])[0];
  }
}

async function downloadWithAria2(links, originalUrl) {
  const fileName = extractFileNameFromUrl(links[0]);
  const outPath = path.join(CONFIG.aria2Options.dir, fileName);
  console.log(`准备下载${fileName}, 存放路径: ${outPath}`);
  let result;
  try {
    if (CONFIG.aria2.mode === 'rpc') {
      result = await downloadViaAria2Rpc(links, fileName, outPath);
    }
    else if (CONFIG.aria2.mode === 'cli') {
      result = await downloadViaAria2Cli(links, fileName, outPath);
    }
    else {
      throw new Error(`未知的 aria2 模式: ${CONFIG.aria2.mode}`);
    }
  }
  catch (err) {
    return {
      success: false,
      error: err.message || '未知错误',
    };
  }
  if (result.success === undefined) {
    return {
      success: false,
      error: '下载函数返回格式不正确',
      raw: result,
    };
  }

  return result;
}
async function downloadViaAria2Rpc(uris, fileName, outPath) {
  const rpcUrl = CONFIG.aria2.rpcUrl; // e.g., http://localhost:6800/jsonrpc
  const dir = path.dirname(outPath);

  const payload = {
    jsonrpc: '2.0',
    id: Date.now().toString(),
    method: 'aria2.addUri',
    params: [
      uris,
      {
        dir,
        out: fileName,
        user_agent: CONFIG.aria2Options.userAgent,
        split: CONFIG.aria2Options.split.toString(),
        max_connection_per_server: CONFIG.aria2Options.maxConnectionPerServer.toString(),
      },
    ],
  };

  console.log(`[Aria2 RPC] 添加任务: ${fileName}`);
  console.log(`[Aria2 RPC] 目标目录: ${dir}`);
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.error) {
      console.log(`${fileName} 添加任务失败。。。`);
      return {
        success: false,
        error: `Aria2 RPC 错误: ${data.error.message || JSON.stringify(data.error)}`,
      };
    }
    console.log(`${fileName} 添加任务成功: gid = ${data.result}`);

    return {
      success: true,
      file: outPath,
      gid: data.result, // 可用于查询进度
      message: '任务已通过 RPC 提交至 Aria2',
    };
  }
  catch (err) {
    console.log(`${fileName} 请求失败。。。\nerror-message: ${err.message}`);
    return {
      success: false,
      error: `Aria2 RPC 请求失败: ${err.message}`,
    };
  }
}

function downloadViaAria2Cli(links, fileName, outPath) {
  return new Promise((resolve, reject) => {
    // const fileName = extractFileNameFromUrl(originalUrl);
    // const outPath = path.join(CONFIG.aria2Options.dir, fileName);

    // 确保目录存在
    fs.mkdir(CONFIG.aria2Options.dir, { recursive: true }).catch(() => {});

    const args = [
      '-s',
      CONFIG.aria2Options.split.toString(),
      '-x',
      CONFIG.aria2Options.maxConnectionPerServer.toString(),
      '--user-agent',
      CONFIG.aria2Options.userAgent,
      '--dir',
      CONFIG.aria2Options.dir,
      '--out',
      fileName,
      ...links,
    ];

    console.log(`[Aria2] 开始下载: ${fileName}`);
    console.log(`[Aria2] 命令: aria2c ${args.join(' ')}`);

    const aria2 = spawn('aria2c', args, { stdio: 'inherit' });

    aria2.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, file: outPath, message: 'CLI 下载完成' });
      }
      else {
        resolve({ success: false, error: `aria2c 退出码: ${code}` });
      }
    });

    aria2.on('error', (err) => {
      resolve({ success: false, error: `启动aria2c失败: ${err.message}` });
    });
  });
}

// ========== 单任务流程 ==========
function withTimeout(promise, ms, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms),
    ),
  ]);
}

async function processSingleTask(downloadUrl) {
  console.log(`\n➡️ 开始处理任务: ${downloadUrl}`);
  const apiUrl = `${CONFIG.baseUri}/api.rb?dl_start`;

  const submitRes = await sendDownloadRequest(apiUrl, '', downloadUrl);
  if (submitRes.action !== 'redirect') {
      // console.log("returned action = :", submitRes.action)
    throw new Error(`提交失败(not redirect): ${submitRes.message}`);
  }

  console.log(`\n➡️ 任务已成功提交，正在重定向到: ${submitRes.url}`);
  const redirectRes = await redirectRequestWithRetry(submitRes.url);
  if (!redirectRes.success) {
    throw new Error(`获取链接失败: ${redirectRes.error}`);
  }

  console.log(`✅ 获取到 ${redirectRes.links.length} 个镜像链接`);
  const result = await downloadWithAria2(redirectRes.links, downloadUrl);
  if (result.success) {
    console.log('✅ 下载成功:', result.file);
    if (result.gid) {
      console.log('📌 Aria2 GID:', result.gid);
    }
    return result;
  }
  else {
    console.error('❌ 下载失败:', result.error);
    throw new Error(`下载失败: ${result.error}`);
  }
}

// ========== 并发控制器 ==========

async function runConcurrentTasks(taskUrls) {
  const results = [];
  const executing = new Set();

  for (const url of taskUrls) {
    const promise = withTimeout(
      processSingleTask(url),
      120_000, // 5分钟超时
      `任务超时: ${url}`,
    );
      // 包装结果并立即监听完成（成功或失败）
    const resultPromise = promise
      .then(value => ({ url, status: 'fulfilled', value }))
      .catch(reason => ({ url, status: 'rejected', reason: reason.message || reason }));

    // 当任务完成时，自动推入 results
    resultPromise.then(result => {
      results.push(result);
    });

    executing.add(promise);

    resultPromise.finally(() => executing.delete(promise));

    if (executing.size >= CONFIG.maxConcurrentTasks) {
      // 等待任意一个完成
      await Promise.race(executing);
    }
  }

  // 等待剩余全部完成
    await Promise.allSettled(executing);
    return results;
}

// ========== 主程序入口 ==========

async function main() {
  const taskUrls = [
    'https://github.com/MetaCubeX/mihomo/releases/download/v1.19.21/mihomo-windows-amd64-v3-v1.19.22.zip',
    'https://github.com/MetaCubeX/mihomo/releases/download/v1.19.21/mihomo-windows-amd64-v3-v1.19.21.zip',
    'https://github.com/obsproject/obs-studio/releases/download/32.1.0/OBS-Studio-32.1.0-Windows-x64-Installer.exe',
    'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.10%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.10_7.msi',
    // 可添加更多
  ];

  console.log(`🚀 启动并发下载任务（最多 ${CONFIG.maxConcurrentTasks} 个并发）`);
  const results = await runConcurrentTasks(taskUrls);

  console.log('\n=== 最终结果汇总 ===');
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      console.log(`✅ [${r.url}] 下载成功 → ${r.value.file}`);
    }
    else {
      console.log(`❌ [${r.url}] 失败: ${r.reason}`);
    }
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processSingleTask, runConcurrentTasks };
