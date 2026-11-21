<template>
  <div class="homestay-detail">
    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item @click.native="$router.push({ name: 'HomestayList' })">民宿列表</el-breadcrumb-item>
      <el-breadcrumb-item>民宿详情</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="detail-card">
      <div slot="header" class="detail-header">
        <span class="detail-title">{{ homestay.name || '民宿详情' }}</span>
        <el-button 
          type="primary" 
          size="mini"
          @click="$router.push({ name: 'RoomList', params: { homestayId: homestay.id } })">
          管理房型
        </el-button>
      </div>

      <div class="detail-content">
        <!-- 左侧：外观图片展示 -->
        <div class="image-section" v-if="getFullImageUrl(homestay.coverImage)">
          <div class="image-title">外观图片</div>
          <div class="image-container">
            <img 
              :src="getFullImageUrl(homestay.coverImage)" 
              :alt="homestay.name"
              class="cover-image"
              @error="handleImageError">
          </div>
        </div>
        <div class="image-section" v-else>
          <div class="image-title">外观图片</div>
          <div class="no-image">
            <i class="el-icon-picture-outline"></i>
            <p>暂无外观图片</p>
          </div>
        </div>

        <!-- 右侧：基础信息 -->
        <div class="info-section">
          <el-descriptions :column="2" border style="margin-bottom: 20px;">
            <el-descriptions-item label="民宿ID">{{ homestay.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="民宿名称">{{ homestay.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="详细地址">{{ homestay.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ homestay.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="homestay.status === 1 ? 'success' : 'danger'">
                {{ homestay.status === 1 ? '上架' : '下架' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ homestay.createdAt ? formatDate(homestay.createdAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ homestay.updatedAt ? formatDate(homestay.updatedAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="房型数量">{{ roomCount || 0 }} 种</el-descriptions-item>
          </el-descriptions>

          <!-- 民宿介绍 -->
          <el-card class="intro-card" shadow="hover" v-if="homestay.description">
            <div slot="header" class="intro-header">
              <span>民宿介绍</span>
            </div>
            <div class="intro-content">
              {{ homestay.description }}
            </div>
          </el-card>
          <el-card class="intro-card" shadow="hover" v-else>
            <div slot="header" class="intro-header">
              <span>民宿介绍</span>
            </div>
            <div class="intro-content no-content">
              暂无民宿介绍
            </div>
          </el-card>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="btn-group" style="margin-top: 20px;">
        <el-button @click="$router.push({ name: 'HomestayEdit', params: { id: homestay.id } })">
          编辑民宿
        </el-button>
        <el-button @click="$router.push({ name: 'HomestayList' })" type="primary">
          返回列表
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'HomestayDetail',
  data() {
    return {
      homestay: {},
      roomCount: 0,
      // 图片服务器基础地址（和上传页面保持一致）
      baseImageUrl: 'http://localhost:8082'
    }
  },
  created() {
    const homestayId = this.$route.params.id
    if (homestayId) {
      this.fetchHomestayDetail(homestayId)
      this.fetchRoomCount(homestayId)
    } else {
      this.$message.error('缺少民宿ID')
      this.$router.push({ name: 'HomestayList' })
    }
  },
  methods: {
    // 核心：拼接完整的图片URL
    getFullImageUrl(path) {
      if (!path) return ''
      // 如果已经是完整URL（以http开头），直接返回；否则拼接基础地址
      return path.startsWith('http') ? path : `${this.baseImageUrl}${path}`
    },

    // 格式化日期
    formatDate(date) {
      const d = new Date(date)
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    
    // 图片加载失败处理
    handleImageError(event) {
      event.target.style.display = 'none'
      const parent = event.target.parentElement
      parent.innerHTML = `
        <div class="no-image">
          <i class="el-icon-picture-outline"></i>
          <p>图片加载失败</p>
        </div>
      `
    },
    
    // 获取民宿详情（处理图片URL）
    fetchHomestayDetail(homestayId) {
      request.get(`/homestay/${homestayId}`)
        .then(res => {
          if (res.data.code === 200) {
            const homestayData = res.data.data
            // 处理封面图片URL，转换为完整地址
            homestayData.coverImage = this.getFullImageUrl(homestayData.coverImage || '')
            this.homestay = homestayData
          } else {
            this.$message.error(res.data.msg || '获取民宿详情失败')
          }
        })
        .catch(err => {
          console.error('获取民宿详情失败:', err)
          this.$message.error('获取民宿详情失败')
        })
    },
    
    // 获取房型数量
    fetchRoomCount(homestayId) {
      request.get(`/room/count/${homestayId}`)
        .then(res => {
          if (res.data.code === 200) {
            this.roomCount = res.data.data
          }
        })
        .catch(() => {
          this.roomCount = 0
        })
    }
  }
}
</script>

<style scoped>
.homestay-detail {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.breadcrumb {
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 详情内容布局 */
.detail-content {
  display: flex;
  gap: 30px;
}

.image-section {
  flex: 1;
  min-width: 300px;
}

.image-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 5px;
  border-left: 4px solid #409EFF;
}

.image-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
}

.cover-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.no-image {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 250px;
  color: #909399;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.no-image .el-icon-picture-outline {
  font-size: 48px;
  margin-bottom: 15px;
  color: #c0c4cc;
}

.no-image p {
  font-size: 14px;
  margin: 0;
}

.info-section {
  flex: 2;
  min-width: 500px;
}

/* 民宿介绍卡片 */
.intro-card {
  border-radius: 8px;
  margin-top: 20px;
}

.intro-header {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.intro-content {
  line-height: 1.6;
  color: #666;
  padding: 15px 0;
  white-space: pre-line;
}

.intro-content.no-content {
  color: #909399;
  font-style: italic;
}

/* 操作按钮组 */
.btn-group {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .detail-content {
    flex-direction: column;
  }
  
  .image-section,
  .info-section {
    min-width: 100%;
  }
  
  .image-container {
    min-height: 200px;
  }
}

@media (max-width: 768px) {
  .homestay-detail {
    padding: 16px;
  }
  
  .detail-card {
    padding: 15px;
  }
  
  .image-container {
    padding: 10px;
  }
  
  .cover-image {
    max-height: 300px;
  }
}
</style>