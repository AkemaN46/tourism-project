const imageUtil = require('../../utils/imageUtil');

Page({
  data: {
    list: [], loading: false, keyword: '',
    loadError: false, errorMessage: ''
  },
  // tabBar 页面会被微信缓存，不能只依赖首次 onLoad。
  // 每次用户进入“民宿”页都刷新第一页，避免首次请求失败后一直显示空列表。
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
  onInput(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() { return this.load(); },
  retry() { return this.load(); },
  load() {
    if (this.data.loading) return Promise.resolve();
    this.setData({ loading: true, loadError: false, errorMessage: '' });
    const keyword = String(this.data.keyword || '').trim();
    const requestData = {
      page: 1,
      size: 50,
      status: 1
    };
    // wx.request 在部分基础库中会把 undefined 序列化为字符串，
    // 导致后端按关键字 "undefined" 查询并返回空列表。
    if (keyword) requestData.keyword = keyword;
    return getApp().request({
      url: '/homestay/list', method: 'GET',
      data: requestData
    }).then(res => {
      // 同时兼容 V1.1 的 data.list、旧版 Spring Page 的 data.content，
      // 以及测试环境中直接返回数组的形式。
      const payload = res && res.data !== undefined ? res.data : res;
      const source = Array.isArray(payload)
        ? payload
        : (payload && (payload.list || payload.content || payload.records));
      if (!Array.isArray(source)) {
        throw new Error('民宿列表响应结构不正确');
      }
      const rows = source.map(item => imageUtil.normalizeRoomImage(item));
      this.setData({
        list: rows,
        loadError: false,
        errorMessage: ''
      });
    }).catch(err => {
      console.error('加载民宿列表失败:', err);
      const message = err && err.errMsg && err.errMsg.indexOf('timeout') >= 0
        ? '请求超时，请确认后端服务已启动'
        : '无法连接民宿服务，请确认后端已启动';
      this.setData({ list: [], loadError: true, errorMessage: message });
    }).finally(() => this.setData({ loading: false }));
  },
  onImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.list[index];
    if (!item) return;
    this.setData({ [`list[${index}].coverImage`]: imageUtil.getFallbackRoomImage(item.id) });
  },
  open(e) { wx.navigateTo({ url: `/pages/homestay/detail?id=${e.currentTarget.dataset.id}` }); }
});
