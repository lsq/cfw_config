import { load } from "js-yaml";

// js-yaml 同步解析（轻量）
export const parseJsYaml = (yamlText: string): any => {
  try {
    return load(yamlText, { json: true }) || {};
  } catch (e) {
    console.warn("js-yaml 解析失败", e);
    return null;
  }
};
