import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Home from '../components/Home.vue';
import Register from '../components/Register.vue';
import DashBoard from '../components/DashBoard.vue';
import axios from 'axios';

// 定义路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }, // 主页不需要认证
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }, // 登录页面不需要认证
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }, // 注册页面不需要认证
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashBoard,
    meta: { requiresAuth: true }, // 需要认证
  },
  // 其他需要认证的页面
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});


router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      next({ name: 'Login' });
    } else {
      try {
        // 请求后端验证 token
        await axios.get('/api/verify-token', {
          headers: {
            'Authorization': token,
          },
        });
        next(); // 验证成功，允许进入路由
      } catch (error) {
        // 验证失败，移除 token 并跳转到登录页
        localStorage.removeItem('auth_token');
        next({ name: 'Login' });
        console.log(error);
        
      }
    }
  } else {
    next(); // 不需要认证的路由，直接进入
  }
});

export default router;
