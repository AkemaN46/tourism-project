<template>
  <div class="review-list-container">
    <el-card class="filter-card">
      <div slot="header">
        <span class="filter-header">筛选条件</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="民宿">
          <el-input v-model="filterForm.roomName" placeholder="请输入民宿名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="待审核" value="0"></el-option>
            <el-option label="已通过" value="1"></el-option>
            <el-option label="未通过" value="2"></el-option>
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
        <span class="table-title">评价列表</span>
        <span class="table-total">共 {{ pagination.total }} 条记录</span>
      </div>
      <!-- 核心优化：表格增加overflow:auto，避免内容溢出 -->
      <div class="table-wrapper">
        <el-table 
          :data="reviewList" 
          v-loading="loading" 
          style="width: 100%"
          :header-cell-style="{background: '#f5f7fa', color: '#606266'}"
          row-class-name="table-row"
        >
          <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
          <el-table-column prop="roomName" label="民宿" width="150">
            <template slot-scope="scope">
              <span class="room-name">{{ scope.row.roomName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用户" width="180">
            <template slot-scope="scope">
              <div class="user-info">
                <el-avatar :size="30" class="user-avatar">
                  <i class="el-icon-user"></i>
                </el-avatar>
                <span class="user-name">{{ scope.row.userName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="评分" width="180" align="center">
            <template slot-scope="scope">
              <div class="rating-container">
                <el-rate
                  v-model="scope.row.rating"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}分"
                  style="width: 100%;">
                </el-rate>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="评价内容" min-width="200">
            <template slot-scope="scope">
              <div class="content-preview">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="getReviewStatusType(scope.row.status)" size="small">
                {{ getReviewStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- 核心修改1：缩小操作列宽度，从250→200，align改为center -->
          <el-table-column label="操作" width="200" align="center">
            <template slot-scope="scope">
              <!-- 核心修改2：按钮容器改为居中对齐，左移按钮位置 -->
              <div class="review-actions">
                <el-button size="mini" type="info" @click="handleView(scope.row)" plain>查看</el-button>
                <el-button 
                  v-if="scope.row.status === 0" 
                  size="mini" 
                  type="success" 
                  @click="handleApprove(scope.row)"
                >
                  通过
                </el-button>
                <el-button 
                  v-if="scope.row.status === 0" 
                  size="mini" 
                  type="warning" 
                  @click="handleReject(scope.row)"
                >
                  拒绝
                </el-button>
                <el-button 
                  v-if="scope.row.status === 1" 
                  size="mini" 
                  type="danger" 
                  @click="handleHide(scope.row)"
                  plain
                >
                  隐藏
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
          background>
        </el-pagination>
      </div>
    </el-card>
    
    <!-- 评价详情对话框 -->
    <el-dialog 
      title="评价详情" 
      :visible.sync="detailDialogVisible" 
      width="600px"
      custom-class="custom-dialog"
    >
      <div v-if="currentReview">
        <el-row :gutter="20" class="review-detail-header">
          <el-col :span="12">
            <div class="review-info">
              <h3>评价详情</h3>
              <el-tag :type="getReviewStatusType(currentReview.status)" size="medium">
                {{ getReviewStatusText(currentReview.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12" class="text-right">
            <div class="review-rating">
              <el-rate
                v-model="currentReview.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}分">
              </el-rate>
            </div>
          </el-col>
        </el-row>
        
        <el-divider></el-divider>
        
        <el-row :gutter="20" class="detail-section">
          <el-col :span="24">
            <h4 class="section-title">基本信息</h4>
            <div class="detail-item">
              <span class="detail-label">民宿：</span>
              <span class="detail-value">{{ currentReview.roomName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用户：</span>
              <span class="detail-value">{{ currentReview.userName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">评价时间：</span>
              <span class="detail-value">{{ currentReview.createdAt }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" class="detail-section">
          <el-col :span="24">
            <h4 class="section-title">评价内容</h4>
            <div class="review-content">
              {{ currentReview.content }}
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" class="detail-section" v-if="currentReview.images && currentReview.images.length > 0">
          <el-col :span="24">
            <h4 class="section-title">评价图片</h4>
            <div class="review-images">
              <el-image
                v-for="(image, index) in currentReview.images"
                :key="index"
                style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px; border-radius: 4px;"
                :src="image"
                :preview-src-list="currentReview.images"
                fit="cover">
                <div slot="error" class="review-image-error">图片已失效</div>
              </el-image>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" class="detail-section" v-if="currentReview.replyContent">
          <el-col :span="24">
            <h4 class="section-title">回复内容</h4>
            <div class="reply-content">
              {{ currentReview.replyContent }}
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
  name: 'ReviewList',
  data() {
    return {
      filterForm: {
        roomName: '',
        status: ''
      },
      reviewList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      detailDialogVisible: false,
      currentReview: null
    }
  },
  methods: {
    getFullImageUrl(path) {
      if (!path) return ''
      if (/^https?:\/\/(tmp\/|[^/]*example\.com\/)/i.test(path) || path.startsWith('wxfile://')) {
        return this.reviewImagePlaceholder()
      }
      return path.startsWith('http') ? path : `http://localhost:8082${path.startsWith('/') ? '' : '/'}${path}`
    },

    reviewImagePlaceholder() {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" fill="#f2f4f7"/><path d="M54 128l38-40 28 28 22-22 44 44H54z" fill="#c0c4cc"/><circle cx="154" cy="62" r="14" fill="#c0c4cc"/><text x="120" y="158" text-anchor="middle" font-size="16" fill="#909399">图片已失效</text></svg>'
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
    },

    search() {
      this.pagination.currentPage = 1
      this.fetchReviewList()
    },
    
    reset() {
      this.filterForm = {
        roomName: '',
        status: ''
      }
      this.search()
    },
    
    fetchReviewList() {
      this.loading = true
      const params = {
        page: this.pagination.currentPage,
        size: this.pagination.pageSize,
        roomName: this.filterForm.roomName || undefined,
        status: this.filterForm.status || undefined
      }
      
      console.log('请求评价列表参数:', params)
      
      request.get('/review/list', { params })
        .then(response => {
          console.log('评价列表响应:', response)
          const data = response.data
          if (data.code === 200) {
            this.reviewList = (data.data.list || []).map(item => ({
              ...item,
              images: (item.images || []).map(this.getFullImageUrl)
            }))
            this.pagination.total = data.data.total
            console.log('评价列表数据:', this.reviewList)
          } else {
            this.$message.error(data.msg || '获取评价列表失败')
          }
        })
        .catch(error => {
          console.error('获取评价列表失败:', error)
          this.$message.error('获取评价列表失败: ' + error.message)
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    handleView(row) {
      this.currentReview = row
      this.detailDialogVisible = true
    },
    
    handleApprove(row) {
      this.$confirm('确定要通过该评价吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API
        request.post(`/review/${row.id}/approve`)
          .then(response => {
            const data = response.data
            if (data.code === 200) {
              row.status = 1
              this.$message.success('评价已通过')
            } else {
              this.$message.error(data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('操作失败:', error)
            this.$message.error('操作失败')
          })
      })
    },
    
    handleReject(row) {
      this.$prompt('请输入拒绝理由', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入拒绝理由'
      }).then(({ value }) => {
        // 调用后端API
        request.post(`/review/${row.id}/reject`, { reason: value })
          .then(response => {
            const data = response.data
            if (data.code === 200) {
              row.status = 2
              row.replyContent = value
              this.$message.success('评价已拒绝')
            } else {
              this.$message.error(data.msg || '操作失败')
            }
          })
          .catch(error => {
            console.error('操作失败:', error)
            this.$message.error('操作失败')
          })
      }).catch(() => {
        // 取消操作
      })
    },
    
    handleHide(row) {
      this.$confirm('确定要隐藏该评价吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用隐藏API，这里可以调用一个设置状态为隐藏的接口
        // 暂时模拟操作
        row.status = 2
        this.$message.success('评价已隐藏')
      })
    },
    
    getReviewStatusType(status) {
      const statusMap = {
        0: 'info',   // 待审核
        1: 'success', // 已通过
        2: 'danger'   // 未通过/隐藏
      }
      return statusMap[status] || 'info'
    },
    
    getReviewStatusText(status) {
      const statusMap = {
        0: '待审核',
        1: '已通过',
        2: '未通过'
      }
      return statusMap[status] || '未知'
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchReviewList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchReviewList()
    }
  },
  created() {
    console.log('ReviewList created')
    this.fetchReviewList()
  }
}
</script>

<style scoped>
.review-list-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  /* 防止页面整体溢出 */
  box-sizing: border-box;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-card ::v-deep .el-card__header {
  background-color: #fafafa;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-header {
  font-weight: 600;
  color: #303133;
}

.filter-actions {
  margin-left: auto;
  margin-right: 20px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-card ::v-deep .el-card__header {
  background-color: #fafafa;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
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

/* 表格容器：增加横向滚动兜底，确保内容不溢出 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table-row:hover {
  background-color: #f5f7fa !important;
}

.room-name {
  font-weight: 500;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar .el-icon-user {
  color: #fff;
  font-size: 16px;
}

.user-name {
  margin-left: 10px;
  font-weight: 500;
}

.rating-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2px 0;
}

.rating-container ::v-deep .el-rate {
  width: 100%;
}

.rating-container ::v-deep .el-rate__text {
  margin-left: 8px;
  font-size: 14px;
}

.content-preview {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 20px;
}

/* 核心修改3：按钮容器改为居中+左内边距，按钮左移且紧凑排列 */
.review-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px; /* 缩小按钮间距，更紧凑 */
  padding: 4px 0;
  width: 100%;
  /* 轻微左移 */
  padding-left: 10px;
}

.review-actions .el-button {
  margin: 0;
  /* 按钮字号缩小，更适配 */
  font-size: 12px;
  padding: 5px 8px;
}

.pagination-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}

/* 评价详情样式 */
.review-detail-header {
  margin-bottom: 20px;
}

.review-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.review-rating {
  text-align: right;
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
}

.detail-label {
  color: #909399;
  font-size: 14px;
  font-weight: 500;
  width: 80px;
  display: inline-block;
}

.detail-value {
  color: #606266;
  font-size: 14px;
}

.review-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  line-height: 1.6;
  color: #606266;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
}

.review-image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #f5f7fa;
  font-size: 12px;
}

.reply-content {
  background-color: #fff2e8;
  padding: 15px;
  border-radius: 4px;
  line-height: 1.6;
  color: #606266;
  border-left: 3px solid #ff9900;
}

.text-right {
  text-align: right;
}
</style>
