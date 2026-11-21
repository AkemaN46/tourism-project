Page({
  data: {
    couponTabs: [
      { id: 'available', name: '可使用', active: true },
      { id: 'used', name: '已使用', active: false },
      { id: 'expired', name: '已过期', active: false }
    ],
    coupons: [
      {
        id: 1,
        title: '新人专享优惠券',
        amount: 50,
        condition: '满200元可用',
        expireTime: '2024-12-31到期',
        status: 'available'
      },
      {
        id: 2,
        title: '周末特惠券',
        amount: 30,
        condition: '满150元可用',
        expireTime: '2024-11-30到期',
        status: 'available'
      }
    ]
  },

  onLoad() {
    this.loadCoupons();
  },

  // 切换标签
  switchTab(e) {
    const tabId = e.currentTarget.dataset.id;
    const tabs = this.data.couponTabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    }));
    
    this.setData({
      couponTabs: tabs
    });
    
    this.loadCoupons(tabId);
  },

  // 加载优惠券
  loadCoupons(status = 'available') {
    // 这里可以根据状态筛选优惠券
    const filteredCoupons = this.data.coupons.filter(coupon => coupon.status === status);
    this.setData({
      coupons: filteredCoupons
    });
  },

  // 使用优惠券
  useCoupon(e) {
    const couponId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '优惠券已选中',
      icon: 'success'
    });
  }
})