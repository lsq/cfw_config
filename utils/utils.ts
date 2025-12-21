// SPDX-License-Identifier: GPL-3.0
// Original: https://github.com/clash-verge-rev/clash-verge-rev/blob/dev/src/utils/uri-parser.ts
// GitHub: https://github.com/siiway/urlclash-converter
// 本工具仅提供 URL 和 Clash Config 的配置文件格式转换，不存储任何信息，不提供任何代理服务，一切使用产生后果由使用者自行承担，SiiWay Team 及开发本工具的成员不负任何责任.
import { encode as encodePunycode } from "ts-punycode";

/**
 * 将包含 IDN 的域名转换为 Punycode（每个标签独立转换）
 * 输入： example-测试.你好-hello.com
 * 输出： xn--example--6v8re75v.xn---hello-on9im40e.com
 */
export function punycodeDomain(domain: string): string {
  return domain
    .split(".")
    .map((label) => {
      // 只对包含非 ASCII 字符的标签进行 Punycode 编码
      return /[^\x00-\x7F]/.test(label)
        ? "xn--" + encodePunycode(label)
        : label;
    })
    .join(".");
}
