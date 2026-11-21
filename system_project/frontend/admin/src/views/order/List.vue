<template>
  <div class="order-list-container">
    <!-- 筛选卡片 -->
    <el-card class="filter-card">
      <div slot="header" class="filter-header">
        <span class="filter-title">筛选条件</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="订单号">
          <el-input 
            v-model="filterForm.orderNo" 
            placeholder="请输入订单号" 
            class="form-input"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input 
            v-model="filterForm.contactName" 
            placeholder="请输入联系人" 
            class="form-input"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态" 
            class="form-select"
            clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="待支付" value="0"></el-option>
            <el-option label="已支付" value="1"></el-option>
            <el-option label="已入住" value="2"></el-option>
            <el-option label="已完成" value="3"></el-option>
            <el-option label="已取消" value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button type="primary" @click="search" icon="el-icon-search">查询</el-button>
          <el-button @click="reset" icon="el-icon-refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 表格卡片 -->
    <el-card class="table-card">
      <div slot="header" class="table-header">
        <span class="table-title">订单列表</span>
        <span class="table-total">共 {{ pagination.total }} 条记录</span>
      </div>
      
      <el-table 
        :data="orderList" 
        v-loading="loading" 
        style="width: 100%"
        :header-cell-style="{background: '#f8f9fa', color: '#333', fontWeight: 600}"
        :cell-style="{padding: '12px 0'}"
        row-class-name="table-row"
        stripe
        border>
        <!-- 重新分配列宽，确保没有空白列 -->
        <el-table-column prop="orderNo" label="订单号" width="140" align="center"></el-table-column>
        <el-table-column prop="roomName" label="房型" width="130" align="center"></el-table-column>
        <el-table-column prop="contactName" label="联系人" width="100" align="center"></el-table-column>
        <el-table-column label="入住时间" width="200" align="center">
          <template slot-scope="scope">
            <div class="checkin-info">
              <div class="checkin-date">{{ formatDate(scope.row.checkInDate) }}</div>
              <div class="checkin-arrow">→</div>
              <div class="checkout-date">{{ formatDate(scope.row.checkOutDate) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="nights" label="晚数" width="80" align="center">
          <template slot-scope="scope">
            <el-tag size="small" type="info" effect="light" class="nights-badge">
              {{ scope.row.nights || 0 }}晚
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总价" width="110" align="center">
          <template slot-scope="scope">
            <span class="total-amount">¥{{ formatAmount(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="getOrderStatusType(scope.row.status)" 
              size="small" 
              effect="light"
              class="status-tag">
              {{ getOrderStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 移除fixed="right"属性，这会导致额外的空白列 -->
        <el-table-column 
          label="操作" 
          width="240" 
          header-align="center"
          align="center"
          class-name="action-column">
          <template slot-scope="scope">
            <div class="order-actions">
              <el-button size="mini" type="info" @click="handleView(scope.row)" plain class="action-btn">查看</el-button>
              <el-button 
                v-if="scope.row.status === 0" 
                size="mini" 
                type="success" 
                @click="handleConfirm(scope.row)"
                class="action-btn">
                确认
              </el-button>
              <el-button 
                v-if="scope.row.status === 1" 
                size="mini" 
                type="primary" 
                @click="handleCheckIn(scope.row)"
                class="action-btn">
                入住
              </el-button>
              <el-button 
                v-if="scope.row.status === 2" 
                size="mini" 
                type="success" 
                @click="handleComplete(scope.row)"
                class="action-btn">
                完成
              </el-button>
              <el-button 
                v-if="[0, 1, 2].includes(scope.row.status)" 
                size="mini" 
                type="danger" 
                @click="handleCancel(scope.row)"
                class="action-btn">
                取消
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          background>
        </el-pagination>
      </div>
    </el-card>
    
    <!-- 订单详情对话框 -->
    <el-dialog 
      title="订单详情" 
      :visible.sync="detailDialogVisible" 
      width="700px"
      custom-class="custom-dialog"
      :close-on-click-modal="false"
      center>
      <div v-if="currentOrder" class="order-detail">
        <el-row :gutter="24" class="order-detail-header">
          <el-col :span="14">
            <div class="order-info">
              <h3 class="order-no">{{ currentOrder.orderNo }}</h3>
              <el-tag :type="getOrderStatusType(currentOrder.status)" size="medium" class="status-tag-lg">
                {{ getOrderStatusText(currentOrder.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="10" class="text-right">
            <div class="order-amount">
              <div class="amount-label">订单金额</div>
              <div class="amount-value">¥{{ formatAmount(currentOrder.totalAmount) }}</div>
            </div>
          </el-col>
        </el-row>
        
        <el-divider></el-divider>
        
        <el-row :gutter="24" class="detail-section">
          <el-col :span="12">
            <h4 class="section-title">入住信息</h4>
            <div class="detail-item">
              <span class="detail-label">房型：</span>
              <span class="detail-value">{{ currentOrder.roomName || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">入住时间：</span>
              <span class="detail-value">{{ formatDate(currentOrder.checkInDate) }} 至 {{ formatDate(currentOrder.checkOutDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">晚数：</span>
              <span class="detail-value">{{ currentOrder.nights || 0 }}晚</span>
            </div>
          </el-col>
          <el-col :span="12">
            <h4 class="section-title">联系人信息</h4>
            <div class="detail-item">
              <span class="detail-label">姓名：</span>
              <span class="detail-value">{{ currentOrder.contactName || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">电话：</span>
              <span class="detail-value">{{ currentOrder.contactPhone || '未知' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="24" class="detail-section">
          <el-col :span="24">
            <h4 class="section-title">价格明细</h4>
            <div class="price-detail">
              <div class="price-item">
                <span>房费（¥{{ formatAmount(currentOrder.price || 0) }}/晚 × {{ currentOrder.nights || 0 }}晚）</span>
                <span>¥{{ formatAmount(currentOrder.totalAmount) }}</span>
              </div>
              <el-divider></el-divider>
              <div class="price-total">
                <span>实付金额</span>
                <span class="total-amount">¥{{ formatAmount(currentOrder.realAmount || currentOrder.totalAmount) }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="24" class="detail-section">
          <el-col :span="24">
            <h4 class="section-title">其他信息</h4>
            <div class="detail-item">
              <span class="detail-label">下单时间：</span>
              <span class="detail-value">{{ formatDatetime(currentOrder.createdAt) }}</span>
            </div>
            <div class="detail-item" v-if="currentOrder.paymentMethod">
              <span class="detail-label">支付方式：</span>
              <span class="detail-value">{{ getPaymentMethodText(currentOrder.paymentMethod) }}</span>
            </div>
            <div class="detail-item" v-if="currentOrder.paymentTime">
              <span class="detail-label">支付时间：</span>
              <span class="detail-value">{{ formatDatetime(currentOrder.paymentTime) }}</span>
            </div>
            <div class="detail-item" v-if="currentOrder.completedTime">
              <span class="detail-label">完成时间：</span>
              <span class="detail-value">{{ formatDatetime(currentOrder.completedTime) }}</span>
            </div>
            <div class="detail-item" v-if="currentOrder.cancelReason">
              <span class="detail-label">取消原因：</span>
              <span class="detail-value">{{ currentOrder.cancelReason }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ currentOrder.remark || '无' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false" type="primary">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'OrderList',
  data() {
    return {
      filterForm: {
        orderNo: '',
        contactName: '',
        status: ''
      },
      orderList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      detailDialogVisible: false,
      currentOrder: null
    }
  },
  methods: {
    search() {
      this.pagination.currentPage = 1
      this.fetchOrderList()
    },
    
    reset() {
      this.filterForm = {
        orderNo: '',
        contactName: '',
        status: ''
      }
      this.search()
    },
    
    fetchOrderList() {
      this.loading = true
      const params = {
        page: this.pagination.currentPage,
        size: this.pagination.pageSize,
        orderNo: this.filterForm.orderNo || undefined,
        contactName: this.filterForm.contactName || undefined,
        status: this.filterForm.status || undefined
      }
      
      console.log('请求订单列表参数:', params)
      
      // 修改：移除userId header，让后端返回所有订单
      request.get('/order/list', { params })
        .then(response => {
          console.log('订单列表响应:', response)
          const data = response.data
          if (data.code === 200) {
            this.orderList = data.data.list
            this.pagination.total = data.data.total
            console.log('订单列表数据:', this.orderList)
          } else {
            this.$message.error(data.msg || '获取订单列表失败')
          }
        })
        .catch(error => {
          console.error('获取订单列表失败:', error)
          this.$message.error('获取订单列表失败: ' + error.message)
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    handleView(row) {
      this.currentOrder = row
      this.detailDialogVisible = true
    },
    
    handleConfirm(row) {
      this.$confirm('确定要确认该订单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API更新状态
        request.put(`/order/${row.id}/status`, { status: 1 })
          .then(response => {
            if (response.data.code === 200) {
              row.status = 1
              this.$message.success('订单已确认')
              this.fetchOrderList() // 重新加载列表
            } else {
              this.$message.error(response.data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('确认订单失败:', error)
            this.$message.error('确认订单失败: ' + error.message)
          })
      })
    },
    
    handleCheckIn(row) {
      this.$confirm('确定要办理入住吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API更新状态
        request.put(`/order/${row.id}/status`, { status: 2 })
          .then(response => {
            if (response.data.code === 200) {
              row.status = 2
              this.$message.success('入住手续已办理')
              this.fetchOrderList() // 重新加载列表
            } else {
              this.$message.error(response.data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('办理入住失败:', error)
            this.$message.error('办理入住失败: ' + error.message)
          })
      })
    },
    
    handleComplete(row) {
      this.$confirm('确定要完成该订单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API更新状态
        request.put(`/order/${row.id}/status`, { status: 3 })
          .then(response => {
            if (response.data.code === 200) {
              row.status = 3
              this.$message.success('订单已完成')
              this.fetchOrderList() // 重新加载列表
            } else {
              this.$message.error(response.data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('完成订单失败:', error)
            this.$message.error('完成订单失败: ' + error.message)
          })
      })
    },
    
    // 新增：取消订单方法
    handleCancel(row) {
      this.$prompt('请输入取消原因', '取消订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '取消原因不能为空'
      }).then(({ value }) => {
        // 调用后端API取消订单
        request.put(`/order/${row.id}/cancel`, { reason: value })
          .then(response => {
            if (response.data.code === 200) {
              row.status = 4
              this.$message.success('订单已取消')
              this.fetchOrderList() // 重新加载列表
            } else {
              this.$message.error(response.data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('取消订单失败:', error)
            this.$message.error('取消订单失败: ' + error.message)
          })
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    getOrderStatusType(status) {
      const statusMap = {
        0: 'info',    // 待支付
        1: 'warning', // 已支付
        2: 'primary', // 已入住
        3: 'success', // 已完成
        4: 'danger'   // 已取消
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
    
    // 新增：获取支付方式文本
    getPaymentMethodText(method) {
      const methodMap = {
        'wxpay': '微信支付',
        'alipay': '支付宝',
        'balance': '余额支付'
      }
      return methodMap[method] || method || '未知'
    },
    
    formatDate(date) {
      if (!date) return '未知'
      // 如果是Date对象或字符串，提取日期部分
      const dateStr = date.toString()
      return dateStr.split(' ')[0]
    },
    
    // 新增：格式化完整时间
    formatDatetime(datetimeStr) {
      if (!datetimeStr) return '未知'
      const date = new Date(datetimeStr)
      if (isNaN(date.getTime())) return '格式错误'
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
    },
    
    formatAmount(amount) {
      if (!amount) return '0.00'
      // 如果是字符串，转换为数字
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return num.toFixed(2)
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchOrderList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchOrderList()
    }
  },
  created() {
    this.fetchOrderList()
  }
}
</script>

<style scoped>
/* 页面容器 */
.order-list-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: box-shadow 0.3s ease;
}

.filter-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.filter-header {
  display: flex;
  align-items: center;
}

.filter-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

/* 表单元素 */
.form-input, .form-select {
  width: 200px;
}

::v-deep .form-input .el-input__inner,
::v-deep .form-select .el-input__inner {
  border-radius: 6px;
  border: 1px solid #e6e8eb;
  height: 36px;
  padding: 0 12px;
  transition: all 0.2s ease;
}

::v-deep .form-input .el-input__inner:focus,
::v-deep .form-select .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-actions {
  margin-left: 16px;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.table-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-total {
  font-size: 14px;
  color: #909399;
}

/* 表格样式 */
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa !important;
}

/* 入住时间列 */
.checkin-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  gap: 8px;
}

.checkin-date, .checkout-date {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.checkin-arrow {
  color: #c0c4cc;
  font-size: 12px;
}

/* 标签样式 */
.nights-badge {
  border-radius: 20px;
  background-color: #ecf5ff;
  border: none;
  font-size: 13px;
  padding: 2px 8px;
}

.status-tag {
  border-radius: 20px;
  font-size: 13px;
  padding: 2px 8px;
}

.total-amount {
  font-weight: 600;
  color: #f56c6c;
  font-size: 14px;
}

/* 操作列样式 - 更紧凑的布局 */
.order-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 5px;
  min-height: 32px;
}

.action-btn {
  flex: 0 0 auto;
  min-width: 50px;
  height: 26px;
  padding: 4px 6px;
  font-size: 11px;
  line-height: 18px;
  border-radius: 4px;
  white-space: nowrap;
  margin: 0;
}

/* 分页样式 */
.pagination-container {
  margin-top: 0;
  padding: 16px 20px;
  background-color: #fff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  justify-content: center;
}

/* 订单详情弹窗 */
::v-deep .custom-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.order-detail {
  padding: 8px 0;
}

.order-detail-header {
  margin-bottom: 20px;
}

.order-no {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.status-tag-lg {
  border-radius: 20px;
  padding: 4px 12px;
}

.order-amount .amount-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.order-amount .amount-value {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-item {
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-label {
  color: #909399;
  margin-right: 8px;
}

.detail-value {
  color: #606266;
  font-weight: 500;
}

.price-detail {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.price-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.text-right {
  text-align: right;
}

/* 全局美化 */
::v-deep .el-button {
  border-radius: 6px;
  transition: all 0.2s ease;
}

::v-deep .el-table {
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f8f9fa;
  border-radius: 8px;
}

::v-deep .el-table th {
  background-color: #f8f9fa !important;
  border-bottom: 1px solid #e6e8eb;
}

::v-deep .el-table td {
  border-bottom: 1px solid #f0f2f5;
}

::v-deep .el-table::before {
  display: none;
}

::v-deep .el-pagination.is-background .el-pager li {
  border-radius: 6px;
  margin: 0 2px;
}

/* 确保表格列宽正确分配 */
::v-deep .el-table__body,
::v-deep .el-table__header {
  table-layout: fixed !important;
  width: 100% !important;
}

::v-deep .el-table__body-wrapper,
::v-deep .el-table__header-wrapper {
  width: 100% !important;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .form-input, .form-select {
    width: 180px;
  }
  
  .order-actions {
    gap: 4px;
  }
  
  .action-btn {
    min-width: 48px;
    padding: 4px 5px;
    font-size: 11px;
  }
}

@media (max-width: 1200px) {
  .form-input, .form-select {
    width: 160px;
  }
  
  /* 调整表格列宽以适应小屏幕 */
  ::v-deep .el-table td,
  ::v-deep .el-table th {
    padding: 8px 4px;
  }
  
  .order-actions {
    gap: 3px;
  }
  
  .action-btn {
    min-width: 45px;
    padding: 4px;
    font-size: 10px;
  }
}

@media (max-width: 992px) {
  .order-list-container {
    padding: 16px;
  }
  
  .filter-card {
    margin-bottom: 16px;
  }
  
  .form-input, .form-select {
    width: 140px;
  }
  
  ::v-deep .el-table {
    font-size: 13px;
  }
  
  .checkin-date, .checkout-date {
    font-size: 12px;
  }
  
  /* 小屏幕上隐藏按钮文字，只显示图标 */
  .action-btn span {
    display: none;
  }
  
  .action-btn {
    min-width: 32px;
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-btn i {
    margin: 0;
    font-size: 14px;
  }
}

/* 为小屏幕设备隐藏部分按钮文字，只显示图标 */
@media (max-width: 768px) {
  .action-btn span {
    display: none;
  }
  
  .action-btn {
    min-width: 30px;
    width: 30px;
    height: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-btn i {
    margin: 0;
    font-size: 13px;
  }
  
  /* 调整入住时间显示方式 */
  .checkin-info {
    flex-direction: column;
    gap: 2px;
  }
  
  .checkin-arrow {
    transform: rotate(90deg);
    margin: 2px 0;
  }
}
</style>
