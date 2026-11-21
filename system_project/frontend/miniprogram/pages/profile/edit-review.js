// edit-review.js - 编辑评价页面
Page({
  data: {
    reviewId: null,
    review: {},
    rating: 0,
    content: '',
    images: [],
    uploading: false,
    maxImages: 9
  },

  onLoad(options) {
    const reviewId = options.id;
    this.setData({ reviewId });
    
    // 获取评价详情
    this.getReviewDetail(reviewId);
  },

  // 获取评价详情
  getReviewDetail(id) {
    const app = getApp();
    app.request({
      url: `/review/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const review = res.data;
        this.setData({
          review: review,
          rating: review.rating,
          content: review.content,
          images: review.images || []
        });
      } else {
        wx.showToast({
          title: res.msg || '获取评价详情失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取评价详情失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 评分改变事件
  onRateChange(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  // 输入评价内容
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    const remain = this.data.maxImages - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({
        title: `最多只能上传${this.data.maxImages}张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        const images = [...this.data.images];

        tempFiles.forEach(file => {
          images.push({
            url: file.tempFilePath,
            uploadStatus: 'pending'
          });
        });

        this.setData({ images });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.images.map(img => img.url);
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 更新评价
  async updateReview() {
    const { reviewId, rating, content, images } = this.data;
    
    if (rating === 0) {
      wx.showToast({
        title: '请先评分',
        icon: 'none'
      });
      return;
    }

    if (!content.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ uploading: true });
    wx.showLoading({
      title: '提交中...'
    });

    try {
      // 上传图片
      const uploadedImages = await this.uploadImages();
      
      const app = getApp();
      
      // 准备评价数据
      const reviewData = {
        rating: rating,
        content: content,
        images: uploadedImages
      };

      // 更新评价
      const res = await app.request({
        url: `/review/${reviewId}/update`,
        method: 'PUT',
        data: reviewData
      });
      
      wx.hideLoading();
      this.setData({ uploading: false });
      
      if (res.code === 200) {
        wx.showToast({
          title: '评价更新成功',
          icon: 'success'
        });
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.msg || '更新失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ uploading: false });
      console.error('更新评价失败:', err);
      wx.showToast({
        title: (err && err.message) || (err && err.msg) || '更新失败，请稍后重试',
        icon: 'none'
      });
    }
  },

  // 上传图片到服务器
  async uploadImages() {
    const { images } = this.data;
    if (!images || images.length === 0) {
      return [];
    }
    
    const uploadedUrls = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      const isTemporary = /^wxfile:\/\//i.test(image.url) || /^https?:\/\/tmp\//i.test(image.url);
      // http://tmp/... 是微信临时文件，并不是可供后台访问的远程地址。
      if (image.url.startsWith('http') && !isTemporary) {
        // 已经是服务器地址，直接使用
        uploadedUrls.push(image.url);
      } else {
        // 是本地临时路径，需要上传
        try {
          const result = await this.uploadSingleImage(image.url);
          if (result.success) {
            uploadedUrls.push(result.url);
          } else {
            throw new Error(result.error || '评价图片上传失败');
          }
        } catch (error) {
          console.error('上传图片失败:', error);
          throw error;
        }
      }
    }
    
    return uploadedUrls;
  },
  
  // 上传单张图片
  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      const app = getApp();
      
      wx.uploadFile({
        url: `${app.globalData.apiUrl}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'token': app.globalData.token || '',
          'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve({ success: true, url: data.data.url });
            } else {
              resolve({ success: false, error: data.msg });
            }
          } catch (e) {
            resolve({ success: false, error: '解析响应失败' });
          }
        },
        fail: (err) => {
          resolve({ success: false, error: err.errMsg });
        }
      });
    });
  }
})
