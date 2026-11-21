<template>
  <div class="room-create">
    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item @click.native="$router.push({ name: 'HomestayList' })">民宿列表</el-breadcrumb-item>
      <el-breadcrumb-item @click.native="goBackRoomList">
        {{ homestayName }}
      </el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '编辑房型' : '新增房型' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="form-card">
      <div slot="header" class="form-header">
        <span class="form-title">{{ isEdit ? '编辑房型' : '新增房型' }}</span>
      </div>

      <el-form 
        ref="roomForm" 
        :model="roomForm" 
        :rules="formRules" 
        label-width="100px"
        class="room-form">
        <!-- 隐藏民宿ID -->
        <el-input v-model="roomForm.homestayId" type="hidden"></el-input>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房型名称" prop="name">
              <el-input 
                v-model="roomForm.name" 
                placeholder="请输入房型名称"
                maxlength="50"
                show-word-limit>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="床型" prop="bedType">
              <el-select v-model="roomForm.bedType" placeholder="请选择床型">
                <el-option label="1.8米大床" value="1.8米大床"></el-option>
                <el-option label="1.2米双床" value="1.2米双床"></el-option>
                <el-option label="榻榻米" value="榻榻米"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="price">
              <el-input-number 
                v-model="roomForm.price" 
                :min="0.01"
                :max="10000"
                :step="10"
                placeholder="请输入销售价格"
                style="width: 100%;">
                <template slot="prefix">¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number 
                v-model="roomForm.originalPrice" 
                :min="0.01"
                :max="10000"
                :step="10"
                placeholder="请输入原价"
                style="width: 100%;">
                <template slot="prefix">¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="可住人数" prop="peopleNum">
              <el-input-number 
                v-model="roomForm.peopleNum" 
                :min="1" 
                :max="10"
                placeholder="请输入可住人数"
                style="width: 100%;">
                <template slot="suffix">人</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number 
                v-model="roomForm.stock" 
                :min="0" 
                :max="999"
                placeholder="请输入库存数量"
                style="width: 100%;">
                <template slot="suffix">间</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 房型封面 -->
        <el-form-item label="房型封面" prop="coverImage">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture"
            :file-list="coverFileList"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
            :on-remove="handleCoverRemove"
            :on-error="handleUploadError"
            :on-preview="handleCoverPreview"
            :limit="1"
            :on-exceed="handleCoverExceed">
            <i class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">提示：请上传尺寸为375*250的图片，支持jpg、png、webp格式，大小不超过5MB</div>
        </el-form-item>

        <!-- 房型图片集 -->
        <el-form-item label="房型图片集" prop="gallery">
          <el-upload
            class="gallery-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="galleryFileList"
            :on-success="handleGallerySuccess"
            :before-upload="beforeGalleryUpload"
            :on-remove="handleGalleryRemove"
            :on-error="handleUploadError">
            <i class="el-icon-plus"></i>
          </el-upload>
          <div class="upload-tip">提示：可上传多张房型图片，支持jpg、png、webp格式，每张大小不超过5MB</div>
        </el-form-item>

        <el-form-item label="房型描述" prop="description">
          <el-input 
            v-model="roomForm.description" 
            type="textarea"
            placeholder="请输入房型描述（选填）"
            :rows="4"
            maxlength="500"
            show-word-limit>
          </el-input>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roomForm.status">
            <el-radio label="1">上架</el-radio>
            <el-radio label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item class="form-submit">
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBackRoomList">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 封面预览弹窗 -->
    <el-dialog title="房型封面预览" :visible.sync="coverPreviewVisible" width="400px">
      <img :src="previewImageUrl" style="width: 100%;" alt="封面预览">
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'RoomCreate',
  data() {
    return {
      isEdit: false,
      homestayId: '',
      homestayName: '',
      loading: false,
      // 图片服务器基础地址
      baseImageUrl: 'http://localhost:8082',
      uploadUrl: '/api/upload/image',
      coverFileList: [],
      galleryFileList: [],
      coverPreviewVisible: false,
      previewImageUrl: '',
      roomForm: {
        id: '',
        homestayId: '',
        roomTypeId: 1,
        name: '',
        bedType: '',
        price: 0,
        originalPrice: 0,
        peopleNum: 2,
        stock: 0,
        description: '',
        status: '1',
        coverImage: '',
        gallery: []
      },
      formRules: {
        name: [
          { required: true, message: '请输入房型名称', trigger: 'blur' },
          { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
        ],
        bedType: [
          { required: true, message: '请选择床型', trigger: 'change' }
        ],
        price: [
          { required: true, type: 'number', message: '请输入销售价格', trigger: 'change' },
          { validator: (rule, value, callback) => {
            if (value <= 0 || value > 10000) {
              callback(new Error('销售价格须大于0且不超过10000元'));
            } else {
              callback();
            }
          }, trigger: 'change' }
        ],
        peopleNum: [
          { required: true, type: 'number', message: '请输入可住人数', trigger: 'change' },
          { validator: (rule, value, callback) => {
            if (value < 1 || value > 10) {
              callback(new Error('可住人数在1-10之间'));
            } else {
              callback();
            }
          }, trigger: 'change' }
        ],
        stock: [
          { required: true, type: 'number', message: '请输入库存数量', trigger: 'change' },
          { validator: (rule, value, callback) => {
            if (value < 0) {
              callback(new Error('库存不能为负数'));
            } else if (value > 999) {
              callback(new Error('库存不能超过999'));
            } else {
              callback();
            }
          }, trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        coverImage: [
          { required: true, message: '请上传房型封面图片', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    uploadHeaders() {
      return { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` }
    }
  },
  created() {
    const roomId = this.$route.params.id
    if (roomId) {
      this.isEdit = true
      this.fetchRoomDetail(roomId)
    } else {
      this.homestayId = this.$route.params.homestayId
      this.roomForm.homestayId = this.homestayId
      this.fetchHomestayName()
    }
  },
  methods: {
    // 【核心修复1】增强URL拼接逻辑，增加空值/异常处理
    getFullImageUrl(path) {
      // 严格判空，排除空字符串、null、undefined
      if (!path || path === 'null' || path === 'undefined') return ''
      // 兼容完整URL、相对路径、甚至//开头的路径
      if (path.startsWith('http') || path.startsWith('//')) return path
      // 处理路径开头缺少/的情况
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      return `${this.baseImageUrl}${normalizedPath}`
    },

    // 返回房型列表
    goBackRoomList() {
      this.$router.push({ 
        name: 'RoomList', 
        params: { homestayId: this.roomForm.homestayId || this.homestayId } 
      })
    },

    // 获取民宿名称
    fetchHomestayName() {
      if (!this.roomForm.homestayId) return
      request.get(`/homestay/${this.roomForm.homestayId}`)
        .then(res => {
          if (res.data.code === 200) {
            this.homestayName = res.data.data.name
          }
        })
        .catch(err => {
          console.error('获取民宿名称失败:', err)
        })
    },
    
    // 【核心修复2】重构房型详情获取逻辑，确保URL拼接100%生效
    fetchRoomDetail(roomId) {
      this.loading = true
      request.get(`/room/${roomId}`)
        .then(res => {
          this.loading = false
          if (res.data.code === 200) {
            const roomData = res.data.data
            console.log('后端返回的房型数据:', roomData) // 调试用，可保留
            
            // 1. 优先处理coverImage（兼容coverImage/cover_image两个字段）
            const rawCoverImage = roomData.coverImage || roomData.cover_image || ''
            const coverImage = this.getFullImageUrl(rawCoverImage)
            
            // 2. 处理gallery图片集（增强JSON解析容错）
            let gallery = []
            try {
              // 兼容字符串/数组两种格式，解析失败则置空
              gallery = typeof roomData.gallery === 'string' 
                ? JSON.parse(roomData.gallery) 
                : (Array.isArray(roomData.gallery) ? roomData.gallery : [])
            } catch (e) {
              console.error('解析gallery失败:', e)
              gallery = []
            }
            // 拼接每个图片的URL并过滤空值
            const fullGalleryUrls = gallery.map(url => this.getFullImageUrl(url)).filter(url => !!url)
            
            // 3. 赋值表单（确保所有字段类型正确）
            this.roomForm = {
              id: roomData.id || '',
              homestayId: roomData.homestayId || roomData.homestay_id || '',
              name: roomData.name || '',
              bedType: roomData.bedType || roomData.bed_type || '',
              price: Number(roomData.price) || 0,
              originalPrice: Number(roomData.originalPrice) || Number(roomData.original_price) || 0,
              peopleNum: Number(roomData.peopleNum) || Number(roomData.people_num) || 2,
              stock: Number(roomData.stock) || 0,
              description: roomData.description || '',
              status: (roomData.status === 0 || roomData.status === 1) ? roomData.status.toString() : '1',
              coverImage: coverImage, // 确保是完整URL
              gallery: fullGalleryUrls // 确保是完整URL数组
            }

            // 4. 【核心修复】手动更新fileList（确保el-upload能识别）
            this.coverFileList = coverImage ? [{
              name: coverImage.substring(coverImage.lastIndexOf('/') + 1) || 'cover.jpg',
              url: coverImage
            }] : []
            
            this.galleryFileList = fullGalleryUrls.map(url => ({
              name: url.substring(url.lastIndexOf('/') + 1) || 'gallery.jpg',
              url: url
            }))

            // 5. 其他初始化
            this.homestayId = this.roomForm.homestayId
            this.fetchHomestayName()
            
            console.log('处理后的表单数据:', this.roomForm) // 调试用，可保留
            console.log('封面文件列表:', this.coverFileList) // 调试用，可保留
          } else {
            this.$message.error(res.data.msg)
          }
        })
        .catch(err => {
          this.loading = false
          console.error('获取房型详情失败:', err)
          this.$message.error('获取房型详情失败')
        })
    },
    
    // 封面图片预览
    handleCoverPreview(file) {
      this.previewImageUrl = file.url
      this.coverPreviewVisible = true
    },
    
    // 封面图片超出数量限制提示
    handleCoverExceed(files, fileList) {
      this.$message.warning('房型封面只能上传1张图片哦！');
    },
    
    // 封面图片上传成功回调
    handleCoverSuccess(res) {
      if (res.code === 200) {
        const relativeUrl = res.data.imageUrl || res.data.url || ''
        const imageUrl = this.getFullImageUrl(relativeUrl)
        
        this.roomForm.coverImage = imageUrl
        this.coverFileList = [{
          name: imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || 'cover.jpg',
          url: imageUrl
        }]
        // 手动触发校验
        if (this.$refs.roomForm) {
          this.$refs.roomForm.validateField('coverImage')
        }
        this.$message.success('封面图片上传成功')
      } else {
        this.$message.error(`封面图片上传失败：${res.msg || '未知错误'}`)
      }
    },
    
    // 封面图片删除回调
    handleCoverRemove() {
      this.roomForm.coverImage = ''
      this.coverFileList = []
      if (this.$refs.roomForm) {
        this.$refs.roomForm.validateField('coverImage')
      }
      this.$message.info('封面图片已删除')
    },
    
    // 图片集上传成功回调
    handleGallerySuccess(res, file, fileList) {
      if (res.code === 200) {
        const relativeUrl = res.data.imageUrl || res.data.url || ''
        file.url = this.getFullImageUrl(relativeUrl)
        this.roomForm.gallery = fileList.map(item => item.url).filter(url => !!url)
        this.$message.success('图片上传成功')
      } else {
        this.$message.error(`图片上传失败：${res.msg || '未知错误'}`)
      }
    },
    
    // 图片集移除回调
    handleGalleryRemove(file, fileList) {
      this.roomForm.gallery = fileList.map(item => item.url).filter(url => !!url)
    },
    
    // 封面图片上传前校验
    beforeCoverUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
      const isLt5M = file.size / 1024 / 1024 <= 5
      
      if (!isImage) {
        this.$message.error('封面图片只能上传JPG/PNG/WEBP格式！')
      }
      if (!isLt5M) {
        this.$message.error('封面图片大小不能超过5MB！')
      }
      return isImage && isLt5M
    },
    
    // 图片集上传前校验
    beforeGalleryUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
      const isLt5M = file.size / 1024 / 1024 <= 5
      
      if (!isImage) {
        this.$message.error('房型图片只能上传JPG/PNG/WEBP格式！')
      }
      if (!isLt5M) {
        this.$message.error('房型图片大小不能超过5MB！')
      }
      return isImage && isLt5M
    },
    
    // 上传失败回调
    handleUploadError(err) {
      console.error('图片上传失败:', err)
      this.$message.error('图片上传失败，请检查后端接口是否启动（端口8082）或网络连接')
    },
    
    // 提交表单
    submitForm() {
      this.$refs.roomForm.validate((valid) => {
        if (valid) {
          // 准备提交数据（转回相对路径）
          const submitData = {
            ...this.roomForm,
            price: Number(this.roomForm.price),
            originalPrice: Number(this.roomForm.originalPrice),
            peopleNum: Number(this.roomForm.peopleNum),
            stock: Number(this.roomForm.stock),
            status: Number(this.roomForm.status),
            // 转回相对路径（兼容空值）
            coverImage: this.roomForm.coverImage.replace(this.baseImageUrl, '') || '',
            cover_image: this.roomForm.coverImage.replace(this.baseImageUrl, '') || '',
            // gallery转回相对路径数组并JSON化
            gallery: JSON.stringify(this.roomForm.gallery.map(url => url.replace(this.baseImageUrl, '')).filter(url => !!url))
          }
          
          const requestFunc = this.isEdit 
            ? request.put(`/room/update/${submitData.id}`, submitData)
            : request.post('/room/create', submitData)
          
          requestFunc.then(res => {
            if (res.data.code === 200) {
              this.$message.success(this.isEdit ? '编辑成功' : '新增成功')
              this.goBackRoomList()
            } else {
              this.$message.error(res.data.msg)
            }
          }).catch(err => {
            console.error('提交失败:', err)
            this.$message.error('请求失败，请稍后重试')
          })
        } else {
          this.$message.error('表单填写有误，请检查红色提示的字段并修正')
          return false
        }
      })
    },
    
    // 重置表单
    resetForm() {
      if (this.$refs.roomForm) {
        this.$refs.roomForm.resetFields()
      }
      // 重置图片相关字段
      this.roomForm.coverImage = ''
      this.roomForm.gallery = []
      this.coverFileList = []
      this.galleryFileList = []
      
      if (this.isEdit) {
        // 重新拉取最新数据，避免缓存问题
        this.fetchRoomDetail(this.roomForm.id)
      } else {
        this.roomForm = {
          homestayId: this.homestayId,
          name: '',
          bedType: '',
          price: 0,
          originalPrice: 0,
          peopleNum: 2,
          stock: 0,
          description: '',
          status: '1',
          coverImage: '',
          gallery: []
        }
      }
    }
  }
}
</script>

<style scoped>
.room-create {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

.breadcrumb {
  margin-bottom: 16px;
  font-size: 14px;
}

.form-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
}

.form-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.room-form {
  padding: 20px 0;
}

.form-submit {
  text-align: center;
  margin-top: 20px;
}

/* 封面上传样式 */
.avatar-uploader {
  display: inline-block;
  position: relative;
  margin-bottom: 8px;
  vertical-align: top;
}

.avatar-uploader .el-upload--picture {
  width: 180px;
  height: 120px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 有图片时隐藏上传按钮 */
.avatar-uploader.has-file .el-upload--picture {
  display: none;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c8c8c;
  width: 180px;
  height: 120px;
  line-height: 120px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
}

.avatar-uploader-icon:hover {
  border-color: #409eff;
}

::v-deep .avatar-uploader .el-upload-list--picture {
  display: inline-block;
  margin-right: 20px;
  vertical-align: top;
}

::v-deep .avatar-uploader .el-upload-list--picture .el-upload-list__item {
  width: 180px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  margin: 0;
}

::v-deep .avatar-uploader .el-upload-list__item-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

::v-deep .avatar-uploader:not(.el-upload--disabled) .el-upload-list--picture:has(.el-upload-list__item) + .el-upload--picture {
  display: none;
}

.gallery-uploader {
  margin-top: 10px;
  margin-bottom: 8px;
}

::v-deep .gallery-uploader .el-upload--picture-card {
  width: 120px;
  height: 120px;
  line-height: 120px;
}

::v-deep .gallery-uploader .el-upload-list--picture-card .el-upload-list__item {
  width: 120px;
  height: 120px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
