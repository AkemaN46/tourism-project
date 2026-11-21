Page({
  data: {
    totalPoints: 1200,
    pointsHistory: [
      {
        id: 1,
        title: '每日签到奖励',
        points: '+10',
        date: '2024-01-15',
        type: 'earn'
      },
      {
        id: 2,
        title: '消费获得积分',
        points: '+50',
        date: '2024-01-14',
        type: 'earn'
      },
      {
        id: 3,
        title: '兑换礼品',
        points: '-200',
        date: '2024-01-10',
        type: 'consume'
      }
    ]
  },

  onLoad() {
    this.loadPointsData();
  },

  loadPointsData() {
    // 模拟加载积分数据
    this.setData({
      totalPoints: 1200
    });
  },

  // 积分兑换
  exchangePoints() {
    wx.showModal({
      title: '积分兑换',
      content: '跳转到积分商城',
      confirmText: '去兑换',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/profile/points-mall'
          });
        }
      }
    });
  },

  // 查看积分规则
  viewRules() {
    wx.showModal({
      title: '积分规则',
      content: '每消费1元获得1积分，积分可用于兑换礼品',
      showCancel: false
    });
  }
})