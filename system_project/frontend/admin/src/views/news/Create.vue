<template>
  <div class="news-create">
    <el-card class="form-card">
      <div slot="header" class="form-header">
        <span class="form-title">{{ isEdit ? '编辑资讯' : '发布资讯' }}</span>
      </div>
      
      <el-form 
        :model="newsForm" 
        :rules="newsRules" 
        ref="newsForm" 
        label-width="100px"
        class="news-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input 
                v-model="newsForm.title" 
                placeholder="请输入标题（最多50字）"
                maxlength="50"
                show-word-limit
                class="form-input">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="副标题" prop="subtitle">
              <el-input 
                v-model="newsForm.subtitle" 
                placeholder="请输入副标题（最多100字）"
                maxlength="100"
                show-word-limit
                class="form-input">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select 
                v-model="newsForm.categoryId" 
                placeholder="请选择分类"
                class="form-select">
                <el-option label="景点推荐" value="1"></el-option>
                <el-option label="美食指南" value="2"></el-option>
                <el-option label="民宿攻略" value="3"></el-option>
                <el-option label="活动资讯" value="4"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input 
                v-model="newsForm.author" 
                placeholder="请输入作者名称"
                class="form-input">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="封面图片">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload">
            <div class="upload-container" v-if="newsForm.coverImage">
              <img :src="getImageUrl(newsForm.coverImage)" class="avatar" alt="封面">
              <div class="image-overlay">
                <i class="el-icon-zoom-in" @click.stop="previewImage"></i>
                <i class="el-icon-delete" @click.stop="deleteImage"></i>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <i class="el-icon-plus avatar-uploader-icon"></i>
              <p class="upload-tip">点击上传封面图片</p>
            </div>
          </el-upload>
          <div class="form-tip">建议尺寸：800×450px，支持JPG/PNG格式，大小不超过2MB</div>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            type="textarea" 
            :rows="12" 
            v-model="newsForm.content" 
            placeholder="请输入资讯详细内容"
            class="form-textarea">
          </el-input>
        </el-form-item>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="newsForm.status" class="radio-group">
                <el-radio :label="0" border class="radio-item">草稿</el-radio>
                <el-radio :label="1" border class="radio-item">发布</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number 
                v-model="newsForm.sortOrder" 
                :min="0" 
                :max="999"
                controls-position="right"
                class="form-number"
                placeholder="数字越小越靠前">
              </el-input-number>
              <div class="form-tip">排序值越小，展示越靠前</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item class="form-actions">
          <el-button type="primary" @click="submitForm" class="btn-submit">保存</el-button>
          <el-button @click="cancel" class="btn-cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'NewsCreate',
  data() {
    return {
      isEdit: false,
      newsForm: {
        title: '',
        subtitle: '',
        categoryId: '',
        author: '',
        coverImage: '',
        content: '',
        status: 1,
        sortOrder: 0
      },
      newsRules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' },
          { max: 50, message: '标题长度不能超过50个字符', trigger: 'blur' }
        ],
        categoryId: [
          { required: true, message: '请选择分类', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入内容', trigger: 'blur' }
        ],
        author: [
          { required: true, message: '请输入作者名称', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 判断是编辑还是新增
    const newsId = this.$route.params.id
    if (newsId) {
      this.isEdit = true
      this.fetchNewsDetail(newsId)
    }
  },
  methods: {
    fetchNewsDetail(id) {
      // 获取资讯详情
      console.log('正在加载资讯详情, ID:', id);
      this.$axios.get(`/news/${id}`)
        .then(response => {
          console.log('后端返回数据:', response.data);
          if (response.data.code === 200) {
            const data = response.data.data;
            this.newsForm = {
              title: data.title || '',
              subtitle: data.subtitle || '',
              categoryId: data.categoryId ? String(data.categoryId) : '',
              author: data.author || '',
              coverImage: data.coverImage || '',
              content: data.content || '',
              status: data.status !== undefined ? data.status : 1,
              sortOrder: data.sortOrder || 0
            };
            console.log('表单数据已设置:', this.newsForm);
            // 强制刷新视图
            this.$forceUpdate();
          } else {
            this.$message.error('获取资讯信息失败: ' + (response.data.msg || ''));
            this.$router.push('/news/list');
          }
        })
        .catch(error => {
          console.error('获取资讯详情失败:', error);
          this.$message.error('获取资讯信息失败');
          this.$router.push('/news/list');
        });
    },
    
    submitForm() {
      this.$refs.newsForm.validate(valid => {
        if (valid) {
          const newsId = this.$route.params.id;
          const url = this.isEdit ? `/news/${newsId}` : '/news/create';
          const method = this.isEdit ? 'put' : 'post';
          
          // 准备提交数据
          const submitData = {
            ...this.newsForm,
            categoryId: parseInt(this.newsForm.categoryId)
          };
          
          this.$axios[method](url, submitData)
            .then(response => {
              if (response.data.code === 200) {
                this.$message.success(`${this.isEdit ? '编辑' : '发布'}成功`);
                this.$router.push('/news/list');
              } else {
                this.$message.error(response.data.msg || `${this.isEdit ? '编辑' : '发布'}失败`);
              }
            })
            .catch(error => {
              console.error('提交失败:', error);
              this.$message.error(`${this.isEdit ? '编辑' : '发布'}失败`);
            });
        }
      });
    },
    
    cancel() {
      this.$router.push('/news/list');
    },
    
    handleAvatarSuccess(res, file) {
      // 上传成功后的回调
      if (res && res.code === 200) {
        this.newsForm.coverImage = res.data.url;
        this.$message.success('上传成功');
      } else {
        this.$message.error('上传失败');
      }
    },
    
    beforeAvatarUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isImage) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!');
        return false;
      }
      
      // 显示加载提示
      const loading = this.$loading({
        lock: true,
        text: '上传中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 手动上传
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('开始上传图片:', file.name);
      
      this.$axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => {
        loading.close();
        console.log('上传响应:', response.data);
        if (response.data.code === 200) {
          this.newsForm.coverImage = response.data.data.url;
          console.log('图片URL已设置:', this.newsForm.coverImage);
          this.$message.success('上传成功');
          // 强制刷新视图
          this.$forceUpdate();
        } else {
          this.$message.error('上传失败: ' + (response.data.msg || ''));
        }
      })
      .catch(error => {
        loading.close();
        console.error('上传失败:', error);
        this.$message.error('上传失败');
      });
      
      return false; // 阻止 element-ui 的默认上传行为
    },
    
    getImageUrl(path) {
      if (!path) return '';
      // 如果是完整 URL
      if (path.startsWith('http://') || path.startsWith('https://')) {
        // 如果是 example.com 这种示例 URL，返回空
        if (path.includes('example.com')) {
          return '';
        }
        return path;
      }
      // 否则拼接后端基础 URL
      const baseURL = this.$axios.defaults.baseURL || 'http://localhost:8082';
      return `${baseURL}${path}`;
    },
    
    deleteImage() {
      this.$confirm('确定要删除封面图片吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.newsForm.coverImage = '';
        this.$message.success('删除成功');
      }).catch(() => {});
    },
    
    previewImage() {
      const url = this.getImageUrl(this.newsForm.coverImage);
      window.open(url, '_blank');
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.news-create {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}

/* 表单卡片 */
.form-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.form-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.form-header {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.form-title {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

/* 表单样式 */
.news-form {
  padding: 24px;
}

.form-input, .form-select {
  width: 100%;
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

/* 封面上传 */
.avatar-uploader {
  width: 100%;
}

.upload-container {
  width: 300px;
  height: 200px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.upload-container:hover {
  border-color: #409eff;
  background-color: #f8f9fa;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-container:hover .image-overlay {
  opacity: 1;
}

.image-overlay i {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.2s ease;
}

.image-overlay i:hover {
  transform: scale(1.2);
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-uploader-icon {
  font-size: 32px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

/* 文本域 */
::v-deep .form-textarea .el-textarea__inner {
  border-radius: 6px;
  border: 1px solid #e6e8eb;
  padding: 12px;
  line-height: 1.6;
  transition: all 0.2s ease;
}

::v-deep .form-textarea .el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 单选框 */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  padding: 8px 20px;
  border-radius: 6px;
}

/* 数字输入框 */
::v-deep .form-number .el-input-number {
  width: 100%;
}

::v-deep .form-number .el-input__inner {
  border-radius: 6px;
  border: 1px solid #e6e8eb;
}

/* 提示文本 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 按钮区域 */
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.btn-submit, .btn-cancel {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

::v-deep .btn-submit {
  background-color: #409eff;
  border-color: #409eff;
}

::v-deep .btn-submit:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

::v-deep .btn-cancel:hover {
  background-color: #f8f9fa;
}
</style>