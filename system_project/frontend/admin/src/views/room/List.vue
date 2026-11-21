<template>
  <div class="room-list">
    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item @click.native="$router.push({ name: 'HomestayList' })">民宿列表</el-breadcrumb-item>
      <el-breadcrumb-item>{{ homestayName }}</el-breadcrumb-item>
      <el-breadcrumb-item>房型管理</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 筛选卡片 -->
    <el-card class="filter-card">
      <div slot="header" class="filter-header">
        <span class="filter-title">房型筛选</span>
      </div>
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="房型名称">
          <el-input 
            v-model="filterForm.name" 
            placeholder="请输入房型名称"
            class="form-input"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item label="床型">
          <el-select 
            v-model="filterForm.bedType" 
            placeholder="请选择床型"
            class="form-select"
            clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="1.8米大床" value="1.8米大床"></el-option>
            <el-option label="1.2米双床" value="1.2米双床"></el-option>
            <el-option label="榻榻米" value="榻榻米"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态"
            class="form-select"
            clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="上架" value="1"></el-option>
            <el-option label="下架" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 表格卡片 -->
    <el-card class="table-card">
      <div slot="header" class="table-header">
        <span class="table-title">{{ homestayName }} - 房型列表</span>
        <div class="header-actions">
          <el-button 
            type="primary" 
            icon="el-icon-plus" 
            @click="handleAdd"
            size="small">
            新增房型
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="roomList" 
        v-loading="loading"
        :header-cell-style="{background: '#f8f9fa', color: '#333', fontWeight: 600}"
        :cell-style="{padding: '12px 0'}"
        style="width: 100%"
        stripe
        border
        row-class-name="table-row">
        <el-table-column 
          prop="id" 
          label="ID"
          min-width="60"
          align="center">
        </el-table-column>
        
        <el-table-column 
          prop="name" 
          label="房型名称"
          min-width="140"
          align="center"  
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="text-primary">{{ scope.row.name || '未命名' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="bedType" 
          label="床型" 
          min-width="180"
          align="center"
          show-overflow-tooltip>
        </el-table-column>
        
        <el-table-column 
          prop="price" 
          label="销售价格" 
          min-width="100"
          align="center">
          <template slot-scope="scope">
            <span class="text-price">¥{{ scope.row.price || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="peopleNum" 
          label="可住人数" 
          min-width="90"
          align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.peopleNum">{{ scope.row.peopleNum }}人</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="stock" 
          label="库存" 
          min-width="80"
          align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="scope.row.stock === 0 ? 'danger' : 'success'" 
              size="small"
              effect="light">
              {{ scope.row.stock }}间
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="status" 
          label="状态" 
          min-width="80"
          align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="scope.row.status === 1 ? 'success' : 'danger'" 
              size="small"
              effect="dark">
              {{ scope.row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 - 自适应宽度 -->
        <el-table-column 
          label="操作" 
          min-width="200"
          header-align="center"
          align="center">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="mini" 
                icon="el-icon-edit"
                @click="handleEdit(scope.row)"
                title="编辑房型"
                class="action-btn">
                编辑
              </el-button>
              
              <el-button 
                size="mini" 
                :type="scope.row.status === 1 ? 'warning' : 'success'"
                :icon="scope.row.status === 1 ? 'el-icon-bottom' : 'el-icon-top'"
                @click="handleToggleStatus(scope.row)"
                :title="scope.row.status === 1 ? '下架' : '上架'"
                class="action-btn">
                {{ scope.row.status === 1 ? '下架' : '上架' }}
              </el-button>
              
              <el-button 
                size="mini" 
                type="danger" 
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
                title="删除房型"
                class="action-btn">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
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
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'RoomList',
  data() {
    return {
      homestayId: '', // 当前民宿ID
      homestayName: '', // 民宿名称
      filterForm: {
        name: '',
        bedType: '',
        status: ''
      },
      roomList: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  created() {
    // 从路由获取民宿ID并打印日志
    this.homestayId = this.$route.params.homestayId
    console.log('【房型列表】当前民宿ID:', this.homestayId)
    
    if (!this.homestayId || isNaN(this.homestayId)) {
      this.$message.error('缺少有效民宿ID，无法加载房型列表')
      this.$router.push({ name: 'HomestayList' })
      return
    }
    // 获取民宿名称
    this.fetchHomestayName()
    // 加载房型列表
    this.fetchRoomList()
  },
  methods: {
    // 获取民宿名称
    fetchHomestayName() {
      request.get(`/homestay/${this.homestayId}`)
        .then(res => {
          if (res.data.code === 200) {
            this.homestayName = res.data.data.name
          }
        })
    },

    // 查询房型列表
    search() {
      this.pagination.currentPage = 1
      this.fetchRoomList()
    },
    
    reset() {
      this.filterForm = {
        name: '',
        bedType: '',
        status: ''
      }
      this.search()
    },
    
    // 请求当前民宿下的房型列表
    fetchRoomList() {
      this.loading = true
      const params = {
        page: this.pagination.currentPage,
        size: this.pagination.pageSize,
        homestayId: this.homestayId,
        keyword: this.filterForm.name || undefined,
        bedType: this.filterForm.bedType || undefined,
        status: this.filterForm.status ? Number(this.filterForm.status) : undefined // 转为数字，匹配后端类型
      }
      
      // 调试日志：查看传递的参数
      console.log('【房型列表】请求参数:', params)
      
      request.get('/room/list', { params })
        .then(response => {
          const data = response.data
          console.log('【房型列表】响应数据:', data)
          if (data.code === 200) {
            this.roomList = data.data.list || []
            this.pagination.total = data.data.total || 0
            // 空数据提示
            if (this.roomList.length === 0) {
              this.$message.info('当前民宿下暂无房型数据')
            }
          } else {
            this.$message.error(data.msg || '获取房型列表失败')
            this.roomList = []
            this.pagination.total = 0
          }
        })
        .catch(error => {
          console.error('【房型列表】请求失败:', error)
          this.$message.error('获取房型列表失败，请检查网络或联系管理员')
          this.roomList = []
          this.pagination.total = 0
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    // 新增房型
    handleAdd() {
      this.$router.push({ name: 'RoomCreate', params: { homestayId: this.homestayId } })
    },
    
    // 编辑房型
    handleEdit(row) {
      this.$router.push({ name: 'RoomEdit', params: { id: row.id } })
    },
    
    // 切换房型状态
    handleToggleStatus(row) {
      const action = row.status === 1 ? '下架' : '上架'
      this.$confirm(`确定要${action}该房型吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        request.put(`/room/toggleStatus/${row.id}`)
          .then(res => {
            if (res.data.code === 200) {
              row.status = res.data.data
              this.$message.success(`${action}成功`)
            } else {
              this.$message.error(res.data.msg)
            }
          })
      }).catch(() => {})
    },
    
    // 删除房型
    handleDelete(row) {
      this.$confirm('确定要删除该房型吗？删除后不可恢复！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        request.delete(`/room/delete/${row.id}`)
          .then(res => {
            if (res.data.code === 200) {
              const index = this.roomList.findIndex(item => item.id === row.id)
              if (index > -1) {
                this.roomList.splice(index, 1)
                this.pagination.total--
              }
              this.$message.success('删除成功')
            } else {
              this.$message.error(res.data.msg)
            }
          })
      }).catch(() => {})
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchRoomList()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchRoomList()
    }
  }
}
</script>

<style scoped>
.room-list {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.breadcrumb {
  margin-bottom: 16px;
  font-size: 14px;
}

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

.filter-header, .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.filter-title, .table-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.table-title {
  font-size: 16px;
}

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

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa !important;
}

.text-primary {
  color: #303133;
  font-size: 14px;
}

.text-price {
  color: #e6a23c;
  font-weight: bold;
  font-size: 14px;
}

.text-gray {
  color: #909399;
  font-size: 14px;
}

/* 优化操作按钮布局 - 整体居中 */
.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  gap: 6px;
}

/* 优化按钮样式 */
::v-deep .action-buttons .el-button--mini {
  flex: 0 0 auto;
  border-radius: 4px;
  padding: 5px 8px;
  transition: all 0.2s ease;
  height: auto;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 1.2;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: auto;
}

/* 进一步优化图标和文字间距 */
::v-deep .action-buttons .el-button--mini .el-icon {
  margin-right: 2px;
  font-size: 10px;
  flex-shrink: 0;
}

/* 鼠标悬停效果 */
::v-deep .action-buttons .el-button--mini:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  justify-content: center;
}

::v-deep .el-pagination.is-background .el-pager li {
  border-radius: 6px;
  margin: 0 2px;
}

::v-deep .el-pagination.is-background .el-pager li.active {
  background-color: #409eff;
  color: #fff;
}
</style>
