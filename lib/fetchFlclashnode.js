"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlclashNode = getFlclashNode;
const dgit_1 = require("@bratel/dgit");
const flclashUrl = 'https://github.com/flclashnode/flclashnode.github.io';
const githubLink = `${flclashUrl}/tree/main/uploads`;
function getLatestPath(paths) {
    if (paths.length === 0)
        return undefined;
    // 利用 YYYY/MM 格式的字典序等于时间序的特性，直接取最大值
    return paths.reduce((latest, current) => current > latest ? current : latest);
}
function groupByDim(paths, dim) {
    const groups = {};
    for (const p of paths) {
        if (!p) {
            continue;
        }
        // 取最后一个 "/" 之前的部分作为分组键，如 "uploads/2025/01"
        const sepIndex = p.lastIndexOf(dim);
        const key = sepIndex > -1 ? p.slice(0, sepIndex) : 'NA';
        (groups[key] ?? (groups[key] = [])).push(p.slice(sepIndex + 1, p.length));
    }
    return groups;
}
async function getFlclashNode(reO, reDo) {
    const nodeTree = await (0, dgit_1.getRepoTree)(reO, reDo);
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
    const getLatestFile = () => {
        const groups = {};
        for (const [key, arr] of Object.entries(srcs)) {
            if (!key) {
                continue;
            }
            const result = getLatestPath(arr);
            if (!result)
                continue;
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
