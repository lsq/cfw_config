const { spawnSync } = require('node:child_process');
const i = 0;
// function mystr() {
const mystr = () => {
  if (i === 0) {
    return 'lsq';
  } else {
    return '';
  }
};

const hel = 'hello, ';

const say = hel + mystr();

console.log(say);

const setPlatform = function (platform) {
  Object.defineProperty(process, 'platform', { value: platform });
};

setPlatform('linux');
console.log(process.platform);
console.log(process.env.PKG_CONFIG_PATH.split(';'));

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true,
};
let mingwPkgConfigPath = null;
if (process.report?.getReport?.()?.header?.osName?.startsWith?.('MINGW')) {
  mingwPkgConfigPath = process.env.PKG_CONFIG_PATH?.split(';')
    .map((item) => {
      // console.log(item);
      const ret =
        spawnSync('cygpath', ['-u', `${item}`], {
          ...spawnSyncOptions,
          shell: false,
        }).stdout || '';
      // console.log(ret);
      return ret;
    })
    .join(':');
}
console.log(mingwPkgConfigPath);
console.log(spawnSync('ls', spawnSyncOptions).stdout);
