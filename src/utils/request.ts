import axios from 'axios';
import { message } from 'antd';

export default () => {
    let instance = axios.create();
    instance.defaults.timeout = 60000;
    // 添加请求拦截器
    axios.interceptors.request.use(
        function (config = {}) {
            config.withCredentials = true;
            return config;
        },
        function (error) {
            return Promise.reject(error);
        },
    );

    // 添加响应拦截器
    axios.interceptors.response.use(
        (_) => _,
        (err) => {
            console.log(err);
            if (err && err.response) {
                let config = err.response.config || {};
                if (config.noneIntercept) {
                    return Promise.reject(err);
                }
                const { status, data } = err.response;
                switch (status) {
                    case 0:
                        message.error('系统异常！状态码：0');
                        break;
                    case 400:
                        if (data.message) {
                            if (!config.noneIntercept400) {
                                message.error(data.message, 2);
                            }
                        } else {
                            message.error('请求错误(400)');
                        }
                        break;
                    case 401:
                        message.error('请重新登录！');
                        break;
                    case 403:
                        message.error('服务器连接失败！');
                        break;
                    case 404:
                        message.error('资源已经移除！');
                        break;
                    case 500:
                        message.error('服务器错误(500)');
                        break;
                    case 501:
                        message.error('服务未实现(501)');
                        break;
                    case 502:
                        message.error('网络错误(502)');
                        break;
                    case 503:
                        message.error('我们正在对系统进行升级维护，期间由此造成的不便敬请谅解。');
                        break;
                    case 504:
                        message.error('响应超时，请稍后再试！');
                        break;
                    default:
                        message.error(`连接出错(${err.response.status})!`);
                }
            }
            return Promise.reject(err);
        },
    );
};
