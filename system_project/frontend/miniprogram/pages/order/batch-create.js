// 批量创建订单页面
Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    contactName: '',
    contactPhone: '',
    remark: ''
  },

  onLoad() {
    // 从全局变量获取选中的购物车项
    const app = getApp();
    const selectedCartItems = app.globalData.selectedCartItems || [];
    
    if (selectedCartItems.length > 0) {
      this.setData({
        cartItems: selectedCartItems
      });
      
      // 获取详细信息
      this.loadRoomDetails(selectedCartItems);
    }
  },

  // 加载房间详细信息
  loadRoomDetails(selectedCartItems) {
    const app = getApp();
    const promises = selectedCartItems.map(item => {
      return app.request({
        url: `/room/${item.roomId}`,
        method: 'GET'
      });
    });

    Promise.all(promises).then(results => {
      const detailedItems = results.map((res, index) => {
        if (res.code === 200) {
          const item = selectedCartItems[index];
          const room = res.data;
          
          // 计算入住晚数
          const checkIn = new Date(item.checkInDate);
          const checkOut = new Date(item.checkOutDate);
          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          
          return {
            ...item,
            roomName: room.name,
            roomPrice: room.price,
            coverImage: room.coverImage,
            nights: nights,
            total: room.price * nights
          };
        }
        return null;
      }).filter(Boolean);

      // 计算总价
      const totalPrice = detailedItems.reduce((sum, item) => sum + item.total, 0);

      this.setData({
        cartItems: detailedItems,
        totalPrice: totalPrice
      });
    }).catch(err => {
      console.error('加载房间详情失败:', err);
      wx.showToast({
        title: '加载房间详情失败',
        icon: 'none'
      });
    });
  },

  // 输入联系人姓名
  onContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  // 输入手机号码
  onContactPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 立即支付
  payNow() {
    // 验证联系人信息
    const contactName = this.data.contactName.trim();
    const remark = this.data.remark.trim();
    if (!/^[\u4e00-\u9fa5A-Za-z]+(?: [\u4e00-\u9fa5A-Za-z]+)*$/.test(contactName) || contactName.length < 2 || contactName.length > 20) {
      wx.showToast({
        title: '联系人须为2-20个中文、字母或中间空格',
        icon: 'none'
      });
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(this.data.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return;
    }
    if (remark.length > 200) { wx.showToast({ title: '备注不能超过200字', icon: 'none' }); return; }
    
    const app = getApp();
    const orderItems = this.data.cartItems.map(item => ({
      cartId: item.id,
      roomId: item.roomId,
      checkInDate: item.checkInDate,
      checkOutDate: item.checkOutDate,
      contactName,
      contactPhone: this.data.contactPhone,
      remark
    }));

    // 创建订单
    app.request({
      url: '/order/batch-create',
      method: 'POST',
      data: {
        orders: orderItems
      }
    }).then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: '订单创建成功',
          icon: 'success'
        });

        getApp().globalData.selectedCartItems = [];
        setTimeout(() => wx.redirectTo({ url: '/pages/order/list' }), 800);
      } else {
        wx.showToast({
          title: res.msg || '订单创建失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('创建订单失败:', err);
      wx.showToast({
        title: '创建订单失败',
        icon: 'none'
      });
    });
  }
});
