const yaml = require('js-yaml');
const YAML = require('yaml');

const obj = {
  '+.fastgit.cc': ['https://dns.alidns.com/dns-query'],
};

// 即使指定了 quotingType: '"'，输出依然没有引号
console.log(yaml.dump(obj, { quotingType: '"' }));
console.log(
  yaml.dump(obj, {
    forceQuotes: true,
    quotingType: '"',
    styles: { '!!str': 'double' },
  })
);

const config = {
  dns: {
    'nameserver-policy': {
      'RULE-SET:China,Lan': ['https://dns.alidns.com/dns-query'],
      '+.fastgit.cc': ['https://doh.pub/dns-query'],
      'geosite:cn': ['https://doh.pub'],
      normalKey: ['https://alidns.com'], // Will stay clean
    },
  },
};

// 1. 先转为 JSON 字符串（强制让所有 Key 拥有双引号边界）
const jsonStr = JSON.stringify(config);

// 2. 用 js-yaml 加载这个 JSON 字符串
const jsonObject = yaml.load(jsonStr);

// 3. 配合 styles 和 forceQuotes 导出
const result = yaml.dump(jsonObject, {
  forceQuotes: true,
  quotingType: '"',
  styles: {
    '!!str': 'double',
  },
});

console.log(result);

// 1. Create a custom string type that forces double quotes
const forcedStringTag = new yaml.Type('tag:yaml.org,002:str', {
  kind: 'scalar',
  construct: function (data) {
    return data !== null ? data : '';
  },
  represent: function (value) {
    return value;
  },
  // This properties forces the engine to wrap strings in double quotes
  defaultStyle: 'double',
});

// 2. Extend the default schema with our custom string handler
// We place it in 'implicit' so it catches all unquoted strings during processing
const CUSTOM_SCHEMA = yaml.DEFAULT_SCHEMA.extend({
  implicit: [forcedStringTag],
});

// 3. Dump the object using the custom schema
const nresult = yaml.dump(config, {
  schema: CUSTOM_SCHEMA,
  indent: 2,
});

console.log(nresult);

// 1. 先用最标准的 js-yaml 导出（此时 dns 和 nameserver-policy 不会带引号）
let yamlString = yaml.dump(config, { indent: 2 });

// 2. 使用正则，精准抓取包含特殊字符（如 +, :, .）且没有被引号包裹的 Key
// 匹配规则：行首的空格 + (包含 + 或 : 或 . 的字符串) + 冒号 + 空格/换行
yamlString = yamlString.replace(
  /^(\s*)([^"\s\n]+[:+.][^"\s\n:]+)\s*:/gm,
  '$1"$2":'
);

console.log(yamlString);

console.log('------使用标准YAML库--------');
// 使用 yaml 库的 Stringifier
const resulty = YAML.stringify(config, {
  // 核心：在复写标量（Scalar）样式时，如果它是 map 的 key，强制指定为双引号
  // defaultKeyType: 'QUOTE_DOUBLE',
  defaultScalarType: 'PLAIN', // Value 保持普通样式
});

console.log(resulty);
console.log(
  resulty.replace(/^(\s*)([^"\s\n]+[:+.][^"\s\n:]+)\s*:/gm, '$1"$2":')
);
console.log('--------------');

// Define Clash special characters that absolutely require quotes
const specialCharsRegex = /[:+.*]/;

const nyamlString = YAML.stringify(config, {
  // Use a custom scalar stringifier to intercept string output
  scalarOptions: {
    str: {
      defaultType: 'PLAIN', // Value/Default style remains unquoted plain text
      // Custom stringifier function
      stringify: (node, ctx, onComment, onChompKeep) => {
        const value = node.value;

        // Check if the current node is a Map Key AND contains special characters
        // Note: ctx.keyHint helps identify if the library is currently printing a key
        const isKey = ctx && ctx.keyHint;

        if (isKey && specialCharsRegex.test(value)) {
          // Force double quotes style exclusively for this key
          return JSON.stringify(value);
        }

        // Otherwise, fall back to default auto-formatting
        return ctx.stringify(node, ctx, onComment, onChompKeep);
      },
    },
  },
});

console.log(nyamlString);

// 1. 创建标准的 YAML Document 对象（这时候会生成完整的 AST 树）
const doc = new YAML.Document(config);

// 2. 利用官方自带的 visit 机制，精准、绝对安全地遍历所有的 Map 节点
YAML.visit(doc, {
  Pair(_, pair) {
    // pair.key 就是当前对象的键节点
    if (pair.key && typeof pair.key.value === 'string') {
      const keyStr = pair.key.value;

      // 精准拦截：只要 Key 包含 Clash 的特殊字符
      if (specialCharsRegex.test(keyStr)) {
        // 直接修改该节点的 AST 属性，强制指定为双引号类型
        pair.key.type = 'QUOTE_DOUBLE';
      } else {
        // 正常的 Key 强制指定为不带引号的普通类型
        pair.key.type = 'PLAIN';
      }
    }
  },
});

// 3. 序列化输出
console.log(doc.toString());
