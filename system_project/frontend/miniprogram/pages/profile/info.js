// info.js
Page({
  data: {
    userInfo: {
      avatarUrl: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
      nickName: '张三',
      gender: 1,
      birthday: '1990-05-15',
      phone: '138****8000',
      email: 'zhangsan@example.com'
    },
    genders: ['未知', '男', '女']
  },

  onLoad() {
    // 页面加载时获取用户信息
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
          userInfo: {
            ...this.data.userInfo,
            ...res.data
          }
        });
      } else {
        wx.showToast({
          title: res.msg || '获取用户信息失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取用户信息失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        })
        
        // 这里可以上传头像到服务器
        // this.uploadAvatar(tempFilePath)
      }
    })
  },

  // 昵称输入
  onNickNameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  // 性别选择
  onGenderChange(e) {
    this.setData({
      'userInfo.gender': e.detail.value
    })
  },

  // 生日选择
  onBirthdayChange(e) {
    this.setData({
      'userInfo.birthday': e.detail.value
    })
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'userInfo.phone': e.detail.value
    })
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      'userInfo.email': e.detail.value
    })
  },

  // 保存信息
  saveInfo() {
    // 表单验证
    if (!this.data.userInfo.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    // 验证邮箱格式
    if (this.data.userInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.data.userInfo.email)) {
        wx.showToast({
          title: '请输入正确的邮箱格式',
          icon: 'none'
        })
        return
      }
    }
    
    // 保存用户信息
    wx.showLoading({
      title: '保存中...'
    })
    
    const app = getApp();
    
    app.request({
      url: '/user/update',
      method: 'POST',
      data: this.data.userInfo
    }).then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 更新全局用户信息
        app.globalData.userInfo = this.data.userInfo;
        
        // 更新本地缓存
        wx.setStorageSync('userInfo', this.data.userInfo);
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.msg || '保存失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('保存用户信息失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  }
})