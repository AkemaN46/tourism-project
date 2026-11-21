// list.js
Page({
  data: {
    currentCategory: '1',
    newsList: [],
    page: 0,
    size: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    console.log('页面加载，初始分类:', this.data.currentCategory);
    this.getNewsList();
  },

  // 切换分类
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    console.log('切换到分类:', categoryId);
    this.setData({
      currentCategory: categoryId,
      page: 0,
      newsList: [],
      hasMore: true
    });
    
    this.getNewsList();
  },

  // 获取资讯列表
  getNewsList() {
    if (this.data.loading || !this.data.hasMore) return;
    
    console.log('请求参数 - 当前分类:', this.data.currentCategory, '页码:', this.data.page);
    
    this.setData({
      loading: true
    });
    
    const app = getApp();
    
    // 构建请求参数
    let params = `page=${this.data.page}&size=${this.data.size}&status=1`;
    if (this.data.currentCategory) {
      params += `&categoryId=${this.data.currentCategory}`;
    }
    
    console.log('请求URL:', `/news/list?${params}`);
    
    app.request({
      url: `/news/list?${params}`,
      method: 'GET'
    }).then(res => {
      console.log('API响应:', res);
      if (res.code === 200) {
        // 处理图片路径：如果是相对路径，拼接完整 URL
        const list = res.data.list.map(item => {
          console.log('原始图片路径:', item.coverImage);
          
          // 如果是 example.com 的示例图片，使用 uploads 目录下的图片
          if (item.coverImage && item.coverImage.includes('example.com')) {
            item.coverImage = app.globalData.apiUrl + '/images/015fab9e-2b9b-43a8-9a28-fb4ec868592f.jpg';
          }
          // 如果是相对路径，拼接完整 URL
          else if (item.coverImage && !item.coverImage.startsWith('http')) {
            item.coverImage = app.globalData.apiUrl + item.coverImage;
          }
          
          console.log('处理后图片路径:', item.coverImage);
          return item;
        });
        
        const newData = this.data.page === 0 ? list : [...this.data.newsList, ...list];
        
        this.setData({
          newsList: newData,
          hasMore: list.length === this.data.size
        });
      } else {
        wx.showToast({
          title: res.msg || '获取资讯列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取资讯列表失败:', err);
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
      page: 0,
      hasMore: true
    });
    this.getNewsList();
    wx.stopPullDownRefresh();
  },

  // 上拉加载
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.getNewsList();
    }
  },

  // 跳转到资讯详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/news/detail?id=${id}`
    })
  }
})