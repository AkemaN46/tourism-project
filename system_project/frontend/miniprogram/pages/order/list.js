// list.js
const orderUtil = require('../../utils/orderUtil');

Page({
  data: {
    currentStatus: '',
    orderList: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    // 确保页面加载时重置状态和数据
    this.setData({
      currentStatus: '',
      page: 1,
      orderList: [],
      hasMore: true
    });
    this.getOrderList();
  },

  onShow() {
    console.log('=== 订单列表页面刷新 ===');
    // 页面显示时刷新订单列表（处理评价后返回的情况）
    this.setData({
      page: 1,
      orderList: [],
      hasMore: true
    });
    this.getOrderList();
  },

  // 切换订单状态
  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    console.log('切换状态:', status, '类型:', typeof status);
    
    // 重置分页和列表数据
    this.setData({
      currentStatus: status,
      page: 1,
      orderList: [],
      hasMore: true
    })
    
    // 重新加载对应状态的订单列表
    this.getOrderList()
  },

  // 获取订单列表
  getOrderList() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      loading: true
    });
    
    const app = getApp();
    
    // 构建请求参数
    let params = `page=${this.data.page}&size=${this.data.size}`;
    if (this.data.currentStatus !== '') {
      params += `&status=${this.data.currentStatus}`;
    }
        
    console.log('当前状态:', this.data.currentStatus);
    console.log('请求参数:', params);
    
    app.request({
      url: `/order/list?${params}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        // 当 page 为 0 时，说明是首次加载或切换状态，应替换而不是追加数据
        const newData = this.data.page === 1 ? res.data.list : [...this.data.orderList, ...res.data.list];
            
        // 使用工具函数格式化日期和确保 reviewed 字段存在
        const formattedData = orderUtil.formatOrderDates(newData);
            
        this.setData({
          orderList: formattedData,
          hasMore: res.data.list.length === this.data.size
        });
            
        console.log('订单列表数据:', this.data.orderList);
        
        // 调试：检查每个订单的 reviewed 状态
        this.data.orderList.forEach((order, index) => {
          if (order.status === 3) {  // 已完成的订单
            console.log(`订单${index + 1}:`, {
              id: order.id,
              orderNo: order.orderNo,
              status: order.status,
              reviewed: order.reviewed,
              hasReviewButton: order.status === 3 && !order.reviewed
            });
          }
        });
      } else {
        wx.showToast({
          title: res.msg || '获取订单列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取订单列表失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({
        loading: false
      });
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.getOrderList();
    wx.stopPullDownRefresh();
  },

  // 上拉加载
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.getOrderList();
    }
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

  // 跳转到订单详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order/detail?id=${id}`
    })
  },

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
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
            url: `/order/${id}/cancel`,
            method: 'PUT',
            data: { reason: '用户取消' }
          }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              
              // 重新加载订单列表
              this.setData({
                page: 1,
                orderList: []
              });
              this.getOrderList();
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
  payOrder(e) {
    const id = e.currentTarget.dataset.id
    const app = getApp()
    
    wx.showLoading({
      title: '正在支付...'
    })
    
    // 调用后端API更新订单状态
    app.request({
      url: `/order/${id}/status`,
      method: 'PUT',
      data: { status: 1 }
    }).then(res => {
      wx.hideLoading()
      if (res.code === 200) {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })
        
        // 更新本地订单状态
        const orderList = this.data.orderList
        const index = orderList.findIndex(item => item.id === id)
        if (index !== -1) {
          orderList[index].status = 1
          orderList[index].paymentTime = new Date().toISOString()
          this.setData({
            orderList: orderList
          })
        }
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
  reviewOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order/detail?id=${id}&tab=review`
    })
  },

  onRoomImageError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const order = this.data.orderList[index];
    if (!order) return;
    this.setData({
      [`orderList[${index}].roomImage`]: require('../../utils/imageUtil').getFallbackRoomImage(order.roomId)
    });
  }
})
