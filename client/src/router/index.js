import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/sign',
      name: 'sign',
      component: () => import('../views/SignerView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/Admin/ListView.vue')
    },
    {
      path: '/admin/:id',
      name: 'admin-user',
      component: () => import('../views/Admin/UserView.vue')
    },
    {
      path: '/admin/add',
      name: 'admin-add',
      component: () => import('../views/Admin/InsertView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/404.vue')
    }
  ]
})

export default router
