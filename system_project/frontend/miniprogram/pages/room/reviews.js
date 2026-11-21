// pages/room/reviews.js
Page({
  data: {
    reviews: [],
    homestayId: null,
    roomId: null,
    loading: false,
    hasMore: true,
    page: 1,
    size: 10
  },

  onLoad(options) {
    const homestayId = options.homestayId;
    const roomId = options.roomId;
    
    this.setData({
      homestayId: parseInt(homestayId),
      roomId: parseInt(roomId)
    });
    
    this.loadReviews();
  },

  // 加载评价列表
  loadReviews() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      loading: true
    });
    
    const app = getApp();
    const params = {
      page: this.data.page,
      size: this.data.size
    };
    
    // 如果有民宿ID，则获取该民宿的所有评价
    if (this.data.homestayId) {
      params.homestayId = this.data.homestayId;
    }
    
    // 如果有房间ID，则获取该房间的评价
    if (this.data.roomId) {
      params.roomId = this.data.roomId;
    }
    
    if (!this.data.roomId) {
      this.setData({ loading: false, hasMore: false });
      return Promise.resolve();
    }
    return app.request({
      url: `/room/${this.data.roomId}/reviews`,
      method: 'GET',
      data: params
    }).then(res => {
      if (res.code === 200) {
        const newData = this.data.page === 1
          ? res.data.list 
          : [...this.data.reviews, ...res.data.list];
        
        this.setData({
          reviews: newData,
          hasMore: res.data.list.length === this.data.size
        });
      } else {
        wx.showToast({
          title: res.msg || '获取评价失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取评价失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({
        loading: false
      });
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadReviews().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadReviews();
    }
  },

  // 跳转到房间详情
  goToRoomDetail(e) {
    const roomId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/room/detail?id=${roomId}`
    });
  }
})
