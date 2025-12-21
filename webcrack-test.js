const { webcrack } = require("@bratel/webcrack");
const { exec, execSync } = require("child_process");
const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(exec);
const { updateUrl } = require("./findNode");
const { execFile } = require('child_process');
const { promisify } = require('util');

async function getNodeFromPath() {
  try {
    console.log("std-------");
    // const path = execSync('which node', {encoding: 'utf8'});
    const { stdout } = await execAsync("where.exe node");
    console.log("stdout-------", stdout);
    return stdout
      .trim()
      .split(/\r?\n/)
      .filter((p) => p.trim() !== "");
  } catch (err) {
    return [];
  }
}

async function findAllNodePaths() {
  const set = new Set();

  // 1. 当前进程（虽然你不要，但可作为参考）
  // set.add(process.execPath);

  // 2. 常见路径扫描
  // const scanned = await findNodeExecutables();
  // scanned.forEach(p => set.add(p));

  // 3. 注册表
  // const fromReg = await getNodeFromRegistry();
  // fromReg.forEach(p => set.add(p));

  // 4. PATH
  const fromPath = await getNodeFromPath();
  console.log("fromPath: ", fromPath);
  fromPath.forEach((p) => set.add(p));

  return Array.from(set).filter((p) => require("fs").existsSync(p));
}

const code = fs.readFileSync("./iframe.js", "utf8");

webcrack(code).then((result) => {
  console.log(result.code);
  const scriptCode = result.code;
  const match = scriptCode.match(/\.src\s*=\s*["']([^"']+)["']/);
  if (match) {
    console.log("Extracted src:", match[1]);
  }
});

async function update_uri() {
  try {
    const nodePath = await findAllNodePaths();
    console.log(nodePath);
    const output = execSync(`${nodePath[0]} updateUri.js`, {
      encoding: "utf8",
    });
    // const result = JSON.parse(output.trim());
    const result = output.trim();
    console.log("Captured result:", result); // { status: 'ok', data: [1,2,3] }

    const myVar = result; // 保存到变量
    console.log(myVar);
  } catch (err) {
    console.error("Script failed:", err);
  }
}


// 将 execFile 转为 Promise 版本
const execFileAsync = promisify(execFile);

// 测试单个 node.exe 的版本
async function getNodeVersion(nodePath) {
  try {
    const { stdout } = await execFileAsync(nodePath, ['-v']);
    return {
      path: nodePath,
      version: stdout.trim(), // 去掉换行符
      error: null
    };
  } catch (err) {
    return {
      path: nodePath,
      version: null,
      error: err.message || 'Unknown error'
    };
  }
}

// 主函数：测试所有路径
async function testAllNodeVersions(nodePaths) {
  // 并发执行所有测试
  const results = await Promise.all(
    nodePaths.map(path => getNodeVersion(path))
  );

  // 输出结果
  console.log('Node.js 版本测试结果：');
  results.forEach(({ path, version, error }) => {
    if (version) {
      console.log(`✅ ${path} -> ${version}`);
    } else {
      console.log(`❌ ${path} -> Error: ${error}`);
    }
  });

  return results;
}

// 测试单个 node.exe 的运行时 OS 名称
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
      'process.report.getReport().header.osName'
    ]);

    return {
      path: nodePath,
      osName: stdout.trim(),
      error: null
    };
  } catch (err) {
    return {
      path: nodePath,
      osName: null,
      error: err.message || 'Unknown error'
    };
  }
}

// 主函数：测试所有路径
async function testAllNodeOsNames(nodePaths) {
  const results = await Promise.all(
    nodePaths.map(path => getNodeOsName(path))
  );

  console.log('Node.js 运行时操作系统测试结果：');
  results.forEach(({ path, osName, error }) => {
    if (osName) {
      console.log(`✅ ${path} -> ${osName}`);
    } else {
      console.log(`❌ ${path} -> Error: ${error}`);
    }
  });

  return results;
}

// 使用示例
// const nodePaths = [
  // "c:\\node.exe",
  // "d:\\node.exe"
// ];
async function findValidNode() {
  // setTimeout(()=>{
  //     console('haha..')
  // }, 3000)
  const output = execSync("where.exe node", { encoding: "utf8" });
  const pathArr = output.split(/\r?\n/).filter((p) => p.trim() !== "");
  const results = await Promise.all(
    pathArr.map(path => getNodeOsName(path))
  );
  const validPath = results.filter(p => {
    return !p.osName.startsWith('MINGW')
    })
  return validPath
}

(async () => {
  const nodePaths = await findAllNodePaths()
  testAllNodeVersions(nodePaths).catch(console.error);
  testAllNodeOsNames(nodePaths).catch(console.error);
  await update_uri();
  console.log("-----------------------");
  const url = await updateUrl();
  console.log("-----------------------");
  console.log(url || 'lsq');
  console.log('------------------')
  const np = await findValidNode()
  console.log(np)
  // console.log(url);
})();
