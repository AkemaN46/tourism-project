import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import request from './utils/request'

Vue.config.productionTip = false

// 全局错误处理
Vue.config.errorHandler = function (err, vm, info) {
  console.error('Vue Error:', err, info)
}

// 将 axios 实例挂载到 Vue 原型上
Vue.prototype.$axios = request

Vue.use(ElementUI)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
