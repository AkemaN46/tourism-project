// detail.js
const dateUtil = require('../../utils/dateUtil');
const imageUtil = require('../../utils/imageUtil');

Page({
  data: {
    room: {},
    reviews: [],
    isFavorite: false,
    roomId: null,
    facilities: [],
    discountPercent: '',
    homestayInfo: {},
    indicatorPosition: 0,
    scrollIntoView: '',
    scrollTop: 0,
    activeTab: 0, // 当前激活的标签索引
    sectionPositions: {}, // 存储各区域的实际位置
    navHeight: 100, // 导航栏高度（rpx）
  },

  // 设施图标映射
  facilityIcons: {
    'WiFi': '📶',
    '空调': '❄️',
    '电视': '📺',
    '热水器': '🚿',
    '独立卫浴': '🚽',
    '吹风机': '💨',
    '电热水壶': '🫖',
    '拖鞋': '🩴',
    '牙刷': '🪥',
    '毛巾': '🧖',
    '浴巾': '🛁',
    '窗户': '🪟',
    '阳台': '🌅',
    '冰箱': '🧊',
    '洗衣机': '🧺',
    '衣柜': '👔',
    '书桌': '📚',
    '沙发': '🛋️',
    '暖气': '🔥',
    '加湿器': '💧'
  },

  onLoad(options) {
    // 页面加载时执行，可以通过options获取传递的参数
    const roomId = options.id;
    this.setData({
      roomId: parseInt(roomId),
      activeTab: 0,
      indicatorPosition: 0
    });

    this.getRoomDetail(parseInt(roomId));
    this.getRoomReviews(parseInt(roomId));
    this.checkFavoriteStatus(parseInt(roomId));
    // getHomestayInfo 会在房型数据加载完成后调用（使用 room.homestayId）
  },

  onShow() {
    // 页面显示时重新检查收藏状态
    if (this.data.roomId) {
      this.checkFavoriteStatus(this.data.roomId);
    }
    // 获取各区域的实际位置
    this.calculateSectionPositions();
  },

  // 获取各区域的实际位置（关键修复）
  calculateSectionPositions() {
    const query = wx.createSelectorQuery().in(this);
    const sections = ['section-facilities', 'section-intro', 'section-booking', 'section-review', 'section-surrounding'];
    
    // 使用更可靠的方法获取页面滚动位置
    query.selectViewport().scrollOffset(res => {
      const scrollTop = res.scrollTop || 0;
      
      const promises = sections.map(section => {
        return new Promise((resolve) => {
          query.select(`#${section}`).boundingClientRect(rect => {
            if (rect) {
              //计算相对于页面顶部的绝对位置
              const absoluteTop = rect.top + scrollTop;
              resolve({
                id: section,
                top: absoluteTop,
                height: rect.height
              });
            } else {
              resolve({
                id: section,
                top: 0,
                height: 0
              });
            }
          }).exec();
        });
      });

      Promise.all(promises).then(results => {
        const positions = {};
        results.forEach(item => {
          positions[item.id] = item.top;
        });
        this.setData({
          sectionPositions: positions
        });
        console.log('各区域绝对位置:', positions);
      });
    }).exec();
  },

  // 获取房型详情
  getRoomDetail(id) {
    const app = getApp();
    app.request({
      url: `/room/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const room = imageUtil.normalizeRoomDetail(res.data);
        // 处理设施数据
        const facilities = this.processFacilities(room.facilities || room.facilityList || []);
        // 处理房型亮点
        const highlights = room.highlights || room.featureList || ['干净整洁', '交通便利', '设施齐全'];
        // 计算折扣
        let discountPercent = '';
        if (room.originalPrice && room.originalPrice > room.price) {
          discountPercent = Math.round((room.price / room.originalPrice) * 10);
        }

        this.setData({
          room: {
            ...room,
            highlights: highlights
          },
          facilities: facilities,
          discountPercent: discountPercent
        });

        // 获取民宿信息
        if (room.homestayId) {
          this.getHomestayInfo(room.homestayId);
        }
        
        // 延迟计算区域位置，确保DOM渲染完成
        setTimeout(() => {
          this.calculateSectionPositions();
        }, 500);
      } else {
        wx.showToast({
          title: res.msg || '获取房型详情失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取房型详情失败:', err);
      const code = Number(err && (err.code || err.statusCode || (err.data && err.data.code)));
      if (code === 404) {
        wx.showToast({ title: '资源已不可用', icon: 'none' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1200);
        return;
      }
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 处理设施数据
  processFacilities(facilitiesData) {
    // 如果后端返回的是字符串数组
    if (Array.isArray(facilitiesData) && facilitiesData.length > 0) {
      return facilitiesData.map(name => ({
        name: name,
        icon: this.facilityIcons[name] || '✓',
        available: true
      }));
    }
    // 如果后端返回的是逗号分隔的字符串
    if (typeof facilitiesData === 'string' && facilitiesData.length > 0) {
      return facilitiesData.split(',').map(name => ({
        name: name.trim(),
        icon: this.facilityIcons[name.trim()] || '✓',
        available: true
      }));
    }
    // 默认设施列表
    return [
      { name: 'WiFi', icon: '📶', available: true },
      { name: '空调', icon: '❄️', available: true },
      { name: '电视', icon: '📺', available: true },
      { name: '热水器', icon: '🚿', available: true },
      { name: '独立卫浴', icon: '🚽', available: true },
      { name: '吹风机', icon: '💨', available: true },
      { name: '电热水壶', icon: '🫖', available: true },
      { name: '拖鞋', icon: '🩴', available: true }
    ];
  },

  // 检查收藏状态
  checkFavoriteStatus(roomId) {
    const app = getApp();
    console.log('检查收藏状态 - roomId:', roomId, 'token:', app.globalData.token);

    // 如果没有登录token，使用本地存储
    if (!app.globalData.token) {
      console.log('使用本地存储检查收藏状态');
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.some(item => item.id === roomId);
      console.log('本地存储检查结果:', isFavorite);
      this.setData({ isFavorite });
      return;
    }

    // 如果已登录，调用后端API检查收藏状态
    console.log('使用后端API检查收藏状态');
    app.request({
      url: `/favorite/check?roomId=${roomId}`,
      method: 'GET'
    }).then(res => {
      console.log('后端API检查结果:', res);
      if (res.code === 200) {
        this.setData({ isFavorite: res.data });
        console.log('设置收藏状态为:', res.data);
      }
    }).catch(err => {
      console.error('检查收藏状态失败:', err);
      // 如果API调用失败，回退到本地存储
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.some(item => item.id === roomId);
      this.setData({ isFavorite });
    });
  },

  // 格式化日期（已移至 utils/dateUtil.js）
  formatDate(date) {
    return dateUtil.formatDate(date);
  },

  // 获取房型评价
  getRoomReviews(roomId) {
    const app = getApp();
    // 调用房间评价接口
    app.request({
      url: `/room/${roomId}/reviews?page=0&size=10`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        let roomReviews = res.data.list || [];
        
        // 预处理评价数据，为星级显示做准备
        roomReviews = roomReviews.map(review => ({
          ...review,
          starRating: this.calculateStarRating(review.rating || 5)
        }));
        
        this.setData({
          reviews: roomReviews
        });
      } else {
        console.error('获取评价失败:', res.msg);
      }
    }).catch(err => {
      console.error('获取评价失败:', err);
    });
  },
  
  // 计算星级显示数据
  calculateStarRating(rating) {
    const stars = [];
    const roundedRating = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(i < roundedRating);
    }
    return stars;
  },

  // 收藏/取消收藏
  toggleFavorite() {
    const app = getApp();
    const room = this.data.room;
    const roomId = room.id;

    // 如果没有登录token，使用本地存储
    if (!app.globalData.token) {
      let favorites = wx.getStorageSync('favorites') || [];

      if (this.data.isFavorite) {
        // 取消收藏
        favorites = favorites.filter(item => item.id !== room.id);
        wx.showToast({
          title: '已取消收藏',
          icon: 'none'
        });
      } else {
        // 添加收藏
        favorites.push({
          id: room.id,
          name: room.name,
          price: room.price,
          coverImage: room.coverImage,
          bedType: room.bedType,
          peopleNum: room.peopleNum,
          addTime: new Date().getTime()
        });
        wx.showToast({
          title: '已收藏',
          icon: 'success'
        });
      }

      wx.setStorageSync('favorites', favorites);
      this.setData({
        isFavorite: !this.data.isFavorite
      });
      return;
    }

    // 如果已登录，调用后端API
    const apiUrl = this.data.isFavorite ? '/favorite/remove' : '/favorite/add';
    const method = 'POST';

    console.log('调用后端API:', apiUrl, 'roomId:', roomId);

    app.request({
      url: apiUrl,
      method: method,
      data: { roomId: roomId }
    }).then(res => {
      console.log('收藏操作结果:', res);
      if (res.code === 200) {
        const message = this.data.isFavorite ? '已取消收藏' : '已收藏';
        wx.showToast({
          title: message,
          icon: 'success'
        });

        // 更新收藏状态
        const newStatus = !this.data.isFavorite;
        this.setData({
          isFavorite: newStatus
        });

        // 刷新我的页面中的收藏数据
        this.refreshFavoriteData();

        // 更新全局数据，以便列表页面在返回时能检测到收藏状态变化
        const app = getApp();
        app.globalData.updatedFavoriteStatus = {
          roomId: this.data.roomId,
          favoriteStatus: newStatus
        };

        // 通知列表页面更新收藏状态
        this.updateListPageFavoriteStatus(newStatus);
      } else {
        wx.showToast({
          title: res.msg || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('收藏操作失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 刷新我的页面中的收藏数据
  refreshFavoriteData() {
    // 通知我的页面刷新数据
    const pages = getCurrentPages();
    const profilePage = pages.find(page => page.route === 'pages/profile/index');
    if (profilePage && profilePage.refreshFavoriteCount) {
      profilePage.refreshFavoriteCount();
    }

    // 通知收藏页面刷新数据
    const favoritePage = pages.find(page => page.route === 'pages/profile/favorite');
    if (favoritePage && favoritePage.getFavoriteList) {
      favoritePage.getFavoriteList();
    }
  },

  // 通知列表页面更新收藏状态
  updateListPageFavoriteStatus(favoriteStatus) {
    const pages = getCurrentPages();
    const listPage = pages.find(page => page.route === 'pages/room/list');
    if (listPage && listPage.updateRoomFavoriteStatus) {
      listPage.updateRoomFavoriteStatus(this.data.roomId, favoriteStatus);
    }
  },

  // 加入购物车
  addToCart() {
    const app = getApp();
    const room = this.data.room;

    // 购物车属于用户数据，未登录时不得写入本地伪购物车或提示成功。
    if (!app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => app.redirectToLogin(), 800);
      return;
    }

    // 如果已登录，需要选择日期后调用后端API
    this.selectDatesAndAddToCart(room);
  },

  // 选择日期并添加到购物车
  selectDatesAndAddToCart(room) {
    const that = this;
  
    // 使用简单的日期选择，设置默认日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    // 使用工具函数格式化日期
    const checkInDate = dateUtil.formatDate(today);
    const checkOutDate = dateUtil.formatDate(tomorrow);
  
    // 直接调用后端 API 添加到购物车
    that.callAddToCartAPI(room.id, checkInDate, checkOutDate);
  },

  // 调用后端添加购物车 API
  callAddToCartAPI(roomId, checkInDate, checkOutDate) {
    const app = getApp();
  
    // 使用工具函数格式化日期
    const formattedCheckIn = dateUtil.formatDate(new Date(checkInDate));
    const formattedCheckOut = dateUtil.formatDate(new Date(checkOutDate));

    app.request({
      url: '/cart/add',
      method: 'POST',
      data: {
        roomId: roomId,
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut
      }
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success'
        });

        // 刷新购物车数据
        this.refreshCartData();
      } else {
        wx.showToast({
          title: res.msg || '添加失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('添加购物车失败:', err);
      wx.showToast({
        title: (err && err.msg) || '添加购物车失败，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 刷新购物车数据
  refreshCartData() {
    // 通知我的页面刷新数据
    const pages = getCurrentPages();
    const profilePage = pages.find(page => page.route === 'pages/profile/index');
    if (profilePage && profilePage.refreshCartCount) {
      profilePage.refreshCartCount();
    }

    // 通知购物车页面刷新数据
    const cartPage = pages.find(page => page.route === 'pages/profile/cart');
    if (cartPage && cartPage.getCartList) {
      cartPage.getCartList();
    }
  },

  // 立即预订
  goToBooking() {
    const roomId = this.data.roomId || this.data.room.id;
    
    if (!roomId) {
      wx.showToast({
        title: '房源信息异常',
        icon: 'none'
      });
      return;
    }
  
    wx.navigateTo({
      url: `/pages/order/create?roomId=${roomId}`
    });
  },

  // 查看更多评价
  goToReviewList() {
    //跳转到评价列表页面
    wx.navigateTo({
      url: `/pages/room/reviews?homestayId=${this.data.room.homestayId || this.data.homestayInfo.id}`
    });
  },

  // 滚动事件处理（优化版）
  onScroll(e) {
    const scrollTop = e.detail.scrollTop;
    this.setData({ scrollTop });

    // 根据实际元素位置更新激活标签
    this.updateActiveTabByScroll(scrollTop);
  },

  // 根据滚动位置更新激活标签（关键修复）
  updateActiveTabByScroll(scrollTop) {
    const { sectionPositions } = this.data;
    const navHeight = this.data.navHeight; // 导航栏高度
    const offset = 100; //偏量，避免遮挡

    // 转换rpx到px
    const systemInfo = wx.getSystemInfoSync();
    const pxPerRpx = systemInfo.windowWidth / 750;
    const navHeightPx = navHeight * pxPerRpx;

    // 遍历所有区域，找到当前可视区域的标签
    let activeTab = 0;
    const sections = [
      { id: 'section-facilities', index: 0 },
      { id: 'section-intro', index: 1 },
      { id: 'section-booking', index: 2 },
      { id: 'section-review', index: 3 },
      { id: 'section-surrounding', index: 4 }
    ];

    // 使用更精确的判断逻辑
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const sectionTop = sectionPositions[section.id] || 0;
      const sectionBottom = i < sections.length - 1 ? 
        sectionPositions[sections[i + 1].id] || Infinity : 
        Infinity;
      
      //判断当前滚动位置是否在该区域范围内
      const currentViewTop = scrollTop + navHeightPx + offset;
      if (currentViewTop >= sectionTop && currentViewTop < sectionBottom) {
        activeTab = section.index;
        break;
      }
      
      // 如果滚动位置超过了最后一个区域的开始位置
      if (i === sections.length - 1 && currentViewTop >= sectionTop) {
        activeTab = section.index;
        break;
      }
    }

    //只有当标签确实发生变化时才更新，避免频繁刷新
    if (this.data.activeTab !== activeTab) {

      this.setData({
        activeTab,
        indicatorPosition: activeTab * 20
      });
    }
  },

  // 滚动到指定区域（核心修复）
  scrollToSection(e) {
    const sectionId = e.currentTarget.dataset.section;
    const tabIndex = parseInt(e.currentTarget.dataset.index);
    
    // 1. 更新激活标签和指示器
    this.setData({
      activeTab: tabIndex,
      indicatorPosition: tabIndex * 20
    });

    // 2. 使用 scroll-into-view进行滚动，更可靠
    //先清除之前的 scrollIntoView确保重新定位
    this.setData({
      scrollIntoView: ''
    });
        
    setTimeout(() => {
      this.setData({
        scrollIntoView: sectionId
      });
          
      // 3.同时更新scrollTop以保持兼容性
      const { sectionPositions } = this.data;
      const sectionTop = sectionPositions[sectionId];
          
      if (sectionTop !== undefined && sectionTop !== null) {
        const systemInfo = wx.getSystemInfoSync();
        const pxPerRpx = systemInfo.windowWidth / 750;
        const navHeightPx = this.data.navHeight * pxPerRpx;
        //偏量，确保导航栏不遮挡内容
        const scrollTop = sectionTop - navHeightPx - 30; // 30px偏移量
            
        // 使用延迟设置确保 scroll-into-view完成后再调整
        setTimeout(() => {
          this.setData({
            scrollTop: scrollTop > 0 ? scrollTop : 0
          });
        }, 200);
      }
    }, 50); //缩延迟时间
  },

  // 滚动到页面顶部
  scrollToTop() {
    // 使用 scroll-into-view 和 scrollTop 双重保障
    this.setData({
      scrollIntoView: '',
      activeTab: 0,
      indicatorPosition: 0
    });
        
    //先设置 scrollIntoView
    setTimeout(() => {
      this.setData({
        scrollTop: 0
      });
    }, 50);
        
    //再确保滚动到顶部
    setTimeout(() => {
      this.setData({
        scrollTop: 0
      });
    }, 200);
  },

  // 页面卸载时清理全局数据
  onUnload() {
    const app = getApp();
    // 如果当前页面不是因为收藏状态改变而卸载，清理全局收藏状态
    if (app.globalData.updatedFavoriteStatus && 
        app.globalData.updatedFavoriteStatus.roomId === this.data.roomId) {
      app.globalData.updatedFavoriteStatus = null;
    }
  },

  // 获取民宿信息
  getHomestayInfo(homestayId) {
    const app = getApp();
    app.request({
      url: `/homestay/${homestayId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        this.setData({
          homestayInfo: res.data
        });
      }
    }).catch(err => {
      console.error('获取民宿信息失败:', err);
    });
  },

  // 以下为保留的原有方法（未修改）
  onReachBottom() {
    console.log('页面滚动到底部');
    this.loadMoreReviews();
  },

  preloadContent() {
    console.log('预加载相关内容');
  },

  loadMoreReviews() {
    console.log('正在加载更多评价...');
    const app = getApp();
    // 实际项目中实现加载更多逻辑
  }
});
