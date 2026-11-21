<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon income">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日收入</div>
              <div class="stat-value" v-loading="statsLoading">¥{{ formatAmount(stats.todayIncome) }}</div>
              <div class="stat-trend" v-if="stats.incomeTrend">
                <span :class="stats.incomeTrend >= 0 ? 'positive' : 'negative'">
                  {{ stats.incomeTrend >= 0 ? '+' : '' }}{{ stats.incomeTrend }}%
                </span> 昨日
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orders">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日订单</div>
              <div class="stat-value" v-loading="statsLoading">{{ stats.todayOrders }}</div>
              <div class="stat-trend" v-if="stats.orderTrend">
                <span :class="stats.orderTrend >= 0 ? 'positive' : 'negative'">
                  {{ stats.orderTrend >= 0 ? '+' : '' }}{{ stats.orderTrend }}%
                </span> 昨日
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <i class="el-icon-user"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">新增用户</div>
              <div class="stat-value" v-loading="statsLoading">{{ stats.todayUsers }}</div>
              <div class="stat-trend" v-if="stats.userTrend">
                <span :class="stats.userTrend >= 0 ? 'positive' : 'negative'">
                  {{ stats.userTrend >= 0 ? '+' : '' }}{{ stats.userTrend }}%
                </span> 昨日
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon occupancy">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">入住率</div>
              <div class="stat-value" v-loading="statsLoading">{{ stats.occupancyRate }}%</div>
              <div class="stat-trend" v-if="stats.occupancyRate >= 70">
                <span class="positive">良好</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>收入趋势（最近7天）</span>
            <el-radio-group v-model="incomePeriod" size="mini" @change="fetchIncomeData" class="period-select">
              <el-radio-button label="7day">近7天</el-radio-button>
              <el-radio-button label="30day">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div v-loading="incomeLoading" ref="incomeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>房型占比</span>
          </div>
          <div v-loading="roomTypeLoading" ref="roomTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="tables-row">
      <el-col :span="12">
        <el-card class="table-card">
          <div slot="header" class="table-header">
            <span>最新订单</span>
            <el-button type="text" @click="goToOrderList">查看更多</el-button>
          </div>
          <el-table :data="latestOrders" style="width: 100%" v-loading="ordersLoading">
            <el-table-column prop="orderNo" label="订单号" width="150"></el-table-column>
            <el-table-column prop="roomName" label="房型"></el-table-column>
            <el-table-column prop="contactName" label="联系人"></el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template slot-scope="scope">
                ¥{{ formatAmount(scope.row.totalAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template slot-scope="scope">
                <el-tag size="small" :type="getOrderStatusType(scope.row.status)">
                  {{ getOrderStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="table-card">
          <div slot="header" class="table-header">
            <span>待处理事项</span>
            <el-button type="text" @click="refreshTasks">刷新</el-button>
          </div>
          <el-table :data="pendingTasks" style="width: 100%" v-loading="tasksLoading">
            <el-table-column prop="type" label="类型" width="100">
              <template slot-scope="scope">
                <el-tag size="small" :type="scope.row.type === '订单' ? 'warning' : 'info'">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容"></el-table-column>
            <el-table-column prop="time" label="时间" width="150">
              <template slot-scope="scope">
                {{ formatTime(scope.row.time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button 
                  v-if="scope.row.actionUrl" 
                  type="text" 
                  size="mini"
                  @click="handleTaskAction(scope.row)">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import request from '@/utils/request'

export default {
  name: 'Dashboard',
  data() {
    return {
      // 统计数据
      stats: {
        todayIncome: 0,
        todayOrders: 0,
        todayUsers: 0,
        occupancyRate: 0,
        incomeTrend: 0,
        orderTrend: 0,
        userTrend: 0
      },
      statsLoading: false,
      
      // 图表数据
      incomePeriod: '7day',
      incomeLoading: false,
      roomTypeLoading: false,
      
      // 表格数据
      latestOrders: [],
      pendingTasks: [],
      ordersLoading: false,
      tasksLoading: false,
      
      // 图表实例
      incomeChart: null,
      roomTypeChart: null
    }
  },
  mounted() {
    this.initCharts()
    this.fetchDashboardData()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.incomeChart) {
      this.incomeChart.dispose()
    }
    if (this.roomTypeChart) {
      this.roomTypeChart.dispose()
    }
  },
  methods: {
    async fetchDashboardData() {
      try {
        // 获取统计数据
        this.statsLoading = true
        const statsRes = await request.get('/dashboard/stats')
        if (statsRes.data.code === 200) {
          this.stats = statsRes.data.data
        } else {
          this.$message.error(statsRes.data.msg || '获取统计数据失败')
        }
        this.statsLoading = false
        
        // 获取最新订单
        this.fetchLatestOrders()
        
        // 获取待处理事项
        this.fetchPendingTasks()
        
        // 获取图表数据
        this.fetchIncomeData()
        this.fetchRoomTypeData()
        
      } catch (error) {
        console.error('获取Dashboard数据失败:', error)
        this.$message.error('获取数据失败')
        this.statsLoading = false
      }
    },
    
    async fetchLatestOrders() {
      try {
        this.ordersLoading = true
        const ordersRes = await request.get('/order/list', {
          params: {
            page: 1,
            size: 5
          }
        })
        if (ordersRes.data.code === 200) {
          this.latestOrders = ordersRes.data.data.list || []
        } else {
          this.$message.error(ordersRes.data.msg || '获取最新订单失败')
        }
        this.ordersLoading = false
      } catch (error) {
        console.error('获取最新订单失败:', error)
        this.ordersLoading = false
      }
    },
    
    async fetchPendingTasks() {
      try {
        this.tasksLoading = true
        const tasks = []
        
        // 获取待支付订单
        const pendingOrdersRes = await request.get('/order/list', {
          params: {
            status: 0, // 待支付
            page: 1,
            size: 3
          }
        })
        
        if (pendingOrdersRes.data.code === 200 && pendingOrdersRes.data.data.list) {
          pendingOrdersRes.data.data.list.forEach(order => {
            tasks.push({
              type: '订单',
              content: `订单 ${order.orderNo} 待支付`,
              time: order.createdAt,
              actionUrl: '/order/list'
            })
          })
        }
        
        // 获取待审核评价
        const pendingReviewsRes = await request.get('/review/list', {
          params: {
            status: 0, // 待审核
            page: 1,
            size: 3
          }
        })
        
        if (pendingReviewsRes.data.code === 200 && pendingReviewsRes.data.data.list) {
          pendingReviewsRes.data.data.list.forEach(review => {
            tasks.push({
              type: '评价',
              content: `用户 ${review.userName || '匿名'} 的评价待审核`,
              time: review.createdAt,
              actionUrl: '/review/list'
            })
          })
        }
        
        // 如果没有任务，显示提示
        if (tasks.length === 0) {
          tasks.push({
            type: '提示',
            content: '暂无待处理事项',
            time: new Date().toISOString(),
            actionUrl: null
          })
        }
        
        this.pendingTasks = tasks
        this.tasksLoading = false
        
      } catch (error) {
        console.error('获取待处理事项失败:', error)
        this.tasksLoading = false
      }
    },
    
    async fetchIncomeData() {
      try {
        this.incomeLoading = true
        const res = await request.get('/dashboard/income-trend', {
          params: { period: this.incomePeriod }
        })
        
        if (res.data.code === 200) {
          this.updateIncomeChart(res.data.data)
        } else {
          this.$message.error(res.data.msg || '获取收入数据失败')
        }
        this.incomeLoading = false
        
      } catch (error) {
        console.error('获取收入数据失败:', error)
        this.incomeLoading = false
      }
    },
    
    async fetchRoomTypeData() {
      try {
        this.roomTypeLoading = true
        const res = await request.get('/dashboard/room-type-distribution')
        
        if (res.data.code === 200) {
          this.updateRoomTypeChart(res.data.data)
        } else {
          this.$message.error(res.data.msg || '获取房型数据失败')
        }
        this.roomTypeLoading = false
        
      } catch (error) {
        console.error('获取房型数据失败:', error)
        this.roomTypeLoading = false
      }
    },
    
    initCharts() {
      // 收入趋势图表
      this.incomeChart = echarts.init(this.$refs.incomeChart)
      
      // 房型占比图表
      this.roomTypeChart = echarts.init(this.$refs.roomTypeChart)
    },
    
    updateIncomeChart(data) {
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>¥{c}'
        },
        xAxis: {
          type: 'category',
          data: data.dates || [],
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        series: [{
          name: '收入',
          type: 'line',
          smooth: true,
          data: data.values ? data.values.map(v => v || 0) : [],
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        }]
      }
      
      if (this.incomeChart) {
        this.incomeChart.setOption(option)
        // 窗口大小变化时重新渲染图表
        window.addEventListener('resize', () => {
          this.incomeChart.resize()
        })
      }
    },
    
    updateRoomTypeChart(data) {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          bottom: 'bottom',
          itemWidth: 12,
          itemHeight: 12
        },
        series: [{
          name: '房型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data || []
        }]
      }
      
      if (this.roomTypeChart) {
        this.roomTypeChart.setOption(option)
        // 窗口大小变化时重新渲染图表
        window.addEventListener('resize', () => {
          this.roomTypeChart.resize()
        })
      }
    },
    
    getOrderStatusType(status) {
      const statusMap = {
        0: 'info',     // 待支付
        1: 'warning',  // 已支付
        2: 'primary',  // 已入住
        3: 'success',  // 已完成
        4: 'danger'    // 已取消
      }
      return statusMap[status] || 'info'
    },
    
    getOrderStatusText(status) {
      const statusMap = {
        0: '待支付',
        1: '已支付',
        2: '已入住',
        3: '已完成',
        4: '已取消'
      }
      return statusMap[status] || '未知'
    },
    
    formatAmount(amount) {
      if (!amount) return '0.00'
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
    },
    
    formatTime(time) {
      if (!time) return '--'
      const date = new Date(time)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    goToOrderList() {
      this.$router.push('/order/list')
    },
    
    refreshTasks() {
      this.fetchPendingTasks()
    },
    
    handleTaskAction(task) {
      if (task.actionUrl) {
        this.$router.push(task.actionUrl)
      }
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: #fff;
}

.stat-icon.income {
  background-color: #409EFF;
}

.stat-icon.orders {
  background-color: #67C23A;
}

.stat-icon.users {
  background-color: #E6A23C;
}

.stat-icon.occupancy {
  background-color: #F56C6C;
}

.stat-info .stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-info .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-info .stat-trend {
  font-size: 12px;
  color: #909399;
}

.stat-trend .positive {
  color: #67C23A;
}

.stat-trend .negative {
  color: #F56C6C;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card, .table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-header, .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #303133;
}

.period-select {
  float: right;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.tables-row {
  margin-bottom: 20px;
}

.tables-row .el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-card .table-header {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stats-row .el-col {
    margin-bottom: 20px;
  }
  
  .charts-row .el-col {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .tables-row .el-col {
    width: 100%;
    margin-bottom: 20px;
  }
}
</style>
