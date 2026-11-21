const imageUtil = require('../../utils/imageUtil');

Page({
  data: { keyword: '', homestays: [], rooms: [], loading: true },
  onLoad(options) { this.setData({ keyword: decodeURIComponent(options.keyword || '') }); this.search(); },
  search() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    this.setData({ loading: true });
    Promise.all([
      getApp().request({ url: '/homestay/list', method: 'GET', data: { keyword, page: 1, size: 20 } }),
      getApp().request({ url: '/room/search', method: 'GET', data: { keyword, page: 1, size: 20 } })
    ]).then(([homestayRes, roomRes]) => this.setData({
      homestays: (homestayRes.data.list || []).map(imageUtil.normalizeRoomImage),
      rooms: (roomRes.data.list || []).map(imageUtil.normalizeRoomImage)
    })).finally(() => this.setData({ loading: false }));
  },
  openHomestay(e) { wx.navigateTo({ url: `/pages/homestay/detail?id=${e.currentTarget.dataset.id}` }); },
  openRoom(e) { wx.navigateTo({ url: `/pages/room/detail?id=${e.currentTarget.dataset.id}` }); }
});
