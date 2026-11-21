// pages/login/index.js
Page({
  data: {
    isAgree: false,
    tempCode: '' // 临时存储code，避免嵌套调用
  },

  onLoad(options) {
    // 页面加载时检查是否已有登录态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      // 已有登录态，验证是否有效
      getApp().request({
        url: '/user/info',
        method: 'GET'
      }).then(res => {
        if (res.code === 200) {
          // 登录态有效，直接跳转首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else {
          // 登录态失效，清除本地数据
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
        }
      }).catch(() => {
        // 验证失败，清除本地数据
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
      });
    }
  },

  // 切换协议同意状态
  toggleAgree() {
    this.setData({
      isAgree: !this.data.isAgree
    });
  },

  // 登录前检查（按钮点击先执行这个）
  preLoginCheck() {
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      });
      return;
    }

    return true;
  },

  // 用户授权成功回调（直接绑定到按钮，顶层点击事件）
  onGetUserInfo(e) {
    if (!this.data.isAgree) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return;
    }
    // 1. 检查用户是否同意授权
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '你拒绝了授权',
        icon: 'none'
      });
      return;
    }
  
    console.log('【步骤 2】获取用户信息成功:', e.detail.userInfo);
      
    // 2. 显示加载中
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
  
    // 3. 每次都重新获取新的 code（避免重复使用）
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('【步骤 1-刷新】获取新的微信 code:', res.code);
          // 直接使用新 code 登录，不使用缓存的
          this.doLogin(res.code, e.detail.userInfo);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 执行登录请求（发送 code 和用户信息到后端）
  doLogin(code, userInfo) {
    console.log('【步骤 3】发起登录请求，发送 code 和用户信息到后端...');
    
    getApp().request({
      url: '/user/wxlogin',
      method: 'POST',
      data: {
        code: code,
        userInfo: userInfo,
        agreed: true
      }
    }).then(res => {
      console.log('【步骤 4】后端返回结果:', res);
      
      if (res.code === 200 && res.data) {
        // 步骤 4：保存登录信息到全局和本地
        const app = getApp();
        app.globalData.userInfo = userInfo;
        app.globalData.token = res.data.token;
        
        // 本地持久化存储
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('token', res.data.token);
        if (res.data.userId) {
          wx.setStorageSync('userId', res.data.userId);
        }
        
        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        console.log('【步骤 5】登录完成，跳转首页');
        
        // 步骤 5：跳转首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1000);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: res.msg || '登录失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('【步骤 3】登录请求失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 显示用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用汐岸小筑民宿小程序！在使用本服务前，请您仔细阅读并同意以下条款：\n\n1. 本小程序提供民宿预订、订单管理等服务\n2. 我们需要收集您的微信昵称、头像等信息以提供服务\n3. 我们会保护您的个人隐私和数据安全\n4. 请您遵守相关法律法规和平台规则\n\n点击"确定"表示您已阅读并同意以上条款。',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护：\n\n1. 信息收集：仅在必要时收集微信昵称、头像等基本信息\n2. 信息使用：仅用于提供民宿预订相关服务\n3. 信息安全：采用加密技术保护您的数据安全\n4. 信息共享：不会向第三方泄露您的个人信息\n5. 用户权利：您可以随时查看、修改或删除个人信息\n\n点击"确定"表示您已阅读并理解以上政策。',
      showCancel: false,
      confirmText: '确定'
    });
  }
});
