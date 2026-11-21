const imageUtil = require('../../utils/imageUtil');

Page({
  data: { item: null },
  onLoad(options) {
    if (!options.id) { wx.showToast({ title: '民宿参数缺失', icon: 'none' }); return; }
    getApp().request({ url: `/homestay/${options.id}`, method: 'GET' }).then(res => {
      const item = imageUtil.normalizeRoomImage(res.data);
      this.setData({ item }); wx.setNavigationBarTitle({ title: item.name || '民宿详情' });
    });
  },
  viewRooms() {
    if (!this.data.item) return;
    wx.navigateTo({ url: `/pages/room/list?homestayId=${this.data.item.id}` });
  }
});
