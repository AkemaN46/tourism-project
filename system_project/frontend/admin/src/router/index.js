import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'

// 民宿管理
import HomestayList from '../views/homestay/List.vue'
import HomestayCreate from '../views/homestay/Create.vue'
import HomestayDetail from '../views/homestay/Detail.vue'

// 房型管理
import RoomList from '../views/room/List.vue'
import RoomCreate from '../views/room/Create.vue'

// 其他功能模块
import OrderList from '../views/order/List.vue'
import UserList from '../views/user/List.vue'
import ReviewList from '../views/review/List.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '首页' }
      },
      // 民宿管理
      {
        path: 'homestay/list',
        name: 'HomestayList',
        component: HomestayList,
        meta: { title: '民宿列表' }
      },
      {
        path: 'homestay/create',
        name: 'HomestayCreate',
        component: HomestayCreate,
        meta: { title: '新增民宿' }
      },
      {
        path: 'homestay/edit/:id',
        name: 'HomestayEdit',
        component: HomestayCreate,
        meta: { title: '编辑民宿' },
        props: true
      },
      {
        path: 'homestay/detail/:id',
        name: 'HomestayDetail',
        component: HomestayDetail,
        meta: { title: '民宿详情' },
        props: true
      },
      // 房型管理
      {
        path: 'room/list/:homestayId',
        name: 'RoomList',
        component: RoomList,
        meta: { title: '房型列表' },
        props: true
      },
      {
        path: 'room/create/:homestayId',
        name: 'RoomCreate',
        component: RoomCreate,
        meta: { title: '新增房型' },
        props: true
      },
      {
        path: 'room/edit/:id',
        name: 'RoomEdit',
        component: RoomCreate,
        meta: { title: '编辑房型' },
        props: true
      },
      // 其他原有路由
      {
        path: 'order/list',
        name: 'OrderList',
        component: OrderList,
        meta: { title: '订单列表' }
      },
      {
        path: 'user/list',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户列表' }
      },
      {
        path: 'review/list',
        name: 'ReviewList',
        component: ReviewList,
        meta: { title: '评价列表' }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    if (localStorage.getItem('admin_token')) next('/dashboard')
    else next()
    return
  }
  if (localStorage.getItem('admin_token')) next()
  else next('/login')
})

export default router
