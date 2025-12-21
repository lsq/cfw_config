const { exec, execSync } = require("child_process");
const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(exec);
const fsA = require("fs/promises");

async function getNodeFromPath() {
  try {
    // console.log("std-------");
    // const path = execSync('which node', {encoding: 'utf8'});
    const { stdout } = await execAsync("where.exe node");
    // console.log("stdout-------", stdout);
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
  // console.log("fromPath: ", fromPath);
  fromPath.forEach((p) => set.add(p));

  return Array.from(set).filter((p) => fs.existsSync(p));
}

async function updateUrl() {
  try {
    const nodePath = await findAllNodePaths();
    // console.log(nodePath);
    if (nodePath.length > 0) {
    const output = execSync(`${nodePath[0]} updateUri.js`, { encoding: "utf8", });
    // const result = JSON.parse(output.trim());
    // const { stdout } = await execAsync(`${nodePath[0]} updateUri.js`);
    // await fsA.writeFile('ssrurl.txt', new Date() + JSON.stringify(output));

    // const ret = output .trim() .split(/\r?\n/) .filter((p) => p.trim() !== "");
    const ret = output.trim()
        // await fsA.writeFile('ssrurl.txt', ret, {encoding: 'utf8'});
    return ret
    }
    return null
  } catch (err) {
    console.error("Script failed:", err);
    return null;
  }
}

module.exports = {
    updateUrl,
    findAllNodePaths
}
