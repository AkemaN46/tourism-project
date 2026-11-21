// favorite.js
const imageUtil = require('../../utils/imageUtil');
Page({
  data: {
    favoriteList: [],
    loading: false
  },

  onLoad() {
    // 页面加载时获取收藏列表
    this.getFavoriteList();
  },
  
  onShow() {
    // 页面显示时获取最新收藏列表
    this.getFavoriteList();
  },

  // 获取收藏列表
  getFavoriteList() {
    const app = getApp();
    
    this.setData({ loading: true });
    
    app.request({
      url: '/favorite/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        const list = res.data.map(item => ({
          ...item,
          coverImage: imageUtil.resolveRoomImage(item.coverImage, item.roomId)
        }));
        
        this.setData({
          favoriteList: list
        });
      } else {
        wx.showToast({
          title: res.msg || '获取收藏列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取收藏列表失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  onRoomImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.favoriteList[index];
    if (!item) return;
    this.setData({ [`favoriteList[${index}].coverImage`]: imageUtil.getFallbackRoomImage(item.roomId) });
  },

  // 取消收藏
  removeFavorite(e) {
    const roomId = e.currentTarget.dataset.id;
    const app = getApp();
    
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用取消收藏接口
          app.request({
            url: '/favorite/remove',
            method: 'POST',
            data: { roomId: roomId }
          }).then(res => {
            if (res.code === 200) {
              // 从列表中移除
              const favoriteList = this.data.favoriteList;
              const index = favoriteList.findIndex(item => item.roomId === roomId);
              if (index !== -1) {
                favoriteList.splice(index, 1);
                this.setData({
                  favoriteList: favoriteList
                });
              }
              
              wx.showToast({
                title: '已取消收藏',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: res.msg || '取消收藏失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('取消收藏失败:', err);
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 跳转到预订页面
  goToBooking(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/room/detail?id=${id}`
    })
  }
})
