const os = require('os')
const { platform, arch, report } = require('node:process');
console.log(os.type())
console.log(report.getReport().header.osName)
console.log(report.getReport().header.osName.startsWith('MINGW32_NT'))
const str = 'hello'
console.log(str.startsWith('h'))
