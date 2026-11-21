<template>
  <div class="news-list">
    <!-- 筛选卡片 -->
    <el-card class="filter-card">
      <div slot="header" class="filter-header">
        <span class="filter-title">筛选条件</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="标题">
          <el-input 
            v-model="filterForm.title" 
            placeholder="请输入标题" 
            clearable
            class="form-input"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select 
            v-model="filterForm.categoryId" 
            placeholder="请选择分类" 
            clearable
            class="form-select"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="景点推荐" value="1"></el-option>
            <el-option label="美食指南" value="2"></el-option>
            <el-option label="民宿攻略" value="3"></el-option>
            <el-option label="活动资讯" value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态" 
            clearable
            class="form-select"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="草稿" value="0"></el-option>
            <el-option label="发布" value="1"></el-option>
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
        <span class="table-title">资讯列表</span>
        <div class="header-actions">
          <el-button 
            type="primary" 
            @click="handleAdd"
            icon="el-icon-plus"
            class="add-btn"
          >
            发布资讯
          </el-button>
        </div>
      </div>
      
      <!-- 表格容器 -->
      <div class="table-wrapper">
        <el-table 
          :data="newsList" 
          v-loading="loading" 
          style="width: 100%"
          border
          stripe
          :header-cell-style="{background: '#f8f9fa', color: '#333', fontWeight: 600}"
          :cell-style="{padding: '12px 0'}"
          row-class-name="table-row"
        >
          <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
          <el-table-column prop="title" label="标题" min-width="200">
            <template slot-scope="scope">
              <span class="title-text">{{ scope.row.title || '未设置标题' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="categoryName" label="分类" width="120" align="center"></el-table-column>
          <el-table-column prop="viewCount" label="浏览量" width="100" align="center">
            <template slot-scope="scope">
              <el-tag size="small" type="info" class="view-count-tag">
                {{ scope.row.viewCount || 0 }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag 
                size="small" 
                :type="scope.row.status === 1 ? 'success' : 'info'"
                class="status-tag"
              >
                {{ scope.row.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180" align="center">
            <template slot-scope="scope">
              <span class="time-text">{{ formatDatetime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <!-- 核心修改：header-align="center" 让「操作」标题居中 -->
          <el-table-column 
            label="操作" 
            width="280" 
            header-align="center"  
            align="center"        
          >
            <template slot-scope="scope">
              <div class="action-buttons-horizontal">
                <el-button 
                  size="mini" 
                  type="primary" 
                  @click="handleEdit(scope.row)"
                  icon="el-icon-edit"
                >
                  编辑
                </el-button>
                <el-button 
                  size="mini" 
                  :type="scope.row.status === 1 ? 'warning' : 'success'"
                  @click="handleToggleStatus(scope.row)"
                  :icon="scope.row.status === 1 ? 'el-icon-download' : 'el-icon-upload'"
                >
                  {{ scope.row.status === 1 ? '设为草稿' : '发布' }}
                </el-button>
                <el-button 
                  size="mini" 
                  type="danger" 
                  @click="handleDelete(scope.row)"
                  icon="el-icon-delete"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页区域 -->
      <div class="pagination">
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
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'NewsList',
  data() {
    return {
      filterForm: {
        title: '',
        categoryId: '',
        status: ''
      },
      newsList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  methods: {
    search() {
      this.pagination.currentPage = 1
      this.fetchNewsList()
    },
    
    reset() {
      this.filterForm = {
        title: '',
        categoryId: '',
        status: ''
      }
      this.search()
    },
    
fetchNewsList() {
  this.loading = true
  const params = {
    page: this.pagination.currentPage - 1,
    size: this.pagination.pageSize,
    title: this.filterForm.title || undefined,
    categoryId: this.filterForm.categoryId || undefined,
    status: this.filterForm.status || undefined
  }
  
  console.log('请求资讯列表参数:', params)
  
  request.get('/news/list', { params })
    .then(response => {
      console.log('资讯列表响应:', response)
      const data = response.data
      if (data.code === 200) {
        // 处理分类名称映射
        const newsListWithCategory = data.data.list.map(item => {
          return {
            ...item,
            categoryName: this.getCategoryName(item.categoryId)
          }
        })
        
        this.newsList = newsListWithCategory
        this.pagination.total = data.data.total
        console.log('资讯列表数据:', this.newsList)
      } else {
        this.$message.error(data.msg || '获取资讯列表失败')
      }
    })
    .catch(error => {
      console.error('获取资讯列表失败:', error)
      this.$message.error('获取资讯列表失败: ' + error.message)
    })
    .finally(() => {
      this.loading = false
    })
},

// 添加分类映射方法
getCategoryName(categoryId) {
  const categoryMap = {
    1: '景点推荐',
    2: '美食指南',
    3: '民宿攻略',
    4: '活动资讯'
  }
  return categoryMap[categoryId] || '其他分类'
},
    
    handleAdd() {
      this.$router.push('/news/create')
    },
    
    handleEdit(row) {
      this.$router.push(`/news/edit/${row.id}`)
    },
    
    handleToggleStatus(row) {
      this.$confirm(`确定要${row.status === 1 ? '设为草稿' : '发布'}该资讯吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.status = row.status === 1 ? 0 : 1
        this.$message.success('操作成功')
      })
    },
    
    handleDelete(row) {
      this.$confirm('确定要删除该资讯吗？删除后不可恢复！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = this.newsList.findIndex(item => item.id === row.id)
        if (index > -1) {
          this.newsList.splice(index, 1)
          this.pagination.total--
          this.$message.success('删除成功')
        }
      })
    },
    
    // 格式化时间，提升可读性
    formatDatetime(datetimeStr) {
      if (!datetimeStr) return '未知'
      const date = new Date(datetimeStr)
      if (isNaN(date.getTime())) return '格式错误'
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchNewsList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchNewsList()
    }
  },
  created() {
    console.log('NewsList created')
    this.fetchNewsList()
  }
}
</script>

<style scoped>
/* 全局容器 */
.news-list {
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

.filter-header {
  display: flex;
  align-items: center;
}

.filter-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

/* 表单元素美化 */
.form-input, .form-select {
  width: 200px;
}

::v-deep .form-input .el-input__inner,
::v-deep .form-select .el-input__inner {
  border-radius: 6px;
  border: 1px solid #e6e8eb;
  height: 36px;
  padding: 0 12px;
}

::v-deep .form-input .el-input__inner:focus,
::v-deep .form-select .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-actions {
  margin-left: 16px;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
  overflow: hidden;
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

.add-btn {
  border-radius: 6px;
  padding: 8px 16px;
}

/* 表格容器 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* 表格行样式 */
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa !important;
}

/* 文本样式 */
.title-text {
  color: #303133;
  font-size: 14px;
  line-height: 1.5;
}

.time-text {
  color: #606266;
  font-size: 14px;
}

/* 标签样式 */
.view-count-tag {
  border-radius: 20px;
  background-color: #e8f4ff;
  color: #409eff;
  border: none;
}

.status-tag {
  border-radius: 20px;
}

/* 操作按钮样式 */
.action-buttons-horizontal {
  display: flex;
  align-items: center;
  justify-content: center; /* 按钮居中排列 */
  gap: 8px;
  flex-wrap: nowrap;
}

.action-buttons-horizontal .el-button {
  margin: 0;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
}

/* 分页样式 */
.pagination {
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

/* 全局按钮美化 */
::v-deep .el-button {
  border-radius: 6px;
  transition: all 0.2s ease;
}

::v-deep .el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

::v-deep .el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

::v-deep .el-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
}

::v-deep .el-button--warning:hover {
  background-color: #ebb563;
  border-color: #ebb563;
}

::v-deep .el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

::v-deep .el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

/* 表格样式优化 */
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

/* 分页组件美化 */
::v-deep .el-pagination .el-pager li {
  border-radius: 6px;
  margin: 0 2px;
}

::v-deep .el-pagination .el-pager li.active {
  background-color: #409eff;
  color: #fff;
}

::v-deep .el-pagination .el-pagination__sizes .el-input__inner {
  border-radius: 6px;
}
</style>