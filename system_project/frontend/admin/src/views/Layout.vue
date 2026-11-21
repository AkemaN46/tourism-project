<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">汐岸小筑</div>
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        background-color="#f8fbff"
        text-color="#5a6c7d"
        active-text-color="#667eea"
        active-background-color="#e8f4ff"
        router
        unique-opened
      >
        <el-menu-item index="/dashboard">
          <i class="el-icon-s-home"></i>
          <span slot="title">首页</span>
        </el-menu-item>
        
        <el-submenu index="homestay">
          <template slot="title">
            <i class="el-icon-office-building"></i>
            <span>民宿管理</span>
          </template>
          <el-menu-item index="/homestay/list">民宿列表</el-menu-item>
          <el-menu-item index="/homestay/create">新增民宿</el-menu-item>
        </el-submenu>
        
        <el-submenu index="order">
          <template slot="title">
            <i class="el-icon-document"></i>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/order/list">订单列表</el-menu-item>
        </el-submenu>
        
        <el-submenu index="user">
          <template slot="title">
            <i class="el-icon-user"></i>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/user/list">用户列表</el-menu-item>
        </el-submenu>
        
        <el-submenu index="review">
          <template slot="title">
            <i class="el-icon-chat-dot-round"></i>
            <span>评价管理</span>
          </template>
          <el-menu-item index="/review/list">评价列表</el-menu-item>
        </el-submenu>
        
        <!-- 已删除：测试页面菜单项 -->
        <!-- 
        <el-menu-item index="/test">
          <i class="el-icon-s-promotion"></i>
          <span slot="title">测试页面</span>
        </el-menu-item>
        -->
      </el-menu>
    </el-aside>
    
    <!-- 主体区域 -->
    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <i class="el-icon-s-fold toggle-sidebar" @click="toggleSidebar"></i>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="admin-info">
              <i class="el-icon-user"></i>
              管理员
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区域 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'Layout',
  methods: {
    toggleSidebar() {
      // 切换侧边栏折叠状态
      console.log('切换侧边栏')
    },
    handleCommand(command) {
      if (command === 'logout') {
        // 清除token并跳转到登录页
        localStorage.removeItem('admin_token')
        this.$router.push('/login')
      }
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #f8fbff 0%, #e8f4ff 100%);
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(102, 126, 234, 0.1);
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  /* 小清新渐变背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 3px;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
}

.sidebar-menu {
  border: none;
  height: calc(100% - 60px);
}

/* 菜单项悬停效果 */
/deep/ .el-menu-item:hover {
  background-color: #f0f7ff !important;
}

/deep/ .el-menu-item.is-active {
  background-color: #e8f4ff !important;
  border-right: 3px solid #667eea;
}

/deep/ .el-submenu__title:hover {
  background-color: #f0f7ff !important;
}

.header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  border-bottom: 2px solid #e8f4ff;
}

.toggle-sidebar {
  font-size: 22px;
  cursor: pointer;
  color: #5a6c7d;
  transition: all 0.3s ease;
}

.toggle-sidebar:hover {
  color: #667eea;
  transform: scale(1.1);
}

.admin-info {
  cursor: pointer;
  font-size: 15px;
  color: #5a6c7d;
  font-weight: 500;
  padding: 8px 15px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fbff 0%, #e8f4ff 100%);
  transition: all 0.3s ease;
}

.admin-info:hover {
  background: linear-gradient(135deg, #e8f4ff 0%, #d0e8ff 100%);
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.main {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 25px;
}
</style>
