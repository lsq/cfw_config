const os = require('node:os');
const path = require('node:path');
// 修正：引入标准的 Error 类，不需要从 console 引入
const { parseData, exportData, updateUrl } = require('./get_newpac');

const newpacData = path.join(__dirname, 'newpac.yaml');

(async () => {
  try {
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

    // 成功则正常退出 (exit code 0)
    process.exit(0);
  }
  catch (err) {
    // 捕获所有错误
    console.error('❌ 发生严重错误:', err.message);
    console.error(err.stack); // 打印堆栈跟踪，方便调试

    // 关键：以非 0 状态码退出，告诉 CI 系统任务失败了
    process.exit(1);
  }
})();
