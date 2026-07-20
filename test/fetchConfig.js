const axios = require('axios');

const url = 'https://gh-proxy.com/raw.githubusercontent.com/HenryChiao/MIHOMO_YAMLS/main/THEYAMLS/General_Config/wanswu/config.yaml';

async function fetchConfig() {
  try {
    const response = await axios.get(url);
    console.log('请求成功，状态码:', response.status);
    console.log('--- 配置内容 ---');
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      // 服务器返回了非 2xx 的状态码
      console.error(`请求失败，HTTP 响应码: ${error.response.status}`);
      console.error('响应内容:', error.response.data);
    } else if (error.request) {
      // 请求已发出但没有收到响应（如网络错误、超时等）
      console.error('请求已发出但未收到响应:', error.message);
    } else {
      // 请求配置阶段出错
      console.error('请求配置错误:', error.message);
    }
  }
}

fetchConfig();
