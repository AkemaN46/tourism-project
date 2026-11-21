// review.js - 我的评价页面
Page({
  data: {
    reviewList: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
    activeTab: 'all' // all, pending, approved, rejected
  },

  onLoad() {
    this.getReviewList();
  },

  // 获取评价列表
  getReviewList() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({
      loading: true
    });

    const app = getApp();

    // 构建请求参数
    let params = `page=${this.data.page}&size=${this.data.size}`;
    if (this.data.activeTab !== 'all') {
      let status;
      switch (this.data.activeTab) {
        case 'pending':
          status = 0; // 待审核
          break;
        case 'approved':
          status = 1; // 已通过
          break;
        case 'rejected':
          status = 2; // 未通过
          break;
      }
      params += `&status=${status}`;
    }

    // 使用 /review/user 接口获取当前登录用户的评价
    app.request({
      url: `/review/user?${params}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const newData = this.data.page === 1 ? res.data.list : [...this.data.reviewList, ...res.data.list];
        
        this.setData({
          reviewList: newData,
          hasMore: res.data.list.length === this.data.size
        });
      } else {
        wx.showToast({
          title: res.msg || '获取评价列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取评价列表失败:', err);
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

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    this.setData({
      activeTab: tab,
      page: 1,
      reviewList: [],
      hasMore: true
    });
    
    this.getReviewList();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      reviewList: []
    });
    this.getReviewList();
    wx.stopPullDownRefresh();
  },

  // 上拉加载
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.getReviewList();
    }
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      0: '待审核',
      1: '已通过',
      2: '未通过'
    };
    return statusMap[status] || '未知';
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      0: 'info',
      1: 'success',
      2: 'danger'
    };
    return classMap[status] || 'info';
  },



  // 编辑评价
  editReview(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/edit-review?id=${id}`
    });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  // 删除评价
  deleteReview(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          const app = getApp();
          app.request({
            url: `/review/${id}/delete`,
            method: 'DELETE'
          }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 重新加载列表
              this.setData({
                page: 1,
                reviewList: [],
                hasMore: true
              });
              this.getReviewList();
            } else {
              wx.showToast({
                title: res.msg || '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除评价失败:', err);
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          });
        }
      }
    });
  }
})
