const imageUtil = require('../../utils/imageUtil');

Page({
  data: {
    showAuthModal: false, // 授权弹窗显示状态
    hasAuth: false, // 是否已授权
    userInfo: {}, // 用户信息
    banners: [], // 轮播图数据
    rooms: [], // 推荐民宿（按民宿维度）
    recommendedRooms: [], // 个性化推荐房源（按房源维度）
    searchKeyword: '' // 首页搜索关键字
  },

  onLoad() {
    // 页面加载时检查授权状态
    this.checkAuthStatus();
    // 加载首页数据
    this.loadHomeData();
  },

  onShow() {
    // 页面显示时再次检查（防止授权后返回不刷新）
    this.checkAuthStatus();
  },

  // 检查授权状态
  checkAuthStatus() {
    const app = getApp();
    // 检查全局用户信息
    if (app.globalData.userInfo && app.globalData.token) {
      this.setData({
        hasAuth: true,
        userInfo: app.globalData.userInfo
      });
    } else {
      // 未授权，显示弹窗（延迟显示提升体验）
      setTimeout(() => {
        this.setData({
          showAuthModal: true
        });
      }, 1000);
    }
  },

  // 关闭授权弹窗
  closeAuthModal() {
    this.setData({
      showAuthModal: false
    });
    // 记录用户已关闭弹窗，不再重复显示
    wx.setStorageSync('hasClosedAuthModal', true);
  },

  // 点击授权登录
  handleAuth() {
    // 跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/index'
    });
  },

  // 加载首页数据
  loadHomeData() {
    // 加载轮播图数据
    this.setData({
      banners: [
        { id: 1, imageUrl: '/assets/images/banner1.jpg' },
        { id: 2, imageUrl: '/assets/images/banner2.jpg' },
        { id: 3, imageUrl: '/assets/images/banner3.jpg' }
      ]
    });

    // 从后端加载推荐民宿（按民宿列表）
    getApp().request({
      url: '/homestay/list',
      method: 'GET',
      data: { page: 1, size: 6 }
    }).then(res => {
      console.log('民宿列表返回:', res);
      if (res.code === 200 && res.data) {
        const rooms = res.data.list || res.data.content || [];
        // 限制推荐民宿为4个
        const limitedRooms = rooms.slice(0, 4).map(item => imageUtil.normalizeRoomImage(item));
        this.setData({ rooms: limitedRooms });
      }
    }).catch((err) => {
      console.error('获取民宿列表失败:', err);
      this.setData({ rooms: [] });
    });

    // 加载个性化推荐房源（基于用户行为）
    getApp().request({
      url: '/recommend/rooms',
      method: 'GET',
      data: { size: 6 }
    }).then(res => {
      console.log('个性化推荐房源返回:', res);
      if (res.code === 200 && res.data) {
        const list = (res.data.list || []).map(item => imageUtil.normalizeRoomImage(item));
        this.setData({
          recommendedRooms: list
        });
      }
    }).catch((err) => {
      console.error('获取个性化推荐房源失败:', err);
      // 失败时不影响其他模块展示，保持默认空列表
      this.setData({
        recommendedRooms: []
      });
    });

  },

  // 跳转到搜索页
  goToSearch() {
    const keyword = this.data.searchKeyword && this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入要搜索的民宿名称',
        icon: 'none'
      });
      return;
    }
    // 由于房型列表是 tabBar 页面，这里需要使用 switchTab 进行跳转，
    // 通过全局变量或本地存储传递搜索关键字
    wx.navigateTo({
      url: `/pages/search/results?keyword=${encodeURIComponent(keyword)}`
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 键盘搜索确认
  onSearchConfirm() {
    this.goToSearch();
  },

  // 跳转到民宿列表
  goToHomestayList() {
    wx.switchTab({
      url: '/pages/homestay/list'
    });
  },

  // 查看全部可售房型
  goToAllRooms() {
    wx.navigateTo({
      url: '/pages/room/list?scope=all'
    });
  },

  // 跳转到民宿详情（显示该民宿的房型列表）
  goToHomestayDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/homestay/detail?id=${id}`
    });
  },

  // 跳转到推荐房源的房型详情
  goToRecommendedRoomDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: `/pages/room/detail?id=${id}`
    });
  },

  // 跳转到房型详情（用于房型列表页）
  goToRoomDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/room/detail?id=${id}`
    });
  },

  // 跳转到订单列表
  goToOrderList() {
    wx.navigateTo({
      url: '/pages/order/list'
    });
  },

  // 跳转到个人中心
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/index'
    });
  },

  // 测试下单权限（民宿列表/详情页同理）
  tryToBook() {
    if (!this.data.hasAuth) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再下单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              showAuthModal: true
            });
          }
        }
      });
      return;
    }
    // 已授权，跳转到下单页面
    wx.navigateTo({
      url: '/pages/order/create?roomId=1'
    });
  }
});
