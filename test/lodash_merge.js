const yaml = require('js-yaml');
const _ = require('lodash');

const original = {
  '+.example.com': [
    'https://dns.alidns.com/dns-query', // 索引 0
    'https://doh.pub/dns-query', // 索引 1
  ],
};

const newPolicy = {
  '+.example.com': [
    'https://dns.google/dns-query', // 索引 0（期望整体替换）
  ],
};

const dns = ['a', 'c', 1, 2];

const mDns = ['b', 'e', 3, 4];

// ❌ 使用 lodash merge
const result = _.merge({}, original, newPolicy);
console.log(result['+.example.com']);

const nt = _.merge([], dns, mDns);
console.log(nt);
const concateArray = [...mDns, ...dns];
console.log(concateArray);
console.log(concateArray.length);

/**
 * 将 toNameserverPolicy 的返回值安全合并到原 mihomo 配置的 nameserver-policy 中
 * @param {object} originalConfig - 原始 mihomo 完整配置对象
 * @param {object} newPolicy - toNameserverPolicy() 的返回值
 * @returns {object} 合并后的完整配置对象（不修改原对象）
 */
function mergeNameserverPolicy(originalConfig, newPolicy) {
  // 1. 深拷贝原配置，避免直接修改原始数据
  const merged = JSON.parse(JSON.stringify(originalConfig));

  // 2. 确保 nameserver-policy 字段存在
  // if (!merged.dns) merged.dns = {};
  // if (!merged.dns['nameserver-policy']) merged.dns['nameserver-policy'] = {};

  // 3. 浅合并：新策略的键值对覆盖/追加到原 policy 中
  // ⚠️ 相同域名键时，newPolicy 的值会完全替换原值（符合 mihomo 语义）
  // Object.assign(merged.dns['nameserver-policy'], newPolicy);
  Object.assign(merged, newPolicy);

  return merged;
}

// ③ 执行合并
const finalConfig = mergeNameserverPolicy(original, newPolicy);
console.log(finalConfig['+.example.com']);

/**
 * @param {'merge'|'append'|'prepend'|'replace'} arrayStrategy
 *   - merge:   按索引深度合并（默认 lodash.merge 行为）
 *   - append:  将新数组元素追加到原数组末尾
 *   - prepend: 将新数组元素插入到原数组开头
 *   - replace: 直接用新数组替换旧数组
 */
function mergeReplaceWithExp(key, content, obj, arrayStrategy = 'merge') {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedKey}:\\s*\\n(?:\\s{2,}.*\\n?)*`, 'gm');

  if (!regex.test(content)) {
    throw new Error(`${key} block not found in content`);
  }

  const block = extractYamlBlock(content, regex);
  if (!block) return content;

  const partial = yaml.load(block);
  const replace = extractKey(obj, key);

  // ✅ 核心改动：使用自定义合并代替 lodash.merge
  const merged = customMerge(partial, replace, arrayStrategy);

  let newBlock = yaml.dump(merged, {
    quotingType: '"',
    noRefs: true,
    indent: 2,
    sortKeys: false,
  });

  // 为含特殊字符的 key 加引号
  newBlock = newBlock.replace(
    /^(\s*)([^\s"][^\s"+.:]*[+.:]:*[^\s":]+(?::+[^\s":]+)*)\s*:/gm,
    '$1"$2":'
  );

  return replaceWithExp(regex, content, newBlock);
}

// ---------- 辅助函数 ----------

function extractKey(obj, key) {
  return obj?.[key] !== undefined ? { [key]: obj[key] } : undefined;
}

function extractYamlBlock(text, regex) {
  regex.lastIndex = 0;
  const match = regex.exec(text);
  return match ? match[0] : null;
}

function replaceWithExp(reg, content, newBlock) {
  return content.replace(reg, `${newBlock.trim()}\n`);
}

/**
 * 自定义深度合并，支持数组策略
 */
function customMerge(target, source, arrayStrategy) {
  if (source === undefined || source === null) return target;
  if (target === undefined || target === null) return source;

  // ✅ 数组处理：根据策略决定行为
  if (Array.isArray(target) && Array.isArray(source)) {
    switch (arrayStrategy) {
      case 'append':
        return [...target, ...source];
      case 'prepend':
        return [...source, ...target];
      case 'replace':
        return [...source];
      case 'merge':
      default:
        // 按索引深度合并（与 lodash.merge 一致）
        return source.reduce(
          (acc, val, idx) => {
            acc[idx] = customMerge(acc[idx], val, arrayStrategy);
            return acc;
          },
          [...target]
        );
    }
  }

  // 对象处理：递归深度合并
  if (isPlainObject(target) && isPlainObject(source)) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      result[key] = customMerge(result[key], source[key], arrayStrategy);
    }
    return result;
  }

  // 基本类型 / 类型不匹配：source 覆盖 target
  return source;
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

const obj = {
  tun: {
    enable: true,
    routes: ['192.168.0.0/16'],
    dns: { servers: ['1.1.1.1'] },
  },
};

const content = `tun:
  enable: false
  routes:
    - 10.0.0.0/8
    - 172.16.0.0/12
  dns:
    servers:
      - 8.8.8.8`;
// 追加路由，前置 DNS
const mr = mergeReplaceWithExp('tun', content, obj, 'append');
// routes → [10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16]
// dns.servers → [8.8.8.8, 1.1.1.1]
console.log(mr);

const mmr = mergeReplaceWithExp('tun', content, obj, 'prepend');
// routes → [192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12]
// dns.servers → [1.1.1.1, 8.8.8.8]
console.log(mmr);

const tun = `tun:
  - 1
  - 2`;

const ta = {
  tun: [3, 4],
};

let tr = mergeReplaceWithExp('tun', tun, ta, 'prepend');
console.log(tr);
tr = mergeReplaceWithExp('tun', tun, ta);
console.log(tr);
