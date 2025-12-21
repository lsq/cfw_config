const fsA = require("fs/promises");

async function saveTextToFile(filename, content, options = {}) {
  const { e = "utf8", f = "w" } = options;
  try {
    await fsA.writeFile(filename, content, { encoding: e, flag: f });
  } catch (err) {
    console.error("保存文件时出错:", err);
  }
}


(async () => {
  // const a = { a: "lsq", b: "ypj" }
  const a = ['lsq', 'ypj']
  saveTextToFile(
    "tt.log",
    new Date().toLocaleString() + " :" + JSON.stringify(a),
    { f: "a" },
  );
  console.log("写入成功");
})();
