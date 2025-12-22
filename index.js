const axios = require('axios');
// const {DOMParser } = require('@xmldom/xmldom')
// const xpath = require('xpath')
// const xpath = require('xpath-html')
const parser = require('node-html-parser');
//  https://www.horosama.com/archives/317

const url =
  'https://dgithub.xyz/Alvin9999/new-pac/wiki/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7';
// const url = 'https://fan2.194529.xyz/ss%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7/'
//
async function parse_data() {
  try {
    const response = await axios.get(url);
    const data = response.data;
    // console.log(data)
    // const doc = new DOMParser().parseFromString(data, 'text/html')
    // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code', doc)
    // const node = xpath.select('/html/body/div/div[2]/div/div/article/div/div/pre[2]/code/text()', doc)
    // const node = xpath.select('//code/text()', doc) // for xpath
    // const node = xpath.fromPageSource(data).findElements("//*[contains(text(), '节点')") // for xpath-html
    // console.log(node)
    const root = parser.parse(data);
    // console.log(root.querySelector('.markdown-body > table:nth-child(24) > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(4)'))
    // console.log(root.querySelector('.markdown-body > table:nth-child(24) > tbody:nth-child(2) > tr:nth-child(1)'))
    const tr = root.querySelector(
      '.markdown-body > table:nth-child(24) > tbody:nth-child(2) > tr:nth-child(1)'
    );
    console.log(tr.innerText);
    // console.log(node[2].nodeValue)
    // console.log(doc.querySelector('.wp-block-code'))
    const info = node[2].nodeValue;
    // console.log(info)
    const jsonStr =
      '{"' +
      info
        .replace(/\s([^\s]*?：)/g, ',$1')
        .replace(/：/g, '":"')
        .replace(/,/g, '","')
        .replace(/ /g, '') +
      '"}';
    // console.log(jsonStr)
    const meta = JSON.parse(jsonStr);
    const new_pac = [
      {
        name: 'new-pac',
        type: 'ss',
        server: meta['节点'],
        port: meta['端口'],
        cipher: meta['加密方式'],
        password: meta['密码'],
      },
    ];

    return new_pac;
  } catch (e) {
    console.log(e);
  }
}

// newInfo = axios.get(url)
// .then(function(response) {
// .then(parse_data)
// console.log(response)
// })
// .catch(function(error){console.log(error)})

console.log(new Date().toLocaleString());
parse_data().then((data) => {
  console.log(data);
});
