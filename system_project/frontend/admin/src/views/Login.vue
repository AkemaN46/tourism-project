<template>
  <div class="login-container">
    <div class="login-form">
      <div class="title">汐岸小筑民宿管理系统</div>
      <el-form :model="loginForm" :rules="loginRules" ref="loginForm" class="form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            prefix-icon="el-icon-user"
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="el-icon-lock"
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            style="width: 100%" 
            @click="handleLogin" 
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: 'admin',
        password: 'admin123'
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          
          this.$axios.post('/api/admin/login', null, { params: this.loginForm })
            .then(({ data }) => {
              if (data.code === 200 && data.data && data.data.token) {
                localStorage.setItem('admin_token', data.data.token)
                this.$message.success('登录成功')
                this.$router.push('/dashboard')
              } else {
                this.$message.error(data.msg || '用户名或密码错误')
              }
            })
            .catch(() => {
              this.$message.error('登录失败，请检查后端服务')
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 小清新渐变背景 */
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  position: relative;
  overflow: hidden;
}

/* 装饰性圆形背景 */
.login-container::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.login-container::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  bottom: -80px;
  left: -80px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.login-form {
  width: 420px;
  padding: 50px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(162, 155, 254, 0.2);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.login-form:hover {
  box-shadow: 0 12px 40px rgba(162, 155, 254, 0.3);
  transform: translateY(-5px);
}

.title {
  text-align: center;
  margin-bottom: 35px;
  font-size: 28px;
  font-weight: 600;
  /* 渐变色文字 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.form {
  margin-top: 25px;
}

/* 输入框美化 */
/deep/ .el-input__inner {
  height: 45px;
  border-radius: 10px;
  border: 2px solid #e8f4f8;
  background-color: #f8fbff;
  transition: all 0.3s ease;
}

/deep/ .el-input__inner:hover {
  border-color: #a8edea;
  background-color: #fff;
}

/deep/ .el-input__inner:focus {
  border-color: #667eea;
  background-color: #fff;
}

/deep/ .el-input__icon {
  color: #a8edea;
}

/* 按钮美化 */
/deep/ .el-button--primary {
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 3px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

/deep/ .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

/deep/ .el-button--primary:active {
  transform: translateY(0);
}

/* 表单项间距 */
/deep/ .el-form-item {
  margin-bottom: 25px;
}
</style>
