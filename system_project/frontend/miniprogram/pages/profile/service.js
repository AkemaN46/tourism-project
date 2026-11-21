// service.js
Page({
  data: {
    serviceOptions: [
      {
        id: 'phone',
        title: '电话客服',
        desc: '工作日 9:00-18:00',
        icon: '/assets/icons/phone.png'
      },
      {
        id: 'wechat',
        title: '微信客服',
        desc: '24小时在线',
        icon: '/assets/icons/wechat.png'
      },
      {
        id: 'qq',
        title: 'QQ客服',
        desc: '即时回复',
        icon: '/assets/icons/qq.png'
      },
      {
        id: 'email',
        title: '邮件咨询',
        desc: '24小时内回复',
        icon: '/assets/icons/email.png'
      }
    ]
  },

  onLoad() {
    
  },

  // 联系客服
  contactService(e) {
    const serviceId = e.currentTarget.dataset.id;
    
    switch(serviceId) {
      case 'phone':
        this.callPhone();
        break;
      case 'wechat':
        this.copyWechat();
        break;
      case 'qq':
        this.copyQQ();
        break;
      case 'email':
        this.sendEmail();
        break;
    }
  },

  // 拨打电话
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 复制微信号
  copyWechat() {
    wx.setClipboardData({
      data: 'xianxiaozhu_service',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 复制QQ号
  copyQQ() {
    wx.setClipboardData({
      data: '123456789',
      success: () => {
        wx.showToast({
          title: 'QQ号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 发送邮件
  sendEmail() {
    wx.showModal({
      title: '邮件咨询',
      content: '客服邮箱：support@xianxiaozhu.com',
      showCancel: false,
      confirmText: '复制邮箱'
    }).then(() => {
      wx.setClipboardData({
        data: 'support@xianxiaozhu.com',
        success: () => {
          wx.showToast({
            title: '邮箱已复制',
            icon: 'success'
          });
        }
      });
    });
  }
});