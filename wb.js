const { webcrack } = require('@bratel/webcrack');

webcrack('const a = 1+1;').then((result) => {
  console.log(result.code); // 'const a = 2;'
});
