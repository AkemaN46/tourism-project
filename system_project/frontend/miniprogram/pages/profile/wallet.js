Page({
  data: {
    walletBalance: 0,
    points: 0,
    coupons: 0,
    transactions: []
  },

  onLoad() {
    this.loadWalletData();
  },

  loadWalletData() {
    // 模拟加载钱包数据
    this.setData({
      walletBalance: 888.88,
      points: 1200,
      coupons: 5
    });
  },

  // 充值
  handleRecharge() {
    wx.showModal({
      title: '充值',
      content: '跳转到充值页面',
      showCancel: false
    });
  },

  // 提现
  handleWithdraw() {
    wx.showModal({
      title: '提现',
      content: '跳转到提现页面',
      showCancel: false
    });
  },

  // 查看交易记录
  viewTransactions() {
    wx.showToast({
      title: '交易记录功能开发中',
      icon: 'none'
    });
  }
})