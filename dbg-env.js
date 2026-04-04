// debug-env.js
const fs = require('node:fs');
const path = require('node:path');

// 绝对路径，防止 cwd 变化导致文件写错地方
// 注意：这里写死在 C:\temp 确保一定能写入，不受项目目录权限影响
const logDir = 'D:\\pnpm-debug';
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {}
}

const fileName = `proc-${process.pid}-${Date.now()}.log`;
const fullPath = path.join(logDir, fileName);

const info = {
  pid: process.pid,
  execPath: process.execPath,
  argv: process.argv,
  scriptName: process.argv[1] ? path.basename(process.argv[1]) : 'UNKNOWN',
  cwd: process.cwd(),
  isPrebuildRelated: process.argv.some((arg) => arg.includes('prebuild')),
  envSnapshot: {
    npm_config_target: process.env.npm_config_target,
    npm_config_runtime: process.env.npm_config_runtime,
    npm_config_arch: process.env.npm_config_arch,
    TARGET_ARCH: process.env.TARGET_ARCH,
  },
};

try {
  fs.writeFileSync(fullPath, JSON.stringify(info, null, 2));
  // 同时向 stderr 输出一行简短提示，方便你在控制台看到
  console.error(`[PROBE] Dumped PID ${process.pid} to ${fullPath}`);
} catch (err) {
  console.error(`[PROBE ERROR] Failed to write log: ${err.message}`);
}
