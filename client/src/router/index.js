import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../composables/useAuth';
import { canAccessAdmin, canViewAuditLogs, hasAnyRole } from '../utils/permissions';
import { ROLES, LEGACY_ROLES } from '../constants/roles.js';
const FINANCE_ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  LEGACY_ROLES.BOSS
];
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false, title: 'Login' }
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/finance/overview'
        },
        {
          path: 'user-management',
          name: 'UserManagement',
          component: () => import('../views/AdminUsers.vue'),
          meta: {
            title: 'User Management',
            requiresRole: [ROLES.SUPER_ADMIN, ROLES.ADMIN, LEGACY_ROLES.BOSS] // BOSS for backward compatibility
          }
        },
        {
          path: 'profiles',
          name: 'Profiles',
          redirect: '/profiles/job-profiles'
        },
        {
          path: 'profiles/job-profiles',
          name: 'JobProfiles',
          component: () => import('../views/JobProfilesView.vue'),
          meta: { title: 'Job Profiles' }
        },
        {
          path: 'profiles/freelancer-profiles',
          name: 'FreelancerProfiles',
          component: () => import('../views/FreelancerProfilesView.vue'),
          meta: { title: 'Freelancer Profiles' }
        },
        {
          path: 'profiles/personal-profiles',
          name: 'PersonalProfiles',
          component: () => import('../views/PersonalProfilesView.vue'),
          meta: { title: 'Personal Profiles' }
        },
        {
          path: 'profiles/personal-profile',
          name: 'PersonalProfile',
          component: () => import('../views/PersonalProfilesView.vue'),
          meta: { title: 'Personal Profile' }
        },
        {
          path: 'interview-boards',
          name: 'InterviewBoardsList',
          component: () => import('../views/InterviewBoardsList.vue'),
          meta: { title: 'Interview Boards' }
        },
        {
          path: 'interview-boards/:id',
          name: 'InterviewBoardView',
          component: () => import('../views/InterviewBoardView.vue'),
          meta: { title: 'Interview Board' }
        },
        {
          path: 'project-job-management',
          name: 'ProjectJobManagement',
          component: () => import('../views/Kanban.vue'),
          meta: { title: 'Project & Task & Job Management' }
        },
        {
          path: 'projects',
          name: 'Projects',
          component: () => import('../views/Projects.vue'),
          meta: { title: 'Projects' }
        },
        {
          path: 'projects/:id',
          name: 'ProjectDetail',
          component: () => import('../views/ProjectDetail.vue'),
          meta: { title: 'Project Detail' }
        },
        /* ===============================
   * Assignments (CORE FEATURE)
   * =============================== */
        {
          path: 'assignments',
          name: 'Assignments',
          component: () => import('../views/assignments/AssignmentsList.vue'),
          meta: { title: 'Assignments' },
        },
        {
          path: 'assignments/new',
          name: 'AssignmentCreate',
          component: () => import('../views/assignments/AssignmentCreate.vue'),
          meta: { title: 'Create Assignment' }
        },
        {
          path: 'assignments/:id',
          name: 'AssignmentDetail',
          component: () => import('../views/assignments/AssignmentDetail.vue'),
          meta: { title: 'Assignment Detail' }
        },
        /* =========================
           FINANCE (NEW STRUCTURE)
        ========================== */
        {
          path: 'finance/overview',
          name: 'FinanceOverview',
          component: () => import('../views/FinanceOverview.vue'),
          meta: { title: 'Finance Overview' ,
          }
        },
        {
          path: 'finance/monthly-plans',
          name: 'MonthlyPlansView',
          component: () => import('../views/MonthlyPlansView.vue'),
          meta: { title: 'Monthly Financial Plans' }
        },
        {
          path: 'finance/periodic-plans',
          name: 'PeriodicPlansView',
          component: () => import('../views/PeriodicPlansView.vue'),
          meta: { title: 'Periodic Financial Plans' }
        },
        {
          path: 'finance/transactions',
          name: 'TransactionsView',
          component: () => import('../views/TransactionsView.vue'),
          meta: { title: 'Transactions' }
        },

        // {
        //   path: '/earnings/trend',
        //   name: 'EarningsTrend',
        //   component: () => import('../views/earnings/EarningsTrend.vue'),
        //   meta: { title: 'Earnings Trend' }
        // },
        // Legacy routes (kept for backward compatibility, redirect to new routes)
        {
          path: 'kanban',
          redirect: '/project-job-management'
        },
        {
          path: 'freelancer-accounts',
          redirect: '/profile-management'
        },
        {
          path: 'personal-profile',
          redirect: '/profile-management'
        },
        {
          path: 'projects',
          redirect: '/project-job-management'
        },
        {
          path: 'admin/users',
          redirect: '/user-management'
        },
        {
          path: 'admin/audit-logs',
          name: 'AuditLogs',
          component: () => import('../views/AuditLogs.vue'),
          meta: {
            title: 'Audit Logs',
            requiresRole: [ROLES.SUPER_ADMIN, ROLES.ADMIN, LEGACY_ROLES.BOSS] // BOSS for backward compatibility
          }
        },
        {
          path: 'admin/database',
          name: 'DatabaseManagement',
          component: () => import('../views/DatabaseManagement.vue'),
          meta: {
            title: 'Database Management',
            requiresRole: [ROLES.SUPER_ADMIN, ROLES.ADMIN, LEGACY_ROLES.BOSS] // BOSS for backward compatibility
          }
        },
        {
          path: 'forbidden',
          name: 'Forbidden',
          component: () => import('../views/Forbidden.vue'),
          meta: { title: 'Access Forbidden' }
        }
      ]
    }
  ]
});

// Route guard - requireAuth
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Check localStorage directly for authentication status (source of truth)
  const hasToken = !!localStorage.getItem('token');
  const hasUser = !!localStorage.getItem('user');
  const isAuthenticated = hasToken && hasUser;

  // Restore auth from localStorage if needed (but only if both token and user exist)
  if (!authStore.isAuthenticated && isAuthenticated) {
    authStore.restoreAuth();
  }

  // Check if route requires authentication - use localStorage check for immediate response
  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    next('/login');
    return;
  }

  // Check if route requires specific role (with normalization for BOSS → ADMIN)
  if (to.meta.requiresRole) {
    const requiredRoles = Array.isArray(to.meta.requiresRole)
      ? to.meta.requiresRole
      : [to.meta.requiresRole];

    // Get user from store or localStorage
    let user = authStore.user;
    if (!user && hasUser) {
      try {
        user = JSON.parse(localStorage.getItem('user'));
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        next('/login');
        return;
      }
    }

    // Use hasAnyRole for normalization (BOSS → ADMIN mapping)
    if (!user || !hasAnyRole(user, requiredRoles)) {
      next('/forbidden');
      return;
    }
  }

  // Redirect authenticated users away from login page
  // But allow navigation to login if explicitly navigating there (e.g., during logout)
  if (to.path === '/login' && isAuthenticated && from.path !== '/login') {
    next('/');
    return;
  }

  next();
});
// router.beforeEach((to) => {
//   const auth = useAuthStore();

//   if (to.meta.requiresAuth && !auth.isAuthenticated) {
//     return '/login';
//   }

//   if (to.meta.requiresAdmin && auth.user?.role !== 'ADMIN') {
//     return '/';
//   }
// });

export default router;
