const path = require('node:path/posix');
const yaml = require('js-yaml');

const triples =
  '[{"triple":"aarch64-apple-darwin","platformArchABI":"darwin-arm64","platform":"darwin","arch":"arm64","abi":null},{"triple":"aarch64-linux-android","platformArchABI":"android-arm64","platform":"android","arch":"arm64","abi":null},{"triple":"aarch64-pc-windows-msvc","platformArchABI":"win32-arm64-msvc","platform":"win32","arch":"arm64","abi":"msvc"},{"triple":"aarch64-unknown-freebsd","platformArchABI":"freebsd-arm64","platform":"freebsd","arch":"arm64","abi":null},{"triple":"aarch64-unknown-linux-gnu","platformArchABI":"linux-arm64-gnu","platform":"linux","arch":"arm64","abi":"gnu"},{"triple":"aarch64-unknown-linux-musl","platformArchABI":"linux-arm64-musl","platform":"linux","arch":"arm64","abi":"musl"},{"triple":"armv7-linux-androideabi","platformArchABI":"android-arm-eabi","platform":"android","arch":"arm","abi":"eabi"},{"triple":"armv7-unknown-linux-gnueabihf","platformArchABI":"linux-arm-gnueabihf","platform":"linux","arch":"arm","abi":"gnueabihf"},{"triple":"armv7-unknown-linux-musleabihf","platformArchABI":"linux-arm-musleabihf","platform":"linux","arch":"arm","abi":"musleabihf"},{"triple":"i686-pc-windows-msvc","platformArchABI":"win32-ia32-msvc","platform":"win32","arch":"ia32","abi":"msvc"},{"triple":"loongarch64-unknown-linux-gnu","platformArchABI":"linux-loongarch64-gnu","platform":"linux","arch":"loongarch64","abi":"gnu"},{"triple":"riscv64gc-unknown-linux-gnu","platformArchABI":"linux-riscv64-gnu","platform":"linux","arch":"riscv64","abi":"gnu"},{"triple":"riscv64gc-unknown-linux-musl","platformArchABI":"linux-riscv64-musl","platform":"linux","arch":"riscv64","abi":"musl"},{"triple":"powerpc64le-unknown-linux-gnu","platformArchABI":"linux-ppc64-gnu","platform":"linux","arch":"ppc64","abi":"gnu"},{"triple":"s390x-unknown-linux-gnu","platformArchABI":"linux-s390x-gnu","platform":"linux","arch":"s390x","abi":"gnu"},{"triple":"x86_64-apple-darwin","platformArchABI":"darwin-x64","platform":"darwin","arch":"x64","abi":null},{"triple":"x86_64-pc-windows-msvc","platformArchABI":"win32-x64-msvc","platform":"win32","arch":"x64","abi":"msvc"},{"triple":"x86_64-pc-windows-gun","platformArchABI":"win32-x64-gun","platform":"win32","arch":"x64","abi":"gun"},{"triple":"x86_64-unknown-freebsd","platformArchABI":"freebsd-x64","platform":"freebsd","arch":"x64","abi":null},{"triple":"x86_64-unknown-linux-gnu","platformArchABI":"linux-x64-gnu","platform":"linux","arch":"x64","abi":"gnu"},{"triple":"x86_64-unknown-linux-musl","platformArchABI":"linux-x64-musl","platform":"linux","arch":"x64","abi":"musl"},{"triple":"aarch64-unknown-linux-ohos","platformArchABI":"openharmony-arm64","platform":"openharmony","arch":"arm64","abi":null}]';
const ob = JSON.parse(triples);
const ar = ob.map((item) => path.join('npm', item.platformArchABI));
console.log(ar);
const platformArchABI = 'win32-x64-gun';
const rs = ar.find((tr) => tr.includes(platformArchABI));
console.log(rs);

const tObj = {
  a: {
    b: 1,
    c: {
      d: 4,
      e: [1, 6, 7],
    },
  },
};

console.log(JSON.stringify(tObj));
console.log(yaml.dump(tObj));

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

// 默认缩进 2 空格（作为 main 的子项）
console.log(objectToYamlSubBlock('main', tObj));

// 或者指定缩进为 4（如果父级要求更深）
console.log(objectToYamlSubBlock('  backup', tObj, 4));

const arr = [
  { a: 1, b: 2 },
  { c: 3, d: 4 },
];
console.log(objectToYamlSubBlock('hahah', arr, 4));
