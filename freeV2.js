const fs = require('node:fs').promises;
const path = require('node:path');
const cheerio = require('cheerio');

const freeV2Url = 'https://b.freev2.net';

async function lookUpLink(url) {
  const $ = await cheerio.fromURL(url);
  const operationBtn = $('.mt-5.flex.mx-auto button');

  const operationText = operationBtn.text().trim();

  let detailHref = null;
  if (operationText.includes('立即复制')) {
    detailHref = operationBtn.attr('data-clipboard-text');
    console.log(`freeV2下载链接： ${detailHref}`);
    return detailHref ? detailHref.trim() : null;
  }
  console.log(`not found button!`);
  return detailHref;
}

// (async () => {
//     await parseHtmlResult(freeV2Url)
// })();

if (require.main === module) {
  lookUpLink(freeV2Url);
}

module.exports = { lookUpLink };
