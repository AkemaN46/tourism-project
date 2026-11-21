// review.js - 订单评价页面
Page({
  data: {
    orderId: null,
    order: {},
    rating: 0,        // 评分
    content: '',      // 评价内容
    images: [],       // 评价图片
    uploading: false, // 是否正在上传
    maxImages: 9      // 最大图片数量
  },

  onLoad(options) {
    const orderId = options.id;
    this.setData({ orderId });
    
    // 获取订单详情
    this.getOrderDetail(orderId);
  },

  // 获取订单详情
  getOrderDetail(id) {
    const app = getApp();
    app.request({
      url: `/order/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const order = res.data;
        
        // 检查订单是否已评价
        if (order.reviewed) {
          wx.showToast({
            title: '该订单已评价过',
            icon: 'none'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          return;
        }
        
        this.setData({ order });
      } else {
        wx.showToast({
          title: res.msg || '获取订单详情失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取订单详情失败:', err);
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
            uploadStatus: 'pending' // pending, uploading, success, error
          });
        });

        this.setData({ images });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
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

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
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
  },
  
  // 提交评价
  async submitReview() {
    const { orderId, rating, content, images } = this.data;
    
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
        orderId: parseInt(orderId),
        roomId: this.data.order.roomId,
        rating: rating,
        content: content,
        images: uploadedImages
      };

      // 提交评价
      const res = await app.request({
        url: '/review/create',
        method: 'POST',
        data: reviewData
      });
      
      wx.hideLoading();
      this.setData({ uploading: false });
      
      if (res.code === 200) {
        wx.showToast({
          title: '评价提交成功',
          icon: 'success'
        });
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.msg || '提交失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ uploading: false });
      console.error('提交评价失败:', err);
      wx.showToast({
        title: (err && err.message) || (err && err.msg) || '提交失败，请稍后重试',
        icon: 'none'
      });
    }
  }
})
