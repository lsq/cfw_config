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

// ❌ 使用 lodash merge
const result = _.merge({}, original, newPolicy);
console.log(result['+.example.com']);

/**
 * 将 toNameserverPolicy 的返回值安全合并到原 mihomo 配置的 nameserver-policy 中
 * @param {Object} originalConfig - 原始 mihomo 完整配置对象
 * @param {Object} newPolicy - toNameserverPolicy() 的返回值
 * @returns {Object} 合并后的完整配置对象（不修改原对象）
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
