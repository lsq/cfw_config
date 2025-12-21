const axiosN = require("axios");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const fs = require("fs/promises");
const xpath = require("xpath");
const { webcrack } = require("@bratel/webcrack");

const amazoneUrl =
  "https://s3.dualstack.us-west-2.amazonaws.com/zhifan2/ss.html";
const parser = new DOMParser();
const xpathHtml = (parseString, doc) =>
  xpath.parse(parseString).select({ node: doc, isHtml: true });

async function saveTextToFile(filename, content, options = {}) {
  const { e = "utf8", f = "w" } = options;
  try {
    await fs.writeFile(filename, content, { encoding: e, flag: f });
  } catch (err) {
    console.error("保存文件时出错:", err);
  }
}

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

async function update_uri() {
  try {
    const amazoneResponse = await axiosN.get(amazoneUrl);
    // saveTextToFile("amazoneInfo.html", amazoneResponse.data);
    const retDoc = parser.parseFromString(amazoneResponse.data, "text/html");
    // const uriNode = xpath.parse("//link[@rel='icon']/@href").select({node: retDoc, isHtml: true})
    const uriNode = xpathHtml("//link[@rel='icon']/@href", retDoc);
    // console.log(uriNode)
    if (uriNode.length > 0) {
      const faviconUri = uriNode[0].nodeValue;
      const retUri = faviconUri.slice(0, faviconUri.lastIndexOf("/"));
      if (isValidUrl(retUri)) {
        return retUri;
      }
    }
    const jsDataNode = xpathHtml(
      "//script[contains(text(), '(function')]",
      retDoc,
    );
    // console.log(jsDataNode)
    if (jsDataNode.length > 0) {
      // console.log('-----------------------')
      // console.log(jsDataNode[0].firstChild.nodeValue)
      const jsData =
        jsDataNode[0].textContent || jsDataNode[0].firstChild?.nodeValue;
      // console.log("-----------------------");
      // console.log(jsData);
      if (jsData) {
        const result = await webcrack(jsData);
        const code = result.code;
        if (code) {
          const match = code.match(/\.src\s*=\s*["']([^"']+)["']/);
          if (match && isValidUrl(match[1])) {
            const extractedUrl = match[1];
            // console.log("Extracted src:", extractedUrl);
            await saveTextToFile(
              __dirname + "/ssUrl.log",
              new Date().toLocaleString() +
                "Extracted src: " +
                extractedUrl +
                "\n",
              { f: "a" },
            );
            return extractedUrl;
          }
        }
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

(async ()=> {
    const url = await update_uri()
    // console.log(process.execPath)
    console.log(url);
})();
