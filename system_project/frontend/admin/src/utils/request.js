import axios from 'axios'
import { Message } from 'element-ui' 

// 创建axios实例
const service = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    console.log('发送请求:', config.method.toUpperCase(), config.url)
    
    // 添加 token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    Message.error('请求发送失败，请检查网络！')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    console.log('收到响应:', response.config.url, response.data)
    return response
  },
  error => {
    console.error('响应错误:', error)
    
    if (!error.response) {
      console.error('网络错误，请检查后端服务是否启动')
      Message.error('网络错误，请检查后端服务是否启动！')
      return Promise.reject(error)
    }
    
    const status = error.response.status
    if (status === 401) {
      Message.warning('登录已过期，请重新登录！')
      localStorage.removeItem('admin_token')
      window.location.href = '/#/login'
    } else if (status === 404) {
      console.error('接口不存在:', error.config.url)
      Message.error(`接口不存在: ${error.config.url}`)
    } else if (status === 500) {
      Message.error('服务器内部错误，请联系管理员！')
    }
    
    return Promise.reject(error)
  }
)

export default service