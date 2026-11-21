// detail.js
const orderUtil = require('../../utils/orderUtil');

Page({
  data: {
    order: {}
  },

  onLoad(options) {
    // 页面加载时执行，可以通过options获取传递的参数
    const orderId = options.id;
    
    this.getOrderDetail(parseInt(orderId));
  },

  // 获取订单详情
  getOrderDetail(id) {
    const app = getApp();
    app.request({
      url: `/order/${id}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        // 使用工具函数格式化日期
        const orderData = orderUtil.formatSingleOrderDate(res.data);
        
        this.setData({
          order: orderData
        });
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

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      0: '待支付',
      1: '已支付',
      2: '已入住',
      3: '已完成',
      4: '已取消'
    }
    return statusMap[status] || '未知'
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      0: 'info',
      1: 'warning',
      2: 'primary',
      3: 'success',
      4: 'danger'
    }
    return classMap[status] || 'info'
  },

  // 获取状态描述
  getStatusDesc(status) {
    const descMap = {
      0: '请在30分钟内完成支付，超时订单将自动取消',
      1: '我们已收到您的付款，正在为您准备房间',
      2: '您已成功入住，祝您居住愉快',
      3: '订单已完成，期待您的再次光临',
      4: '订单已取消'
    }
    return descMap[status] || ''
  },

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '取消中...'
          });
          
          const app = getApp();
          app.request({
            url: `/order/${this.data.order.id}/cancel`,
            method: 'PUT',
            data: { reason: '用户取消' }
          }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              
              // 重新获取订单详情
              this.getOrderDetail(this.data.order.id);
            } else {
              wx.showToast({
                title: res.msg || '取消订单失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('取消订单失败:', err);
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 去支付
  payOrder() {
    const app = getApp()
    
    wx.showLoading({
      title: '正在支付...'
    })
    
    // 调用后端API更新订单状态
    app.request({
      url: `/order/${this.data.order.id}/status`,
      method: 'PUT',
      data: { status: 1 }
    }).then(res => {
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })
        
        // 更新订单状态
        this.setData({
          'order.status': 1,
          'order.paymentTime': this.formatTime(new Date())
        })
      } else {
        wx.showToast({
          title: res.msg || '支付失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('支付失败:', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
  },

  // 去评价
  goToReview() {
    console.log('跳转到评价页面，订单ID:', this.data.order.id);
    // 跳转到评价页面
    wx.navigateTo({
      url: `/pages/order/review?id=${this.data.order.id}`
    })
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
  }
})