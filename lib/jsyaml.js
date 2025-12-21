"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsYaml = void 0;
const js_yaml_1 = require("js-yaml");
// js-yaml 同步解析（轻量）
const parseJsYaml = (yamlText) => {
    try {
        return (0, js_yaml_1.load)(yamlText, { json: true }) || {};
    }
    catch (e) {
        console.warn("js-yaml 解析失败", e);
        return null;
    }
};
exports.parseJsYaml = parseJsYaml;
