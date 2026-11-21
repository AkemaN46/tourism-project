<template>
  <div class="homestay-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>民宿管理</h2>
      <p class="sub-title">管理民宿信息、房型配置及状态</p>
    </div>
    
    <!-- 筛选卡片 -->
    <el-card class="filter-card">
      <div slot="header" class="filter-header">
        <span class="filter-title">筛选条件</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline class="filter-form">
        <el-form-item label="民宿名称">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="请输入民宿名称"
            class="form-input"
            clearable
            size="small">
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态"
            class="form-select"
            clearable
            size="small">
            <el-option label="全部" value=""></el-option>
            <el-option label="上架" value="1"></el-option>
            <el-option label="下架" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button type="primary" icon="el-icon-search" @click="search" size="small">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset" size="small">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 表格卡片 -->
    <el-card class="table-card">
      <div slot="header" class="table-header">
        <span class="table-title">民宿列表</span>
        <div class="header-actions">
          <el-button 
            type="primary" 
            icon="el-icon-plus" 
            @click="handleAdd"
            size="small">
            新增民宿
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="homestayList" 
        v-loading="loading"
        :header-cell-style="{background: '#f5f7fa', color: '#303133', fontWeight: 600}"
        :cell-style="{padding: '8px 0'}"
        style="width: 100%"
        stripe
        border
        size="small">
        
        <el-table-column 
          prop="id" 
          label="ID" 
          width="60"
          align="center">
        </el-table-column>
        
        <el-table-column 
          prop="name" 
          label="民宿名称"
          min-width="150"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <div class="name-cell">
              <span class="text-primary">{{ scope.row.name || '未命名' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="address" 
          label="详细地址"
          min-width="180"
          show-overflow-tooltip>
        </el-table-column>
        
        <el-table-column 
          prop="phone" 
          label="联系电话"
          width="110"
          align="center">
          <template slot-scope="scope">
            <div class="phone-cell">
              {{ scope.row.phone || '-' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="status" 
          label="状态" 
          width="80"
          align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="scope.row.status === 1 ? 'success' : 'danger'" 
              size="small"
              effect="plain">
              {{ scope.row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="createdAt" 
          label="创建时间" 
          width="150"
          align="center">
          <template slot-scope="scope">
            <div class="time-cell">
              {{ scope.row.createdAt ? formatDate(scope.row.createdAt) : '-' }}
            </div>
          </template>
        </el-table-column>
        
        <!-- 操作列：彩色图标按钮 -->
        <el-table-column 
          label="操作" 
          width="220"
          header-align="center"
          align="center"
          fixed="right">
          <template slot-scope="scope">
            <div class="action-icons">
              <!-- 详情按钮 - 蓝色 -->
              <el-tooltip 
                effect="dark" 
                content="查看详情" 
                placement="top">
                <el-button 
                  type="text" 
                  size="mini" 
                  icon="el-icon-document"
                  @click="handleDetail(scope.row)"
                  class="btn-icon btn-detail">
                </el-button>
              </el-tooltip>
              
              <!-- 房型管理按钮 - 紫色 -->
              <el-tooltip 
                effect="dark" 
                content="房型管理" 
                placement="top">
                <el-button 
                  type="text" 
                  size="mini" 
                  icon="el-icon-setting"
                  @click="handleRoomManage(scope.row)"
                  class="btn-icon btn-room">
                </el-button>
              </el-tooltip>
              
              <!-- 编辑按钮 - 橙色 -->
              <el-tooltip 
                effect="dark" 
                content="编辑民宿" 
                placement="top">
                <el-button 
                  type="text"
                  size="mini" 
                  icon="el-icon-edit"
                  @click="handleEdit(scope.row)"
                  class="btn-icon btn-edit">
                </el-button>
              </el-tooltip>
              
              <!-- 状态切换按钮 - 上架/下架（修改下架图标为向下箭头） -->
              <el-tooltip 
                effect="dark" 
                :content="scope.row.status === 1 ? '下架民宿' : '上架民宿'" 
                placement="top">
                <el-button 
                  type="text"
                  size="mini" 
                  :icon="scope.row.status === 1 ? 'el-icon-upload2' : 'el-icon-arrow-down'" 
                  @click="handleToggleStatus(scope.row)"
                  :class="['btn-icon', scope.row.status === 1 ? 'btn-up' : 'btn-down']">
                </el-button>
              </el-tooltip>
              
              <!-- 删除按钮 - 红色 -->
              <el-tooltip 
                effect="dark" 
                content="删除民宿" 
                placement="top">
                <el-button 
                  type="text" 
                  size="mini" 
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  class="btn-icon btn-delete">
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          background
          size="small">
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import service from '@/utils/request'
import { Message } from 'element-ui'

export default {
  name: 'HomestayList',
  data() {
    return {
      filterForm: {
        keyword: '',
        status: ''
      },
      homestayList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  methods: {
    // 格式化日期显示
    formatDate(date) {
      const d = new Date(date)
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    },
    
    search() {
      this.pagination.currentPage = 1
      this.fetchHomestayList()
    },
    
    reset() {
      this.filterForm = {
        keyword: '',
        status: ''
      }
      this.search()
    },
    
    async fetchHomestayList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.currentPage,
          size: this.pagination.pageSize,
          keyword: this.filterForm.keyword || undefined,
          status: this.filterForm.status === '' ? undefined : Number(this.filterForm.status)
        }
        
        const response = await service.get('/homestay/list', { params })
        const data = response.data
        
        if (data.code === 200) {
          this.homestayList = data.data.list || []
          this.pagination.total = data.data.total || 0
          if (this.homestayList.length === 0) {
            Message.info('暂无符合条件的民宿数据')
          }
        } else {
          Message.error(data.msg || '获取民宿列表失败')
          this.homestayList = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('获取民宿列表失败详情:', error)
        Message.error('获取民宿列表失败')
        this.homestayList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    
    handleAdd() {
      this.$router.push({ name: 'HomestayCreate' })
    },
    
    handleEdit(row) {
      this.$router.push({ name: 'HomestayEdit', params: { id: row.id } })
    },
    
    handleDetail(row) {
      this.$router.push({ name: 'HomestayDetail', params: { id: row.id } })
    },
    
    handleRoomManage(row) {
      this.$router.push({ name: 'RoomList', params: { homestayId: row.id } })
    },
    
    async handleToggleStatus(row) {
      const action = row.status === 1 ? '下架' : '上架'
      try {
        await this.$confirm(`确定要${action}该民宿吗？`, '操作确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await service.put(`/homestay/toggleStatus/${row.id}`)
        if (response.data.code === 200) {
          row.status = response.data.data
          Message.success(`${action}成功`)
        } else {
          Message.error(response.data.msg || `${action}失败`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          Message.error(`${action}失败`)
        }
      }
    },
    
    async handleDelete(row) {
      try {
        await this.$confirm(
          '确定要删除该民宿吗？删除后会同时删除该民宿下的所有房型，且不可恢复！', 
          '危险操作', 
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'danger'
          }
        )
        
        const response = await service.delete(`/homestay/delete/${row.id}`)
        if (response.data.code === 200) {
          const index = this.homestayList.findIndex(item => item.id === row.id)
          if (index > -1) {
            this.homestayList.splice(index, 1)
            this.pagination.total--
          }
          Message.success('删除成功')
        } else {
          Message.error(response.data.msg || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          Message.error('删除失败')
        }
      }
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchHomestayList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchHomestayList()
    }
  },
  created() {
    this.fetchHomestayList()
  }
}
</script>

<style scoped>
.homestay-list-container {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.page-header .sub-title {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.filter-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding: 12px 20px;
}

.filter-form {
  padding: 10px 20px;
}

.form-input, .form-select {
  width: 200px;
  margin-right: 8px;
}

.form-actions {
  margin-left: 8px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* 操作图标容器 - 关键修改：增加左右内边距，缩小图标间距 */
.action-icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px; /* 缩小图标间距（从4px改为1px） */
  flex-wrap: nowrap;
  padding: 0 18px; /* 增加左右内边距（从0 10px改为0 18px），避免两端图标靠边 */
}

/* 图标按钮样式 - 有颜色版本 */
.btn-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 详情按钮 - 蓝色 */
.btn-detail {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
}

.btn-detail:hover {
  color: #ffffff;
  background-color: #409EFF;
  border-color: #409EFF;
}

/* 房型管理按钮 - 紫色 */
.btn-room {
  color: #8A2BE2;
  background-color: rgba(138, 43, 226, 0.1);
  border-color: rgba(138, 43, 226, 0.2);
}

.btn-room:hover {
  color: #ffffff;
  background-color: #8A2BE2;
  border-color: #8A2BE2;
}

/* 编辑按钮 - 橙色 */
.btn-edit {
  color: #E6A23C;
  background-color: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.2);
}

.btn-edit:hover {
  color: #ffffff;
  background-color: #E6A23C;
  border-color: #E6A23C;
}

/* 上架按钮 - 绿色箭头 (el-icon-upload2) */
.btn-up {
  color: #67C23A;
  background-color: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
}

.btn-up:hover {
  color: #ffffff;
  background-color: #67C23A;
  border-color: #67C23A;
}

/* 下架按钮 - 红色向下箭头 (el-icon-arrow-down) */
.btn-down {
  color: #F56C6C;
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
}

.btn-down:hover {
  color: #ffffff;
  background-color: #F56C6C;
  border-color: #F56C6C;
}

/* 删除按钮 - 红色 */
.btn-delete {
  color: #F56C6C;
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
}

.btn-delete:hover {
  color: #ffffff;
  background-color: #F56C6C;
  border-color: #F56C6C;
}

/* 表格单元格优化 */
.name-cell {
  font-weight: 500;
  font-size: 13px;
}

.phone-cell, .time-cell {
  font-size: 12px;
  color: #606266;
}

.el-table .el-table__cell {
  padding: 6px 0;
}

.el-table--border .el-table__cell {
  border-right: 1px solid #ebeef5;
}

.pagination-wrapper {
  margin-top: 16px;
  padding: 12px 20px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}

/* 响应式调整 - 同步修改图标间距和内边距 */
@media (max-width: 1200px) {
  .form-input, .form-select {
    width: 180px;
  }
  
  .action-icons {
    gap: 1px; /* 同步缩小 */
    padding: 0 15px; /* 同步调整内边距 */
  }
  
  .btn-icon {
    width: 30px;
    height: 30px;
    min-width: 30px;
    font-size: 15px;
  }
}

@media (max-width: 992px) {
  .homestay-list-container {
    padding: 12px;
  }
  
  .filter-form {
    flex-wrap: wrap;
  }
  
  .form-input, .form-select {
    width: 160px;
    margin-bottom: 8px;
  }
  
  .form-actions {
    margin-left: 0;
  }
}
</style>
