// app.js
const config = require('./utils/config');

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 初始化全局数据
    this.globalData = {
      userInfo: wx.getStorageSync(config.USER_INFO_STORAGE_KEY) || null,
      token: wx.getStorageSync(config.TOKEN_STORAGE_KEY) || '',
      apiUrl: config.API_BASE_URL
    };

    // 检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const that = this;
    
    // 如果已有token，验证有效性
    if (this.globalData.token) {
      this.request({
        url: '/user/info',
        method: 'GET'
      }).then(res => {
        if (res.code === 200) {
          // 登录态有效，直接进入首页
          console.log('登录态有效，进入首页');
        } else {
          // 登录态失效，清除并跳登录页
          that.clearLoginInfo();
          console.log('登录态已失效，当前按游客模式浏览');
        }
      }).catch(() => {
        // 网络错误或token无效，跳登录页
        that.clearLoginInfo();
        console.log('登录态校验失败，当前按游客模式浏览');
      });
    }
  },

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    // 获取当前页面路径，避免重复跳转
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (!currentPage || currentPage.route !== 'pages/login/index') {
      wx.redirectTo({
        url: '/pages/login/index'
      });
    }
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo() {
    this.globalData.userInfo = null;
    this.globalData.token = null;
    wx.removeStorageSync(config.USER_INFO_STORAGE_KEY);
    wx.removeStorageSync(config.TOKEN_STORAGE_KEY);
  },

  /**
   * 封装请求方法
   */
  request(options) {
    const app = this;
    if (!options || !options.url) {
      const errMsg = '请求配置异常（缺少URL）';
      wx.showToast({ title: errMsg, icon: 'none' });
      return Promise.reject(new Error(errMsg));
    }

    const fullUrl = app.globalData.apiUrl + options.url;
    console.log(`【请求发起】URL: ${fullUrl} | 方法: ${options.method || 'GET'} | 参数:`, options.data || {});

    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          // 兼容旧接口和新接口：
          // - 旧接口（如 /user/info）从 token 头中读取
          // - 新接口（如 /order/**、/review/**）从 Authorization 头中读取
          'token': app.globalData.token || '',
          'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
        },
        timeout: config.REQUEST_TIMEOUT,
        success(res) {
          console.log(`【请求成功】状态码: ${res.statusCode} | 响应数据:`, res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (!res.data) {
              const errMsg = '后端返回数据为空';
              wx.showToast({ title: errMsg, icon: 'none' });
              return reject(new Error(errMsg));
            }
            if (res.data.code === 200) {
              resolve(res.data);
            } else if (res.data.code === 401) {
              app.clearLoginInfo();
              wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
              setTimeout(() => {
                app.redirectToLogin();
              }, 1500);
              reject(res.data);
            } else {
              const errMsg = res.data.msg || '业务请求失败';
              wx.showToast({ title: errMsg, icon: 'none' });
              reject(res.data);
            }
          } else {
            if (res.statusCode === 401) {
              app.clearLoginInfo();
              wx.showToast({ title: '请先登录', icon: 'none' });
              setTimeout(() => app.redirectToLogin(), 800);
            }
            const errMsg = (res.data && res.data.msg) || `请求失败（HTTP: ${res.statusCode}）`;
            wx.showToast({ title: errMsg, icon: 'none' });
            reject(res);
          }
        },
        fail(err) {
          let errMsg = '网络连接失败';
          if (err.errMsg.includes('timeout')) {
            errMsg = '请求超时（后端无响应）';
          } else if (err.errMsg.includes('connect')) {
            errMsg = '连接失败（IP/端口错误或后端未启动）';
          } else if (err.errMsg.includes('deny')) {
            errMsg = '域名校验未关闭（请在详情中勾选）';
          }
          console.error(`【请求失败】原因: ${errMsg} | 错误详情:`, err);
          wx.showToast({ title: errMsg, icon: 'none' });
          reject(err);
        }
      });
    });
  },

  globalData: {
    userInfo: null,
    token: null,
    apiUrl: config.API_BASE_URL
  }
});
