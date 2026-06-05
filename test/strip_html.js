#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 获取命令行参数中的文件路径
const filePath = process.argv[2];

if (!filePath) {
  console.error('用法: node strip-html.js <input-file.html>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`错误: 文件 "${filePath}" 不存在。`);
  process.exit(1);
}

try {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, {
    // 不解析为 XML，保持 HTML 模式
    xmlMode: false,
    // 不 decode entities，但 cheerio 默认会处理 &amp; 等
  });

  // 提取纯文本（自动处理 HTML 实体，如 &amp; → &）
  const text = $.root().text();

  // 输出到 stdout
  process.stdout.write(text);
} catch (err) {
  console.error('处理文件时出错:', err.message);
  process.exit(1);
}
