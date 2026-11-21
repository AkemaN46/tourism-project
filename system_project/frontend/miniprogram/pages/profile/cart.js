const dateUtil = require('../../utils/dateUtil');
const imageUtil = require('../../utils/imageUtil');

Page({
  data: {
    cartList: [],
    selectAll: false,
    totalAmount: 0,
    loading: false,
    today: '',
    maxDate: ''
  },

  onLoad() {
    const today = new Date();
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 365);
    this.setData({ today: dateUtil.formatDate(today), maxDate: dateUtil.formatDate(maxDate) });
    // 页面加载时获取购物车列表
    this.getCartList();
  },

  onCheckInChange(e) {
    this.updateDates(Number(e.currentTarget.dataset.index), e.detail.value, null);
  },

  onCheckOutChange(e) {
    this.updateDates(Number(e.currentTarget.dataset.index), null, e.detail.value);
  },

  updateDates(index, checkInValue, checkOutValue) {
    const item = this.data.cartList[index];
    if (!item) return;
    const checkInDate = checkInValue || item.checkInDate;
    const checkOutDate = checkOutValue || item.checkOutDate;
    const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / 86400000);
    if (nights < 1 || nights > 60) {
      wx.showToast({ title: '入住晚数须为1-60晚', icon: 'none' });
      return;
    }
    getApp().request({ url: `/cart/${item.id}`, method: 'PUT', data: { checkInDate, checkOutDate } })
      .then(() => {
        const key = `cartList[${index}]`;
        this.setData({ [key]: { ...item, checkInDate, checkOutDate, nights } });
        this.calculateTotal();
      });
  },
  
  onShow() {
    // 页面显示时获取最新购物车列表
    this.getCartList();
  },

  // 获取购物车列表
  getCartList() {
    const app = getApp();
    
    this.setData({ loading: true });
    
    app.request({
      url: '/cart/list',
      method: 'GET'
    }).then(res => {
      if (res.code === 200) {
        // 处理购物车数据
        const cartList = res.data.map(item => {
          item.coverImage = imageUtil.resolveRoomImage(item.coverImage, item.roomId);
          // 格式化日期
          item.checkInDate = dateUtil.formatDate(new Date(item.checkInDate));
          item.checkOutDate = dateUtil.formatDate(new Date(item.checkOutDate));
          
          // 设置默认选中状态
          item.selected = true;
          
          return item;
        });
        
        this.setData({
          cartList: cartList
        });
        
        // 计算总价
        this.calculateTotal();
      } else {
        wx.showToast({
          title: res.msg || '获取购物车列表失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取购物车列表失败:', err);
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
    const item = this.data.cartList[index];
    if (!item) return;
    this.setData({ [`cartList[${index}].coverImage`]: imageUtil.getFallbackRoomImage(item.roomId) });
  },
  
  // 切换单项选择状态（点击商品项）
  toggleItem(e) {
    const itemId = e.currentTarget.dataset.id;
    console.log('【切换商品】itemId:', itemId);
    
    if (!Array.isArray(this.data.cartList) || this.data.cartList.length === 0) return;

    // 创建新的购物车列表，确保每个对象都是新的引用
    const cartList = this.data.cartList.map(item => {
      if (item.id === itemId) {
        // 返回新对象，切换选中状态
        return { ...item, selected: !item.selected };
      }
      // 其他项也返回新对象，确保引用更新
      return { ...item };
    });
    
    console.log('【新购物车列表】cartList:', cartList);
    
    this.setData({
      cartList: cartList
    });
    
    // 检查是否全选
    const isAllSelected = cartList.every(item => item.selected);
    console.log('【是否全选】isAllSelected:', isAllSelected);
    this.setData({
      selectAll: isAllSelected
    });
    
    // 计算总价
    this.calculateTotal();
  },

  // 选择单项（checkbox 直接点击时触发）
  selectItem(e) {
    // 阻止事件冒泡，避免触发父元素的 toggleItem
    e.stopPropagation();
    
    const itemId = e.detail.value;
    console.log('【选择商品】itemId:', itemId);
    
    if (!Array.isArray(this.data.cartList) || this.data.cartList.length === 0) return;

    // 创建新的购物车列表，确保每个对象都是新的引用
    const cartList = this.data.cartList.map(item => {
      if (item.id === itemId) {
        // 返回新对象，切换选中状态
        return { ...item, selected: !item.selected };
      }
      // 其他项也返回新对象，确保引用更新
      return { ...item };
    });
    
    console.log('【新购物车列表】cartList:', cartList);
    
    this.setData({
      cartList: cartList
    });
    
    // 检查是否全选
    const isAllSelected = cartList.every(item => item.selected);
    console.log('【是否全选】isAllSelected:', isAllSelected);
    this.setData({
      selectAll: isAllSelected
    });
    
    // 计算总价
    this.calculateTotal();
  },

  // 切换全选状态（点击全选区域）
  toggleSelectAll() {
    console.log('【切换全选】当前 selectAll:', this.data.selectAll);
    
    if (!Array.isArray(this.data.cartList)) return;

    // 切换全选状态
    const newSelectAll = !this.data.selectAll;
    console.log('【切换全选】新的 selectAll:', newSelectAll);

    // 创建新的购物车列表，每个对象都返回新引用
    const cartList = this.data.cartList.map(item => ({
      ...item,
      selected: newSelectAll
    }));
    
    console.log('【新购物车列表】cartList:', cartList);
    
    this.setData({
      cartList: cartList,
      selectAll: newSelectAll
    });
    
    // 计算总价
    this.calculateTotal();
  },

  // 全选/取消全选（保留以兼容 checkbox 直接点击）
  selectAllItems(e) {
    const checked = e.detail.value;
    console.log('【全选操作】checked:', checked);
    
    if (!Array.isArray(this.data.cartList)) return;

    // 创建新的购物车列表，每个对象都返回新引用
    const cartList = this.data.cartList.map(item => ({
      ...item,
      selected: checked
    }));
    
    console.log('【新购物车列表】cartList:', cartList);
    
    this.setData({
      cartList: cartList,
      selectAll: checked
    });
    
    // 计算总价
    this.calculateTotal();
  },

  // 从购物车移除
  removeFromCart(e) {
    const id = e.currentTarget.dataset.id;
    const app = getApp();
    
    if (!Array.isArray(this.data.cartList) || this.data.cartList.length === 0) return;

    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      success: (modalRes) => {
        if (modalRes.confirm) {
          // 调用后端接口删除购物车项（使用请求体传递ID，兼容后端 @RequestBody）
          app.request({
            url: '/cart/remove',
            method: 'POST',
            data: { id }
          }).then(removeRes => {
            if (removeRes.code === 200) {
              const cartList = [...this.data.cartList];
              const index = cartList.findIndex(item => item.id === id);
              
              if (index !== -1) {
                cartList.splice(index, 1);
                this.setData({
                  cartList: cartList
                });
                
                // 检查是否全选
                if (cartList.length > 0) {
                  const isAllSelected = cartList.every(item => item.selected);
                  this.setData({
                    selectAll: isAllSelected
                  });
                } else {
                  this.setData({
                    selectAll: false
                  });
                }
                
                // 计算总价
                this.calculateTotal();
                
                wx.showToast({
                  title: '已删除',
                  icon: 'success'
                });
              }
            } else {
              wx.showToast({
                title: removeRes.msg || '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('删除购物车项失败:', err);
            wx.showToast({
              title: '网络错误，请稍后重试',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 计算总价
  calculateTotal() {
    if (!Array.isArray(this.data.cartList) || this.data.cartList.length === 0) {
      this.setData({ totalAmount: 0 });
      return;
    }
  
    const selectedItems = this.data.cartList.filter(item => item.selected);
    console.log('【选中商品】selectedItems:', selectedItems);
      
    const total = selectedItems.reduce((sum, item) => {
      // 使用后端返回的 nights 字段计算总价
      const nights = item.nights || 1;
      return sum + (item.price * nights);
    }, 0);
      
    console.log('【计算总价】total:', total);
      
    this.setData({
      totalAmount: total
    });
  },

  // 去结算
  checkout() {
    const selectedItems = this.data.cartList.filter(item => item.selected);
      
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      });
      return;
    }
      
    // 提取选中的房间 ID 和相关信息
    const selectedRoomIds = selectedItems.map(item => ({
      id: item.id,
      roomId: item.roomId,
      checkInDate: item.checkInDate,
      checkOutDate: item.checkOutDate
    }));
      
    // 存储选中的购物车项到全局变量
    getApp().globalData.selectedCartItems = selectedRoomIds;
      
    // 跳转到批量预订页面
    wx.navigateTo({
      url: '/pages/order/batch-create'
    });
  }
})
