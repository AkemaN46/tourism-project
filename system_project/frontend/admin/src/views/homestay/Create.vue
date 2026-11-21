<template>
  <div class="homestay-create">
    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item @click.native="$router.push({ name: 'HomestayList' })">民宿列表</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '编辑民宿' : '新增民宿' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="form-card">
      <div slot="header" class="form-header">
        <span class="form-title">{{ isEdit ? '编辑民宿' : '新增民宿' }}</span>
      </div>

      <el-form 
        ref="homestayForm" 
        :model="homestayForm" 
        :rules="formRules" 
        label-width="100px"
        class="homestay-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="民宿名称" prop="name">
              <el-input 
                v-model="homestayForm.name" 
                placeholder="请输入民宿名称"
                maxlength="50"
                show-word-limit>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input 
                v-model="homestayForm.phone" 
                placeholder="请输入联系电话"
                maxlength="11">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" prop="address">
          <el-input 
            v-model="homestayForm.address" 
            placeholder="请输入详细地址"
            maxlength="200"
            show-word-limit>
          </el-input>
        </el-form-item>

        <!-- 新增：民宿外观图片 -->
        <el-form-item label="外观图片" prop="coverImage">
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
            :limit="1"
            :on-exceed="handleCoverExceed">
            <i class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">提示：请上传民宿外观图片，支持jpg、png、webp格式，大小不超过5MB</div>
        </el-form-item>

        <el-form-item label="民宿介绍" prop="description">
          <el-input 
            v-model="homestayForm.description" 
            type="textarea"
            placeholder="请输入民宿介绍（选填）"
            :rows="4"
            maxlength="500"
            show-word-limit>
          </el-input>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="homestayForm.status">
            <el-radio label="1">上架</el-radio>
            <el-radio label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item class="form-submit">
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.push({ name: 'HomestayList' })">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'HomestayCreate',
  data() {
    return {
      isEdit: false,
      // 图片服务器基础地址
      baseImageUrl: 'http://localhost:8082',
      uploadUrl: '/api/upload/image',
      coverFileList: [], // 外观图片文件列表
      homestayForm: {
        id: '',
        name: '',
        phone: '',
        address: '',
        description: '',
        coverImage: '', // 新增：外观图片URL
        status: '1'
      },
      formRules: {
        name: [
          { required: true, message: '请输入民宿名称', trigger: 'blur' },
          { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        address: [
          { required: true, message: '请输入详细地址', trigger: 'blur' },
          { min: 5, max: 120, message: '地址长度在5-120个字符之间', trigger: 'blur' }
        ],
        description: [
          { max: 500, message: '介绍长度不超过500字符', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        coverImage: [
          { required: true, message: '请上传民宿外观图片', trigger: 'change' }
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
    const homestayId = this.$route.params.id
    if (homestayId) {
      this.isEdit = true
      this.fetchHomestayDetail(homestayId)
    }
  },
  methods: {
    // 拼接完整的图片URL
    getFullImageUrl(path) {
      if (!path) return ''
      // 如果已经是完整URL，直接返回；否则拼接基础地址
      return path.startsWith('http') ? path : `${this.baseImageUrl}${path}`
    },

    // 获取民宿详情
    fetchHomestayDetail(homestayId) {
      request.get(`/homestay/${homestayId}`)
        .then(res => {
          if (res.data.code === 200) {
            const homestayData = res.data.data
            // 处理图片字段，补全URL
            const coverImage = this.getFullImageUrl(homestayData.coverImage || '')
            
            // 赋值给表单
            this.homestayForm = {
              ...homestayData,
              id: homestayData.id,
              name: homestayData.name,
              phone: homestayData.phone || '',
              address: homestayData.address || '',
              description: homestayData.description || '',
              coverImage: coverImage,
              status: homestayData.status.toString()
            }
            
            // 初始化封面文件列表
            this.coverFileList = coverImage ? [{
              name: coverImage.substring(coverImage.lastIndexOf('/') + 1),
              url: coverImage
            }] : []
          } else {
            this.$message.error(res.data.msg)
          }
        })
        .catch(error => {
          console.error('获取民宿详情失败:', error)
          this.$message.error('获取民宿详情失败')
        })
    },
    
    // 外观图片超出数量限制提示
    handleCoverExceed(files, fileList) {
      this.$message.warning('民宿外观图片只能上传1张哦！');
    },
    
    // 外观图片上传成功回调
    handleCoverSuccess(res) {
      if (res.code === 200) {
        // 拼接完整URL
        const relativeUrl = res.data.imageUrl || res.data.url
        const imageUrl = this.getFullImageUrl(relativeUrl)
        
        this.homestayForm.coverImage = imageUrl
        // 更新封面文件列表
        this.coverFileList = [{
          name: imageUrl.substring(imageUrl.lastIndexOf('/') + 1),
          url: imageUrl
        }]
        this.$message.success('外观图片上传成功')
      } else {
        this.$message.error(`外观图片上传失败：${res.msg || '未知错误'}`)
      }
    },
    
    // 外观图片删除回调
    handleCoverRemove() {
      this.homestayForm.coverImage = ''
      this.coverFileList = []
      this.$message.info('外观图片已删除')
    },
    
    // 图片上传前校验
    beforeCoverUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
      const isLt5M = file.size / 1024 / 1024 <= 5
      
      if (!isImage) {
        this.$message.error('民宿图片只能上传JPG/PNG/WEBP格式！')
      }
      if (!isLt5M) {
        this.$message.error('民宿图片大小不能超过5MB！')
      }
      return isImage && isLt5M
    },
    
    // 上传失败回调（增强：详细错误日志）
    handleUploadError(err) {
      console.error('民宿图片上传失败详情：', err);
      if (err.message.includes('Network Error')) {
        this.$message.error('图片上传失败：网络连接异常，请检查后端服务是否启动（端口8082）');
      } else {
        const errorMsg = err.response && err.response.data && err.response.data.msg || '接口返回异常，请查看后端日志';
        this.$message.error('图片上传失败：' + errorMsg);
      }
    },
    
    // 提交表单（提交时保存相对路径，避免冗余）
    submitForm() {
      this.$refs.homestayForm.validate((valid) => {
        if (valid) {
          // 准备提交数据，将完整URL转回相对路径
          const submitData = {
            ...this.homestayForm,
            status: Number(this.homestayForm.status),
            // 提交给后端时使用相对路径
            coverImage: this.homestayForm.coverImage.replace(this.baseImageUrl, '')
          }
          
          const requestFunc = this.isEdit 
            ? request.put(`/homestay/update/${submitData.id}`, submitData)
            : request.post('/homestay/create', submitData)
          
          requestFunc.then(res => {
            if (res.data.code === 200) {
              this.$message.success(this.isEdit ? '编辑成功' : '新增成功')
              this.$router.push({ name: 'HomestayList' })
            } else {
              this.$message.error(res.data.msg)
            }
          })
          .catch(error => {
            console.error('提交失败:', error)
            this.$message.error('提交失败，请稍后重试')
          })
        }
      })
    },
    
    // 重置表单
    resetForm() {
      this.$refs.homestayForm.resetFields()
      // 重置图片相关字段
      this.homestayForm.coverImage = ''
      this.coverFileList = []
      
      if (this.isEdit) {
        this.fetchHomestayDetail(this.homestayForm.id)
      } else {
        this.homestayForm.status = '1'
      }
    }
  }
}
</script>

<style scoped>
.homestay-create {
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

.homestay-form {
  padding: 20px 0;
}

.form-submit {
  text-align: center;
  margin-top: 20px;
}

/* 外观图片上传样式 */
.avatar-uploader {
  display: inline-block;
  position: relative;
  margin-bottom: 8px;
  vertical-align: top;
}

.avatar-uploader .el-upload--picture {
  width: 200px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c8c8c;
  width: 200px;
  height: 150px;
  line-height: 150px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
}

.avatar-uploader-icon:hover {
  border-color: #409eff;
}

::v-deep .avatar-uploader .el-upload--picture.is-disabled .avatar-uploader-icon {
  cursor: not-allowed;
  color: #c0c4cc;
  border-color: #ebeef5;
  background: #fafafa;
}

::v-deep .avatar-uploader .el-upload-list--picture .el-upload-list__item {
  width: 200px;
  height: 150px;
  border-radius: 6px;
  overflow: hidden;
  margin: 0;
}

::v-deep .avatar-uploader .el-upload-list__item-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 上传提示文字 */
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
