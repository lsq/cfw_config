const util = require('util');
const { exec } = require('child_process');

// 将 exec 转为返回 Promise 的函数
const execPromise = util.promisify(exec);

async function runCommand() {
  try {
    const { stdout, stderr } = await execPromise('node -v');
    console.log('Node version:', stdout.trim()); // v20.17.0
  } catch (err) {
    console.error('命令执行失败:', err.message);
  }
}

runCommand();
