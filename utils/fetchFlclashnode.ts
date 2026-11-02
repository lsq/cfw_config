// import path from "node:path";
import type {
  DgitGlobalOption,
  RepoOptionType,
  RepoTreeNode,
} from '@bratel/dgit';
import { getRepoTree } from '@bratel/dgit';

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
