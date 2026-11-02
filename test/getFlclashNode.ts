import { getFlclashNode } from '../utils/fetchFlclashnode';
import path from 'path';

const flclashUrl = 'https://github.com/flclashnode/flclashnode.github.io';
const githubLink = `${flclashUrl}/tree/main/uploads`;
const response = JSON.parse(`[
  {"0": "uploads/2026/10/0-20261030.yaml"},
  {"1": "uploads/2026/10/1-20261030.yaml"},
  {"2": "uploads/2026/10/2-20261030.yaml"},
  {"3": "uploads/2026/10/3-20261030.yaml"},
  {"4": "uploads/2026/10/4-20261030.yaml"},
  {"NA": "uploads/2026/10/20261030.json"}
]`);

(async () => {
  // const result = await getFlclashNode({ githubLink });
  // console.log(result);
  console.log(response);
  const proxyUrls = response
    ?.filter(
      (node) => (
        console.log(path.extname(Object.values(node)[0]) === '.json'),
        !(path.extname(Object.values(node)[0]) === '.json')
      )
    )
    ?.map((it) => {
      const key = Object.keys(it)[0];
      // if (!key) continue;
      const yamlOrNot = path.extname(it[key]) === '.yaml';
      return {
        name: `flNode${key}`,
        type: yamlOrNot ? 'yaml' : 'base64',
        url: `${flclashUrl}/${it[key]}`,
      };
    });
  console.log(proxyUrls);
})();
