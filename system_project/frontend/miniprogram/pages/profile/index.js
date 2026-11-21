Page({
  data: {
    userInfo: {},
    // 快捷功能数据
    quickStats: {
      orders: 0,
      coupons: 0,
      points: 0,
      balance: 0
    },
    // 菜单列表
    menuList: [
      {
        id: 'orders',
        name: '我的订单',
        icon: '/assets/icons/order.png',
        badge: 0,
        url: '/pages/order/list'
      },
      {
        id: 'favorite',
        name: '我的收藏',
        icon: '/assets/icons/favorite.png',
        url: '/pages/profile/favorite'
      },
      {
        id: 'cart',
        name: '购物车',
        icon: '/assets/icons/cart.png',
        badge: 0,
        url: '/pages/profile/cart'
      },
      {
        id: 'reviews',
        name: '我的评价',
        icon: '/assets/icons/review.png',
        url: '/pages/profile/review'
      },
      {
        id: 'wallet',
        name: '我的钱包',
        icon: '/assets/icons/wallet.png',
        url: '/pages/profile/wallet'
      },
      {
        id: 'coupons',
        name: '优惠券',
        icon: '/assets/icons/coupon.png',
        badge: 0,
        url: '/pages/profile/coupons'
      },
      {
        id: 'points',
        name: '积分中心',
        icon: '/assets/icons/points.png',
        url: '/pages/profile/points'
      },
      {
        id: 'address',
        name: '收货地址',
        icon: '/assets/icons/address.png',
        url: '/pages/profile/address'
      }
    ],
    // 服务工具
    tools: [
      {
        name: '联系客服',
        icon: '/assets/icons/service.png',
        url: '/pages/profile/service'
      },
      {
        name: '意见反馈',
        icon: '/assets/icons/feedback.png',
        url: '/pages/profile/feedback'
      },
      {
        name: '设置',
        icon: '/assets/icons/set.png',
        url: '/pages/profile/setting'
      }
    ]
  },

  onShow() {
    this.getUserInfo();
    this.getUserStats();
  },

  getUserInfo() {
    const app = getApp();
    const token = app.globalData.token;
    
    if (!token) {
      this.setData({ userInfo: {} });
      return;
    }
    
    app.request({
      url: '/user/info',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({ userInfo: res.data });
        app.globalData.userInfo = res.data;
      }
    }).catch(err => {
      console.error('获取用户信息失败:', err);
    });
  },

  getUserStats() {
    const app = getApp();
    const token = app.globalData.token;
    
    if (!token) return;
    
    // 获取真实的统计数据
    this.getRealStats();
  },

  // 获取真实统计数据
  getRealStats() {
    const app = getApp();
    
    // 获取未支付订单数量
    this.getUnpaidOrderCount();
    
    // 获取购物车数量
    this.getCartItemCount();
    
    // 获取收藏数量
    this.getFavoriteCount();
    
    // 获取优惠券数量（这里可以调用优惠券API）
    this.getCouponCount();
  },

  // 获取未支付订单数量
  getUnpaidOrderCount() {
    const app = getApp();
    
    app.request({
      url: '/order/list',
      method: 'GET',
      data: {
        page: 1,
        size: 100,
        status: 0  // 0表示未支付状态
      }
    }).then(res => {
      if (res.code === 200) {
        const unpaidCount = res.data.list ? res.data.list.length : 0;
        this.setData({
          'quickStats.orders': unpaidCount,
          'menuList[0].badge': unpaidCount
        });
      }
    }).catch(err => {
      console.error('获取未支付订单数量失败:', err);
    });
  },

  // 获取购物车数量
  getCartItemCount() {
    const app = getApp();
    
    app.request({
      url: '/cart/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const cartCount = res.data.length;
        this.setData({
          'menuList[2].badge': cartCount
        });
      }
    }).catch(err => {
      console.error('获取购物车数量失败:', err);
    });
  },

  // 获取收藏数量
  getFavoriteCount() {
    const app = getApp();
    
    app.request({
      url: '/favorite/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const favoriteCount = res.data.length;
        this.setData({
          'menuList[1].badge': favoriteCount
        });
      }
    }).catch(err => {
      console.error('获取收藏数量失败:', err);
    });
  },

  // 获取优惠券数量
  getCouponCount() {
    const app = getApp();
    
    // 这里可以调用优惠券相关的API
    // 暂时使用模拟数据
    setTimeout(() => {
      this.setData({
        'quickStats.coupons': 5,
        'menuList[5].badge': 5
      });
    }, 300);
  },

  // 跳转到个人信息
  goToUserInfo() {
    const app = getApp();
    
    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/profile/info'
    });
  },

  // 点击菜单项
  handleMenuTap(e) {
    const { url, type, id } = e.currentTarget.dataset;
    const app = getApp();
    
    console.log('点击菜单:', id, url, type);
    
    // 需要登录验证的页面
    const needAuth = ['orders', 'favorite', 'cart', 'reviews', 'wallet', 'coupons', 'points', 'address'];
    
    if (needAuth.includes(id) && !app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      });
      return;
    }
    
    if (type === 'contact') {
      this.contactCustomerService();
    } else if (url) {
      console.log('跳转到:', url);
      // 购物车是 tabBar 页面，必须使用 switchTab；订单等普通页面使用 navigateTo。
      const navigate = url === '/pages/profile/cart' ? wx.switchTab : wx.navigateTo;
      navigate({ 
        url: url,
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({
            title: '页面不存在',
            icon: 'none'
          });
        }
      });
    }
  },

  // 联系客服
  contactCustomerService() {
    wx.showModal({
      title: '联系客服',
      content: '客服热线：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4001234567'
          });
        }
      }
    });
  },



  // 快捷操作
  handleQuickAction(e) {
    const { type } = e.currentTarget.dataset;
    const app = getApp();
    
    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      });
      return;
    }
    
    const pages = {
      'orders': '/pages/order/list',
      'coupons': '/pages/profile/coupons',
      'points': '/pages/profile/points',
      'wallet': '/pages/profile/wallet'
    };
    
    if (pages[type]) wx.navigateTo({ url: pages[type] });
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
          
          this.setData({
            userInfo: {},
            quickStats: {
              orders: 0,
              coupons: 0,
              points: 0,
              balance: 0
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 刷新收藏数量
  refreshFavoriteCount() {
    const app = getApp();
    if (!app.globalData.token) return;
    
    app.request({
      url: '/favorite/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const count = res.data.length;
        this.setData({
          'menuList[1].badge': count
        });
      }
    }).catch(err => {
      console.error('刷新收藏数量失败:', err);
    });
  },
  
  // 刷新购物车数量
  refreshCartCount() {
    const app = getApp();
    if (!app.globalData.token) return;
    
    app.request({
      url: '/cart/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const count = res.data.length;
        this.setData({
          'menuList[2].badge': count
        });
      }
    }).catch(err => {
      console.error('刷新购物车数量失败:', err);
    });
  }
});
