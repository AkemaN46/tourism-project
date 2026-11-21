// detail.js
Page({
  data: {
    news: {},
    relatedNews: []
  },

  onLoad(options) {
    // 页面加载时执行，可以通过options获取传递的参数
    const newsId = options.id;
    
    this.getNewsDetail(parseInt(newsId));
  },

  // 获取资讯详情
  getNewsDetail(id) {
    const app = getApp();
    app.request({
      url: `/news/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const news = res.data;
        console.log('详情页原始图片路径:', news.coverImage);
        
        // 处理图片路径：如果是 example.com 的示例图片，使用 uploads 目录下的图片
        if (news.coverImage && news.coverImage.includes('example.com')) {
          news.coverImage = app.globalData.apiUrl + '/images/015fab9e-2b9b-43a8-9a28-fb4ec868592f.jpg';
        }
        // 如果是相对路径，拼接完整 URL
        else if (news.coverImage && !news.coverImage.startsWith('http')) {
          news.coverImage = app.globalData.apiUrl + news.coverImage;
        }
        
        console.log('详情页处理后图片路径:', news.coverImage);
        
        this.setData({
          news: news
        });
        
        // 获取相关资讯（这里简单地获取最新的几条）
        this.getRelatedNews();
      } else {
        wx.showToast({
          title: res.msg || '获取资讯详情失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取资讯详情失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 获取相关资讯
  getRelatedNews() {
    const app = getApp();
    app.request({
      url: `/news/list?page=0&size=3&status=1`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        //过滤掉当前资讯，并处理图片路径
        const relatedNews = res.data.list
          .filter(item => item.id !== this.data.news.id)
          .map(item => {
            //处理图片路径：如果是 example.com 的示例图片，使用 uploads 目录下的图片
            if (item.coverImage && item.coverImage.includes('example.com')) {
              item.coverImage = app.globalData.apiUrl + '/images/015fab9e-2b9b-43a8-9a28-fb4ec868592f.jpg';
            }
            // 如果是相对路径，拼接完整 URL
            else if (item.coverImage && !item.coverImage.startsWith('http')) {
              item.coverImage = app.globalData.apiUrl + item.coverImage;
            }
            return item;
          });
        
        this.setData({
          relatedNews: relatedNews
        });
      }
    }).catch(err => {
      console.error('获取相关资讯失败:', err);
    });
  },

  // 跳转到资讯详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/news/detail?id=${id}`
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  }
})