const dateUtil = require('../../utils/dateUtil');
const imageUtil = require('../../utils/imageUtil');

Page({
  data: {
    roomList: [],
    homestayId: 0, // 民宿ID
    homestayInfo: {}, // 民宿信息
    scope: '',
    isGlobalMode: false,
    pageReady: false,
    page: 1,
    size: 50,
    hasMore: false,
    loading: false,
    loadError: false,
    errorMessage: '',
    showFilter: false,
    currentFilter: {
      bedType: '',
      priceRange: '',
      minPrice: 0,
      maxPrice: 800
    },
    sliderValue: [0, 800], // 滑动条值
    filterText: '筛选',
    searchKeyword: '', // 搜索关键字（来自首页或本页）
    priceRangeText: '0-800' // 价格范围显示文本
  },

  onLoad(options) {
    const scope = options.scope === 'all' ? 'all' : '';
    const isGlobalMode = scope === 'all';
    // 获取传递的民宿ID（支持URL参数和全局存储）
    let homestayId = options.homestayId || 0;
    // 获取传递的搜索关键字（当从非 tabBar 页面 navigateTo 过来时生效）
    let keyword = options.keyword || '';
    
    this.setData({
      homestayId: parseInt(homestayId) || 0,
      searchKeyword: keyword,
      scope,
      isGlobalMode
    });
    // 新增：打印初始化信息，确认参数传递
    console.log('房型列表页初始化 - 民宿ID:', this.data.homestayId);
    
    if (isGlobalMode) {
      this.setData({ pageReady: true, homestayInfo: {} });
      wx.setNavigationBarTitle({ title: '全部房型' });
      this.loadRoomList();
      return;
    }

    if (!(homestayId > 0)) {
      wx.showToast({ title: '请先选择民宿', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/homestay/list' }), 600);
      return;
    }
    this.setData({ pageReady: true });
    this.loadHomestayInfo(homestayId);
    this.loadRoomList();
  },

  // 页面显示时检查是否有选中的民宿ID
  onShow() {
    if (!this.data.pageReady) return;
    const app = getApp();
    if (!this.data.isGlobalMode) {
      const homestayId = app.globalData.selectedHomestayId || wx.getStorageSync('selectedHomestayId') || 0;
      const globalKeyword = app.globalData.searchKeyword || wx.getStorageSync('searchKeyword') || '';
      // 如果从首页选择了民宿或输入了新的搜索关键字，则重新加载列表
      if ((homestayId && homestayId !== this.data.homestayId) ||
          (globalKeyword && globalKeyword !== this.data.searchKeyword)) {
        this.setData({
          homestayId: parseInt(homestayId) || 0,
          searchKeyword: globalKeyword,
          roomList: []
        });
        // 清除存储的筛选来源数据，避免重复触发
        app.globalData.selectedHomestayId = 0;
        wx.removeStorageSync('selectedHomestayId');
        app.globalData.searchKeyword = '';
        wx.removeStorageSync('searchKeyword');
        // 加载数据
        if (homestayId) {
          this.loadHomestayInfo(homestayId);
        }
        this.loadRoomList();
      }
    }
    
    // 检查是否有从详情页返回需要更新的收藏状态
    if (app.globalData.updatedFavoriteStatus) {
      const { roomId, favoriteStatus } = app.globalData.updatedFavoriteStatus;
      this.updateRoomFavoriteStatus(roomId, favoriteStatus);
      // 清除临时状态
      app.globalData.updatedFavoriteStatus = null;
    }
    
    // 检查本地存储中的收藏状态变化（处理可能的同步问题）
    this.checkLocalFavorites();
  },
  
  // 检查本地存储中的收藏状态变化
  checkLocalFavorites() {
    const app = getApp();
    
    // 如果用户未登录，使用本地收藏数据更新列表
    if (!app.globalData.token) {
      const localFavorites = wx.getStorageSync('favorites') || [];
      const favoriteIds = localFavorites.map(item => item.id);
      
      if (favoriteIds.length > 0) {
        const roomList = this.data.roomList.map(item => {
          item.isFavorite = favoriteIds.includes(item.id);
          return item;
        });
        
        this.setData({ roomList });
      }
    }
  },
  
  // 检查列表中每个房间的收藏状态
  checkFavoriteStatusForList(roomList) {
    const app = getApp();
    
    if (!app.globalData.token) {
      // 如果未登录，使用本地存储检查收藏状态
      const localFavorites = wx.getStorageSync('favorites') || [];
      const favoriteIds = localFavorites.map(item => item.id);
      
      return roomList.map(item => {
        item.isFavorite = favoriteIds.includes(item.id);
        return item;
      });
    } else {
      // 如果已登录，需要逐个检查后端API（这里暂时使用本地缓存）
      // 实际项目中可以批量调用API检查收藏状态
      return roomList.map(item => {
        // 默认未收藏，实际项目中应调用后端API检查
        if (typeof item.isFavorite === 'undefined') {
          item.isFavorite = false;
        }
        return item;
      });
    }
  },

  // 加载民宿信息
  loadHomestayInfo(homestayId) {
    getApp().request({
      url: `/homestay/${homestayId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200 && res.data) {
        this.setData({
          homestayInfo: res.data
        });
        wx.setNavigationBarTitle({ title: `${res.data.name} · 房型` });
      }
    }).catch(err => {
      console.error('获取民宿信息失败:', err);
    });
  },

  // 加载房型列表（核心修复：完善错误调试+Promise兼容）
  loadRoomList() {
    if (this.data.loading) return Promise.resolve();
    
    this.setData({
      loading: true,
      loadError: false,
      errorMessage: ''
    });
    
    const app = getApp();
    
    // 用对象传参（替代字符串拼接，更健壮）
    const params = {
      page: 1,
      size: this.data.size
    };

    if (this.data.isGlobalMode) {
      params.scope = 'all';
    } else {
      params.homestayId = this.data.homestayId;
    }

    // 搜索关键字（按房型名称模糊查询）
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword;
    }
    
    // 传递床型筛选条件（bedType对应后端字段）
    if (this.data.currentFilter.bedType) {
      params.bedType = this.data.currentFilter.bedType;
    }
    
    // 新增价格区间筛选参数传递
    if (this.data.currentFilter.priceRange) {
      params.priceRange = this.data.currentFilter.priceRange;
    }

    // 调试：打印完整请求信息（关键排查依据）
    console.log('请求房型列表参数:', params);
    const fullUrl = `${app.globalData.apiUrl}/room/list`;
    console.log('请求完整URL:', fullUrl);
    
    // 核心修复：确保Promise链式调用正常，catch捕获所有错误
    return app.request({
      url: '/room/list',
      method: 'GET',
      data: params
    }).then(res => {
      // 调试：打印后端返回数据
      console.log('房型列表返回结果:', res);
      
      if (res && res.code === 200) { 
        const currentPageList = (res.data.list || []).map(item => imageUtil.normalizeRoomImage(item));
        // 检查收藏状态后再设置数据
        const newDataWithFavoriteStatus = this.checkFavoriteStatusForList(currentPageList);
        
        this.setData({
          roomList: newDataWithFavoriteStatus,
          hasMore: false,
          loadError: false,
          errorMessage: ''
        });
      } else {
        this.setData({
          roomList: [],
          loadError: true,
          errorMessage: '加载失败，点击重试'
        });
      }
    }).catch(err => {
      // 核心修复：打印完整错误信息，定位连不上的根源
      console.error('获取房型列表失败-详细错误:', JSON.stringify(err));
      this.setData({
        roomList: [],
        loadError: true,
        errorMessage: '加载失败，点击重试'
      });
    }).finally(() => {
      this.setData({
        loading: false
      });
    });
  },

  // 下拉刷新（修复：then调用兼容，避免报错）
  onPullDownRefresh() {
    // 修复：loadRoomList返回Promise后，再停止刷新
    this.loadRoomList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  retryLoad() {
    return this.loadRoomList();
  },

  onImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.roomList[index];
    if (!item) return;
    this.setData({
      [`roomList[${index}].coverImage`]: imageUtil.getFallbackRoomImage(item.id)
    });
  },

  showFilterPopup() {
    // 显示弹窗时同步滑动条值
    this.setData({
      showFilter: true,
      sliderValue: [this.data.currentFilter.minPrice, this.data.currentFilter.maxPrice]
    })
  },

  hideFilterPopup() {
    this.setData({
      showFilter: false
    })
  },

  stopPropagation(e) {
    // 阻止事件冒泡（用于筛选弹窗内部点击）
  },

  // 本页搜索输入
  onLocalSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 本页搜索确认（按钮或键盘搜索）
  onLocalSearchConfirm() {
    this.setData({
      page: 1,
      roomList: []
    });
    this.loadRoomList();
  },

  selectBedType(e) {
    const bedType = e.currentTarget.dataset.type
    this.setData({
      'currentFilter.bedType': bedType
    })
  },

  // 价格滑动条拖动中（实时更新）
  onPriceChanging(e) {
    const value = e.detail.value
    if (Array.isArray(value) && value.length === 2) {
      const [minPrice, maxPrice] = value
      this.setData({
        sliderValue: [minPrice, maxPrice],
        priceRangeText: `${minPrice}-${maxPrice}`
      })
    }
  },

  // 价格滑动条变化完成
  onPriceChange(e) {
    const value = e.detail.value
    if (Array.isArray(value) && value.length === 2) {
      const [minPrice, maxPrice] = value
      this.setData({
        'currentFilter.minPrice': minPrice,
        'currentFilter.maxPrice': maxPrice,
        sliderValue: [minPrice, maxPrice],
        priceRangeText: `${minPrice}-${maxPrice}`
      })
    }
  },

  // 价格输入框变化
  onMinPriceInput(e) {
    const value = parseInt(e.detail.value) || 0
    // 确保最小值不超过最大值
    const maxPrice = Math.max(value, this.data.currentFilter.maxPrice)
    this.setData({
      'currentFilter.minPrice': value,
      'currentFilter.maxPrice': maxPrice,
      priceRangeText: `${value}-${maxPrice}`
    })
  },

  onMaxPriceInput(e) {
    const value = parseInt(e.detail.value) || 800
    // 确保最大值不小于最小值
    const minPrice = Math.min(value, this.data.currentFilter.minPrice)
    this.setData({
      'currentFilter.maxPrice': value,
      'currentFilter.minPrice': minPrice,
      priceRangeText: `${minPrice}-${value}`
    })
  },

  selectPriceRange(e) {
    const priceRange = e.currentTarget.dataset.range
    let minPrice = 0, maxPrice = 800
    
    // 根据预设价格范围设置滑动条值
    switch(priceRange) {
      case '0-300':
        minPrice = 0
        maxPrice = 300
        break
      case '300-600':
        minPrice = 300
        maxPrice = 600
        break
      case '600+':
        minPrice = 600
        maxPrice = 800
        break
      default:
        minPrice = 0
        maxPrice = 800
    }
    
    this.setData({
      'currentFilter.priceRange': priceRange,
      'currentFilter.minPrice': minPrice,
      'currentFilter.maxPrice': maxPrice,
      sliderValue: [minPrice, maxPrice], // 同步滑动条值
      priceRangeText: priceRange || `${minPrice}-${maxPrice}`
    })
  },

  resetFilter() {
    this.setData({
      currentFilter: {
        bedType: '',
        priceRange: '',
        minPrice: 0,
        maxPrice: 800
      },
      sliderValue: [0, 800],
      filterText: '筛选',
      priceRangeText: '0-800'
    })
    this.hideFilterPopup()
    // 重置筛选后重新加载数据
    this.setData({
      page: 1
    });
    this.loadRoomList();
  },

  confirmFilter() {
    const { bedType, minPrice, maxPrice } = this.data.currentFilter
    let filterText = '筛选'
    let priceRange = ''
    
    // 构造价格范围字符串
    if (minPrice === 0 && maxPrice === 800) {
      priceRange = ''
    } else if (maxPrice === 800) {
      priceRange = `${minPrice}+`
    } else {
      priceRange = `${minPrice}-${maxPrice}`
    }
    
    // 更新价格范围
    this.setData({
      'currentFilter.priceRange': priceRange,
      sliderValue: [minPrice, maxPrice] // 同步滑动条值
    })
    
    if (bedType || priceRange) {
      filterText = '已筛选'
      if (bedType) filterText += ` · ${bedType}`
      if (priceRange) filterText += ` · ${priceRange}`
    }
    
    this.setData({
      filterText: filterText
    })
    this.hideFilterPopup()
    
    // 确认筛选后重新加载第一页数据
    this.setData({
      page: 1,
      roomList: [] // 清空当前列表
    });
    this.loadRoomList();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/room/detail?id=${id}`
    })
  },

  // 收藏/取消收藏
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    
    // 获取当前房间状态
    const room = this.data.roomList.find(item => item.id === id)
    const currentStatus = room.isFavorite
    
    // 收藏属于登录态业务
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    
    // 如果已登录，调用后端API
    const apiUrl = currentStatus ? '/favorite/remove' : '/favorite/add'
    const method = 'POST'
    
    app.request({
      url: apiUrl,
      method: method,
      data: { roomId: id }
    }).then(res => {
      if (res.code === 200) {
        const message = currentStatus ? '已取消收藏' : '已收藏'
        wx.showToast({
          title: message,
          icon: 'success'
        })
        
        // 更新页面显示状态
        const roomList = this.data.roomList.map(item => {
          if (item.id === id) {
            item.isFavorite = !item.isFavorite
          }
          return item
        })
        this.setData({ roomList })
        
        // 刷新相关页面数据
        this.refreshRelatedPages()
      } else {
        wx.showToast({
          title: res.msg || '操作失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('收藏操作失败:', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
  },

  // 加入购物车
  addToCart(e) {
    const id = e.currentTarget.dataset.id
    const room = this.data.roomList.find(item => item.id === id)
    const app = getApp()
    
    // 购物车属于登录态业务
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    
    // 如果已登录，需要选择日期
    this.selectDatesAndAddToCart(room)
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
  
  // 调用后端添加购物车API
  callAddToCartAPI(roomId, checkInDate, checkOutDate) {
    const app = getApp();
    
    app.request({
      url: '/cart/add',
      method: 'POST',
      data: {
        roomId: roomId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate
      }
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success'
        });
        
        // 刷新相关页面数据
        this.refreshRelatedPages();
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
  
  // 刷新相关页面数据
  refreshRelatedPages() {
    // 通知我的页面刷新数据
    const pages = getCurrentPages();
    const profilePage = pages.find(page => page.route === 'pages/profile/index');
    if (profilePage && profilePage.refreshFavoriteCount) {
      profilePage.refreshFavoriteCount();
    }
    if (profilePage && profilePage.refreshCartCount) {
      profilePage.refreshCartCount();
    }
      
    // 通知收藏页面刷新数据
    const favoritePage = pages.find(page => page.route === 'pages/profile/favorite');
    if (favoritePage && favoritePage.getFavoriteList) {
      favoritePage.getFavoriteList();
    }
      
    // 通知购物车页面刷新数据
    const cartPage = pages.find(page => page.route === 'pages/profile/cart');
    if (cartPage && cartPage.getCartList) {
      cartPage.getCartList();
    }
  },

  // 立即预定
  goToBook(e) {
    const id = e.currentTarget.dataset.id
    if (!getApp().globalData.token) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    wx.navigateTo({
      url: `/pages/order/create?roomId=${id}`
    })
  },
  
  // 更新房间收藏状态（用于从详情页返回时同步状态）
  updateRoomFavoriteStatus(roomId, favoriteStatus) {
    const roomList = this.data.roomList.map(item => {
      if (item.id === roomId) {
        item.isFavorite = favoriteStatus
      }
      return item
    })
    this.setData({ roomList })
  }
})
