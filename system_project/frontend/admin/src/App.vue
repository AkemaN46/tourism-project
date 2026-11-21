<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-color: #f8fbff;
}

#app {
  height: 100%;
}

/* 小清新主题色变量 */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --background-gradient: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  --sidebar-gradient: linear-gradient(180deg, #f8fbff 0%, #e8f4ff 100%);
  --header-gradient: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  --accent-color: #667eea;
  --light-accent: #e8f4ff;
  --text-primary: #5a6c7d;
  --text-secondary: #8898aa;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f0f7ff;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #764ba2 0%, #667eea 100%);
}

/* Element UI 组件统一样式 */
.el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

.el-button--primary:hover {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
}

.el-card {
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08) !important;
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background: linear-gradient(135deg, #f8fbff 0%, #e8f4ff 100%) !important;
  color: #5a6c7d;
  font-weight: 600;
}

.el-table td {
  color: #5a6c7d;
}

.el-pagination {
  color: #5a6c7d;
}

/* 输入框统一样式 */
.el-input__inner {
  border: 2px solid #e8f4f8 !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;
}

.el-input__inner:hover {
  border-color: #a8edea !important;
}

.el-input__inner:focus {
  border-color: #667eea !important;
}

/* 表单标签 */
.el-form-item__label {
  color: #5a6c7d;
  font-weight: 500;
}

/* 对话框美化 */
.el-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.el-dialog__header {
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
  border-bottom: 2px solid #e8f4ff;
}

.el-dialog__title {
  color: #5a6c7d;
  font-weight: 600;
}

/* 加载动画颜色 */
.el-loading-spinner .path {
  stroke: #667eea !important;
}

.el-loading-spinner .el-loading-text {
  color: #667eea !important;
}
</style>