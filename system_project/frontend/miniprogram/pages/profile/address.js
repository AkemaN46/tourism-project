Page({
  data: {
    addresses: [
      {
        id: 1,
        name: '张三',
        phone: '138****8888',
        address: '北京市朝阳区某某街道123号',
        isDefault: true
      },
      {
        id: 2,
        name: '李四',
        phone: '139****9999',
        address: '上海市浦东新区某某路456号',
        isDefault: false
      }
    ]
  },

  onLoad() {
    this.loadAddresses();
  },

  loadAddresses() {
    // 模拟加载地址数据
    this.setData({
      addresses: [
        {
          id: 1,
          name: '张三',
          phone: '138****8888',
          address: '北京市朝阳区某某街道123号',
          isDefault: true
        },
        {
          id: 2,
          name: '李四',
          phone: '139****9999',
          address: '上海市浦东新区某某路456号',
          isDefault: false
        }
      ]
    });
  },

  // 添加新地址
  addAddress() {
    wx.navigateTo({
      url: '/pages/profile/add-address'
    });
  },

  // 编辑地址
  editAddress(e) {
    const addressId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/profile/edit-address?id=${addressId}`
    });
  },

  // 设为默认地址
  setDefault(e) {
    const addressId = e.currentTarget.dataset.id;
    let addresses = this.data.addresses;
    addresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id == addressId
    }));
    
    this.setData({
      addresses
    });
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    });
  }
})