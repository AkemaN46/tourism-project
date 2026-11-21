const dateUtil = require('../../utils/dateUtil');

Page({
  data: {
    room: {},
    roomId: null,
    startDate: '',
    endDate: '',
    nightCount: 1,
    contactName: '',
    contactPhone: '',
    remark: '',
    totalAmount: 0,
    today: '',
    minEndDate: '',
    // 弹窗相关
    showDatePicker: false,
    popupCalendar: [],
    popupCalendarMonth: '',
    currentMonthIndex: 0,
    tempStartDate: '',
    tempEndDate: '',
    tempNightCount: 1,
    // 星期标题
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    // 节假日配置
    holidays: {
      '01-01': '元旦',
      '02-14': '情人节',
      '02-27': '今天',
      '02-28': '明天',
      '03-03': '元宵节',
      '03-08': '妇女节',
      '03-12': '植树节',
      '05-01': '劳动节',
      '06-01': '儿童节',
      '10-01': '国庆节',
      '10-02': '国庆节',
      '10-03': '国庆节',
      '12-25': '圣诞节'
    }
  },

  onLoad(options) {
    if (!getApp().globalData.token) {
      wx.navigateTo({ url: '/pages/login/index' });
      return;
    }
    // 页面加载时执行，可以通过options获取传递的参数
    const roomId = options.roomId;
    if (!roomId) {
      wx.showToast({ title: '房型参数异常', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({
      roomId: parseInt(roomId)
    });
    
    // 获取房型信息
    this.getRoomInfo(parseInt(roomId));
    
    // 初始化日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = dateUtil.formatDate(today);
    const tomorrowStr = dateUtil.formatDate(tomorrow);
    
    this.setData({
      today: todayStr,
      minEndDate: tomorrowStr,
      startDate: todayStr,
      endDate: tomorrowStr
    });
    
    // 计算晚数和总价
    this.calculateNightsAndTotal();
  },

  // 获取房型信息（已优化：层层判空）
  getRoomInfo(roomId) {
    const app = getApp();
    app.request({
      url: `/room/${roomId}`,
      method: 'GET'
    }).then(res => {
      if (res.code === 200 && res.data) {
        this.setData({
          room: res.data
        });
        // 重新计算总价
        this.calculateNightsAndTotal();
      } else {
        wx.showToast({
          title: res.msg || '获取房型信息失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取房型信息失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 关键修改：删除无用的showStartDatePicker和showEndDatePicker方法

  // 入住日期改变
  onStartDateChange(e) {
    const startDate = e.detail.value
    // 确保离店日期不早于入住日期的第二天
    const startDateObj = new Date(startDate)
    const minEndDateObj = new Date(startDateObj)
    minEndDateObj.setDate(minEndDateObj.getDate() + 1)
    
    this.setData({
      startDate: startDate,
      minEndDate: dateUtil.formatDate(minEndDateObj)
    })
    
    // 如果离店日期早于新的最小离店日期，则更新离店日期
    const endDateObj = new Date(this.data.endDate)
    if (endDateObj < minEndDateObj) {
      this.setData({
        endDate: dateUtil.formatDate(minEndDateObj)
      })
    }
    
    // 计算晚数和总价
    this.calculateNightsAndTotal()
  },

  // 计算晚数和总价（已优化：判空room和room.price）
  calculateNightsAndTotal() {
    const { startDate, endDate, room } = this.data;
    // 关键修改：判空处理，避免空指针
    if (!room || !room.price || !startDate || !endDate) {
      this.setData({ nightCount: 0, totalAmount: 0 });
      return;
    }

    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    
    // 计算晚数
    const timeDiff = endDateObj.getTime() - startDateObj.getTime()
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    // 计算总价
    const totalAmount = nights * room.price
    
    this.setData({
      nightCount: nights,
      totalAmount: totalAmount
    })
  },

  // 联系人姓名输入
  onContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    })
  },

  // 联系人手机输入
  onContactPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    })
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交订单
  submitOrder() {
    // 表单验证
    const contactName = this.data.contactName.trim();
    const remark = this.data.remark.trim();
    if (!/^[\u4e00-\u9fa5A-Za-z]+(?: [\u4e00-\u9fa5A-Za-z]+)*$/.test(contactName) || contactName.length < 2 || contactName.length > 20) {
      wx.showToast({
        title: '联系人须为2-20个中文、字母或中间空格',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.contactPhone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(this.data.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }
    if (remark.length > 200) {
      wx.showToast({ title: '备注不能超过200字', icon: 'none' });
      return;
    }
    
    // 提交订单
    wx.showLoading({
      title: '提交中...'
    })
    
    // 只提交用户输入，价格、晚数、订单号和状态均由服务端生成
    const orderData = {
      roomId: this.data.roomId,
      checkInDate: this.data.startDate,
      checkOutDate: this.data.endDate,
      contactName,
      contactPhone: this.data.contactPhone,
      remark
    };
    
    const app = getApp();
    app.request({
      url: '/order/create',
      method: 'POST',
      data: orderData
    }).then(res => {
      wx.hideLoading();
      if (res.code === 200 && res.data) {
        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        });
        
        // 跳转到订单详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order/detail?id=${res.data.id}`
          });
        }, 1500);
      } else {
        wx.showToast({
          title: res.msg || '订单提交失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('提交订单失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    });
  },

  // 显示日期选择弹窗
  showDatePicker() {
    const { startDate, endDate, nightCount } = this.data;
    this.setData({
      showDatePicker: true,
      tempStartDate: startDate,
      tempEndDate: endDate,
      tempStartWeekDay: this.getWeekDay(startDate),
      tempEndWeekDay: this.getWeekDay(endDate),
      tempNightCount: nightCount,
      currentMonthIndex: 0
    });
    this.generatePopupCalendar(0);
  },

  // 隐藏日期选择弹窗
  hideDatePicker() {
    this.setData({
      showDatePicker: false
    });
  },

  // 切换月份
  switchMonth(e) {
    const direction = e.currentTarget.dataset.direction;
    let newIndex = this.data.currentMonthIndex;
    
    if (direction === 'prev' && newIndex > 0) {
      newIndex--;
    } else if (direction === 'next' && newIndex < 12) {
      newIndex++;
    }
    
    this.setData({
      currentMonthIndex: newIndex
    });
    
    this.generatePopupCalendar(newIndex);
  },

  // 生成弹窗日历
  generatePopupCalendar(monthIndex) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 计算目标月份
    const targetMonth = new Date(today);
    targetMonth.setMonth(today.getMonth() + monthIndex);
    
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    this.setData({
      popupCalendarMonth: `${year}年${month + 1}月`
    });
    
    // 获取该月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几（0=周日）
    const startWeekDay = firstDay.getDay();
    
    const calendar = [];
    const basePrice = this.data.room.price || 299;
    const { tempStartDate, tempEndDate } = this.data;
    
    // 添加空白占位
    for (let i = 0; i < startWeekDay; i++) {
      calendar.push({
        isEmpty: true
      });
    }
    
    // 生成当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const dayOfWeek = date.getDay();
      
      // 检查是否是今天之前（禁用）
      const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 365);
      const isBeforeToday = date < today || date > maxDate;
      
      // 检查是否是节假日
      const monthDay = `${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const holidayName = this.data.holidays[monthDay] || '';
      
      // 基础价格
      let price = basePrice;
      
      // 周末价格上浮20%
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        price = Math.round(price * 1.2);
      }
      
      // 计算是否在选中区间内
      let inRange = false;
      let isStartDate = false;
      let isEndDate = false;
      
      if (tempStartDate && tempEndDate) {
        const currentDate = new Date(dateStr);
        currentDate.setHours(0, 0, 0, 0);
        const start = new Date(tempStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(tempEndDate);
        end.setHours(0, 0, 0, 0);
        
        isStartDate = currentDate.getTime() === start.getTime();
        isEndDate = currentDate.getTime() === end.getTime();
        inRange = currentDate > start && currentDate < end;
      } else if (tempStartDate) {
        const currentDate = new Date(dateStr);
        currentDate.setHours(0, 0, 0, 0);
        const start = new Date(tempStartDate);
        start.setHours(0, 0, 0, 0);
        isStartDate = currentDate.getTime() === start.getTime();
      }
      
      calendar.push({
        date: dateStr,
        day: day,
        price: price,
        status: isBeforeToday ? 'full' : 'available',
        holidayName: holidayName,
        inRange: inRange,
        isStartDate: isStartDate,
        isEndDate: isEndDate,
        isEmpty: false
      });
    }
    
    this.setData({
      popupCalendar: calendar
    });
    
    // 计算临时晚数
    this.calculateTempNights();
  },

  // 弹窗中选择日期
  onPopupDateSelect(e) {
    const { date, status, empty } = e.currentTarget.dataset;
    
    // empty 会被转为字符串，需要正确判断
    if (empty === true || empty === 'true' || status === 'full') {
      return;
    }
    
    const { tempStartDate, tempEndDate } = this.data;
    const selectedDate = new Date(date);
    
    // 如果没有选择入住日期，或已经选择完区间，则重新开始
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      this.setData({
        tempStartDate: date,
        tempEndDate: '',
        tempStartWeekDay: this.getWeekDay(date),
        tempEndWeekDay: ''
      });
    } else {
      // 已选择入住日期，现在选择离店日期
      const start = new Date(tempStartDate);
      
      if (selectedDate <= start) {
        // 如果选择的日期早于或等于入住日期，则作为新的入住日期
        this.setData({
          tempStartDate: date,
          tempEndDate: '',
          tempStartWeekDay: this.getWeekDay(date),
          tempEndWeekDay: ''
        });
      } else {
        // 正常设置离店日期
        this.setData({
          tempEndDate: date,
          tempEndWeekDay: this.getWeekDay(date)
        });
      }
    }
    
    // 重新生成日历以更新区间显示
    this.generatePopupCalendar(this.data.currentMonthIndex);
    
    // 计算临时晚数
    this.calculateTempNights();
  },

  // 计算临时晚数
  calculateTempNights() {
    const { tempStartDate, tempEndDate } = this.data;
    
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      this.setData({
        tempNightCount: diffDays
      });
    } else {
      this.setData({
        tempNightCount: 1
      });
    }
  },

  // 确认日期选择
  confirmDateSelection() {
    const { tempStartDate, tempEndDate, tempNightCount } = this.data;
    
    if (!tempStartDate || !tempEndDate) {
      wx.showToast({
        title: '请选择入住和离店日期',
        icon: 'none'
      });
      return;
    }
    if (tempNightCount > 60) {
      wx.showToast({ title: '单笔订单最长可预订60晚', icon: 'none' });
      return;
    }
    
    this.setData({
      startDate: tempStartDate,
      endDate: tempEndDate,
      nightCount: tempNightCount,
      showDatePicker: false
    });
    
    this.calculateNightsAndTotal();
  },

  // 格式化显示日期（MM月DD日）
  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  // 获取星期几（已移至 utils/dateUtil.js）
  getWeekDay(dateStr) {
    return dateUtil.getWeekDay(dateStr);
  },

  // 格式化日期（已移至 utils/dateUtil.js）
  formatDate(date) {
    return dateUtil.formatDate(date);
  }
})
