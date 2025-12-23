import fs from 'node:fs'

function decodeBase64OrOriginal(str: string): Uint8Array {
  try {
    // return atob(str);
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes
    // return new TextDecoder().decode(bytes);
  } catch {
      throw new Error('Invalid base64 input');
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

function utf8BytesEqual(str1: string, str2: string): boolean {
  const encoder = new TextEncoder();
  const b1 = encoder.encode(str1);
  const b2 = encoder.encode(str2);
  return b1.length === b2.length && b1.every((byte, i) => byte === b2[i]);
}

const str = "节点";
const utf8Bytes = new TextEncoder().encode(str); // Uint8Array
console.log(`编码后的字节序为: ${bytesToHex(utf8Bytes)}`)
const base64 = btoa(String.fromCharCode(...utf8Bytes));
console.log(base64); // 输出: 6L+Z5piv
// const base64Str = 'ew0KICAidiI6ICIyIiwNCiAgInBzIjogIlZNRVNT6IqC54K5Mi1pcHY2IiwNCiAgImFkZCI6ICIyMDAxOmJjODozMmQ3OjIwMTM6OjgiLA0KICAicG9ydCI6ICI2MjIxMSIsDQogICJpZCI6ICJlMTc4NmQ0OS1jY2JhLTQ2NmItYTBkZC1lMWFiNTliZDgzYmIiLA0KICAiYWlkIjogIjAiLA0KICAic2N5IjogImF1dG8iLA0KICAibmV0IjogIndzIiwNCiAgInR5cGUiOiAibm9uZSIsDQogICJob3N0IjogInd3dy5iaW5nLmNvbSIsDQogICJwYXRoIjogIi9naXRodWIuY29tL0FsdmluOTk5OSIsDQogICJ0bHMiOiAiIiwNCiAgInNuaSI6ICIiLA0KICAiYWxwbiI6ICIiLA0KICAiZnAiOiAiIg0KfQ=='
// const base64Str='6L+Z5piv'
const base64Str='6IqC54K5'
const bytes = decodeBase64OrOriginal(base64Str)
console.log(`解码后的字节序为: ${bytesToHex(bytes)}`)

const atobStr = atob(base64Str)
const retStr = 'è\x8a\x82ç\x82¹'

console.log(atobStr)
console.log(utf8BytesEqual(atobStr, retStr))
fs.writeFileSync('./jied.txt', atobStr)
