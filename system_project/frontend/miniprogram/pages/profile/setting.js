// setting.js
Page({
  data: {
    settings: [
      {
        id: 'account',
        title: '账号与安全',
        icon: '/assets/icons/account-setting.png',
        url: '/pages/profile/account-security'
      }
    ]
  },

  onLoad() {
    
  },

  // 跳转到设置项
  navigateToSetting(e) {
    const index = e.currentTarget.dataset.index;
    const setting = this.data.settings[index];
    
    if (setting.url) {
      wx.navigateTo({
        url: setting.url
      });
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.globalData.token = null;
          app.globalData.userInfo = null;
          
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          
          // 延迟返回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        }
      }
    });
  }
});