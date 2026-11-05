// import path from "node:path";
import type {
  DgitGlobalOption,
  RepoOptionType,
  RepoTreeNode,
} from '@bratel/dgit';
import { getRepoTree } from '@bratel/dgit';

const jsUrl =
  'https://gh-proxy.com/https://github.com/flclashnode/flclashnode.github.io/blob/main/assets/website/js/frontend/G.js';
// 'https://flclashnode.github.io/assets/website/js/frontend/G.js';
function getLatestPath(paths: string[]): string | undefined {
  if (paths.length === 0) return undefined;

  // 利用 YYYY/MM 格式的字典序等于时间序的特性，直接取最大值
  return paths.reduce((latest, current) =>
    current > latest ? current : latest
  );
}

function groupByDim(
  paths: (string | null | undefined)[],
  dim: string
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const p of paths) {
    if (!p) {
      continue;
    }
    // 取最后一个 "/" 之前的部分作为分组键，如 "uploads/2025/01"
    const sepIndex = p.lastIndexOf(dim);
    const key = sepIndex > -1 ? p.slice(0, sepIndex) : 'NA';

    (groups[key] ??= []).push(p.slice(sepIndex + 1, p.length));
  }

  return groups;
}

export async function getFlclashNode(
  reO: RepoOptionType,
  reDo?: DgitGlobalOption
) {
  const nodeTree: RepoTreeNode[] = await getRepoTree(reO, reDo);
  const uploads = nodeTree.map((it) => it.path);
  const result = groupByDim(uploads, '/');
  const latestDate = getLatestPath(Object.keys(result));
  if (!latestDate) {
    console.error(`cannot find ${latestDate}!`);
    return;
  }
  // console.log(latestDate);
  const srcs = groupByDim(result[latestDate], '-');
  // console.log(srcs);
  const getLatestFile = (): Record<string, string> => {
    const groups: Record<string, string> = {};
    for (const [key, arr] of Object.entries(srcs)) {
      if (!key) {
        continue;
      }
      const result = getLatestPath(arr);
      if (!result) continue;
      groups[key] = result;
    }
    return groups;
  };
  // console.log(getLatestFile());

  const downLoadFiles = Object.entries(getLatestFile()).map(([k, v]) => {
    return { [k]: `${latestDate}/${k === 'NA' ? v : `${k}-${v}`}` };
  });

  console.log(downLoadFiles);
  return downLoadFiles;
}

function formatter_date(time: string | undefined) {
  const date = typeof time == 'undefined' ? new Date() : new Date(time);
  const formattedDate = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  return formattedDate;
}

function formatter_date_to_items(time: string | undefined) {
  const d = formatter_date(time);
  const dSplit = d.split('/');
  const year = dSplit[0];
  const month = dSplit[1].length === 1 ? `0${dSplit[1]}` : dSplit[1];
  const day = dSplit[2].length === 1 ? `0${dSplit[2]}` : dSplit[2];

  const re = {
    year,
    month,
    day,
  };
  return re;
}

async function fetchGjs() {
  const response = await fetch(jsUrl, {
    credentials: 'omit',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'script',
    },
    referrer:
      'https://flclashnode.github.io/newly-discovered-nodes/index.html?date=2026-11-3',
    method: 'GET',
    mode: 'cors',
  });
  if (!response.ok) {
    console.log(response);
    return;
  }
  const code = await response.text();
  // console.log(content)
  const match = code.match(/var clash_url = '([^']+)'/);
  if (match) {
    // console.log(match[1]);
    // 输出: https://node.freeclashnode.com/uploads/
    return match[1];
  }
}

export async function genFlclashNode(date: string | undefined) {
  const dateItems = formatter_date_to_items(date);
  const flUrl = await fetchGjs();

  if (!flUrl) return [];

  const clash_rows = [];
  for (let i = 0; i < 5; i++) {
    const clash_url = `${flUrl + dateItems.year}/${dateItems.month}/${i}-${
      dateItems.year
    }${dateItems.month}${dateItems.day}.yaml`;
    clash_rows.push({
      name: `fl${i}`,
      type: 'yaml',
      url: [clash_url],
    });
  }

  return clash_rows;
}

// (async () => {
//   fetchGjs();
// })();
