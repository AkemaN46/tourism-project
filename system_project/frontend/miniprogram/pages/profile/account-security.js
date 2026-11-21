// account-security.js
Page({
  data: {
    userInfo: {},
    securityOptions: [
      {
        id: 'password',
        title: '修改密码',
        icon: '/assets/icons/password.png',
        url: '/pages/profile/change-password'
      },
      {
        id: 'phone',
        title: '绑定手机',
        icon: '/assets/icons/phone.png',
        url: '/pages/profile/bind-phone'
      },
      {
        id: 'email',
        title: '绑定邮箱',
        icon: '/assets/icons/email.png',
        url: '/pages/profile/bind-email'
      }
    ]
  },

  onLoad() {
    this.getUserInfo();
  },

  // 获取用户信息
  getUserInfo() {
    const app = getApp();
    
    app.request({
      url: '/user/info',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({
          userInfo: res.data
        });
      }
    }).catch(err => {
      console.error('获取用户信息失败:', err);
    });
  },

  // 跳转到安全设置项
  navigateToSecurity(e) {
    const index = e.currentTarget.dataset.index;
    const option = this.data.securityOptions[index];
    
    if (option.url) {
      wx.navigateTo({
        url: option.url
      });
    }
  },

  // 修改基本信息
  editBasicInfo() {
    wx.navigateTo({
      url: '/pages/profile/info'
    });
  }
});