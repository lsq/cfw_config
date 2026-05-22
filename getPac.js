const fsA = require('node:fs/promises');
// const os = require('node:os');
const path = require('node:path');
const { env } = require('node:process');
const yaml = require('js-yaml');
const lds = require('lodash');
const { genClashCfg } = require('./genMihomo');
// 修正：引入标准的 Error 类，不需要从 console 引入
const {
  parseData,
  exportData,
  updateUrl,
  fileExists,
} = require('./get_newpac');

const newpacData = path.join(__dirname, 'newpac.yaml');
const rootyml = path.join(__dirname, '..', 'newpac.yaml');
const isCI = !!env.GITHUB_ACTIONS;
const outputPath = env.GITHUB_OUTPUT;

function yamlArraysEqual(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;

  // 按 name 排序（假设 name 是唯一标识）
  const sorted1 = lds.sortBy(arr1, 'name');
  const sorted2 = lds.sortBy(arr2, 'name');

  // return lds.isEqual(sorted1, sorted2);
  for (let i = 0; i < sorted1.length; i++) {
    if (!lds.isEqual(sorted1[i], sorted2[i])) {
      console.log('差异出现在 proxy:', sorted1[i].name);
      console.log('proxy1:', sorted1[i]);
      console.log('proxy2:', sorted2[i]);
      return false;
    }
  }
  return true;
}

async function writeOutPut(num) {
  if (isCI && outputPath) {
    // 🟢 CI 环境：写入 GITHUB_OUTPUT 文件（供后续步骤使用）
    try {
      await fsA.appendFile(outputPath, `needCommit=${num}\n`);
      console.log(`✅ needCommit=${num} Outputs written to GITHUB_OUTPUT`);
    } catch (err) {
      console.error('❌ Failed to write to GITHUB_OUTPUT:', err);
      process.exit(1);
    }
  } else {
    // 🟡 本地开发环境：输出到控制台（便于调试）
    console.log('💡 Running locally. Outputs:');
    console.log('needCommit:', num);
  }
}

(async () => {
  try {
    console.log('🚀 开始更新ssrhub节点配置...');
    const ssrContents = await genClashCfg(path.join(__dirname, 'ssrhub.yaml'));
    if (!ssrContents) {
      throw new Error('ssrhub更新失败！');
    }

    console.log('🚀 开始更新节点配置...');

    // 1. 获取链接
    const getUrl = await updateUrl();

    if (!getUrl) {
      // 修正：使用全局 Error 类，而不是 console.error
      throw new Error('链接为空，更新失败！');
    }

    console.log(`✅ 获取到链接: ${getUrl}`);

    // 2. 解析数据
    const rest = await parseData({ url: getUrl });
    console.log('✅ 数据解析完成');

    // 3. 导出数据
    await exportData(newpacData, rest);
    console.log('✅ 配置文件已保存至:', newpacData);

    console.log('🎉 全部完成！');

    const isFile = await fileExists(rootyml);
    if (!isFile) {
      console.log('../newpac.yml 不存在或无法访问');
      await writeOutPut(1);
      process.exit(0);
    }

    const oldYML = await fsA.readFile(rootyml, 'utf8');
    const oldData = yaml.load(oldYML);

    // 成功则正常退出 (exit code 0)
    const cmt = yamlArraysEqual(oldData.proxies, rest.proxies) ? 0 : 1;
    await writeOutPut(cmt);
    if (cmt || !fileExists(path.join(__dirname, '../newpac.json'))) {
      await fsA.writeFile(
        path.join(__dirname, 'newpac.json'),
        JSON.stringify(rest)
      );
    }
    process.exit(0);
  } catch (err) {
    // 捕获所有错误
    console.error('❌ 发生严重错误:', err.message);
    console.error(err.stack); // 打印堆栈跟踪，方便调试

    // 关键：以非 0 状态码退出，告诉 CI 系统任务失败了
    process.exit(1);
  }
})();
