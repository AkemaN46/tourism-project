Page({
  data: {
    feedbackTypes: [
      { id: 'bug', name: '功能异常', selected: false },
      { id: 'suggest', name: '产品建议', selected: false },
      { id: 'complaint', name: '投诉', selected: false },
      { id: 'other', name: '其他', selected: false }
    ],
    content: '',
    contact: ''
  },

  // 选择反馈类型
  selectType(e) {
    const typeId = e.currentTarget.dataset.id;
    const feedbackTypes = this.data.feedbackTypes.map(type => ({
      ...type,
      selected: type.id === typeId
    }));
    
    this.setData({
      feedbackTypes
    });
  },

  // 输入反馈内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  // 提交反馈
  submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    // 检查是否选择了反馈类型
    const selectedType = this.data.feedbackTypes.find(type => type.selected);
    if (!selectedType) {
      wx.showToast({
        title: '请选择反馈类型',
        icon: 'none'
      });
      return;
    }

    // 这里可以提交反馈到服务器
    wx.showModal({
      title: '提示',
      content: '反馈已提交，感谢您的宝贵意见！',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          // 清空表单
          this.setData({
            content: '',
            contact: '',
            feedbackTypes: this.data.feedbackTypes.map(type => ({
              ...type,
              selected: false
            }))
          });
        }
      }
    });
  }
})