<template>
  <div class="user-list-container">
    <el-card class="filter-card">
      <div slot="header">
        <span class="filter-header">筛选条件</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="昵称">
          <el-input v-model="filterForm.nickname" placeholder="请输入昵称" clearable></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="filterForm.phone" placeholder="请输入手机号" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="正常" value="1"></el-option>
            <el-option label="禁用" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" @click="search" icon="el-icon-search">查询</el-button>
          <el-button @click="reset" icon="el-icon-refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <div slot="header" class="table-header">
        <span class="table-title">用户列表</span>
        <span class="table-total">共 {{ pagination.total }} 条记录</span>
      </div>
      <!-- 表格外层容器，处理滚动和布局 -->
      <div class="table-wrapper">
        <el-table 
          :data="userList" 
          v-loading="loading" 
          style="width: 100%"
          :header-cell-style="{background: '#f8f9fa', color: '#333', fontWeight: 600}"
          :cell-style="{padding: '12px 0'}"
          row-class-name="table-row"
          border
          stripe
        >
          <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
          <!-- 修改点：将固定宽度改为最小宽度，实现自适应 -->
          <el-table-column label="用户信息" min-width="220">
            <template slot-scope="scope">
              <div class="user-info">
                <el-avatar 
                  :size="45" 
                  class="user-avatar"
                >
                  <i class="el-icon-user"></i>
                </el-avatar>
                <div class="user-details">
                  <div class="user-nickname">{{ scope.row.nickname || '未设置' }}</div>
                  <div class="user-phone">{{ scope.row.phone || '未绑定' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="gender" label="性别" width="90" align="center">
            <template slot-scope="scope">
              <el-tag 
                size="small" 
                :type="scope.row.gender === 1 ? 'primary' : (scope.row.gender === 2 ? 'pink' : 'info')"
                class="gender-tag"
              >
                {{ getGenderText(scope.row.gender) }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- 格式化生日，只显示年月日 -->
          <el-table-column label="生日" width="120" align="center">
            <template slot-scope="scope">
              <span class="birthday-text">{{ formatDate(scope.row.birthday) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag 
                :type="scope.row.status === 1 ? 'success' : 'danger'" 
                size="small"
                class="status-tag"
              >
                {{ scope.row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- ========== 新增：订单总数列 ========== -->
          <el-table-column prop="orderCount" label="订单总数" width="100" align="center">
            <template slot-scope="scope">
              <el-tag type="info" size="small" effect="light" class="order-count-tag">
                {{ scope.row.orderCount || 0 }} 单
              </el-tag>
            </template>
          </el-table-column>
          <!-- 优化注册时间格式 -->
          <el-table-column label="注册时间" width="180" align="center">
            <template slot-scope="scope">
              <span class="time-text">{{ formatDatetime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            label="操作" 
            width="200" 
            header-align="center"
            align="right"
            fixed="right"
          >
            <template slot-scope="scope">
              <div class="action-buttons">
                <el-button 
                  size="mini" 
                  type="primary" 
                  @click="handleView(scope.row)"
                  icon="el-icon-user"
                  class="view-btn"
                >
                  查看
                </el-button>
                <el-button 
                  size="mini" 
                  :type="scope.row.status === 1 ? 'warning' : 'success'"
                  @click="handleToggleStatus(scope.row)"
                  :icon="scope.row.status === 1 ? 'el-icon-lock' : 'el-icon-unlock'"
                >
                  {{ scope.row.status === 1 ? '禁用' : '启用' }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          background
          class="page-component"
        >
        </el-pagination>
      </div>
    </el-card>
    
    <!-- 用户详情对话框 -->
    <el-dialog 
      title="用户详情" 
      :visible.sync="detailDialogVisible" 
      width="800px" 
      custom-class="custom-dialog"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" v-if="currentUser" class="detail-form">
        <!-- ========== 新增：标签页，分离基本信息和历史订单 ========== -->
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="baseInfo">
            <el-row :gutter="20">
              <el-col :span="8" class="avatar-col">
                <el-form-item label="头像：">
                  <el-avatar 
                    :size="100" 
                    :src="currentUser.avatarUrl || '/default-avatar.png'"
                    class="detail-avatar"
                  ></el-avatar>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="昵称：">
                  <span class="dialog-value">{{ currentUser.nickname || '未设置' }}</span>
                </el-form-item>
                <el-form-item label="手机号：">
                  <span class="dialog-value">{{ currentUser.phone || '未绑定' }}</span>
                </el-form-item>
                <el-form-item label="邮箱：">
                  <span class="dialog-value">{{ currentUser.email || '未填写' }}</span>
                </el-form-item>
                <el-form-item label="性别：">
                  <span class="dialog-value">{{ getGenderText(currentUser.gender) }}</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="生日：">
              <span class="dialog-value">{{ formatDate(currentUser.birthday) }}</span>
            </el-form-item>
            <el-form-item label="状态：">
              <el-tag :type="currentUser.status === 1 ? 'success' : 'danger'">
                {{ currentUser.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="订单总数：">
              <span class="dialog-value">{{ currentUser.orderCount || 0 }} 单</span>
            </el-form-item>
            <el-form-item label="注册时间：">
              <span class="dialog-value">{{ formatDatetime(currentUser.createdAt) }}</span>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="历史预订记录" name="orderHistory">
            <!-- 历史订单表格 -->
            <div class="order-history-wrapper">
              <el-table 
                :data="currentUserOrders" 
                v-loading="orderLoading" 
                style="width: 100%"
                size="small"
                stripe
                border
              >
                <el-table-column prop="orderNo" label="订单号" width="160" align="center"></el-table-column>
                <el-table-column prop="roomName" label="房型" width="140" align="center"></el-table-column>
                <el-table-column label="入住时间" width="200" align="center">
                  <template slot-scope="scope">
                    <div class="checkin-info">
                      <div>{{ formatDate(scope.row.checkInDate) }}</div>
                      <div class="arrow">→</div>
                      <div>{{ formatDate(scope.row.checkOutDate) }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="totalAmount" label="订单金额" width="120" align="center">
                  <template slot-scope="scope">
                    <span class="total-amount">¥{{ formatAmount(scope.row.totalAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="订单状态" width="100" align="center">
                  <template slot-scope="scope">
                    <el-tag :type="getOrderStatusType(scope.row.status)" size="mini">
                      {{ getOrderStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 订单分页 -->
              <div class="order-pagination">
                <el-pagination
                  @size-change="handleOrderSizeChange"
                  @current-change="handleOrderCurrentChange"
                  :current-page="orderPagination.currentPage"
                  :page-sizes="[5, 10, 20]"
                  :page-size="orderPagination.pageSize"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="orderPagination.total"
                  background
                  size="small"
                >
                </el-pagination>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false" type="primary">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'UserList',
  data() {
    return {
      filterForm: {
        nickname: '',
        phone: '',
        status: ''
      },
      userList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      detailDialogVisible: false,
      currentUser: null,
      // ========== 新增：标签页和订单相关数据 ==========
      activeTab: 'baseInfo', // 默认选中基本信息标签
      currentUserOrders: [], // 当前用户历史订单
      orderLoading: false, // 订单加载状态
      orderPagination: { // 订单分页参数
        currentPage: 1,
        pageSize: 5,
        total: 0
      }
    }
  },
  methods: {
    search() {
      this.pagination.currentPage = 1
      this.fetchUserList()
    },
    
    reset() {
      this.filterForm = {
        nickname: '',
        phone: '',
        status: ''
      }
      this.search()
    },
    
    fetchUserList() {
      this.loading = true
      const params = {
        page: this.pagination.currentPage,
        size: this.pagination.pageSize,
        nickname: this.filterForm.nickname || undefined,
        phone: this.filterForm.phone || undefined,
        status: this.filterForm.status || undefined
      }
      
      request.get('/user/list', { params })
        .then(response => {
          const data = response.data
          if (data.code === 200) {
            this.userList = data.data.list
            this.pagination.total = data.data.total
          } else {
            this.$message.error(data.msg || '获取用户列表失败')
          }
        })
        .catch(error => {
          console.error('获取用户列表失败:', error)
          this.$message.error('获取用户列表失败: ' + error.message)
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    handleView(row) {
      this.currentUser = row
      this.detailDialogVisible = true
      // ========== 新增：打开弹窗时，初始化并查询当前用户的历史订单 ==========
      this.orderPagination.currentPage = 1
      this.fetchCurrentUserOrders()
    },
    
    // ========== 新增：查询当前用户的历史订单 ==========
    fetchCurrentUserOrders() {
      if (!this.currentUser || !this.currentUser.id) return
      
      this.orderLoading = true
      const params = {
        page: this.orderPagination.currentPage,
        size: this.orderPagination.pageSize
      }
      
      request.get(`/user/${this.currentUser.id}/orders`, { params })
        .then(response => {
          const data = response.data
          if (data.code === 200) {
            this.currentUserOrders = data.data.list
            this.orderPagination.total = data.data.total
          } else {
            this.$message.error(data.msg || '获取用户订单失败')
          }
        })
        .catch(error => {
          console.error('获取用户订单失败:', error)
          this.$message.error('获取用户订单失败: ' + error.message)
        })
        .finally(() => {
          this.orderLoading = false
        })
    },
    
    handleToggleStatus(row) {
      this.$confirm(`确定要${row.status === 1 ? '禁用' : '启用'}该用户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const status = row.status === 1 ? 0 : 1
        request.put(`/user/${row.id}/status`, { status }).then(({ data }) => {
          if (data.code !== 200) throw new Error(data.msg || '操作失败')
          row.status = status
          this.$message.success('操作成功')
        }).catch(error => this.$message.error(error.message || '操作失败'))
      })
    },
    
    getGenderText(gender) {
      const genderMap = {
        0: '未知',
        1: '男',
        2: '女'
      }
      return genderMap[gender] || '未知'
    },
    
    // 格式化日期（只保留年月日）
    formatDate(dateStr) {
      if (!dateStr) return '未填写'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '格式错误'
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    },
    
    // 格式化时间（年月日 时分）
    formatDatetime(datetimeStr) {
      if (!datetimeStr) return '未知'
      const date = new Date(datetimeStr)
      if (isNaN(date.getTime())) return '格式错误'
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // ========== 新增：订单相关格式化方法 ==========
    // 格式化金额
    formatAmount(amount) {
      if (!amount) return '0.00'
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return num.toFixed(2)
    },
    
    // 获取订单状态样式
    getOrderStatusType(status) {
      const statusMap = {
        0: 'info',    // 待支付
        1: 'warning', // 已支付
        2: 'primary', // 已入住
        3: 'success', // 已完成
        4: 'danger',  // 已取消
        5: 'danger'   // 已退款
      }
      return statusMap[status] || 'info'
    },
    
    // 获取订单状态文本
    getOrderStatusText(status) {
      const statusMap = {
        0: '待支付',
        1: '已支付',
        2: '已入住',
        3: '已完成',
        4: '已取消',
        5: '已退款'
      }
      return statusMap[status] || '未知'
    },
    
    // ========== 新增：订单分页相关方法 ==========
    handleOrderSizeChange(val) {
      this.orderPagination.pageSize = val
      this.fetchCurrentUserOrders()
    },
    
    handleOrderCurrentChange(val) {
      this.orderPagination.currentPage = val
      this.fetchCurrentUserOrders()
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchUserList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchUserList()
    }
  },
  created() {
    this.fetchUserList()
  }
}
</script>

<style scoped>
/* 全局容器样式 */
.user-list-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

/* 筛选卡片样式 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
}

.filter-card ::v-deep .el-card__header {
  background-color: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  border-radius: 12px 12px 0 0;
}

.filter-header {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.filter-actions {
  margin-left: auto;
  margin-right: 20px;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
  overflow: hidden;
}

.table-card ::v-deep .el-card__header {
  background-color: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 表格容器 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* 消除fixed列的竖线分隔 */
.table-wrapper ::v-deep .el-table__fixed-right {
  border-left: none !important;
  background-color: #fff;
}

/* 确保操作列表头文字居中显示的兜底样式 */
.table-wrapper ::v-deep .el-table__header-cell--right {
  text-align: center !important;
}

/* 表格行样式 */
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa !important;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.user-avatar {
  border: 1px solid #f0f2f5;
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar .el-icon-user {
  color: #fff;
  font-size: 24px;
}

.user-details {
  margin-left: 12px;
}

.user-nickname {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

/* 标签样式优化 */
.gender-tag {
  border-radius: 20px;
}

.status-tag {
  border-radius: 20px;
}

/* ========== 新增：订单数标签样式 ========== */
.order-count-tag {
  border-radius: 20px;
  background-color: #ecf5ff;
  color: #409eff;
  border: none;
}

/* 文本样式 */
.birthday-text, .time-text {
  color: #606266;
  font-size: 14px;
}

/* 操作按钮靠右对齐，紧贴操作列右侧 */
.action-buttons {
  display: flex;
  justify-content: flex-end; /* 按钮靠操作列最右侧 */
  gap: 8px;
  padding-right: 15px; /* 与页面最右侧保持少量间距，避免贴边 */
}

.action-buttons .el-button {
  margin: 0;
  border-radius: 6px;
}

/* 查看按钮样式：默认白底白字，hover 时显示紫色 */
.view-btn {
  background-color: #9c27b0 !important;
  border-color: #9c27b0 !important;
  color: #fff !important;
}

.view-btn:hover {
  background-color: #ba68c8 !important;
  border-color: #ba68c8 !important;
  color: #fff !important;
}

.view-btn:active,
.view-btn:focus {
  background-color: #7b1fa2 !important;
  border-color: #7b1fa2 !important;
  color: #fff !important;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  justify-content: center;
}

.page-component ::v-deep .el-pagination {
  margin-top: 8px;
}

/* 详情弹窗样式 */
.custom-dialog ::v-deep .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.custom-dialog ::v-deep .el-dialog__header {
  background-color: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.custom-dialog ::v-deep .el-dialog__title {
  color: #303133;
  font-weight: 600;
  font-size: 16px;
}

.detail-form {
  padding: 8px 0;
}

/* ========== 新增：标签页样式 ========== */
.detail-tabs {
  margin-bottom: 10px;
}

.avatar-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-avatar {
  border: 2px solid #f0f2f5;
}

.dialog-value {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

/* ========== 新增：历史订单板块样式 ========== */
.order-history-wrapper {
  margin-top: 10px;
}

.checkin-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
}

.checkin-info .arrow {
  color: #c0c4cc;
}

.total-amount {
  color: #f56c6c;
  font-weight: 600;
}

.order-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  text-align: center;
  padding: 12px 20px;
  border-top: 1px solid #f0f2f5;
  background-color: #f8f9fa;
  margin: 0 -20px -10px;
}

/* 全局表单元素美化 */
::v-deep .el-input__inner {
  border-radius: 6px;
  border: 1px solid #e6e8eb;
  height: 36px;
}

::v-deep .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

::v-deep .el-select .el-input__inner {
  border-radius: 6px;
  height: 36px;
}

::v-deep .el-button {
  border-radius: 6px;
  padding: 8px 16px;
}

::v-deep .el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

::v-deep .el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
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

::v-deep .el-tag {
  --el-tag-border-radius: 20px;
}
</style>
