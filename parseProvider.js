const { processFiles, linksToConfig } = require('./get_newpac');

(async () => {
  const fileNames = ['f.txt'];
  const proxiesData = await processFiles(fileNames, linksToConfig);
  console.log(`proxiesData: ${JSON.stringify(proxiesData)}`);
})();
